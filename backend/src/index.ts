import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import db from './db'
import authRouter from './routes/auth'
import employeeRouter from './routes/employees'
import customerRouter from './routes/customers'
import productRouter from './routes/products'
import challanRouter from './routes/challans'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : '*',
  credentials: true
}))
app.use(express.json())

// API Routes
app.use('/api/auth', authRouter)
app.use('/api/employees', employeeRouter)
app.use('/api/customers', customerRouter)
app.use('/api/products', productRouter)
app.use('/api/challans', challanRouter)

// Health check API route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend server is running successfully',
    timestamp: new Date().toISOString()
  })
})

// Test Database Connection Route
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result')
    res.status(200).json({
      status: 'connected',
      message: 'Database connection test successful',
      data: rows
    })
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    })
  }
})

import fs from 'fs'
import path from 'path'

// Centralized Error Middleware
app.use(errorHandler)

// Start server
app.listen(PORT, async () => {
  console.log(`[Server] Running on http://localhost:${PORT}`)
  try {
    const schemaPath = path.join(process.cwd(), 'schema.sql')
    if (fs.existsSync(schemaPath)) {
      console.log('[Server] Initializing database schema from schema.sql...')
      const sql = fs.readFileSync(schemaPath, 'utf8')
      
      // Clean and split SQL file into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      for (const statement of statements) {
        if (!statement.toLowerCase().startsWith('create database') && !statement.toLowerCase().startsWith('use')) {
          await db.query(statement)
        }
      }
      console.log('[Server] Database schema initialized successfully.')
    } else {
      console.log('[Server] schema.sql not found, skipping auto-migration.')
    }

    // Auto-verify AuditLogs table (ensures it is set up regardless of schema.sql)
    await db.query(`
      CREATE TABLE IF NOT EXISTS AuditLogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_name VARCHAR(50) NOT NULL,
        record_id VARCHAR(50) NOT NULL,
        field_name VARCHAR(50) NOT NULL,
        old_value TEXT NOT NULL,
        new_value TEXT NOT NULL,
        changed_by VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (changed_by) REFERENCES Employees(id)
      )
    `)
    console.log('[Server] Database AuditLogs table verified successfully.')
  } catch (err: any) {
    console.error('[Server] Failed to initialize database tables:', err.message || err)
  }
})
