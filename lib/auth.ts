import { type NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getDb } from "@/lib/db/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import NextAuth from "next-auth"

export const nextAuthConfig = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "example@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const db = await getDb()
          
          const [user] = await db.select().from(users).where(eq(users.email, credentials.email as string)).limit(1)

          if (!user) return null

          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!passwordMatch) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: null,
          }
        } catch (error) {
          console.error("Error during authentication:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: { token: any; user?: any; account?: any }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthConfig

declare module "next-auth" {
  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: "PATIENT" | "PRESCRIBER"
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(nextAuthConfig)
