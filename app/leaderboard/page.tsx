"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LeaderboardEntry } from "@/lib/types";
import { getRegisteredUser } from "@/lib/progress";
import { shouldShowLeaderboardIntro, markLeaderboardIntroSeen } from "@/lib/contextualMessages";
import ToastMessage from "@/components/ToastMessage";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [introToast, setIntroToast] = useState<string | null>(null);

  useEffect(() => {
    if (shouldShowLeaderboardIntro()) {
      markLeaderboardIntroSeen();
      setTimeout(() => setIntroToast("Acá ves a los mejores yoguis. ¿Te animás a entrar en el top?"), 800);
    }

    const user = getRegisteredUser();
    setCurrentUser(user);
    const url = user ? `/api/leaderboard?email=${encodeURIComponent(user.email)}` : "/api/leaderboard";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.entries) setEntries(data.entries);
        else setError("No se pudo cargar el ranking.");
      })
      .catch(() => setError("Error de conexión."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen">
      {introToast && <ToastMessage text={introToast} onClose={() => setIntroToast(null)} />}
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #434344 0%, #5a4a6b 50%, #9993C0 100%)",
          padding: "32px 24px 28px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 36, margin: "0 0 8px" }}>🏆</p>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "white",
            margin: "0 0 6px",
            fontFamily: "var(--font-bree)",
          }}
        >
          Ranking Global
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.7)",
            margin: 0,
            fontFamily: "var(--font-rubik)",
          }}
        >
          Los mejores yoguis del trivia
        </p>
      </div>

      <div className="mx-auto w-full max-w-[512px] px-4 pb-16 pt-8">

        {loading && (
          <p className="text-center font-rubik text-sukha-dark">Cargando…</p>
        )}

        {error && (
          <p className="text-center font-rubik text-sm" style={{ color: "#D4726A" }}>{error}</p>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <p className="font-rubik text-sukha-mid">Todavía no hay jugadores registrados.</p>
            <p className="mt-1 font-rubik text-xs text-gray-400">¡Sé el primero en entrar al ranking!</p>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="rounded-3xl bg-white overflow-hidden" style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.10)" }}>
            {entries.map((entry, i) => {
              const isMe = currentUser && entry.name === currentUser.name;
              return (
                <div
                  key={entry.rank}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{
                    borderBottom: i < entries.length - 1 ? "1px solid #f3f4f6" : "none",
                    background: isMe ? "rgba(153,147,192,0.06)" : "transparent",
                  }}
                >
                  {/* Rank */}
                  <div className="w-8 shrink-0 text-center">
                    {i < 3 ? (
                      <span style={{ fontSize: 20 }}>{MEDALS[i]}</span>
                    ) : (
                      <span className="font-rubik text-sm font-medium text-sukha-mid">
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-rubik text-sm font-medium truncate"
                      style={{ color: isMe ? "#9993C0" : "#434344" }}
                    >
                      {entry.name}
                      {isMe && (
                        <span className="ml-2 font-rubik text-xs font-normal text-sukha-mid">
                          (vos)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Score */}
                  <p className="font-rubik text-base font-medium tabular-nums" style={{ color: "#434344" }}>
                    {entry.totalScore.toLocaleString()}
                    <span className="ml-1 font-rubik text-xs font-normal text-sukha-mid">pts</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* CTAs */}
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-2xl py-4 font-rubik font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #9993C0, #7b74a8)" }}
          >
            Jugar
          </Link>
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-2xl border-2 border-gray-200 py-4 font-rubik font-medium text-sukha-dark transition-all hover:border-sukha-accent hover:text-sukha-accent active:scale-[0.98]"
          >
            ← Volver al inicio
          </Link>
        </div>

        <p className="mt-10 text-center font-rubik text-xs text-sukha-mid">
          Una experiencia de{" "}
          <a href="https://www.sukhaonline.com.ar" className="hover:underline">SUKHA</a>
          {" · "}www.sukhaonline.com.ar
        </p>
      </div>
    </main>
  );
}
