import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = "https://api.rxprescribers.com"

export async function GET(_request: NextRequest) {
  try {
    console.log("[v0] Proxying drug categories request to:", `${API_BASE_URL}/drug_categories.php`)

    const response = await fetch(`${API_BASE_URL}/drug_categories.php`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const responseText = await response.text()
    console.log("[v0] Raw drug categories API response:", responseText.substring(0, 200) + "...")

    if (!response.ok) {
      console.error("[v0] External API error:", response.status, response.statusText, responseText)
      return NextResponse.json(
        {
          error: `External API error: ${responseText}`,
          status: response.status,
        },
        { status: response.status },
      )
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[v0] Failed to parse drug categories API response as JSON:", responseText)
      return NextResponse.json(
        {
          error: `Invalid API response: ${responseText}`,
          raw_response: responseText,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Drug categories received:", data.length || 0, "categories")

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] API proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch drug categories" }, { status: 500 })
  }
}
