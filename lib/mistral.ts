import { Mistral } from "@mistralai/mistralai";

const apiKey = process.env.MISTRAL_API_KEY || "mistral_api_key_missing";
const mistral = new Mistral({ apiKey });

/**
 * Struktur pesan untuk chat completion
 */
export interface MistralMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Fungsi untuk membuat embedding
 */
export async function createEmbedding(input: string) {
  const res = await mistral.embeddings.create({
    model: "mistral-embed",
    inputs: [input],
  });

  return res.data[0].embedding;
}

/**
 * Fungsi utama untuk bertanya ke Mistral (Chat Completion)
 * Menerima array messages agar bisa multi-turn conversation
 */
export async function askMistral(messages: MistralMessage[]): Promise<string> {
  const res = await mistral.chat.complete({
    model: "open-mistral-7b",
    messages,
  });

  const content = res.choices?.[0]?.message?.content;

  if (Array.isArray(content)) {
    // Kalau berupa array of ContentChunk
    return content
      .map((c) => (typeof c === "string" ? c : c.type || ""))
      .join(" ");
  }

  return content || "Maaf, tidak ada respons dari AI.";
}
