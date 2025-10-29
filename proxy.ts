import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/register"];

// Define routes that should redirect to dashboard if already logged in
const authRoutes = ["/login", "/register"];

// Helper function to verify token (inline karena middleware tidak bisa import dari lib)
async function verifyTokenInline(token: string) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET not found in environment variables");
      return null;
    }
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload as {
      sub: string;
      userId?: number;
      email?: string;
      role?: string;
      iat?: number;
      exp?: number;
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie (sesuai dengan yang di-set di login: "jwt-access-token")
  const token = request.cookies.get("jwt-access-token")?.value;

  // Check if current path is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Allow access to root path
  if (pathname === "/") {
    // If logged in, redirect to dashboard
    if (token) {
      const verified = await verifyTokenInline(token);
      if (verified) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    // If not logged in, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If accessing auth routes (login/register) while logged in
  if (isAuthRoute && token) {
    const verified = await verifyTokenInline(token);
    if (verified) {
      // Already logged in, redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // If accessing protected route without token
  if (!isPublicRoute && !token) {
    // Redirect to login with callback URL
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Verify token for protected routes
  if (!isPublicRoute && token) {
    const verified = await verifyTokenInline(token);
    if (!verified) {
      // Token invalid or expired, redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      // Clear invalid token (gunakan nama cookie yang sama)
      response.cookies.delete("jwt-access-token");
      return response;
    }

    // Token valid, add user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    if (verified.userId) {
      requestHeaders.set("x-user-id", String(verified.userId));
    }
    if (verified.role) {
      requestHeaders.set("x-user-role", String(verified.role));
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Allow public routes
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
