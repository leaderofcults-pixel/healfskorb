import CredentialsProvider from "next-auth/providers/credentials"
import { getDb } from "@/lib/db/connection"
import { users } from "@/lib/db/schema"
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        const db = await getDb()
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
        if (user.length === 0) {
          return null
        }
        const foundUser = user[0]
        const isValidPassword = await bcrypt.compare(credentials.password as string, foundUser.password || "")
        if (!isValidPassword) {
          return null
        }
        return {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          role: foundUser.role,
        }
      },
    }),
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //   profile(profile) {
    //     return {
    //       id: profile.sub,
    //       email: profile.email,
    //       name: profile.name,
    //       image: profile.picture,
    //       role: "PATIENT", // Default role for OAuth users
    //     }
    //   },
    // }),
  ],
  callbacks: {
    async jwt({ token, user, account }: { token: any; user?: any; account?: any }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "PATIENT" | "PRESCRIBER";
      }
      return session;
    },
    // async signIn({ user, account, profile }) {
    //   if (account?.provider === "google") {
    //     const db = getDb();
    //     // Check if user exists
    //     const existingUser = await db.select().from(users).where(eq(users.email, user.email!)).limit(1);
    //     if (existingUser.length === 0) {
    //       // Create new user for Google OAuth
    //       await db.insert(users).values({
    //         email: user.email!,
    //         name: user.name!,
    //         role: "PATIENT",
    //         createdAt: new Date(),
    //       });
    //     }
    //   }
    //   return true;
    // },
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
