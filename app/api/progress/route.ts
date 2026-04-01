import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// Returns YYYY-MM-DD in Argentina timezone (UTC-3)
function getArgentinaDate(): string {
  const now = new Date();
  const arg = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return arg.toISOString().slice(0, 10);
}

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

    // Score updates + streak fetch in parallel
    const [newTotal, , , lastPlayDateRaw, currentStreakRaw] = await Promise.all([
      redis.hincrby(key, "totalScore", score),
      redis.hincrby(key, "gamesPlayed", 1),
      redis.zincrby("leaderboard", score, email),
      redis.hget(key, "streak:lastPlayDate"),
      redis.hget(key, "streak:current"),
    ]);

    // Streak logic (Argentina timezone)
    const today = getArgentinaDate();
    const lastPlayDate = lastPlayDateRaw as string | null;
    const prevStreak = currentStreakRaw ? parseInt(currentStreakRaw as string, 10) : 0;

    let newStreak = prevStreak;
    let streakBroken = false;

    if (!lastPlayDate) {
      // First game ever
      newStreak = 1;
      await redis.hset(key, { "streak:current": 1, "streak:lastPlayDate": today });
    } else if (lastPlayDate === today) {
      // Already played today — no streak change
      newStreak = prevStreak || 1;
    } else {
      const lastDate = new Date(lastPlayDate + "T00:00:00Z");
      const todayDate = new Date(today + "T00:00:00Z");
      const diffDays = Math.round(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        // Consecutive day — extend streak
        newStreak = (prevStreak || 0) + 1;
        await redis.hset(key, { "streak:current": newStreak, "streak:lastPlayDate": today });
      } else {
        // Gap > 1 day — reset streak
        streakBroken = (prevStreak || 0) > 1;
        newStreak = 1;
        await redis.hset(key, { "streak:current": 1, "streak:lastPlayDate": today });
      }
    }

    return NextResponse.json({ totalScore: newTotal, streak: newStreak, streakBroken, prevStreak });
  } catch (err) {
    console.error("[/api/progress] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
