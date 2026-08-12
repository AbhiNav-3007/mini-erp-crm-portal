import { Router, Response, NextFunction } from 'express'
import { AuthenticatedRequest, authenticateToken, authorizeRoles } from '../middleware/auth'
import db from '../db'

const router = Router()

// 1. Create a Sales Challan Draft (Sales, Admin, and Accounts only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('Admin', 'Sales', 'Accounts'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const connection = await db.getConnection()
    try {
      const companyId = req.user?.company_id
      const { customer_id, items } = req.body // items is array of { product_id, quantity, unit_price }

      if (!companyId) {
        return res.status(401).json({ status: 'error', message: 'Company context missing' })
      }

      if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Customer ID and product items are required' })
      }

      await connection.beginTransaction()

      // Generate a unique challan number
      const challanNumber = `CH-${Date.now()}`
      const totalQuantity = items.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0)

      // Insert Challan header record
      const [challanResult]: any = await connection.query(
        `INSERT INTO Challans (company_id, challan_number, customer_id, status, total_quantity, created_by) 
         VALUES (?, ?, ?, 'Draft', ?, ?)`,
        [companyId, challanNumber, customer_id, totalQuantity, req.user?.id]
      )
      const challanId = challanResult.insertId

      // System Audit Log draft creation
      await connection.query(
        `INSERT INTO AuditLogs (company_id, table_name, record_id, field_name, old_value, new_value, changed_by) 
         VALUES (?, 'Challans', ?, 'CREATE_DRAFT', '', ?, ?)`,
        [companyId, challanId.toString(), `Created Challan ${challanNumber} (Draft)`, req.user?.id]
      )

      // Insert Challan nested items
      for (const item of items) {
        if (!item.product_id || !item.quantity || !item.unit_price) {
          throw new Error('Invalid challan item fields')
        }

        const [products]: any = await connection.query(
          'SELECT name, current_stock FROM Products WHERE id = ? AND company_id = ?',
          [item.product_id, companyId]
        )
        if (products.length === 0) {
          throw new Error('Product not found in this company')
        }
        const product = products[0]
        if (product.current_stock < item.quantity) {
          throw new Error(`Product quantity unavailable for product '${product.name}' (Required: ${item.quantity}, In Stock: ${product.current_stock})`)
        }

        await connection.query(
          `INSERT INTO ChallanItems (challan_id, product_id, quantity, unit_price) 
           VALUES (?, ?, ?, ?)`,
          [challanId, item.product_id, item.quantity, item.unit_price]
        )
      }

      await connection.commit()
      res.status(201).json({
        status: 'success',
        message: 'Sales Challan draft created successfully',
        data: { challanId, challanNumber }
      })
    } catch (error: any) {
      await connection.rollback()
      res.status(400).json({ status: 'error', message: error.message || 'Failed to create challan draft' })
    } finally {
      connection.release()
    }
  }
)

