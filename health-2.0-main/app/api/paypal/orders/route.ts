import { type NextRequest, NextResponse } from "next/server"

// Reused server implementation from root app
async function getPayPalClient() {
  const paypal = await import("@paypal/checkout-server-sdk")
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error("PayPal credentials not configured")
  const environment = process.env.PAYPAL_ENV === "live"
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret)
  return new paypal.core.PayPalHttpClient(environment)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const items = body.items || []
    const currency = body.currency || "USD"
    const total = items.length ? items.reduce((s: number, i: any) => s + i.price * (i.qty || 1), 0) : 19.99

    const paypal = await import("@paypal/checkout-server-sdk")
    const orderRequest = new paypal.orders.OrdersCreateRequest()
    orderRequest.prefer("return=representation")
    orderRequest.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: currency, value: total.toFixed(2) }
      }],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payment-success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payment-cancelled`,
      }
    })

    const client = await getPayPalClient()
    const response = await client.execute(orderRequest)
    return NextResponse.json({ id: response.result.id, status: response.result.status })
  } catch (err: any) {
    console.error("[PayPal] order create error:", err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
