import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db/connection"
import { users } from "@/lib/db/schema"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import fs from "fs/promises"
import path from "path"

type DevUser = {
  id: string
  email: string
  passwordHash: string
  name: string
  role: string
  createdAt: string
}

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
    } catch (dbErr: unknown) {
      const message = dbErr instanceof Error ? dbErr.message : String(dbErr)
      console.warn("[dev] DB insert failed, falling back to dev-users file:", message)

      // fallback to writing a local dev users file
      try {
        const file = path.resolve(process.cwd(), ".dev-users.json")
        let list: DevUser[] = []
        try {
          const raw = await fs.readFile(file, "utf8")
          list = JSON.parse(raw || "[]")
        } catch {
          // ignore missing file
        }

        list.push({ id, email, passwordHash: hashedPassword, name, role, createdAt: new Date().toISOString() })
        await fs.writeFile(file, JSON.stringify(list, null, 2), "utf8")

        return NextResponse.json({ id, email, createdIn: "file" })
      } catch (fileErr: unknown) {
        const message = fileErr instanceof Error ? fileErr.message : String(fileErr)
        console.error("[dev] fallback write failed:", message)
        return NextResponse.json({ error: message }, { status: 500 })
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[dev] register-test failed:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
