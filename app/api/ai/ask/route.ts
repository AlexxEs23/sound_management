import { NextRequest, NextResponse } from "next/server";
import { askMistral } from "@/lib/mistral";
import { prisma } from "@/lib/prisma";

// ✅ Fungsi bantu: clean text supaya rapi sebelum dikirim ke model
const formatText = (text: string | null | undefined): string =>
  text?.trim().replace(/\s+/g, " ") || "-";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    // ✅ Validasi input
    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Pertanyaan tidak boleh kosong." },
        { status: 400 }
      );
    }

    // ✅ Ambil data paralel (lebih cepat)
    const [equipments, events, damagedEquipments] = await Promise.all([
      prisma.equipments.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.events.findMany({
        orderBy: { date: "desc" },
        take: 20,
        include: {
          EquipmentEvent: { include: { equipment: true } },
        },
      }),
      prisma.damagedEquipment.findMany({
        orderBy: { reportedAt: "desc" },
        take: 20,
        include: { equipment: true },
      }),
    ]);

    // ✅ Bangun konteks AI-friendly
    const equipmentContext = equipments
      .map(
        (eq) =>
          `- **${formatText(eq.name)}**  
  Kategori: ${formatText(eq.category)}  
  Stok: ${eq.stock} unit`
      )
      .join("\n\n");

    const eventContext = events
      .map(
        (ev) =>
          `- **${formatText(ev.title)}**  
  Lokasi: ${formatText(ev.location)}  
  Tanggal: ${new Date(ev.date).toLocaleDateString("id-ID")}  
  Status: ${formatText(ev.status)}`
      )
      .join("\n\n");

    const damagedContext = damagedEquipments
      .map(
        (dm) =>
          `- **${formatText(dm.equipment.name)}**  
  Jumlah rusak: ${dm.quantity} unit, Alasan Kerusakan: ${dm.description || "-"}
  Status perbaikan: ${formatText(dm.repairStatus)}`
      )
      .join("\n\n");

    const context = `
## 📦 Data Equipment
**Total Equipment:** ${equipments.length}  
**Total Stok:** ${equipments.reduce((sum, eq) => sum + eq.stock, 0)} unit  

${equipmentContext || "_Tidak ada data equipment tersedia._"}

---

## 📅 Data Event
**Total Event:** ${events.length}  

${eventContext || "_Belum ada event tercatat._"}

---

## 🔧 Data Barang Rusak
**Total Barang Rusak:** ${damagedEquipments.length}  

${damagedContext || "_Tidak ada barang rusak tercatat._"}
`;

    // ✅ Prompt sistem biar jawaban rapi & bergaya profesional
    const messages = [
      {
        role: "system" as const,
        content: `
Kamu adalah **asisten virtual profesional** yang membantu mengelola sound equipment.  
Jawab pertanyaan berdasarkan konteks dengan **akurat, sopan, dan informatif**.  

Gunakan **Markdown** untuk mempercantik jawaban, beri **bold** pada poin penting,  
dan tambahkan **spasi antar paragraf** agar mudah dibaca.

Jawab **hanya berdasarkan data yang diberikan di konteks**.  
Jika pertanyaan di luar konteks, jawab dengan sopan bahwa informasi tersebut belum tersedia.  
Jangan memaksakan menjawab jika tidak tahu.
        `,
      },
      {
        role: "user" as const,
        content: `Konteks:\n${context}\n\nPertanyaan: ${question}`,
      },
    ];

    // ✅ Kirim ke Mistral AI (pakai messages, bukan question + context)
    const answer = await askMistral(messages);

    return NextResponse.json({
      success: true,
      data: {
        question,
        answer,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("AI Ask Error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal memproses pertanyaan. Pastikan server dan API key Mistral sudah dikonfigurasi dengan benar.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
