export interface CustomJWT {
  role?: "PATIENT" | "PRESCRIBER" | "ADMIN"
  id?: string
}
