import { Router, Response, NextFunction } from 'express'
import { AuthenticatedRequest, authenticateToken, authorizeRoles } from '../middleware/auth'
import db from '../db'

const router = Router()

// Helper validation for role prefix
const isValidRolePrefix = (id: string, role: string): boolean => {
  const prefixMap: { [key: string]: string } = {
    Admin: 'AD-',
    Sales: 'SL-',
    Warehouse: 'WH-',
    Accounts: 'AC-'
  }
  const expectedPrefix = prefixMap[role]
  return expectedPrefix ? id.startsWith(expectedPrefix) : false
}

// 1. Pre-register employee (Admin-Only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('Admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, name, role, joining_date } = req.body

      if (!id || !name || !role || !joining_date) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' })
      }

      // Check prefix
      if (!isValidRolePrefix(id, role)) {
        return res.status(400).json({
          status: 'error',
          message: `ID format mismatch: ID for role ${role} must start with the correct prefix (AD-, SL-, WH-, AC-)`
        })
      }

      // Check unique
      const [existing]: any = await db.query('SELECT * FROM Employees WHERE id = ?', [id])
      if (existing.length > 0) {
        return res.status(400).json({ status: 'error', message: 'Employee ID is already registered' })
      }

      // Insert record
      await db.query(
        'INSERT INTO Employees (id, name, role, joining_date, is_activated) VALUES (?, ?, ?, ?, false)',
        [id, name, role, joining_date]
      )

      // Audit Log pre-registration
      await db.query(
        `INSERT INTO AuditLogs (table_name, record_id, field_name, old_value, new_value, changed_by) 
         VALUES ('Employees', ?, 'PRE_REGISTER', '', ?, ?)`,
        [id, `Pre-registered ${name} as ${role}`, req.user?.id]
      )

      res.status(201).json({
        status: 'success',
        message: 'Employee profile pre-registered successfully. Ready for activation.'
      })
    } catch (error) {
      next(error)
    }
  }
)

// 2. Get all employees (Admin-Only)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('Admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const [rows]: any = await db.query(
        'SELECT id, name, role, joining_date, is_activated, created_at, (password IS NOT NULL) AS has_password FROM Employees ORDER BY created_at DESC'
      )
      res.status(200).json({ status: 'success', data: rows })
    } catch (error) {
      next(error)
    }
  }
)

// 3. Approve employee registration request (Admin-Only)
router.post(
  '/:id/approve',
  authenticateToken,
  authorizeRoles('Admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.params.id

      // Verify exists
      const [rows]: any = await db.query('SELECT * FROM Employees WHERE id = ?', [employeeId])
      if (rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Employee request not found' })
      }

      await db.query('UPDATE Employees SET is_activated = true WHERE id = ?', [employeeId])

      // Audit Log approval
      await db.query(
        `INSERT INTO AuditLogs (table_name, record_id, field_name, old_value, new_value, changed_by) 
         VALUES ('Employees', ?, 'APPROVE_REGISTRATION', 'Pending', 'Approved', ?)`,
        [employeeId, req.user?.id]
      )

      res.status(200).json({ status: 'success', message: 'Employee registration approved successfully' })
    } catch (error) {
      next(error)
    }
  }
)

// 4. Get Audit Logs (Admin-Only)
router.get(
  '/audit-logs',
  authenticateToken,
  authorizeRoles('Admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const [rows]: any = await db.query(
        `SELECT al.id, al.table_name, al.record_id, al.field_name, al.old_value, al.new_value, al.timestamp, e.name AS employee_name, e.role AS employee_role 
         FROM AuditLogs al 
         JOIN Employees e ON al.changed_by = e.id 
         ORDER BY al.timestamp DESC`
      )
      res.status(200).json({ status: 'success', data: rows })
    } catch (error) {
      next(error)
    }
  }
)

// 5. Delete employee (Admin-Only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('Admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.params.id

      if (employeeId === req.user?.id) {
        return res.status(400).json({ status: 'error', message: 'Cannot delete your own active administrator profile' })
      }

      // Check if employee exists
      const [rows]: any = await db.query('SELECT * FROM Employees WHERE id = ?', [employeeId])
      if (rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Employee record not found' })
      }

      const empName = rows[0].name

      // Delete employee
      await db.query('DELETE FROM Employees WHERE id = ?', [employeeId])

      // Audit Log deletion
      await db.query(
        `INSERT INTO AuditLogs (table_name, record_id, field_name, old_value, new_value, changed_by) 
         VALUES ('Employees', ?, 'DELETE', ?, 'Deleted', ?)`,
        [employeeId, `Deleted profile: ${empName}`, req.user?.id]
      )

      res.status(200).json({ status: 'success', message: 'Employee profile deleted successfully' })
    } catch (error: any) {
      // Catch SQL foreign key reference restriction
      if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.sqlState === '23000') {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete employee: This profile has registered historical transactions (e.g. sales challans, follow-ups, or stock movements) in the database.'
        })
      }
      next(error)
    }
  }
)

export default router
