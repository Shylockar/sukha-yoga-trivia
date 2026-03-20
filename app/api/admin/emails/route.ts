import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const ADMIN_SECRET = "sukha2026";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // All registered emails are members of the leaderboard sorted set
  const emails = await redis.zrange("leaderboard", 0, -1);

  if (!emails || emails.length === 0) {
    const format = searchParams.get("format");
    if (format === "csv") {
      return new NextResponse("name,email,totalScore,gamesPlayed,createdAt\n", {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=\"sukha-users.csv\"",
        },
      });
    }
    return NextResponse.json({ total: 0, users: [] });
  }

  // Fetch all user hashes in parallel
  const hashes = await Promise.all(
    (emails as string[]).map((email) => redis.hgetall(`user:${email}`))
  );

  const users = hashes
    .map((data, i) => {
      if (!data) return null;
      const createdAt = data.createdAt
        ? new Date(Number(data.createdAt)).toISOString()
        : null;
      return {
        name:        String(data.name        ?? ""),
        email:       String(data.email       ?? (emails as string[])[i]),
        totalScore:  Number(data.totalScore  ?? 0),
        gamesPlayed: Number(data.gamesPlayed ?? 0),
        createdAt,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.totalScore - a!.totalScore);

  const format = searchParams.get("format");

  if (format === "csv") {
    const rows = [
      "name,email,totalScore,gamesPlayed,createdAt",
      ...users.map((u) =>
        [
          `"${u!.name.replace(/"/g, '""')}"`,
          `"${u!.email.replace(/"/g, '""')}"`,
          u!.totalScore,
          u!.gamesPlayed,
          u!.createdAt ?? "",
        ].join(",")
      ),
    ].join("\n");

    return new NextResponse(rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=\"sukha-users.csv\"",
      },
    });
  }

  return NextResponse.json({ total: users.length, users });
}
