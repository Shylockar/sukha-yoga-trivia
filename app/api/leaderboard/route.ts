import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { LeaderboardEntry } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    // Get top 10 by score descending: returns [member, score, member, score, ...]
    const raw = await redis.zrange("leaderboard", 0, 9, {
      rev: true,
      withScores: true,
    });

    const entries: LeaderboardEntry[] = [];
    if (raw && raw.length > 0) {
      for (let i = 0; i < raw.length; i += 2) {
        const e = raw[i] as string;
        const score = Number(raw[i + 1]);
        const name = (await redis.hget(`user:${e}`, "name")) as string | null;
        entries.push({ rank: entries.length + 1, name: name ?? e, totalScore: score });
      }
    }

    // If email provided and not in top 10, look up their rank
    let userEntry: LeaderboardEntry | null = null;
    if (email) {
      const inTop = entries.some((_, i) => {
        // match by checking raw emails
        const rawEmail = raw[(i * 2)] as string;
        return rawEmail === email;
      });

      if (!inTop) {
        const [rank, score, name] = await Promise.all([
          redis.zrevrank("leaderboard", email),
          redis.zscore("leaderboard", email),
          redis.hget(`user:${email}`, "name"),
        ]);
        if (rank !== null && score !== null) {
          userEntry = {
            rank: rank + 1, // zrevrank is 0-indexed
            name: (name as string | null) ?? email,
            totalScore: Number(score),
          };
        }
      }
    }

    return NextResponse.json({ entries, userEntry });
  } catch (err) {
    console.error("[/api/leaderboard] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
