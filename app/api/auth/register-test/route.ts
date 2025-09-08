import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db/connection"
import { users } from "@/lib/db/schema"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import fs from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  // Only allow in non-production to avoid accidental public test accounts
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const email = body.email || "test@example.com"
    const password = body.password || "password123"
    const name = body.name || "Test User"
    const role = body.role || "PATIENT"

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 })
    }

    // Update: Await the getDb() call
    const db = await getDb()

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const id = randomUUID()

    try {
      // Update: Replace property 'passwordHash' with 'password' in user insertion
      await db.insert(users).values({
        id,
        email,
        password: hashedPassword,
        name,
        role,
        createdAt: new Date(),
      })

      return NextResponse.json({ id, email, createdIn: "db" })
    } catch (dbErr: any) {
      console.warn("[dev] DB insert failed, falling back to dev-users file:", dbErr?.message)

      // fallback to writing a local dev users file
      try {
        const file = path.resolve(process.cwd(), ".dev-users.json")
        let list: any[] = []
        try {
          const raw = await fs.readFile(file, "utf8")
          list = JSON.parse(raw || "[]")
        } catch (e) {
          // ignore missing file
        }

        list.push({ id, email, passwordHash: hashedPassword, name, role, createdAt: new Date().toISOString() })
        await fs.writeFile(file, JSON.stringify(list, null, 2), "utf8")

        return NextResponse.json({ id, email, createdIn: "file" })
      } catch (fileErr: any) {
        console.error("[dev] fallback write failed:", fileErr)
        return NextResponse.json({ error: fileErr?.message || String(fileErr) }, { status: 500 })
      }
    }
  } catch (err: any) {
    console.error("[dev] register-test failed:", err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
