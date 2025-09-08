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

    const db = await getDb()

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" }, 
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    // Create user - ensure all required fields match your schema
    const userId = crypto.randomUUID();

    await db
      .insert(users)
      .values({
        id: userId,
        email: validatedData.email,
        passwordHash: passwordHash,
        name: validatedData.name,
        role: validatedData.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    // Fetch the newly created user
    const createdUser = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    console.log("User registered successfully:", validatedData.email);

    return NextResponse.json(
      { 
        message: "User registered successfully",
        user: { 
          id: createdUser[0].id, 
          email: createdUser[0].email 
        }
      }, 
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Invalid request data", 
          details: error.errors 
        }, 
        { status: 400 }
      )
    }

    // Handle database constraint errors (MySQL specific)
    if (error instanceof Error) {
      if (error.message.includes('Duplicate entry')) {
        return NextResponse.json(
          { error: "User with this email already exists" }, 
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}