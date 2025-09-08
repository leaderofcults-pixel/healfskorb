import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// Extend the Request type to include nextUrl and auth
interface ExtendedRequest extends Request {
  nextUrl: URL;
  auth?: {
    user?: {
      role?: string;
    };
  };
}

export default auth((req: ExtendedRequest) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/api/search", "/api/autocomplete"]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Prescriber-only routes
  const prescriberRoutes = ["/prescriber"]
  const isPrescriberRoute = prescriberRoutes.some((route) => pathname.startsWith(route))

    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
