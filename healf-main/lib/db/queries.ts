import { getDb } from "./connection"
import { npiDetails, npiAddresses, npiPrescriptions, drugs, usZipcodes } from "./schema"
import { eq, and, between, sql, asc, like } from "drizzle-orm"

export interface SearchRequest {
  pharmaName: string
  lat: number
  lng: number
  radius: number
  filters?: {
    specialty?: string[]
    verified?: boolean
  }
}

export interface PrescriberResult {
  npi: string
  name: string
  specialty: string | null
  address: {
    street: string | null
    city: string | null
    state: string | null
    zipCode: string | null
  }
  coordinates: {
    lat: number
    lng: number
  }
  distance: number
  matchScore: number
  totalClaims: number
}

// Calculate bounding box for efficient geo-search
function calculateBoundingBox(lat: number, lng: number, radiusMiles: number) {
  const latDelta = radiusMiles / 69.0 // Approximate miles per degree latitude
  const lngDelta = radiusMiles / (69.0 * Math.cos((lat * Math.PI) / 180))

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  }
}

// Main search function with Haversine distance calculation
export async function searchPrescribers(params: SearchRequest): Promise<PrescriberResult[]> {
  const db = await getDb()
  const bounds = calculateBoundingBox(params.lat, params.lng, params.radius)

  // Find drug ID from brand name
  const drugResult = await db
    .select({ drugId: drugs.drugId })
    .from(drugs)
    .where(eq(drugs.brandName, params.pharmaName.toUpperCase()))
    .limit(1)

  if (drugResult.length === 0) {
    return []
  }

  const drugId = drugResult[0].drugId

  // Search prescribers with geo-filtering and distance calculation
  const results = await db
    .select({
      npi: npiDetails.npi,
      name: npiDetails.name,
      specialty: npiDetails.specialty,
      street: npiAddresses.street,
      city: npiAddresses.city,
      state: npiAddresses.state,
      zipCode: npiAddresses.zipCode,
      lat: usZipcodes.latitude,
      lng: usZipcodes.longitude,
      totalClaims: npiPrescriptions.totalClaims,
      // Haversine formula for distance calculation
      distance: sql<number>`
        3959 * acos(
          cos(radians(${params.lat})) * 
          cos(radians(${usZipcodes.latitude})) * 
          cos(radians(${usZipcodes.longitude}) - radians(${params.lng})) + 
          sin(radians(${params.lat})) * 
          sin(radians(${usZipcodes.latitude}))
        )
      `.as("distance"),
    })
    .from(npiDetails)
    .innerJoin(npiAddresses, eq(npiDetails.npi, npiAddresses.npi))
    .innerJoin(usZipcodes, eq(npiAddresses.zipCode, usZipcodes.zipCode))
    .innerJoin(npiPrescriptions, eq(npiDetails.npi, npiPrescriptions.npi))
    .where(
      and(
        // Bounding box filter for performance
        between(usZipcodes.latitude, bounds.minLat, bounds.maxLat),
        between(usZipcodes.longitude, bounds.minLng, bounds.maxLng),
        // Drug filter
        eq(npiPrescriptions.drugId, drugId),
        // Specialty filter if provided
        params.filters?.specialty?.length ? sql`${npiDetails.specialty} IN ${params.filters.specialty}` : sql`1=1`,
      ),
    )
    .having(sql`distance <= ${params.radius}`)
    .orderBy(asc(sql`distance`))
    .limit(50)

  // Calculate match scores and format results
  return results.map((result) => ({
    npi: result.npi,
    name: result.name,
    specialty: result.specialty,
    address: {
      street: result.street,
      city: result.city,
      state: result.state,
      zipCode: result.zipCode,
    },
    coordinates: {
      lat: Number(result.lat),
      lng: Number(result.lng),
    },
    distance: Number(result.distance),
    matchScore: calculateMatchScore(result, params),
    totalClaims: result.totalClaims,
  }))
}

// Match score algorithm
function calculateMatchScore(prescriber: any, searchParams: SearchRequest): number {
  let score = 0
  const weights = {
    exactDrug: 40,
    proximity: 25,
    specialty: 20,
    volume: 15,
  }

  // Exact drug match (40 points)
  score += weights.exactDrug

  // Proximity score (25 points) - inverse distance weighting
  const proximityScore = Math.max(0, 1 - prescriber.distance / searchParams.radius) * weights.proximity
  score += proximityScore

  // Specialty alignment (20 points) - simplified for now
  if (prescriber.specialty) {
    score += weights.specialty * 0.5 // Partial credit
  }

  // Prescription volume (15 points) - normalized
  const volumeScore = Math.min(weights.volume, (prescriber.totalClaims / 100) * weights.volume)
  score += volumeScore

  return Math.round(Math.min(100, score))
}

// Get drug suggestions for autocomplete
export async function getDrugSuggestions(query: string, limit = 10) {
  const db = getDb()

  return await db
    .select({
      drugId: drugs.drugId,
      brandName: drugs.brandName,
      therapeuticClass: drugs.therapeuticClass,
    })
    .from(drugs)
    .where(like(drugs.brandName, `%${query.toUpperCase()}%`))
    .orderBy(asc(drugs.brandName))
    .limit(limit)
}
