import { type NextRequest, NextResponse } from "next/server"
import { searchPrescribers } from "@/lib/db/queries"
import { z } from "zod"

const searchSchema = z.object({
  pharmaName: z.string().min(1, "Pharmaceutical name is required"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().min(1).max(100).default(25),
  filters: z
    .object({
      specialty: z.array(z.string()).optional(),
      verified: z.boolean().optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = searchSchema.parse(body)

    console.log("[v0] Search request received:", {
      pharmaName: validatedData.pharmaName,
      location: `${validatedData.lat}, ${validatedData.lng}`,
      radius: validatedData.radius,
    })

    const results = await searchPrescribers(validatedData)

    console.log("[v0] Search completed:", {
      resultCount: results.length,
      topMatch: results?.[0]?.matchScore || 0,
    })

    return NextResponse.json({
      results,
      totalCount: results.length,
      searchId: crypto.randomUUID(),
    })
  } catch (error) {
    console.error("[v0] Search API error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}