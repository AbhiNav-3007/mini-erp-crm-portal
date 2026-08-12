import { Request, Response, NextFunction } from 'express'

export interface CustomError extends Error {
  statusCode?: number
  errors?: any[]
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    status: 'error',
    message,
    errors: err.errors || undefined
  })
}
