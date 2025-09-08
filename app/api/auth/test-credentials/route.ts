import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import path from "path"
import fs from "fs"

import { getDb } from "@/lib/db/connection"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

type DevUser = {
  id: string
  email: string
  passwordHash: string
  name: string
  role: string
  createdAt: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body || {}

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "email and password required" }, { status: 400 })
    }

    // Try DB first
    try {
      const db = await getDb()
      const rows = await db
        .select({ id: users.id, email: users.email, password: users.password, role: users.role, name: users.name })
        .from(users)
        .where(eq(users.email, email as string))
        .limit(1)

      if (rows.length > 0) {
        const u = rows[0]
        const ok = await bcrypt.compare(password as string, u.password || "")
        if (ok) {
          return NextResponse.json({ ok: true, user: { id: u.id, email: u.email, name: u.name, role: u.role } })
        }
        return NextResponse.json({ ok: false }, { status: 401 })
      }
    } catch {
      // DB unavailable — fall through to dev-file check
      // eslint-disable-next-line no-console
      console.warn('[dev] test-credentials: DB unavailable, falling back to .dev-users.json')
    }

    // Development fallback
    if (process.env.NODE_ENV !== "production") {
      try {
        const file = path.resolve(process.cwd(), ".dev-users.json")
        if (fs.existsSync(file)) {
          const list: DevUser[] = JSON.parse(fs.readFileSync(file, "utf8") || "[]")
          const found = list.find((u) => u.email === email)
          if (found) {
            const ok = await bcrypt.compare(password as string, found.passwordHash)
            if (ok) {
              return NextResponse.json({ ok: true, user: { id: found.id, email: found.email, name: found.name, role: found.role } })
            }
            return NextResponse.json({ ok: false }, { status: 401 })
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[dev] test-credentials: failed to read .dev-users.json', err)
      }
    }

    return NextResponse.json({ ok: false }, { status: 401 })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('test-credentials error', err)
    return NextResponse.json({ ok: false, error: 'internal' }, { status: 500 })
  }
}
