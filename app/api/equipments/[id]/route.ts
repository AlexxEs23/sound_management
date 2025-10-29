import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handlePrismaError } from "@/lib/prisma-error-handler";
import { z } from "zod";

const uploadDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const EquipmentUpdateSchema = z.object({
  name: z.string().min(1, "Nama equipment wajib diisi"),
  category: z.string().min(1, "Kategori equipment wajib diisi"),
  stock: z.number().int().min(0, "Stok minimal 0").optional(),
});

/**
 * GET - Get single equipment by ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const equipment = await prisma.equipments.findUnique({
      where: { id },
    });

    if (!equipment) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Equipment tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Equipment retrieved successfully",
        data: equipment,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("🔥 Get equipment error:", err);

    const prismaError = handlePrismaError(err);
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
        message: "Terjadi kesalahan saat mengambil data equipment",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update equipment
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.formData();

    const name = body.get("name") as string;
    const category = body.get("category") as string;
    const stockStr = body.get("stock") as string;
    const imageFile = body.get("image") as File | null;
    const deleteImage = body.get("deleteImage") === "true";

    // Parse stock
    const stock = stockStr ? parseInt(stockStr, 10) : undefined;

    // Validasi input
    const parsed = EquipmentUpdateSchema.safeParse({
      name,
      category,
      stock,
    });

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

    // Check if equipment exists
    const existingEquipment = await prisma.equipments.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Equipment tidak ditemukan",
        },
        { status: 404 }
      );
    }

    let imageUrl = existingEquipment.imageUrl;

    // Handle delete old image
    if (deleteImage && existingEquipment.imageUrl) {
      const oldImagePath = path.join(
        process.cwd(),
        "public",
        existingEquipment.imageUrl
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      imageUrl = null;
    }

    // Handle new image upload
    if (imageFile && imageFile.size > 0) {
      // Validasi file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(imageFile.type)) {
        return NextResponse.json(
          {
            error: "Invalid file type",
            message: "File harus berupa gambar (JPEG, PNG, atau WebP)",
          },
          { status: 400 }
        );
      }

      // Validasi file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        return NextResponse.json(
          {
            error: "File too large",
            message: "Ukuran file maksimal 5MB",
          },
          { status: 400 }
        );
      }

      // Delete old image if exists
      if (existingEquipment.imageUrl) {
        const oldImagePath = path.join(
          process.cwd(),
          "public",
          existingEquipment.imageUrl
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Save new file
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${imageFile.name.replace(/\s/g, "-")}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);
      imageUrl = `/uploads/${fileName}`;
    }

    // Update equipment
    const equipment = await prisma.equipments.update({
      where: { id },
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        stock: parsed.data.stock !== undefined ? parsed.data.stock : undefined,
        imageUrl: imageUrl,
      },
    });

    return NextResponse.json(
      {
        message: "Equipment berhasil diupdate",
        data: equipment,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("🔥 Update equipment error:", err);

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

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Terjadi kesalahan saat mengupdate equipment",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete equipment by ID
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Get equipment untuk hapus file image
    const equipment = await prisma.equipments.findUnique({
      where: { id },
    });

    if (!equipment) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Equipment tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Delete file image jika ada
    if (equipment.imageUrl) {
      const imagePath = path.join(process.cwd(), "public", equipment.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete equipment
    await prisma.equipments.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        message: "Equipment berhasil dihapus",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("🔥 Delete equipment error:", err);

    const prismaError = handlePrismaError(err);
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
        message: "Terjadi kesalahan saat menghapus equipment",
      },
      { status: 500 }
    );
  }
}
