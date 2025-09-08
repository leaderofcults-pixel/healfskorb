import { drizzle } from "drizzle-orm/mysql2"
import * as mysql from "mysql2/promise"
import type { Pool } from "mysql2/promise"
import * as schema from "./schema"
import type { MySql2Database } from "drizzle-orm/mysql2"

export type Schema = typeof schema
export type Database = MySql2Database<typeof schema>

let _pool: Pool | null = null
let _db: Database | null = null

export async function getDb(): Promise<Database> {
  if (!_db) {
    if (!_pool) {
      _pool = await mysql.createPool({
        host: process.env.DB_HOST || "srv1850.hstgr.io",
        user: process.env.DB_USER || "u883018350_admin",
        password: process.env.DB_PASSWORD || "tR&+m47KI4",
        database: process.env.DB_NAME || "u883018350_prescribers_pd",
        port: Number.parseInt(process.env.DB_PORT || "3306"),
        connectionLimit: 1,
        connectTimeout: 5000
      })
    }
    _db = drizzle(_pool, { schema, mode: "default" })
  }
  return _db
}
