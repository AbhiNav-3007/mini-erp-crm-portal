import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    role: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts'
    company_id: number
  }
}

// Verify JWT token in authorization header
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
      id: string
      role: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts'
      company_id: number
    }
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ status: 'error', message: 'Invalid or expired token' })
  }
}

// Authorize roles (RBAC)
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden: Access restricted to roles: [${allowedRoles.join(', ')}]`
      })
    }

    next()
  }
}
