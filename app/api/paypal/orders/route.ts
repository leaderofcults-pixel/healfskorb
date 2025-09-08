import { type NextRequest, NextResponse } from "next/server"

// Enhanced PayPal SDK types
interface PayPalOrderItem {
  name: string
  description?: string
  sku?: string
  price: number
  qty: number
  category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS'
}

interface PayPalCreateOrderRequest {
  items?: PayPalOrderItem[]
  currency?: string
  planType?: 'basic' | 'premium' | 'enterprise'
}

interface PayPalPurchaseUnit {
  amount: {
    currency_code: string
    value: string
    breakdown?: {
      item_total: {
        currency_code: string
        value: string
      }
    }
  }
  description: string
  items?: Array<{
    name: string
    description: string
    sku: string
    unit_amount: {
      currency_code: string
      value: string
    }
    quantity: string
    category: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS'
  }>
}

// Predefined pricing tiers for security
const PRICING_TIERS = {
  basic: { price: 9.99, name: "Basic Access" },
  premium: { price: 29.99, name: "Premium Access" },
  enterprise: { price: 99.99, name: "Enterprise Access" }
} as const

// Dynamic import for PayPal SDK with proper error handling
async function getPayPalClient() {
  try {
    const paypal = await import("@paypal/checkout-server-sdk")
    
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      throw new Error("PayPal credentials not configured")
    }
    
    const environment = process.env.PAYPAL_ENV === "live"
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret)
    
    return new paypal.core.PayPalHttpClient(environment)
  } catch (error) {
    console.error("[PayPal] Failed to initialize client:", error)
    throw new Error("PayPal client initialization failed")
  }
}

// Input validation
function validateOrderRequest(data: unknown): PayPalCreateOrderRequest {
  if (typeof data !== 'object' || data === null) {
    throw new Error("Invalid request data")
  }
  const obj = data as Record<string, unknown>
  const { items, currency = "USD", planType } = obj

  // Validate currency
  const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  if (typeof currency !== 'string' || !validCurrencies.includes(currency)) {
    throw new Error(`Invalid currency: ${currency}`)
  }

  // Validate plan type if provided
  if (planType !== undefined && (typeof planType !== 'string' || !Object.keys(PRICING_TIERS).includes(planType))) {
    throw new Error(`Invalid plan type: ${planType}`)
  }

  // Validate items if provided
  if (items !== undefined) {
    if (!Array.isArray(items)) {
      throw new Error("Items must be an array")
    }
    for (const item of items) {
      if (typeof item !== 'object' || item === null ||
          !('name' in item) || typeof item.name !== 'string' ||
          !('price' in item) || typeof item.price !== 'number' ||
          !('qty' in item) || typeof item.qty !== 'number') {
        throw new Error("Invalid item structure")
      }
      if (item.price < 0 || item.qty < 1) {
        throw new Error("Invalid item price or quantity")
      }
    }
  }

  return { items: items as PayPalOrderItem[] | undefined, currency, planType: planType as keyof typeof PRICING_TIERS | undefined }
}

// Calculate total with validation
function calculateTotal(items?: PayPalOrderItem[], planType?: keyof typeof PRICING_TIERS): number {
  if (planType) {
    return PRICING_TIERS[planType].price
  }
  
  if (items && items.length > 0) {
    return items.reduce((sum, item) => {
      const itemTotal = Number(item.price) * Number(item.qty)
      if (isNaN(itemTotal) || itemTotal < 0) {
        throw new Error(`Invalid item calculation for ${item.name}`)
      }
      return sum + itemTotal
    }, 0)
  }
  
  // Default to premium pricing
  return PRICING_TIERS.premium.price
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json()
    const { items, currency, planType } = validateOrderRequest(body)
    
    // Calculate total securely on server
    const total = calculateTotal(items, planType)
    
    // Get description based on plan type or items
    const description = planType 
      ? `RxPrescribers ${PRICING_TIERS[planType].name}`
      : items && items.length > 0
        ? `RxPrescribers - ${items.map(i => i.name).join(', ')}`
        : "RxPrescribers Premium Access"
    
    // Import PayPal SDK
    const paypal = await import("@paypal/checkout-server-sdk")
    const orderRequest = new paypal.orders.OrdersCreateRequest()
    orderRequest.prefer("return=representation")
    
    // Build order request body
    const purchaseUnit: PayPalPurchaseUnit = {
      amount: {
        currency_code: currency as string,
        value: total.toFixed(2),
      },
      description,
    }
    
    // Add item breakdown if items provided
    if (items && items.length > 0) {
      purchaseUnit.amount.breakdown = {
        item_total: {
          currency_code: currency as string,
          value: total.toFixed(2),
        },
      }
      purchaseUnit.items = items.map(item => ({
        name: item.name,
        description: item.description || '',
        sku: item.sku || `item-${Date.now()}`,
        unit_amount: {
          currency_code: currency as string,
          value: item.price.toFixed(2),
        },
        quantity: item.qty.toString(),
        category: item.category || 'DIGITAL_GOODS',
      }))
    }
    
    orderRequest.requestBody({
      intent: "CAPTURE",
      purchase_units: [purchaseUnit],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        brand_name: "RxPrescribers",
        locale: "en-US",
        landing_page: "NO_PREFERENCE",
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payment-success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payment-cancelled`,
      },
    })
    
    // Execute order creation
    const client = await getPayPalClient()
    const response = await client.execute(orderRequest)
    
    // Log successful order creation (remove in production or use proper logging)
    console.log(`[PayPal] Order created successfully: ${response.result.id}`, {
      orderId: response.result.id,
      amount: total,
      currency,
      timestamp: new Date().toISOString(),
    })
    
    return NextResponse.json({ 
      id: response.result.id,
      status: response.result.status,
      amount: total,
      currency,
    })
    
  } catch (error: any) {
    // Enhanced error logging
    console.error("[PayPal] Order creation failed:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
    
    // Return appropriate error response
    if (error.message.includes("Invalid") || error.message.includes("validation")) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.message },
        { status: 400 }
      )
    }
    
    if (error.message.includes("PayPal")) {
      return NextResponse.json(
        { error: "Payment service unavailable" },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: "Order creation failed" },
      { status: 500 }
    )
  }
}

// Optional: Add a GET handler for order status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    
    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 })
    }
    
    const paypal = await import("@paypal/checkout-server-sdk")
    const orderRequest = new paypal.orders.OrdersGetRequest(orderId)
    
    const client = await getPayPalClient()
    const response = await client.execute(orderRequest)
    
    return NextResponse.json({
      id: response.result.id,
      status: response.result.status,
      intent: response.result.intent,
      purchase_units: response.result.purchase_units,
    })
    
  } catch (error: any) {
    console.error("[PayPal] Order retrieval failed:", error)
    return NextResponse.json(
      { error: "Failed to retrieve order" },
      { status: 500 }
    )
  }
}
