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

const EquipmentSchema = z.object({
  name: z.string().min(1, "Nama equipment wajib diisi"),
  category: z.string().min(1, "Kategori equipment wajib diisi"),
  stock: z.number().int().min(0, "Stok minimal 0").optional(),
});

/**
 * GET - Fetch all equipments with optional filters
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: {
      category?: string;
      OR?: Array<{
        name?: { contains: string };
        category?: { contains: string };
      }>;
    } = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const equipments = await prisma.equipments.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        data: equipments,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("🔥 Get equipments error:", err);

    const prismaError = handlePrismaError(err);
    if (prismaError) {
      return NextResponse.json(
        {
          success: false,
          message: prismaError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil data equipment",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new equipment
 */
export async function POST(req: Request) {
  try {
    const body = await req.formData();

    const name = body.get("name") as string;
    const category = body.get("category") as string;
    const stockStr = body.get("stock") as string;
    const imageFile = body.get("image") as File | null;

    // Parse stock dengan default 1 jika tidak diisi
    const stock = stockStr ? parseInt(stockStr, 10) : 1;

    // Validasi input
    const parsed = EquipmentSchema.safeParse({
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

    let imageUrl = "";

    // Handle file upload jika ada
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

      // Save file
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${imageFile.name.replace(/\s/g, "-")}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);
      imageUrl = `/uploads/${fileName}`;
    }

    // Create equipment
    const equipment = await prisma.equipments.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        stock: parsed.data.stock || 1,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json(
      {
        message: "Equipment berhasil ditambahkan",
        data: equipment,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("🔥 Create equipment error:", err);

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
        message: "Terjadi kesalahan saat menambahkan equipment",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete equipment
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error: "Missing parameter",
          message: "ID equipment wajib diisi",
        },
        { status: 400 }
      );
    }

    // Get equipment untuk hapus file image
    const equipment = await prisma.equipments.findUnique({
      where: { id: id },
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
      where: { id: id },
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
