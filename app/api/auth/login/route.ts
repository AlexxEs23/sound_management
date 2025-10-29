import { verify as verifyHash } from "@/lib/argon2Helper";
import { CookieSet } from "@/lib/cookies";
import { generateToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { handlePrismaError } from "@/lib/prisma-error-handler";
import { NextResponse } from "next/server";
import z from "zod";

const LoginSchema = z.object({
  email: z.string().email("Email tidak valid").min(1, "Email wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path[0],
        message: issue.message,
      }));

      return NextResponse.json(
        {
          error: "Validation failed",
          message: errors[0]?.message || "Data tidak valid",
          errors,
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.users.findFirst({
      where: { email: email },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Authentication failed",
          message: "Email atau password salah",
        },
        { status: 401 }
      );
    }

    const checkPassword = await verifyHash(password, user.password);
    if (!checkPassword) {
      return NextResponse.json(
        {
          error: "Authentication failed",
          message: "Email atau password salah",
        },
        { status: 401 }
      );
    }

    const jwt = await generateToken({
      sub: String(user.id),
      email: user.email,
      userId: user.id,
      role: user.role || undefined,
    });

    const response = NextResponse.json(
      {
        message: "Login berhasil",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    CookieSet(jwt, response);
    return response;
  } catch (error) {
    console.error("🔥 Login error:", error);

    // Handle Prisma errors
    const prismaError = handlePrismaError(error);
    if (prismaError) {
      return NextResponse.json(
        {
          error: "Database error",
          message: prismaError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Terjadi kesalahan yang tidak terduga",
      },
      { status: 500 }
    );
  }
}
