import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const EventSchema = z.object({
  title: z.string().min(1, "Judul event wajib diisi"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Format tanggal tidak valid",
  }),
  location: z.string().min(1, "Lokasi wajib diisi"),
  equipments: z
    .array(
      z.object({
        equipmentId: z.string(),
        quantity: z.number().int().min(1, "Quantity minimal 1"),
      })
    )
    .optional(),
});

// GET /api/events - List all events with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const location = searchParams.get("location") || "";

    const events = await prisma.events.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: search } },
                  { description: { contains: search } },
                ],
              }
            : {},
          location ? { location: { contains: location } } : {},
        ],
      },
      include: {
        EquipmentEvent: {
          include: {
            equipment: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data event" },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = EventSchema.parse(body);

    // Create event with transaction
    const event = await prisma.$transaction(async (tx) => {
      // Create event
      const newEvent = await tx.events.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          date: new Date(validatedData.date),
          location: validatedData.location,
        },
      });

      // Create equipment relations if provided
      if (validatedData.equipments && validatedData.equipments.length > 0) {
        // Validate stock availability for each equipment
        for (const item of validatedData.equipments) {
          const equipment = await tx.equipments.findUnique({
            where: { id: item.equipmentId },
          });

          if (!equipment) {
            throw new Error(
              `Equipment dengan ID ${item.equipmentId} tidak ditemukan`
            );
          }

          if (equipment.stock < item.quantity) {
            throw new Error(
              `Stok ${equipment.name} tidak cukup. Tersedia: ${equipment.stock}, Diminta: ${item.quantity}`
            );
          }
        }

        // Create equipment event relations with quantity
        await tx.equipmentEvent.createMany({
          data: validatedData.equipments.map((item) => ({
            eventId: newEvent.id,
            equipmentId: item.equipmentId,
            quantity: item.quantity,
          })),
        });

        // Decrease stock for each equipment
        for (const item of validatedData.equipments) {
          await tx.equipments.update({
            where: { id: item.equipmentId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // Return event with equipment relations
      return await tx.events.findUnique({
        where: { id: newEvent.id },
        include: {
          EquipmentEvent: {
            include: {
              equipment: true,
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event berhasil dibuat",
        data: event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validasi gagal",
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle custom error messages
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Gagal membuat event" },
      { status: 500 }
    );
  }
}

// DELETE /api/events - Bulk delete (optional)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.split(",") || [];

    if (ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada event yang dipilih untuk dihapus",
        },
        { status: 400 }
      );
    }

    await prisma.events.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${ids.length} event berhasil dihapus`,
    });
  } catch (error) {
    console.error("Error deleting events:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus event" },
      { status: 500 }
    );
  }
}
