import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"

export function getDb() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "srv1850.hstgr.io",
    user: process.env.DB_USER || "u883018350_admin",
    password: process.env.DB_PASSWORD || "tR&+m47KI4",
    database: process.env.DB_NAME || "u883018350_prescribers_pd",
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    connectionLimit: 1, // For serverless, limit to 1
    connectTimeout: 5000,
  })

  return drizzle(pool)
}