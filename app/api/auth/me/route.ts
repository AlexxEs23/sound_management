import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { handlePrismaError } from "@/lib/prisma-error-handler";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get token from cookie (sesuai dengan yang di-set di login: "jwt-access-token")
  const token = request.cookies.get("jwt-access-token")?.value;

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized - Token tidak ditemukan",
      },
      { status: 401 }
    );
  }

  // Verify token
  const verified = await verifyToken(token);

  if (!verified || !verified.userId) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized - Invalid token",
      },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.users.findUnique({
      where: {
        id: verified.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        noWa: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User data fetched successfully",
        data: user,
      },
      { status: 200 }
    );
  } catch (e) {
    const prismaError = handlePrismaError(e);
    if (prismaError) {
      return NextResponse.json(
        {
          success: false,
          message: prismaError.message,
          field: prismaError.field,
          code: prismaError.code,
        },
        { status: prismaError.code === "P2002" ? 409 : 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
