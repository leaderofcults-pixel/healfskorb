import CredentialsProvider from "next-auth/providers/credentials"
import { getDb } from "@/lib/db/connection"
import { User, Session } from "next-auth"
import NextAuth from "next-auth/next"
import type { Adapter } from "next-auth/adapters"
import type { JWT } from "next-auth/jwt"
// Update this import to match the actual exported member from your schema file.
// For example, if your schema exports 'Users' or 'userTable', use that name instead.
// import { Users } from "@/lib/db/schema"
// import { userTable } from "@/lib/db/schema"
// Update this import to match the actual exported member from your schema file.
// For example, if your schema exports 'Users' or 'users', use that name instead.
// import { Users as users } from "@/lib/db/schema"
// Update this import to match the actual exported member from your schema file.
// For example, if your schema exports 'Users' or 'userTable', use that name instead.
// import { Users } from "@/lib/db/schema"
// import { userTable } from "@/lib/db/schema"
import { Users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const nextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) return null
        const db = await getDb()
        const user = await db
          .select({ id: users.id, email: users.email, password: users.password, role: users.role, name: users.name })
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1)
        if (user.length === 0) return null
        const foundUser = user[0]
        const isValidPassword = await bcrypt.compare(credentials.password as string, foundUser.password || "")
        if (!isValidPassword) return null
        return { id: foundUser.id, email: foundUser.email, name: foundUser.name, role: foundUser.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user?: User; account?: Adapter }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as "PATIENT" | "PRESCRIBER"
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
}

export default nextAuthConfig
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const db = await getDb()

        // Check both patient and prescriber tables
        const user = await db
          .select({
            id: users.id,
            email: users.email,
            password: users.password,
            role: users.role,
            name: users.name,
          })
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1)

        if (user.length === 0) return null

        const foundUser = user[0]
        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          foundUser.password || ""
        )

        if (!isValidPassword) return null

        return {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          role: foundUser.role,
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, account }: { token: JWT; user?: User; account?: Adapter }) => {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    session: async ({ session, token }: { session: Session; token: JWT }) => {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as "PATIENT" | "PRESCRIBER"
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
})
