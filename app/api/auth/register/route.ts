import { encode } from "@/lib/argon2Helper";
import { prisma } from "@/lib/prisma";
import { handlePrismaError } from "@/lib/prisma-error-handler";
import { NextResponse } from "next/server";
import { z } from "zod";

const RegisterSchema = z.object({
  email: z.string().email("Email tidak valid").min(1, "Email wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  noWa: z.string().min(9, "Nomor WhatsApp tidak valid"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validasi input dengan Zod
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path[0],
        message: issue.message,
      }));

      return NextResponse.json(
        {
          error: "Validation failed",
          errors,
          message: errors[0]?.message || "Data tidak valid",
        },
        { status: 400 }
      );
    }

    const { name, noWa, email, password } = parsed.data;
    const passwordHash = await encode(password);

    // Create user dengan error handling
    const user = await prisma.users.create({
      data: {
        email: email,
        noWa: noWa,
        name: name,
        password: passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        noWa: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Registrasi berhasil",
        data: user,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("🔥 Registration error:", err);

    // Handle Prisma errors dengan helper
    const prismaError = handlePrismaError(err);
    if (prismaError) {
      return NextResponse.json(
        {
          error: "Database error",
          message: prismaError.message,
          field: prismaError.field,
          code: prismaError.code,
        },
        { status: prismaError.code === "P2002" ? 409 : 400 }
      );
    }

    // Fallback untuk unexpected errors
    return NextResponse.json(
      {
        error: JSON.stringify(err),
        message: "Terjadi kesalahan yang tidak terduga. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}
