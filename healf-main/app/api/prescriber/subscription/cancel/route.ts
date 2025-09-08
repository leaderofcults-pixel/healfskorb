import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/connection"
import { prescriberProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "PRESCRIBER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()

    // Update subscription status to FREE
    await db
      .update(prescriberProfiles)
      .set({
        subscriptionStatus: "FREE",
        subscriptionExpires: null,
        verified: false,
      })
      .where(eq(prescriberProfiles.userId, session.user.id))

    console.log("[v0] Subscription cancelled for user:", session.user.id)

    return NextResponse.json({ message: "Subscription cancelled successfully" })
  } catch (error) {
    console.error("[v0] Cancel subscription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
