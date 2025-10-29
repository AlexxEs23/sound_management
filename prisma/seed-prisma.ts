import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Starting hybrid seed: Supabase Auth + Prisma DB...");

  // Clean DB (order matters)
  await prisma.equipmentEvent.deleteMany();
  await prisma.events.deleteMany();
  await prisma.equipments.deleteMany();
  await prisma.users.deleteMany();

  const usersToCreate = [
    {
      name: "Alice Admin",
      email: "alice@example.com",
      noWa: "081200000001",
      password: "password123",
    },
    {
      name: "Bob Operator",
      email: "bob@example.com",
      noWa: "081200000002",
      password: "password123",
    },
  ];

  for (const u of usersToCreate) {
    await prisma.users.create({
      data: {
        name: u.name,
        email: u.email,
        noWa: u.noWa,
        password: u.password,
      },
    });
  }

  // Equipments
  const speaker = await prisma.equipments.create({
    data: {
      name: "Main Speaker",
      category: "Speaker",
      condition: "available",
      imageUrl: null,
    },
  });
  const mixer = await prisma.equipments.create({
    data: {
      name: "FoH Mixer",
      category: "Mixer",
      condition: "available",
      imageUrl: null,
    },
  });
  const mic = await prisma.equipments.create({
    data: {
      name: "Wireless Mic",
      category: "Microphone",
      condition: "available",
      imageUrl: null,
    },
  });

  // Events
  const concert = await prisma.events.create({
    data: {
      title: "City Concert",
      description: "Outdoor city concert with live bands",
      date: new Date("2025-11-15T19:00:00.000Z"),
      location: "Central Park",
    },
  });

  const seminar = await prisma.events.create({
    data: {
      title: "Tech Seminar",
      description: "Internal tech seminar for staff",
      date: new Date("2025-12-03T09:00:00.000Z"),
      location: "Conference Hall B",
    },
  });

  // Link equipment to events
  await prisma.equipmentEvent.createMany({
    data: [
      { equipmentId: speaker.id, eventId: concert.id, status: "in_use" },
      { equipmentId: mixer.id, eventId: concert.id, status: "in_use" },
      { equipmentId: mic.id, eventId: seminar.id, status: "available" },
    ],
  });

  console.log("Hybrid seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
