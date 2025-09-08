import type { NextRequest } from "next/server"
import { getDb } from "@/lib/db/connection"
import { prescriberProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// PayPal webhook verification
  // TODO: Implement actual webhook signature verification for production
async function verifyWebhookSignature(body: any, signature: string | null): Promise<boolean> {
  // In production, you would verify the webhook signature using PayPal's verification API
  // For now, we'll return true for development
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get("paypal-transmission-sig")

    console.log("[v0] PayPal webhook received:", body.event_type)

    // Verify webhook signature
    if (!(await verifyWebhookSignature(body, signature))) {
      console.error("[v0] Invalid PayPal webhook signature")
      return new Response("Invalid signature", { status: 401 })
    }

    const db = await getDb()

    switch (body.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        await handleSubscriptionActivated(body.resource, db)
        break

      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handleSubscriptionCancelled(body.resource, db)
        break

      case "BILLING.SUBSCRIPTION.SUSPENDED":
        await handleSubscriptionSuspended(body.resource, db)
        break

      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        await handlePaymentFailed(body.resource, db)
        break

      default:
        console.log("[v0] Unhandled PayPal webhook event:", body.event_type)
    }

    return new Response("OK", { status: 200 })
  } catch (error) {
    console.error("[v0] PayPal webhook error:", error)
    return new Response("Internal server error", { status: 500 })
  }
}

async function handleSubscriptionActivated(resource: any, db: any) {
  const userId = resource.custom_id

  if (!userId) {
    console.error("[v0] No user ID found in subscription")
    return
  }

  // Determine subscription tier based on plan ID
  let subscriptionStatus: "VERIFIED" | "FEATURED" = "VERIFIED"
  if (resource.plan_id === "P-FEATURED-PLAN-ID") {
    subscriptionStatus = "FEATURED"
  }

  // Calculate expiration date (1 month from now)
  const expirationDate = new Date()
  expirationDate.setMonth(expirationDate.getMonth() + 1)

  await db
    .update(prescriberProfiles)
    .set({
      subscriptionStatus,
      subscriptionExpires: expirationDate,
      verified: true,
    })
    .where(eq(prescriberProfiles.userId, userId))

  console.log("[v0] Subscription activated for user:", userId, "Status:", subscriptionStatus)
}

async function handleSubscriptionCancelled(resource: any, db: any) {
  const userId = resource.custom_id

  if (!userId) {
    console.error("[v0] No user ID found in cancelled subscription")
    return
  }

  await db
    .update(prescriberProfiles)
    .set({
      subscriptionStatus: "FREE",
      subscriptionExpires: null,
      verified: false,
    })
    .where(eq(prescriberProfiles.userId, userId))

  console.log("[v0] Subscription cancelled for user:", userId)
}

async function handleSubscriptionSuspended(resource: any, db: any) {
  const userId = resource.custom_id

  if (!userId) {
    console.error("[v0] No user ID found in suspended subscription")
    return
  }

  // Keep the subscription status but mark as expired
  await db
    .update(prescriberProfiles)
    .set({
      subscriptionExpires: new Date(), // Set to current date to mark as expired
      verified: false,
    })
    .where(eq(prescriberProfiles.userId, userId))

  console.log("[v0] Subscription suspended for user:", userId)
}

async function handlePaymentFailed(resource: any, db: any) {
  const userId = resource.custom_id

  if (!userId) {
    console.error("[v0] No user ID found in failed payment")
    return
  }

  // You might want to send an email notification here
  console.log("[v0] Payment failed for user:", userId)
}
