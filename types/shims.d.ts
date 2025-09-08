declare module "@paypal/checkout-server-sdk";
declare module "next-auth/app";

// Minimal next-auth types used in this codebase
declare module "next-auth" {
  export type NextAuthConfig = any
  const NextAuth: any
  export default NextAuth
}
