"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLocalScore, getLevel, getRegisteredUser } from "@/lib/progress";

const LEVEL_STAR: Record<string, string> = {
  principiante: "⭐",
  intermedio: "🌟",
  avanzado: "✨",
};

const LEVEL_LABEL: Record<string, string> = {
  principiante: "PRINCIPIANTE",
  intermedio: "INTERMEDIO",
  avanzado: "AVANZADO",
};

export default function ScoreBadge() {
  const [score, setScore] = useState<number | null>(null);
  const [level, setLevel] = useState<string>("principiante");
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const s = getLocalScore();
    setScore(s);
    setLevel(getLevel(s));
    setRegistered(getRegisteredUser() !== null);
  }, []);

  if (score === null || score === 0) return null;

  return (
    <div className="mb-8 flex items-center justify-between rounded-2xl px-4 py-3 font-rubik"
      style={{ background: "rgba(153,147,192,0.08)", border: "1px solid rgba(153,147,192,0.15)" }}
    >
      <span className="text-sm font-medium text-sukha-dark">
        {LEVEL_STAR[level]} {LEVEL_LABEL[level]} · {score.toLocaleString()} pts
      </span>
      <Link
        href="/leaderboard"
        className="text-xs text-sukha-accent hover:underline"
      >
        Ver ranking →
      </Link>
    </div>
  );
}
