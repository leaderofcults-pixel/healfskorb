import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/connection"
import { prescriberProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  practiceName: z.string().min(1, "Practice name is required"),
  specialty: z.array(z.string()),
  npiNumber: z.string().length(10, "NPI number must be 10 digits"),
  addressStreet: z.string().min(1, "Street address is required"),
  addressCity: z.string().min(1, "City is required"),
  addressState: z.string().length(2, "State must be 2 characters"),
  addressZip: z.string().min(5, "ZIP code is required"),
  phone: z.string().min(10, "Phone number is required"),
  website: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(500, "Bio must be less than 500 characters"),
})

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "PRESCRIBER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()

    // Get prescriber profile
    const profile = await db
      .select()
      .from(prescriberProfiles)
      .where(eq(prescriberProfiles.userId, session.user.id))
      .limit(1)

    // Mock stats for now
    const stats = {
      profileViews: Math.floor(Math.random() * 100) + 50,
      searchAppearances: Math.floor(Math.random() * 200) + 100,
      patientInquiries: Math.floor(Math.random() * 20) + 5,
      monthlyGrowth: Math.floor(Math.random() * 30) + 10,
    }

    return NextResponse.json({
      profile: profile[0] || null,
      stats,
    })
  } catch (error) {
    console.error("[v0] Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "PRESCRIBER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = profileSchema.parse(body)

    const db = getDb()

    // Calculate profile completeness
    const fields = [
      validatedData.firstName,
      validatedData.lastName,
      validatedData.practiceName,
      validatedData.specialty.length > 0,
      validatedData.npiNumber,
      validatedData.addressStreet,
      validatedData.addressCity,
      validatedData.addressState,
      validatedData.addressZip,
      validatedData.phone,
      validatedData.bio,
    ]

    const filledFields = fields.filter(Boolean).length
    const profileCompleteness = Math.round((filledFields / fields.length) * 100)

    // Check if profile exists
    const existingProfile = await db
      .select()
      .from(prescriberProfiles)
      .where(eq(prescriberProfiles.userId, session.user.id))
      .limit(1)

    if (existingProfile.length > 0) {
      // Update existing profile
      await db
        .update(prescriberProfiles)
        .set({
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          practiceName: validatedData.practiceName,
          specialty: JSON.stringify(validatedData.specialty),
          npiNumber: validatedData.npiNumber,
          addressStreet: validatedData.addressStreet,
          addressCity: validatedData.addressCity,
          addressState: validatedData.addressState,
          addressZip: validatedData.addressZip,
          phone: validatedData.phone,
          website: validatedData.website || null,
          bio: validatedData.bio,
          profileCompleteness,
        })
        .where(eq(prescriberProfiles.userId, session.user.id))
    } else {
      // Create new profile
      await db.insert(prescriberProfiles).values({
        userId: session.user.id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        practiceName: validatedData.practiceName,
        specialty: JSON.stringify(validatedData.specialty),
        npiNumber: validatedData.npiNumber,
        addressStreet: validatedData.addressStreet,
        addressCity: validatedData.addressCity,
        addressState: validatedData.addressState,
        addressZip: validatedData.addressZip,
        phone: validatedData.phone,
        website: validatedData.website || null,
        bio: validatedData.bio,
        profileCompleteness,
        createdAt: new Date(),
      })
    }

    console.log("[v0] Profile updated successfully for user:", session.user.id)

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("[v0] Profile update error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
