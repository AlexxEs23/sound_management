import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handlePrismaError } from "@/lib/prisma-error-handler";
import { z } from "zod";

const DamagedEquipmentSchema = z.object({
  equipmentId: z.string().min(1, "Equipment ID wajib diisi"),
  quantity: z.number().int().min(1, "Quantity minimal 1"),
  description: z.string().optional(),
});

/**
 * GET - Fetch all damaged equipments with equipment details
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // pending, in_progress, completed
    const equipmentId = searchParams.get("equipmentId");

    const where: {
      repairStatus?: "pending" | "in_progress" | "completed";
      equipmentId?: string;
    } = {};

    if (
      status &&
      (status === "pending" ||
        status === "in_progress" ||
        status === "completed")
    ) {
      where.repairStatus = status;
    }

    if (equipmentId) {
      where.equipmentId = equipmentId;
    }

    const damagedEquipments = await prisma.damagedEquipment.findMany({
      where,
      include: {
        equipment: true,
      },
      orderBy: { reportedAt: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        data: damagedEquipments,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("🔥 Get damaged equipments error:", err);

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
        message: "Terjadi kesalahan saat mengambil data equipment rusak",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Report damaged equipment
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validasi input
    const parsed = DamagedEquipmentSchema.safeParse(body);

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
    const equipment = await prisma.equipments.findUnique({
      where: { id: parsed.data.equipmentId },
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

    // Check if there's enough stock
    if (equipment.stock < parsed.data.quantity) {
      return NextResponse.json(
        {
          error: "Insufficient stock",
          message: `Stok tidak cukup. Stok tersedia: ${equipment.stock}`,
        },
        { status: 400 }
      );
    }

    // Create damaged equipment record
    const damagedEquipment = await prisma.damagedEquipment.create({
      data: {
        equipmentId: parsed.data.equipmentId,
        quantity: parsed.data.quantity,
        description: parsed.data.description || null,
        repairStatus: "pending",
      },
      include: {
        equipment: true,
      },
    });

    return NextResponse.json(
      {
        message: "Equipment rusak berhasil dilaporkan",
        data: damagedEquipment,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("🔥 Create damaged equipment error:", err);

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
        message: "Terjadi kesalahan saat melaporkan equipment rusak",
      },
      { status: 500 }
    );
  }
}
