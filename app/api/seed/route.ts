import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const USERS = [
  { name: "Valentina", email: "valentina@seed.test", totalScore: 12450, gamesPlayed: 9 },
  { name: "Camila", email: "camila@seed.test", totalScore: 9800, gamesPlayed: 7 },
  { name: "Lucía", email: "lucia@seed.test", totalScore: 8200, gamesPlayed: 6 },
  { name: "Sofía", email: "sofia@seed.test", totalScore: 6100, gamesPlayed: 5 },
  { name: "Martina", email: "martina@seed.test", totalScore: 5300, gamesPlayed: 4 },
];

export async function GET() {
  try {
    for (const u of USERS) {
      await redis.hset(`user:${u.email}`, {
        name: u.name,
        email: u.email,
        totalScore: u.totalScore,
        gamesPlayed: u.gamesPlayed,
        createdAt: Date.now(),
      });
      await redis.zadd("leaderboard", { score: u.totalScore, member: u.email });
    }
    return NextResponse.json({ ok: true, seeded: USERS.map((u) => u.name) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
