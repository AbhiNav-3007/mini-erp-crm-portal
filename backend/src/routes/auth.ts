import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
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

// 1. Company Registration API
router.post('/register-company', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyName, adminId, adminName, adminPassword, adminJoiningDate } = req.body

    if (!companyName || !adminId || !adminName || !adminPassword || !adminJoiningDate) {
      return res.status(400).json({ status: 'error', message: 'All company and admin registration fields are required' })
    }

    if (!isValidRolePrefix(adminId, 'Admin')) {
      return res.status(400).json({
        status: 'error',
        message: 'Mismatched profile ID: Admin Employee ID prefix must start with AD-'
      })
    }

    // Check if company name already exists
    const [existingCompany]: any = await db.query('SELECT * FROM Companies WHERE name = ?', [companyName])
    if (existingCompany.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Company name is already registered.' })
    }

    // 1. Create company
    const [compResult]: any = await db.query('INSERT INTO Companies (name) VALUES (?)', [companyName])
    const companyId = compResult.insertId

    // 2. Hash admin password & insert admin employee
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(adminPassword, salt)

    await db.query(
      'INSERT INTO Employees (id, company_id, name, role, joining_date, password, is_activated) VALUES (?, ?, ?, "Admin", ?, ?, true)',
      [adminId, companyId, adminName, adminJoiningDate, hashedPassword]
    )

    // Audit log company creation
    await db.query(
      `INSERT INTO AuditLogs (company_id, table_name, record_id, field_name, old_value, new_value, changed_by) 
       VALUES (?, 'Companies', ?, 'CREATE', '', ?, ?)`,
      [companyId, companyId.toString(), companyName, adminId]
    )

    res.status(201).json({
      status: 'success',
      message: `Company '${companyName}' registered successfully! Your Company ID is: ${companyId}`,
      companyId
    })
  } catch (error) {
    next(error)
  }
})

// 2. Account Self-Registration API
router.post('/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId, id, name, role, joining_date, password } = req.body

    // Simple fields validation
    if (!companyId || !id || !name || !role || !joining_date || !password) {
      return res.status(400).json({ status: 'error', message: 'All registration fields (including Company ID) are required' })
    }

    // Role-Prefix checking
    if (!isValidRolePrefix(id, role)) {
      return res.status(400).json({
        status: 'error',
        message: `Mismatched profile ID: Employee ID prefix for ${role} must match expectations (AD-, SL-, WH-, AC-)`
      })
    }

    // Verify company exists
    const [companies]: any = await db.query('SELECT * FROM Companies WHERE id = ?', [companyId])
    if (companies.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid Company ID. Company not found.' })
    }

    // Query if record already exists under this company
    const [rows]: any = await db.query(
      'SELECT * FROM Employees WHERE id = ? AND company_id = ?',
      [id, companyId]
    )

    if (rows.length > 0) {
      const existing = rows[0]

      // If they already have a password set, they are already registered
      if (existing.password !== null) {
        if (existing.is_activated) {
          return res.status(400).json({ status: 'error', message: 'Employee ID is already registered and approved.' })
        } else {
          return res.status(400).json({ status: 'error', message: 'Registration request is already pending Admin approval.' })
        }
      }

      // Record exists but password is null -> Pre-registered by Admin
      // Validate that Name, Role, and Joining Date match the pre-registered record
      const inputDate = new Date(joining_date).toISOString().split('T')[0]
      const dbDate = new Date(existing.joining_date).toISOString().split('T')[0]

      if (
        existing.name.toLowerCase() !== name.toLowerCase() ||
        dbDate !== inputDate ||
        existing.role !== role
      ) {
        return res.status(400).json({
          status: 'error',
          message: 'Provided details (Name, Role, or Joining Date) do not match the pre-registered employee record.'
        })
      }

      // Details match! Hash password, activate account immediately without Admin approval
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      await db.query(
        'UPDATE Employees SET password = ?, is_activated = true WHERE id = ? AND company_id = ?',
        [hashedPassword, id, companyId]
      )

      return res.status(200).json({
        status: 'success',
        message: 'Account activated successfully! You can now log in.'
      })
    }

    // Hash password & save pending registration for new employees (requires approval)
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    await db.query(
      'INSERT INTO Employees (id, company_id, name, role, joining_date, password, is_activated) VALUES (?, ?, ?, ?, ?, ?, false)',
      [id, companyId, name, role, joining_date, hashedPassword]
    )

    res.status(200).json({
      status: 'success',
      message: 'Registration request submitted successfully. Awaiting Admin approval.'
    })
  } catch (error) {
    next(error)
  }
})

// 3. Login API
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId, id, password, role } = req.body

    if (!companyId || !id || !password || !role) {
      return res.status(400).json({ status: 'error', message: 'Company ID, Employee ID, password, and role are required' })
    }

    // Check employee and fetch company name
    const [rows]: any = await db.query(
      `SELECT e.*, c.name AS company_name 
       FROM Employees e 
       JOIN Companies c ON e.company_id = c.id 
       WHERE e.id = ? AND e.company_id = ?`, 
      [id, companyId]
    )

    if (rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials or company ID mismatch' })
    }

    const employee = rows[0]

    // Verify role matches selected login role
    if (employee.role !== role) {
      return res.status(401).json({ status: 'error', message: 'Mismatched role for this Employee ID' })
    }

    if (!employee.is_activated) {
      return res.status(400).json({ status: 'error', message: 'Profile not activated. Please register/activate first.' })
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, employee.password)
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' })
    }

    // Issue JWT with company_id included
    const token = jwt.sign(
      { id: employee.id, role: employee.role, company_id: employee.company_id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    )

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        company_id: employee.company_id,
        company_name: employee.company_name
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
