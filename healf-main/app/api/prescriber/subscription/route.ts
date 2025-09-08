import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/connection"
import { prescriberProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "PRESCRIBER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()

    // Get prescriber profile with subscription info
    const profile = await db
      .select({
        subscriptionStatus: prescriberProfiles.subscriptionStatus,
        subscriptionExpires: prescriberProfiles.subscriptionExpires,
      })
      .from(prescriberProfiles)
      .where(eq(prescriberProfiles.userId, session.user.id))
      .limit(1)

    const subscription = profile[0] || { subscriptionStatus: "FREE", subscriptionExpires: null }

    return NextResponse.json({
      subscription: {
        status: subscription.subscriptionStatus,
        expires: subscription.subscriptionExpires,
      },
    })
  } catch (error) {
    console.error("[v0] Subscription fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
