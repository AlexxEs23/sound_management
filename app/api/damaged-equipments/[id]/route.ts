import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handlePrismaError } from "@/lib/prisma-error-handler";
import { z } from "zod";

const UpdateDamagedEquipmentSchema = z.object({
  quantity: z.number().int().min(1, "Quantity minimal 1").optional(),
  description: z.string().optional(),
  repairStatus: z
    .enum(["pending", "in_progress", "completed"])
    .optional(),
});

/**
 * GET - Get single damaged equipment by ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const damagedEquipment = await prisma.damagedEquipment.findUnique({
      where: { id },
      include: {
        equipment: true,
      },
    });

    if (!damagedEquipment) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Data equipment rusak tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Damaged equipment retrieved successfully",
        data: damagedEquipment,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("🔥 Get damaged equipment error:", err);

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
        message: "Terjadi kesalahan saat mengambil data equipment rusak",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update damaged equipment (status, description, etc)
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Validasi input
    const parsed = UpdateDamagedEquipmentSchema.safeParse(body);

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

    // Check if damaged equipment exists
    const existing = await prisma.damagedEquipment.findUnique({
      where: { id },
      include: {
        equipment: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Data equipment rusak tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      quantity?: number;
      description?: string;
      repairStatus?: string;
      repairedAt?: Date | null;
    } = {};

    if (parsed.data.quantity !== undefined) {
      updateData.quantity = parsed.data.quantity;
    }

    if (parsed.data.description !== undefined) {
      updateData.description = parsed.data.description;
    }

    if (parsed.data.repairStatus !== undefined) {
      updateData.repairStatus = parsed.data.repairStatus;

      // If status is completed, set repairedAt
      if (parsed.data.repairStatus === "completed") {
        updateData.repairedAt = new Date();

        // Restore stock back to equipment
        await prisma.equipments.update({
          where: { id: existing.equipmentId },
          data: {
            stock: {
              increment: existing.quantity,
            },
          },
        });
      }
    }

    // Update damaged equipment
    const damagedEquipment = await prisma.damagedEquipment.update({
      where: { id },
      data: updateData,
      include: {
        equipment: true,
      },
    });

    return NextResponse.json(
      {
        message: "Equipment rusak berhasil diupdate",
        data: damagedEquipment,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("🔥 Update damaged equipment error:", err);

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
        message: "Terjadi kesalahan saat mengupdate equipment rusak",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete damaged equipment record
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if damaged equipment exists
    const existing = await prisma.damagedEquipment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Data equipment rusak tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Delete damaged equipment
    await prisma.damagedEquipment.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        message: "Data equipment rusak berhasil dihapus",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("🔥 Delete damaged equipment error:", err);

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
        message: "Terjadi kesalahan saat menghapus data equipment rusak",
      },
      { status: 500 }
    );
  }
}
