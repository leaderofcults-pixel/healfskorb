import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db/connection"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["PATIENT", "PRESCRIBER"]),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Update: Await the getDb() call
    const db = await getDb()

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, validatedData.email)).limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Generate an ID for the new user
    const id = crypto.randomUUID()

    // Create user
    await db.insert(users).values({
      id, // Added required id field
      email: validatedData.email,
      password: hashedPassword,
      name: validatedData.name,
      role: validatedData.role,
      createdAt: new Date(),
    })

    console.log("[v0] User registered successfully:", validatedData.email)

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 })
  } catch (error) {
    console.error("[v0] Registration error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
