import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./jwt";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: number;
    email?: string;
    role?: string;
  };
}

/**
 * Middleware helper untuk melindungi API routes
 * Verifikasi JWT token dari cookie dan return user data
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: { userId: number; email?: string; role?: string } } | null> {
  // Get token from cookie (sesuai dengan yang di-set di login: "jwt-access-token")
  const token = request.cookies.get("jwt-access-token")?.value;

  if (!token) {
    return null;
  }

  // Verify token
  const verified = await verifyToken(token);

  if (!verified || !verified.userId) {
    return null;
  }

  return {
    user: {
      userId: verified.userId,
      email: verified.email,
      role: verified.role,
    },
  };
}

/**
 * Wrapper untuk API route yang memerlukan authentication
 * Usage:
 * export const GET = withAuth(async (req, { user }) => {
 *   // user.userId tersedia di sini
 * })
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: { user: { userId: number; email?: string; role?: string } }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const auth = await authenticateRequest(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    return handler(request, { user: auth.user });
  };
}

/**
 * Wrapper untuk API route yang memerlukan admin role
 */
export function withAdmin(
  handler: (
    request: NextRequest,
    context: { user: { userId: number; email?: string; role?: string } }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const auth = await authenticateRequest(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    if (auth.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    return handler(request, { user: auth.user });
  };
}

/**
 * Get user from request headers (set by middleware)
 * Alternative method jika middleware sudah set headers
 */
export function getUserFromHeaders(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId) {
    return null;
  }

  return {
    userId: parseInt(userId, 10),
    role: userRole || "user",
  };
}
