"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LeaderboardEntry } from "@/lib/types";
import { getRegisteredUser } from "@/lib/progress";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function MiniLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getRegisteredUser();
    setCurrentUser(user);
    const url = user
      ? `/api/leaderboard?email=${encodeURIComponent(user.email)}`
      : "/api/leaderboard";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!data.entries) return;
        const all: LeaderboardEntry[] = data.entries;
        setEntries(all.slice(0, 5));

        if (data.userEntry) {
          // User is outside top 10 — API already computed their rank
          setUserEntry(data.userEntry);
        } else if (user) {
          // User might be in positions 6-10 — find them in the full list
          const found = all.slice(5).find((e) => e.name === user.name);
          setUserEntry(found ?? null);
        }
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false));
  }, []);

  // Find if current user is already in the displayed top 5
  const userInTop5 = currentUser
    ? entries.some((e) => e.name === currentUser.name)
    : false;

  if (loading) return null; // Don't show skeleton, just wait silently
  if (entries.length === 0) return null; // No data yet, nothing to show

  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-rubik text-xs font-medium uppercase tracking-widest text-sukha-dark">
          Ranking
        </span>
        <Link
          href="/leaderboard"
          className="font-rubik text-xs text-sukha-accent hover:underline"
        >
          Ver todo →
        </Link>
      </div>

      <div
        className="rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.10)" }}
      >
        {entries.map((entry, i) => {
          const isMe = currentUser && entry.name === currentUser.name;
          return (
            <Row
              key={entry.rank}
              rank={entry.rank}
              name={entry.name}
              score={entry.totalScore}
              isMe={!!isMe}
              isLast={i === entries.length - 1 && !userEntry && !(!currentUser)}
              medal={i < 3 ? MEDALS[i] : undefined}
            />
          );
        })}

        {/* User outside top 5 */}
        {!userInTop5 && userEntry && (
          <>
            <div style={{ padding: "4px 20px", borderTop: "1px solid #f3f4f6" }}>
              <span className="font-rubik text-xs text-gray-300">···</span>
            </div>
            <Row
              rank={userEntry.rank}
              name={userEntry.name}
              score={userEntry.totalScore}
              isMe
              isLast
            />
          </>
        )}

        {/* Not registered CTA */}
        {!currentUser && (
          <div
            style={{
              borderTop: "1px solid #f3f4f6",
              padding: "14px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12,
            }}
          >
            <p className="font-rubik text-xs text-sukha-mid" style={{ lineHeight: 1.4 }}>
              Jugá y registrate para aparecer en el ranking
            </p>
            <Link
              href="/play/aleatorio"
              className="shrink-0 rounded-xl px-3 py-1.5 font-rubik text-xs font-medium text-white"
              style={{ background: "linear-gradient(135deg, #9993C0, #7b74a8)" }}
            >
              Jugar
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  rank, name, score, isMe, isLast, medal,
}: {
  rank: number;
  name: string;
  score: number;
  isMe: boolean;
  isLast: boolean;
  medal?: string;
}) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 20px",
        borderBottom: isLast ? "none" : "1px solid #f3f4f6",
        background: isMe ? "rgba(153,147,192,0.07)" : "transparent",
      }}
    >
      <div style={{ width: 28, textAlign: "center", flexShrink: 0 }}>
        {medal ? (
          <span style={{ fontSize: 18 }}>{medal}</span>
        ) : (
          <span
            className="font-rubik text-sm font-medium"
            style={{ color: isMe ? "#9993C0" : "#9ca3af" }}
          >
            {rank}
          </span>
        )}
      </div>
      <p
        className="flex-1 min-w-0 font-rubik text-sm font-medium truncate"
        style={{ color: isMe ? "#9993C0" : "#434344" }}
      >
        {name}
        {isMe && (
          <span className="ml-1.5 font-rubik text-xs font-normal" style={{ color: "#b0aac8" }}>
            (vos)
          </span>
        )}
      </p>
      <p
        className="font-rubik text-sm tabular-nums"
        style={{ color: isMe ? "#9993C0" : "#6b7280", fontWeight: isMe ? 600 : 400 }}
      >
        {score.toLocaleString()}
        <span className="ml-1 text-xs" style={{ color: "#d1d5db" }}>pts</span>
      </p>
    </div>
  );
}
