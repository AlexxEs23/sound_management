import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import argon2 from "argon2";

export async function PUT(req: NextRequest) {
  try {
    // Get token from cookie (sesuai dengan yang di-set di login: "jwt-access-token")
    const token = req.cookies.get("jwt-access-token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Get request body
    const body = await req.json();
    const { name, email, noWa, currentPassword, newPassword } = body;

    // Validate required fields
    if (!name || !email || !noWa) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama, email, dan nomor WhatsApp wajib diisi",
        },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await prisma.users.findUnique({
      where: { id: decoded.userId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    if (email !== currentUser.email) {
      const existingEmail = await prisma.users.findUnique({
        where: { email },
      });
      if (existingEmail && existingEmail.id !== decoded.userId) {
        return NextResponse.json(
          { success: false, message: "Email sudah digunakan" },
          { status: 400 }
        );
      }
    }

    // Check if noWa is already taken by another user
    if (noWa !== currentUser.noWa) {
      const existingNoWa = await prisma.users.findUnique({
        where: { noWa },
      });
      if (existingNoWa && existingNoWa.id !== decoded.userId) {
        return NextResponse.json(
          { success: false, message: "Nomor WhatsApp sudah digunakan" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: {
      name: string;
      email: string;
      noWa: string;
      password?: string;
    } = {
      name,
      email,
      noWa,
    };

    // If changing password
    if (newPassword && currentPassword) {
      // Verify current password
      const isPasswordValid = await argon2.verify(
        currentUser.password,
        currentPassword
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: "Password lama tidak sesuai" },
          { status: 400 }
        );
      }

      // Validate new password
      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: "Password baru minimal 6 karakter" },
          { status: 400 }
        );
      }

      // Hash new password
      updateData.password = await argon2.hash(newPassword);
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: decoded.userId },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      message: "Profile berhasil diperbarui",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
