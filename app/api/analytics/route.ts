import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { trackEvent, todayUTC } from "@/lib/analytics";

const ANALYTICS_SECRET = "sukha2026";

// ── POST /api/analytics ─────────────────────────────────────────────────────
// Client-side event tracking (no auth — write-only counters, low-value abuse)
// Body: { event: "game_started"|"game_completed"|"share", category?: string, level?: number }

export async function POST(req: NextRequest) {
  try {
    const { event, category, level } = await req.json();

    if (event === "game_started") {
      await trackEvent("analytics:games_started");
    } else if (event === "game_completed") {
      await Promise.all([
        trackEvent("analytics:games_completed"),
        category ? trackEvent(`analytics:category:${category}`) : Promise.resolve(),
        level    ? trackEvent(`analytics:level:${level}`)    : Promise.resolve(),
      ]);
    } else if (event === "share") {
      await trackEvent("analytics:shares");
    } else {
      return NextResponse.json({ error: "Evento desconocido" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/analytics POST] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── GET /api/analytics?key=sukha2026 ────────────────────────────────────────
// Dashboard: totals + daily breakdown for the last 30 days

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== ANALYTICS_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Build list of last 30 date strings
  const dates: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const dateSet = new Set(dates);

  const CATEGORIES = ["historia", "filosofia", "posturas", "anatomia", "curiosidades", "aleatorio"];
  const LEVELS = [1, 2, 3];

  const topLevelKeys = [
    "analytics:games_started",
    "analytics:games_completed",
    "analytics:registrations",
    "analytics:shares",
  ];
  const categoryKeys = CATEGORIES.map((c) => `analytics:category:${c}`);
  const levelKeys    = LEVELS.map((l) => `analytics:level:${l}`);

  const allKeys = [...topLevelKeys, ...categoryKeys, ...levelKeys];

  // Fetch all hashes in parallel
  const results = await Promise.all(allKeys.map((k) => redis.hgetall(k)));

  function sumWindow(data: Record<string, unknown> | null): { total: number; daily: Record<string, number> } {
    if (!data) return { total: 0, daily: {} };
    const daily: Record<string, number> = {};
    let total = 0;
    for (const [date, count] of Object.entries(data)) {
      if (dateSet.has(date)) {
        const n = Number(count);
        daily[date] = n;
        total += n;
      }
    }
    return { total, daily };
  }

  const byKey = Object.fromEntries(allKeys.map((k, i) => [k, sumWindow(results[i])]));

  const today = todayUTC();

  return NextResponse.json({
    window: "last_30_days",
    as_of: today,
    summary: {
      games_started:   byKey["analytics:games_started"].total,
      games_completed: byKey["analytics:games_completed"].total,
      registrations:   byKey["analytics:registrations"].total,
      shares:          byKey["analytics:shares"].total,
    },
    today: {
      games_started:   byKey["analytics:games_started"].daily[today]   ?? 0,
      games_completed: byKey["analytics:games_completed"].daily[today] ?? 0,
      registrations:   byKey["analytics:registrations"].daily[today]   ?? 0,
      shares:          byKey["analytics:shares"].daily[today]          ?? 0,
    },
    by_category: Object.fromEntries(
      CATEGORIES.map((c) => [c, byKey[`analytics:category:${c}`].total])
    ),
    by_level: Object.fromEntries(
      LEVELS.map((l) => [l, byKey[`analytics:level:${l}`].total])
    ),
    daily_games_started:   byKey["analytics:games_started"].daily,
    daily_games_completed: byKey["analytics:games_completed"].daily,
    daily_registrations:   byKey["analytics:registrations"].daily,
    daily_shares:          byKey["analytics:shares"].daily,
  });
}
