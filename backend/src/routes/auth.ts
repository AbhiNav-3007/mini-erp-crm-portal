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

// 1. Account Self-Registration API
router.post('/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, name, role, joining_date, password } = req.body

    // Simple fields validation
    if (!id || !name || !role || !joining_date || !password) {
      return res.status(400).json({ status: 'error', message: 'All registration fields are required' })
    }

    // Role-Prefix checking
    if (!isValidRolePrefix(id, role)) {
      return res.status(400).json({
        status: 'error',
        message: `Mismatched profile ID: Employee ID prefix for ${role} must match expectations (AD-, SL-, WH-, AC-)`
      })
    }

    // Query if record already exists
    const [rows]: any = await db.query(
      'SELECT * FROM Employees WHERE id = ?',
      [id]
    )

    if (rows.length > 0) {
      const existing = rows[0]
      if (existing.is_activated) {
        return res.status(400).json({ status: 'error', message: 'Employee ID is already registered and approved.' })
      } else {
        return res.status(400).json({ status: 'error', message: 'Registration request is already pending Admin approval.' })
      }
    }

    // Hash password & save pending registration
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    await db.query(
      'INSERT INTO Employees (id, name, role, joining_date, password, is_activated) VALUES (?, ?, ?, ?, ?, false)',
      [id, name, role, joining_date, hashedPassword]
    )

    res.status(200).json({
      status: 'success',
      message: 'Registration request submitted successfully. Awaiting Admin approval.'
    })
  } catch (error) {
    next(error)
  }
})

// 2. Login API
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, password, role } = req.body

    if (!id || !password || !role) {
      return res.status(400).json({ status: 'error', message: 'Employee ID, password, and role are required' })
    }

    // Check employee
    const [rows]: any = await db.query('SELECT * FROM Employees WHERE id = ?', [id])
    console.log('[DEBUG] Query result rows:', rows)
    if (rows.length === 0) {
      console.log('[DEBUG] No employee found with ID:', id)
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' })
    }

    const employee = rows[0]
    console.log('[DEBUG] Employee details:', { id: employee.id, is_activated: employee.is_activated, role: employee.role })

    // Verify role matches selected login role
    if (employee.role !== role) {
      console.log('[DEBUG] Role mismatch. Expected:', employee.role, 'Selected:', role)
      return res.status(401).json({ status: 'error', message: 'Mismatched role for this Employee ID' })
    }

    if (!employee.is_activated) {
      console.log('[DEBUG] Employee profile is not activated')
      return res.status(400).json({ status: 'error', message: 'Profile not activated. Please register/activate first.' })
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, employee.password)
    console.log('[DEBUG] Password comparison result:', isMatch)
    if (!isMatch) {
      console.log('[DEBUG] Password mismatch. Input password was:', password)
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' })
    }

    // Issue JWT
    const token = jwt.sign(
      { id: employee.id, role: employee.role },
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
        role: employee.role
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
