import { Router, Response, NextFunction } from 'express'
import { AuthenticatedRequest, authenticateToken, authorizeRoles } from '../middleware/auth'
import db from '../db'

const router = Router()

// 1. View low stock items (All Authenticated users)
router.get(
  '/low-stock',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const [rows]: any = await db.query(
        'SELECT * FROM Products WHERE current_stock <= minimum_stock_alert ORDER BY name ASC'
      )
      res.status(200).json({ status: 'success', data: rows })
    } catch (error) {
      next(error)
    }
  }
)

// 2. View all products with optional search and pagination (All Authenticated users)
router.get(
  '/',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const search = req.query.search as string || ''
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const offset = (page - 1) * limit

      const searchQuery = `%${search}%`

      const [rows]: any = await db.query(
        `SELECT * FROM Products 
         WHERE name LIKE ? OR sku LIKE ? 
         ORDER BY name ASC 
         LIMIT ? OFFSET ?`,
        [searchQuery, searchQuery, limit, offset]
      )

      const [countRows]: any = await db.query(
        'SELECT COUNT(*) as total FROM Products WHERE name LIKE ? OR sku LIKE ?',
        [searchQuery, searchQuery]
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

// 3. View single product detail (All Authenticated users)
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const [rows]: any = await db.query('SELECT * FROM Products WHERE id = ?', [req.params.id])
      if (rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Product not found' })
      }
      res.status(200).json({ status: 'success', data: rows[0] })
    } catch (error) {
      next(error)
    }
  }
)

// 4. Create new product record (Admin, Warehouse, and Sales only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('Admin', 'Warehouse', 'Sales'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { name, sku, category, unit_price, minimum_stock_alert, location, current_stock } = req.body

      if (!name || !sku || !category || unit_price === undefined) {
        return res.status(400).json({ status: 'error', message: 'Missing required product fields' })
      }

      // Check unique SKU
      const [existing]: any = await db.query('SELECT * FROM Products WHERE sku = ?', [sku])
      if (existing.length > 0) {
        return res.status(400).json({ status: 'error', message: 'Product SKU must be unique' })
      }

      const initialStock = parseInt(current_stock as string) || 0

      // Insert product
      const [result]: any = await db.query(
        `INSERT INTO Products (name, sku, category, unit_price, current_stock, minimum_stock_alert, location) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, sku, category, unit_price, initialStock, minimum_stock_alert || 5, location || null]
      )
      const productId = result.insertId

      // System Audit Log product creation
      await db.query(
        `INSERT INTO AuditLogs (table_name, record_id, field_name, old_value, new_value, changed_by) 
         VALUES ('Products', ?, 'CREATE', '', ?, ?)`,
        [productId.toString(), `Created Product ${name} (${sku})`, req.user?.id]
      )

      // Log Stock IN movement if initial stock was set
      if (initialStock > 0) {
        await db.query(
          `INSERT INTO StockMovements (product_id, quantity, movement_type, reason, created_by) 
           VALUES (?, ?, 'IN', 'Initial Stock Entry', ?)`,
          [productId, initialStock, req.user?.id]
        )
      }

      res.status(201).json({ status: 'success', message: 'Product registered successfully', data: { id: productId } })
    } catch (error) {
      next(error)
    }
  }
)

// 5. Update product record catalog (Admin, Warehouse, and Sales only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('Admin', 'Warehouse', 'Sales'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { name, category, unit_price, minimum_stock_alert, location, current_stock } = req.body
      const productId = req.params.id

      if (!name || !category || unit_price === undefined) {
        return res.status(400).json({ status: 'error', message: 'Missing required product fields' })
      }

      const [existing]: any = await db.query('SELECT * FROM Products WHERE id = ?', [productId])
      if (existing.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Product not found' })
      }

      const oldProduct = existing[0]
      const newStock = parseInt(current_stock as string)

      const fields = ['name', 'category', 'unit_price', 'minimum_stock_alert', 'location']
      for (const field of fields) {
        let oldVal = oldProduct[field] === null ? '' : String(oldProduct[field])
        let newVal = req.body[field] === undefined ? '' : String(req.body[field] || '')
        
        if (field === 'location') {
          if (!req.body[field]) newVal = ''
        }

        if (oldVal !== newVal) {
          await db.query(
            `INSERT INTO AuditLogs (table_name, record_id, field_name, old_value, new_value, changed_by) 
             VALUES ('Products', ?, ?, ?, ?, ?)`,
            [productId, field, oldVal, newVal, req.user?.id]
          )
        }
      }

      // Update basic fields
      await db.query(
        `UPDATE Products 
         SET name = ?, category = ?, unit_price = ?, minimum_stock_alert = ?, location = ? 
         WHERE id = ?`,
        [name, category, unit_price, minimum_stock_alert || 5, location || null, productId]
      )

      // If current_stock was passed and differs from old stock, adjust it and log movement
      if (newStock !== undefined && !isNaN(newStock) && newStock !== oldProduct.current_stock) {
        await db.query('UPDATE Products SET current_stock = ? WHERE id = ?', [newStock, productId])

        const stockDiff = newStock - oldProduct.current_stock
        const movementType = stockDiff > 0 ? 'IN' : 'OUT'
        const qtyAdjusted = Math.abs(stockDiff)

        await db.query(
          `INSERT INTO StockMovements (product_id, quantity, movement_type, reason, created_by) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            productId,
            qtyAdjusted,
            movementType,
            `Stock adjusted manually from ${oldProduct.current_stock} to ${newStock}`,
            req.user?.id
          ]
        )

        // Audit Log manual stock adjust
        await db.query(
          `INSERT INTO AuditLogs (table_name, record_id, field_name, old_value, new_value, changed_by) 
           VALUES ('Products', ?, 'MANUAL_STOCK_ADJUST', ?, ?, ?)`,
          [productId, String(oldProduct.current_stock), String(newStock), req.user?.id]
        )
      }

      res.status(200).json({ status: 'success', message: 'Product details updated successfully' })
    } catch (error) {
      next(error)
    }
  }
)

