import type { User } from "@/lib/db/schema"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: "PATIENT" | "PRESCRIBER" | "ADMIN"
    }
  }

  interface JWT {
    role?: "PATIENT" | "PRESCRIBER" | "ADMIN"
    id?: string
  }

  interface User {
    id: string
    name: string | null
    email: string
    role: "PATIENT" | "PRESCRIBER" | "ADMIN"
    password: string
    updatedAt: Date
    createdAt: Date
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "PATIENT" | "PRESCRIBER" | "ADMIN"
    id?: string
  }
}
