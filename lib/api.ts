export interface Prescriber {
  npi: number
  name: string
  specialty: string
  specialty_group: string
  phone?: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  drug: {
    brand_name: string
    generic_name: string
    drug_class: string
    therapeutic_class: string
    drug_family: string
    controlled_substance: boolean
    controlled_schedule: string
    route_of_administration: string
  }
  distance_miles: number
  total_claims: number
}

export interface SearchResponse {
  search_location: {
    zip: string
    city: string
    state: string
  }
  search_params: {
    drug: string
    drug_class: string
    therapeutic_class: string
    radius_miles: number
  }
  results_count: number
  prescribers: Prescriber[]
  is_premium?: boolean
}

export interface DrugCategory {
  category: string
  drugs: string[]
}

const API_BASE_URL = "" // Use relative URLs for internal Next.js API routes

export class RxPrescribersAPI {
  // Free search API - returns blurred results for non-premium users
  static async searchPrescribers(params: {
    drug?: string
    drug_class?: string
    therapeutic_class?: string
    zip: string
    radius?: number
  }): Promise<SearchResponse> {
    const queryParams = new URLSearchParams()

    if (params.drug) queryParams.append("drug", params.drug)
    if (params.drug_class) queryParams.append("drug_class", params.drug_class)
    if (params.therapeutic_class) queryParams.append("therapeutic_class", params.therapeutic_class)
    queryParams.append("zip", params.zip)
    queryParams.append("radius", (params.radius || 25).toString())

    const response = await fetch(`/api/search?${queryParams}`)
    if (!response.ok) {
      throw new Error("Failed to search prescribers")
    }

    return response.json()
  }

  // Premium search API - returns full unblurred results
  static async searchPrescribersPremium(params: {
    drug?: string
    drug_class?: string
    therapeutic_class?: string
    zip: string
    radius?: number
  }): Promise<SearchResponse> {
    const queryParams = new URLSearchParams()

    if (params.drug) queryParams.append("drug", params.drug)
    if (params.drug_class) queryParams.append("drug_class", params.drug_class)
    if (params.therapeutic_class) queryParams.append("therapeutic_class", params.therapeutic_class)
    queryParams.append("zip", params.zip)
    queryParams.append("radius", (params.radius || 25).toString())

    const response = await fetch(`/api/search-premium?${queryParams}`)
    if (!response.ok) {
      throw new Error("Failed to search prescribers (premium)")
    }

    return response.json()
  }

  // Enhanced search with categories
  static async searchEnhanced(params: {
    drug?: string
    drug_class?: string
    therapeutic_class?: string
    zip: string
    radius?: number
  }): Promise<SearchResponse> {
    const queryParams = new URLSearchParams()

    if (params.drug) queryParams.append("drug", params.drug)
    if (params.drug_class) queryParams.append("drug_class", params.drug_class)
    if (params.therapeutic_class) queryParams.append("therapeutic_class", params.therapeutic_class)
    queryParams.append("zip", params.zip)
    queryParams.append("radius", (params.radius || 25).toString())

    const response = await fetch(`/api/search-enhanced?${queryParams}`)
    if (!response.ok) {
      throw new Error("Failed to search prescribers (enhanced)")
    }

    return response.json()
  }

  // Get drug categories
  static async getDrugCategories(): Promise<DrugCategory[]> {
    const response = await fetch(`/api/drug-categories`)
    if (!response.ok) {
      throw new Error("Failed to fetch drug categories")
    }

    return response.json()
  }
  static async searchPrescribersHealf(params: {
    pharmaName: string
    lat: number
    lng: number
    radius: number
  }): Promise<SearchResponse> {
    const response = await fetch(`/api/prescriber-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      throw new Error("Failed to search prescribers (healf)")
    }

    return response.json()
  }
}
