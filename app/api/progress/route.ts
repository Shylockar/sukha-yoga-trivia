import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { email, score } = await req.json();

    if (!email || typeof score !== "number") {
      return NextResponse.json({ error: "email y score requeridos" }, { status: 400 });
    }

    const key = `user:${email}`;
    const exists = await redis.exists(key);
    if (!exists) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const [newTotal] = await Promise.all([
      redis.hincrby(key, "totalScore", score),
      redis.hincrby(key, "gamesPlayed", 1),
      redis.zincrby("leaderboard", score, email),
    ]);

    return NextResponse.json({ totalScore: newTotal });
  } catch (err) {
    console.error("[/api/progress] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
