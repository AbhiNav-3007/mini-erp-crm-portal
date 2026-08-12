import { Router, Response, NextFunction } from 'express'
import { AuthenticatedRequest, authenticateToken, authorizeRoles } from '../middleware/auth'
import db from '../db'

const router = Router()

// 1. Create a customer (Admin and Sales only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('Admin', 'Sales'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.company_id
      const { name, mobile_number, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes } = req.body

      if (!companyId) {
        return res.status(401).json({ status: 'error', message: 'Company context missing' })
      }

      if (!name || !mobile_number || !email || !business_name || !customer_type || !address) {
        return res.status(400).json({ status: 'error', message: 'Missing required customer fields' })
      }

      const [insertResult]: any = await db.query(
        `INSERT INTO Customers (company_id, name, mobile_number, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [companyId, name, mobile_number, email, business_name, gst_number || null, customer_type, address, status || 'Lead', follow_up_date || null, notes || null]
      )
      const customerId = insertResult.insertId

      // System Audit Log
      await db.query(
        `INSERT INTO AuditLogs (company_id, table_name, record_id, field_name, old_value, new_value, changed_by) 
         VALUES (?, 'Customers', ?, 'CREATE', '', ?, ?)`,
        [companyId, customerId.toString(), `Created Customer ${name} (${business_name})`, req.user?.id]
      )

      res.status(201).json({ status: 'success', message: 'Customer record created successfully' })
    } catch (error) {
      next(error)
    }
  }
)

// 2. View all customers with optional search and pagination (All Authenticated users)
router.get(
  '/',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.company_id
      const search = req.query.search as string || ''
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const offset = (page - 1) * limit

      const searchQuery = `%${search}%`

      // Query customers matching search filter on name or business name
      const [rows]: any = await db.query(
        `SELECT * FROM Customers 
         WHERE company_id = ? AND (name LIKE ? OR business_name LIKE ?) 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [companyId, searchQuery, searchQuery, limit, offset]
      )

      // Total count for pagination
      const [countRows]: any = await db.query(
        `SELECT COUNT(*) as total FROM Customers WHERE company_id = ? AND (name LIKE ? OR business_name LIKE ?)`,
        [companyId, searchQuery, searchQuery]
      )
      const total = countRows[0].total

      res.status(200).json({
        status: 'success',
        data: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// 3. Fetch single customer (All Authenticated users)
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.company_id
      const [rows]: any = await db.query('SELECT * FROM Customers WHERE id = ? AND company_id = ?', [req.params.id, companyId])
      if (rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Customer record not found' })
      }
      res.status(200).json({ status: 'success', data: rows[0] })
    } catch (error) {
      next(error)
    }
  }
)

// 4. Update customer details (Admin and Sales only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('Admin', 'Sales'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.company_id
      const { name, mobile_number, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes } = req.body

      if (!name || !mobile_number || !email || !business_name || !customer_type || !address) {
        return res.status(400).json({ status: 'error', message: 'Missing required customer fields' })
      }

      const [existing]: any = await db.query('SELECT * FROM Customers WHERE id = ? AND company_id = ?', [req.params.id, companyId])
      if (existing.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Customer record not found' })
      }

      const oldCust = existing[0]
      const fields = [
        'name', 'mobile_number', 'email', 'business_name', 'gst_number', 
        'customer_type', 'address', 'status', 'follow_up_date', 'notes'
      ]

      for (const field of fields) {
        let oldVal = oldCust[field] === null ? '' : String(oldCust[field])
        let newVal = req.body[field] === undefined ? '' : String(req.body[field] || '')
        
        if (field === 'gst_number' || field === 'follow_up_date' || field === 'notes') {
          if (!req.body[field]) newVal = ''
        }

        if (oldVal !== newVal) {
          await db.query(
            `INSERT INTO AuditLogs (company_id, table_name, record_id, field_name, old_value, new_value, changed_by) 
             VALUES (?, 'Customers', ?, ?, ?, ?, ?)`,
            [companyId, req.params.id, field, oldVal, newVal, req.user?.id]
          )
        }
      }

      await db.query(
        `UPDATE Customers 
         SET name = ?, mobile_number = ?, email = ?, business_name = ?, gst_number = ?, customer_type = ?, address = ?, status = ?, follow_up_date = ?, notes = ? 
         WHERE id = ? AND company_id = ?`,
        [name, mobile_number, email, business_name, gst_number || null, customer_type, address, status, follow_up_date || null, notes || null, req.params.id, companyId]
      )

      res.status(200).json({ status: 'success', message: 'Customer details updated successfully' })
    } catch (error) {
      next(error)
    }
  }
)

// 5. Create a follow-up note (Admin and Sales only)
router.post(
  '/:customerId/notes',
  authenticateToken,
  authorizeRoles('Admin', 'Sales'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.company_id
      const { note } = req.body
      const customerId = req.params.customerId

      if (!note) {
        return res.status(400).json({ status: 'error', message: 'Note content is required' })
      }

      // Verify customer exists
      const [customer]: any = await db.query('SELECT * FROM Customers WHERE id = ? AND company_id = ?', [customerId, companyId])
      if (customer.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Customer not found' })
      }

      await db.query(
        'INSERT INTO FollowUpNotes (company_id, customer_id, employee_id, note) VALUES (?, ?, ?, ?)',
        [companyId, customerId, req.user?.id, note]
      )

      // System Audit Log
      await db.query(
        `INSERT INTO AuditLogs (company_id, table_name, record_id, field_name, old_value, new_value, changed_by) 
         VALUES (?, 'FollowUpNotes', ?, 'ADD_NOTE', '', ?, ?)`,
        [companyId, customerId, `Added follow-up note: ${note.substring(0, 80)}`, req.user?.id]
      )

      res.status(201).json({ status: 'success', message: 'Follow-up note saved successfully' })
    } catch (error) {
      next(error)
    }
  }
)

// 6. View follow-up notes for a customer (All Authenticated users)
router.get(
  '/:customerId/notes',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.company_id
      const customerId = req.params.customerId

      // Verify customer exists
      const [customer]: any = await db.query('SELECT * FROM Customers WHERE id = ? AND company_id = ?', [customerId, companyId])
      if (customer.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Customer not found' })
      }

      // Fetch notes sorted chronologically with Employee name
      const [notes]: any = await db.query(
        `SELECT f.id, f.note, f.created_at, e.name AS employee_name 
         FROM FollowUpNotes f 
         JOIN Employees e ON f.employee_id = e.id AND f.company_id = e.company_id
         WHERE f.customer_id = ? AND f.company_id = ?
         ORDER BY f.created_at DESC`,
        [customerId, companyId]
      )

      res.status(200).json({ status: 'success', data: notes })
    } catch (error) {
      next(error)
    }
  }
)

export default router
