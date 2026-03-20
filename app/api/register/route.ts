import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { name, email, localScore = 0 } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email requeridos" }, { status: 400 });
    }

    const key = `user:${email}`;

    // If user already exists, return their current data
    const existing = await redis.hgetall(key);
    if (existing && existing.email) {
      return NextResponse.json({
        success: true,
        totalScore: Number(existing.totalScore ?? 0),
        alreadyRegistered: true,
      });
    }

    // Create new user
    const totalScore = Math.max(0, Number(localScore));
    await redis.hset(key, {
      name,
      email,
      totalScore,
      gamesPlayed: 1,
      createdAt: Date.now(),
    });

    // Add to leaderboard sorted set
    await redis.zadd("leaderboard", { score: totalScore, member: email });

    return NextResponse.json({ success: true, totalScore });
  } catch (err) {
    console.error("[/api/register] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
