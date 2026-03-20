import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

// In-memory cache: key = `${questionId}-${correct|wrong|timeout}`
const cache = new Map<string, string>();

const SYSTEM_PROMPT = `Sos un experto en yoga con conocimiento profundo de historia, filosofía, anatomía y práctica. Trabajás para Sukha, una marca argentina líder en yoga mats y accesorios sustentables. Tu tono es cálido, educativo y ligeramente informal — como un profesor de yoga que sabe mucho pero no es pedante. Respondés siempre en español rioplatense.

Tu tarea: dado una pregunta de trivia, la respuesta correcta, y la respuesta del usuario, generá una explicación educativa breve (2-3 oraciones) y cerrala con un dato curioso o conexión interesante. Si el usuario acertó, celebralo brevemente. Si erró, explicá sin juzgar.

Formato de respuesta: texto plano, sin markdown, máximo 280 caracteres.`;

export async function POST(req: NextRequest) {
  try {
    const { questionId, question, correctAnswer, userAnswer, isCorrect } = await req.json();

    const resultKey = isCorrect ? "correct" : userAnswer === null ? "timeout" : "wrong";
    const cacheKey = `${questionId}-${resultKey}`;

    if (cache.has(cacheKey)) {
      return NextResponse.json({ explanation: cache.get(cacheKey) });
    }

    const userMsg =
      `Pregunta: ${question}\n` +
      `Respuesta correcta: ${correctAnswer}\n` +
      `Respuesta del usuario: ${userAnswer ?? "Tiempo agotado — no respondió"}`;

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    });

    const explanation = (msg.content[0] as { type: "text"; text: string }).text.trim();
    cache.set(cacheKey, explanation);

    return NextResponse.json({ explanation });
  } catch (err) {
    console.error("[/api/explain] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
