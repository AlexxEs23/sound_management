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
  status: z.enum(["upcoming", "ongoing", "completed"]).optional(),
  equipments: z
    .array(
      z.object({
        equipmentId: z.string(),
        quantity: z.number().int().min(1, "Quantity minimal 1"),
      })
    )
    .optional(),
});

// GET /api/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await prisma.events.findUnique({
      where: { id },
      include: {
        EquipmentEvent: {
          include: {
            equipment: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data event" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = EventSchema.parse(body);

    // Check if event exists
    const existingEvent = await prisma.events.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json(
        {
          success: false,
          message: "Event tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Update event with transaction
    const event = await prisma.$transaction(async (tx) => {
      // Update event data
      const updatedEvent = await tx.events.update({
        where: { id },
        data: {
          title: validatedData.title,
          description: validatedData.description,
          date: new Date(validatedData.date),
          location: validatedData.location,
          ...(validatedData.status && { status: validatedData.status }),
        },
      });

      // Handle equipment relations if provided
      if (validatedData.equipments !== undefined) {
        // Get old equipment relations to restore stock
        const oldEquipmentEvents = await tx.equipmentEvent.findMany({
          where: { eventId: id },
        });

        // Delete existing equipment relations
        await tx.equipmentEvent.deleteMany({
          where: { eventId: id },
        });

        // Restore stock for old equipment
        for (const oldEvent of oldEquipmentEvents) {
          await tx.equipments.update({
            where: { id: oldEvent.equipmentId },
            data: {
              stock: {
                increment: oldEvent.quantity,
              },
            },
          });
        }

        // Create new equipment relations
        if (validatedData.equipments.length > 0) {
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
              eventId: id,
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
      }

      // Return updated event with equipment relations
      return await tx.events.findUnique({
        where: { id },
        include: {
          EquipmentEvent: {
            include: {
              equipment: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Event berhasil diperbarui",
      data: event,
    });
  } catch (error) {
    console.error("Error updating event:", error);

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
      { success: false, message: "Gagal memperbarui event" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if event exists
    const existingEvent = await prisma.events.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json(
        {
          success: false,
          message: "Event tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Delete event with transaction to restore stock
    await prisma.$transaction(async (tx) => {
      // Get equipment relations to restore stock
      const equipmentEvents = await tx.equipmentEvent.findMany({
        where: { eventId: id },
      });

      // Restore stock for each equipment
      for (const equipmentEvent of equipmentEvents) {
        await tx.equipments.update({
          where: { id: equipmentEvent.equipmentId },
          data: {
            stock: {
              increment: equipmentEvent.quantity,
            },
          },
        });
      }

      // Delete event (EquipmentEvent will be cascade deleted)
      await tx.events.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Event berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus event" },
      { status: 500 }
    );
  }
}