// 2. View all Challans with pagination and status filter (All Authenticated users)
router.get(
  '/',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.company_id
      const statusFilter = req.query.status as string || ''
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const offset = (page - 1) * limit

      let query = `
        SELECT c.id, c.challan_number, c.status, c.total_quantity, c.created_at, cust.name AS customer_name, e.name AS creator_name 
        FROM Challans c
        JOIN Customers cust ON c.customer_id = cust.id AND c.company_id = cust.company_id
        JOIN Employees e ON c.created_by = e.id AND c.company_id = e.company_id
        WHERE c.company_id = ?
      `
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM Challans c 
        JOIN Customers cust ON c.customer_id = cust.id AND c.company_id = cust.company_id
        WHERE c.company_id = ?
      `
      const queryParams: any[] = [companyId]

      if (statusFilter) {
        query += ' AND c.status = ?'
        countQuery += ' AND c.status = ?'
        queryParams.push(statusFilter)
      }

      query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
      const selectParams = [...queryParams, limit, offset]

      const [rows]: any = await db.query(query, selectParams)
      const [countRows]: any = await db.query(countQuery, queryParams)
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

// 3. View single Challan detail with nested items (All Authenticated users)
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.company_id
      const challanId = req.params.id

      // Fetch challan header details
      const [challanRows]: any = await db.query(
        `SELECT c.id, c.challan_number, c.status, c.total_quantity, c.created_at, 
                cust.name AS customer_name, cust.business_name AS customer_business,
                cust.mobile_number AS customer_mobile, cust.email AS customer_email,
                cust.gst_number AS customer_gst, cust.customer_type AS customer_type,
                cust.address AS customer_address, cust.status AS customer_status,
                e.name AS creator_name 
         FROM Challans c
         JOIN Customers cust ON c.customer_id = cust.id AND c.company_id = cust.company_id
         JOIN Employees e ON c.created_by = e.id AND c.company_id = e.company_id
         WHERE c.id = ? AND c.company_id = ?`,
        [challanId, companyId]
      )

      if (challanRows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Challan record not found' })
      }

      // Fetch nested items
      const [itemRows]: any = await db.query(
        `SELECT ci.id, ci.quantity, ci.unit_price, p.name AS product_name, p.sku AS product_sku 
         FROM ChallanItems ci 
         JOIN Products p ON ci.product_id = p.id 
         WHERE ci.challan_id = ? AND p.company_id = ?`,
        [challanId, companyId]
      )

      res.status(200).json({
        status: 'success',
        data: {
          ...challanRows[0],
          items: itemRows
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// 4. Confirm Challan (Sales, Admin, and Accounts only) - Executes Phase 18 transaction logic
router.post(
  '/:id/confirm',
  authenticateToken,
  authorizeRoles('Admin', 'Sales', 'Accounts'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const connection = await db.getConnection()
    try {
      const companyId = req.user?.company_id
      const challanId = req.params.id

      await connection.beginTransaction()

      // 1. Check Challan exists and is still in Draft status
      const [challans]: any = await connection.query(
        'SELECT * FROM Challans WHERE id = ? AND company_id = ? FOR UPDATE',
        [challanId, companyId]
      )

      if (challans.length === 0) {
        throw new Error('Challan record not found')
      }

      const challan = challans[0]
      if (challan.status !== 'Draft') {
        throw new Error(`Cannot confirm a challan that is already ${challan.status}`)
      }

      // 2. Fetch all nested challan items
      const [items]: any = await connection.query(
        `SELECT ci.* 
         FROM ChallanItems ci 
         JOIN Products p ON ci.product_id = p.id
         WHERE ci.challan_id = ? AND p.company_id = ?`,
        [challanId, companyId]
      )

      // 3. Verify stock levels for each item and update stock
      for (const item of items) {
        const [products]: any = await connection.query(
          'SELECT name, current_stock FROM Products WHERE id = ? AND company_id = ? FOR UPDATE',
          [item.product_id, companyId]
        )

        if (products.length === 0) {
          throw new Error('One of the products in the challan catalog was not found')
        }

        const product = products[0]
        if (product.current_stock < item.quantity) {
          throw new Error(`Insufficient stock for product '${product.name}'. Required: ${item.quantity}, Available: ${product.current_stock}`)
        }

        // Deduct inventory stock levels
        await connection.query(
          'UPDATE Products SET current_stock = current_stock - ? WHERE id = ? AND company_id = ?',
          [item.quantity, item.product_id, companyId]
        )

        // Log Stock OUT movement
        await connection.query(
          `INSERT INTO StockMovements (company_id, product_id, quantity, movement_type, reason, created_by) 
           VALUES (?, ?, ?, 'OUT', ?, ?)`,
          [
            companyId,
            item.product_id,
            item.quantity,
            `Automated sales deduction for confirmed challan: ${challan.challan_number}`,
            req.user?.id
          ]
        )
      }

      // 4. Update Challan status to Confirmed
      await connection.query(
        "UPDATE Challans SET status = 'Confirmed' WHERE id = ? AND company_id = ?",
        [challanId, companyId]
      )

      // System Audit Log confirmation
      await connection.query(
        `INSERT INTO AuditLogs (company_id, table_name, record_id, field_name, old_value, new_value, changed_by) 
         VALUES (?, 'Challans', ?, 'CONFIRM', 'Draft', 'Confirmed', ?)`,
        [companyId, challanId.toString(), req.user?.id]
      )

      await connection.commit()
      res.status(200).json({ status: 'success', message: 'Sales Challan confirmed successfully. Inventory levels updated.' })
    } catch (error: any) {
      await connection.rollback()
      res.status(400).json({ status: 'error', message: error.message || 'Failed to confirm challan' })
    } finally {
      connection.release()
    }
  }
)

// 5. Cancel Challan (Sales, Admin only)
router.post(
  '/:id/cancel',
  authenticateToken,
  authorizeRoles('Admin', 'Sales'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const connection = await db.getConnection()
    try {
      const companyId = req.user?.company_id
      const challanId = req.params.id

      await connection.beginTransaction()

      // Fetch challan details
      const [challans]: any = await connection.query(
        'SELECT * FROM Challans WHERE id = ? AND company_id = ? FOR UPDATE',
        [challanId, companyId]
      )

      if (challans.length === 0) {
        throw new Error('Challan record not found')
      }

      const challan = challans[0]
      if (challan.status === 'Cancelled') {
        throw new Error('Challan is already cancelled')
      }

      // If the challan was already confirmed, we need to return the deducted stock levels (reverse)
      if (challan.status === 'Confirmed') {
        const [items]: any = await connection.query(
          `SELECT ci.* 
           FROM ChallanItems ci 
           JOIN Products p ON ci.product_id = p.id
           WHERE ci.challan_id = ? AND p.company_id = ?`,
          [challanId, companyId]
        )

        for (const item of items) {
          // Increment stock back
          await connection.query(
            'UPDATE Products SET current_stock = current_stock + ? WHERE id = ? AND company_id = ?',
            [item.quantity, item.product_id, companyId]
          )

          // Log Stock IN movement reversing the OUT movement
          await connection.query(
            `INSERT INTO StockMovements (company_id, product_id, quantity, movement_type, reason, created_by) 
             VALUES (?, ?, ?, 'IN', ?, ?)`,
            [
              companyId,
              item.product_id,
              item.quantity,
              `Reversal: stock returned due to cancellation of confirmed challan ${challan.challan_number}`,
              req.user?.id
            ]
          )
        }
      }

      // Update status to Cancelled
      await connection.query(
        "UPDATE Challans SET status = 'Cancelled' WHERE id = ? AND company_id = ?",
        [challanId, companyId]
      )

      // System Audit Log cancellation
      await connection.query(
        `INSERT INTO AuditLogs (company_id, table_name, record_id, field_name, old_value, new_value, changed_by) 
         VALUES (?, 'Challans', ?, 'CANCEL', ?, 'Cancelled', ?)`,
        [companyId, challanId.toString(), challan.status, req.user?.id]
      )

      await connection.commit()
      res.status(200).json({ status: 'success', message: 'Challan cancelled successfully. Stock levels adjusted if applicable.' })
    } catch (error: any) {
      await connection.rollback()
      res.status(400).json({ status: 'error', message: error.message || 'Failed to cancel challan' })
    } finally {
      connection.release()
    }
  }
)

// 6. Edit Challan Items (Admin and Accounts only) - Phase 19 Audit Log Logic
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('Admin', 'Accounts'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const connection = await db.getConnection()
    try {
      const companyId = req.user?.company_id
      const challanId = req.params.id
      const { items } = req.body // items is array of { id, product_id, quantity, unit_price }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Product items list is required' })
      }

      await connection.beginTransaction()

      // Fetch challan header
      const [challans]: any = await connection.query(
        'SELECT * FROM Challans WHERE id = ? AND company_id = ? FOR UPDATE',
        [challanId, companyId]
      )

      if (challans.length === 0) {
        throw new Error('Challan record not found')
      }

      const challan = challans[0]
      if (challan.status === 'Cancelled') {
        throw new Error('Cannot edit a cancelled challan')
      }

      // Fetch existing challan items
      const [oldItems]: any = await connection.query(
        `SELECT ci.* 
         FROM ChallanItems ci 
         JOIN Products p ON ci.product_id = p.id
         WHERE ci.challan_id = ? AND p.company_id = ?`,
        [challanId, companyId]
      )

      // Match items and record audits
      for (const item of items) {
        const oldItem = oldItems.find((o: any) => o.id === item.id)
        if (!oldItem) continue // Skip if item wasn't originally part of this challan

        const oldQty = oldItem.quantity
        const newQty = parseInt(item.quantity)
        const oldPrice = parseFloat(oldItem.unit_price)
        const newPrice = parseFloat(item.unit_price)

        if (isNaN(newQty) || isNaN(newPrice)) {
          throw new Error('Invalid quantity or price values provided')
        }

        // 1. Audit Quantity Change
        if (oldQty !== newQty) {
          // Log quantity audit entry
          await connection.query(
            `INSERT INTO AuditLogs (company_id, table_name, record_id, field_name, old_value, new_value, changed_by) 
             VALUES (?, 'ChallanItems', ?, 'quantity', ?, ?, ?)`,
            [companyId, item.id.toString(), oldQty.toString(), newQty.toString(), req.user?.id]
          )

          // If confirmed, adjust actual product stock
          if (challan.status === 'Confirmed') {
            const qtyDiff = newQty - oldQty // positive means they increased challan qty (deduct more stock)
            
            const [products]: any = await connection.query(
              'SELECT name, current_stock FROM Products WHERE id = ? AND company_id = ? FOR UPDATE',
              [oldItem.product_id, companyId]
            )

            if (products.length === 0) {
              throw new Error('Product not found in catalog')
            }

            const product = products[0]
            if (qtyDiff > 0 && product.current_stock < qtyDiff) {
              throw new Error(`Insufficient stock for product '${product.name}' to adjust quantity. Required extra: ${qtyDiff}, Available: ${product.current_stock}`)
            }

            // Update stock
            await connection.query(
              'UPDATE Products SET current_stock = current_stock - ? WHERE id = ? AND company_id = ?',
              [qtyDiff, oldItem.product_id, companyId]
            )

            // Log stock movement
            const movementType = qtyDiff > 0 ? 'OUT' : 'IN'
            const movementQty = Math.abs(qtyDiff)
            await connection.query(
              `INSERT INTO StockMovements (company_id, product_id, quantity, movement_type, reason, created_by) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                companyId,
                oldItem.product_id,
                movementQty,
                movementType,
                `Accounts correction for confirmed challan ${challan.challan_number}`,
                req.user?.id
              ]
            )
          }

          // Update ChallanItems table
          await connection.query(
            'UPDATE ChallanItems SET quantity = ? WHERE id = ?',
            [newQty, item.id]
          )
        }

        // 2. Audit Price Change
        if (oldPrice !== newPrice) {
          await connection.query(
            `INSERT INTO AuditLogs (company_id, table_name, record_id, field_name, old_value, new_value, changed_by) 
             VALUES (?, 'ChallanItems', ?, 'unit_price', ?, ?, ?)`,
            [companyId, item.id.toString(), oldPrice.toString(), newPrice.toString(), req.user?.id]
          )

          await connection.query(
            'UPDATE ChallanItems SET unit_price = ? WHERE id = ?',
            [newPrice, item.id]
          )
        }
      }

      // Re-calculate total quantity on Challan header
      const [sumRows]: any = await connection.query(
        'SELECT SUM(quantity) as total_qty FROM ChallanItems WHERE challan_id = ?',
        [challanId]
      )
      const newTotalQty = sumRows[0].total_qty || 0

      await connection.query(
        'UPDATE Challans SET total_quantity = ? WHERE id = ? AND company_id = ?',
        [newTotalQty, challanId, companyId]
      )

      await connection.commit()
      res.status(200).json({ status: 'success', message: 'Challan details updated successfully and audited.' })
    } catch (error: any) {
      await connection.rollback()
      res.status(400).json({ status: 'error', message: error.message || 'Failed to edit challan items' })
    } finally {
      connection.release()
    }
  }
)

export default router