// 6. Record Stock IN movement (Admin and Warehouse only)
router.post(
  '/:id/stock-in',
  authenticateToken,
  authorizeRoles('Admin', 'Warehouse'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { quantity, reason } = req.body
      const productId = req.params.id

      if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0 || !reason) {
        return res.status(400).json({ status: 'error', message: 'Valid positive quantity and reason are required' })
      }

      // Check if product exists
      const [products]: any = await db.query('SELECT * FROM Products WHERE id = ?', [productId])
      if (products.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Product not found' })
      }

      const qtyNum = parseInt(quantity)

      // Increment stock count in Products table
      await db.query('UPDATE Products SET current_stock = current_stock + ? WHERE id = ?', [qtyNum, productId])

      // Log record in StockMovements
      await db.query(
        `INSERT INTO StockMovements (product_id, quantity, movement_type, reason, created_by) 
         VALUES (?, ?, 'IN', ?, ?)`,
        [productId, qtyNum, reason, req.user?.id]
      )

      // Audit Log stock entry
      await db.query(
        `INSERT INTO AuditLogs (table_name, record_id, field_name, old_value, new_value, changed_by) 
         VALUES ('Products', ?, 'STOCK_IN', ?, ?, ?)`,
        [productId, String(products[0].current_stock), String(products[0].current_stock + qtyNum), req.user?.id]
      )

      res.status(200).json({ status: 'success', message: 'Stock IN recorded successfully' })
    } catch (error) {
      next(error)
    }
  }
)

// 7. Get stock movements log for a single product (All Authenticated users)
router.get(
  '/:id/movements',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.id

      const [rows]: any = await db.query(
        `SELECT sm.id, sm.quantity, sm.movement_type, sm.reason, sm.timestamp, e.name AS employee_name 
         FROM StockMovements sm
         JOIN Employees e ON sm.created_by = e.id 
         WHERE sm.product_id = ? 
         ORDER BY sm.timestamp DESC`,
        [productId]
      )

      res.status(200).json({ status: 'success', data: rows })
    } catch (error) {
      next(error)
    }
  }
)

export default router
