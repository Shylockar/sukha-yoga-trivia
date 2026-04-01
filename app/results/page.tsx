"use client";

import { useEffect, useState } from "react";
import { Trophy, Star, Sprout, Share2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GameResult, LeaderboardEntry } from "@/lib/types";
import {
  addLocalScore,
  getLocalScore,
  getRegisteredUser,
  getLevel,
  getNextThreshold,
  getLocalStreak,
  saveLocalStreak,
} from "@/lib/progress";
import type { Level } from "@/lib/progress";
import {
  evaluateMessages,
  incrementGamesPlayed,
  updateLastGameTimestamp,
  getLastRank,
  saveLastRank,
} from "@/lib/contextualMessages";
import type { ToastMsg, LevelUpMsg } from "@/lib/contextualMessages";
import UnlockModal from "@/components/UnlockModal";
import ToastMessage from "@/components/ToastMessage";
import LevelUpCelebration from "@/components/LevelUpCelebration";
import CouponModal from "@/components/CouponModal";
import { generateShareImage } from "@/lib/shareImage";
import type { TriggerType } from "@/lib/shopify";

const CATEGORY_LABELS: Record<string, string> = {
  historia: "Historia",
  filosofia: "Filosofía",
  posturas: "Posturas",
  anatomia: "Anatomía",
  curiosidades: "Curiosidades",
  aleatorio: "Modo Aleatorio",
};

const MAX_SCORE = 1500;

function getAchievement(score: number): { icon: React.ReactNode; title: string; subtitle: string } {
  if (score >= 1200) return {
    icon: <Trophy size={52} strokeWidth={1.5} className="text-sukha-accent" />,
    title: "Maestro yogui",
    subtitle: "Conocimiento digno de un gurú. ¡Impresionante!",
  };
  if (score >= 800) return {
    icon: <Star size={52} strokeWidth={1.5} className="text-sukha-accent" />,
    title: "Buen camino",
    subtitle: "Sólido conocimiento del yoga. Seguí practicando.",
  };
  return {
    icon: <Sprout size={52} strokeWidth={1.5} className="text-sukha-accent" />,
    title: "Seguí practicando",
    subtitle: "Cada clase te acerca más. ¡La constancia es todo!",
  };
}

const SCORE_THRESHOLDS: Array<{ score: number; trigger: TriggerType }> = [
  { score: 20000, trigger: "25off" },
  { score: 12000, trigger: "15off" },
  { score: 8000,  trigger: "10off" },
];

function resolveCouponTriggers(
  prevScore: number,
  newScore: number,
  correctCount: number,
  prevLevel: Level,
  newLevel: Level,
): TriggerType[] {
  const triggers: TriggerType[] = [];

  // Level-up triggers (checked first — they supersede score thresholds)
  if (prevLevel !== "avanzado" && newLevel === "avanzado") {
    triggers.push("20off");
  } else if (prevLevel === "principiante" && newLevel === "intermedio") {
    triggers.push("free_shipping");
  } else {
    // Score threshold triggers
    for (const { score, trigger } of SCORE_THRESHOLDS) {
      if (prevScore < score && newScore >= score) {
        triggers.push(trigger);
        break; // only one score trigger per game
      }
    }
  }

  // Perfect game (always appended — repeatable)
  if (correctCount === 10) {
    triggers.push("15off_perfect");
  }

  return triggers;
}

const STREAK_MILESTONES = [
  { days: 30, key: "sukha_streak_ms_30", text: "🔥 ¡30 días seguidos! Sos un yogui de verdad." },
  { days: 14, key: "sukha_streak_ms_14", text: "🔥 ¡14 días seguidos! La constancia es tu superpoder." },
  { days: 7,  key: "sukha_streak_ms_7",  text: "🔥 ¡Una semana seguida! ¡Increíble racha!" },
  { days: 3,  key: "sukha_streak_ms_3",  text: "🔥 ¡3 días seguidos! Seguí así." },
];

function resolveStreakToast(
  streak: number,
  streakBroken: boolean,
  prevStreak: number,
): ToastMsg | null {
  if (streakBroken && prevStreak >= 2) {
    return { id: "streak_broken", text: `Tu racha de ${prevStreak} días terminó. ¡Empezá una nueva hoy!` };
  }
  if (streak >= 2 && !streakBroken) {
    for (const ms of STREAK_MILESTONES) {
      if (streak === ms.days && !localStorage.getItem(ms.key)) {
        localStorage.setItem(ms.key, "1");
        return { id: `streak_ms_${ms.days}`, text: ms.text };
      }
    }
    return { id: "streak_extended", text: `🔥 ¡${streak} días seguidos! No pierdas tu racha mañana.` };
  }
  return null;
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<GameResult | null>(null);
  const [visible, setVisible] = useState(false);
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [registeredUser, setRegisteredUser] = useState<{ email: string; name: string } | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [top3, setTop3] = useState<LeaderboardEntry[] | null>(null);
  const [userRankEntry, setUserRankEntry] = useState<LeaderboardEntry | null>(null);
  const [sharing, setSharing] = useState<"stories" | "whatsapp" | null>(null);
  const [toastMsg, setToastMsg] = useState<ToastMsg | null>(null);
  const [levelUpData, setLevelUpData] = useState<LevelUpMsg | null>(null);
  const [coupon, setCoupon] = useState<{
    code: string;
    description: string;
    expiresAt: string;
    hoursValid: number;
  } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("gameResult");
    if (!raw) { router.replace("/"); return; }
    const parsed: GameResult = JSON.parse(raw);
    setResult(parsed);
    setTimeout(() => setVisible(true), 60);

    // Analytics: track game completed
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "game_completed",
        category: parsed.category,
        level: parsed.level ?? 1,
      }),
    }).catch(() => {});

    // Accumulate score in localStorage
    const prevScore = getLocalScore();
    const newTotal = addLocalScore(parsed.totalScore);
    setAccumulatedScore(newTotal);

    // Check registered user
    const user = getRegisteredUser();
    setRegisteredUser(user);

    // Coupon triggers (only for registered users)
    if (user) {
      const triggers = resolveCouponTriggers(prevScore, newTotal, parsed.correctCount, getLevel(prevScore), getLevel(newTotal));
      for (const trigger of triggers) {
        fetch("/api/coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, triggerType: trigger, userName: user.name }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.code) {
              setTimeout(() => setCoupon({ code: data.code, description: data.description, expiresAt: data.expiresAt, hoursValid: data.hoursValid }), 1200);
            }
          })
          .catch(() => {});
        break; // only first matching trigger per game
      }
    }

    // Contextual messages
    const games = incrementGamesPlayed();
    const { toast, levelUp } = evaluateMessages({
      prevScore,
      newScore: newTotal,
      prevLevel: getLevel(prevScore),
      newLevel: getLevel(newTotal),
      correctCount: parsed.correctCount,
      isRegistered: !!user,
      gamesPlayed: games,
    });
    updateLastGameTimestamp();
    let msgQueued = false;
    if (levelUp) { setTimeout(() => setLevelUpData(levelUp), 900); msgQueued = true; }
    else if (toast) { setTimeout(() => setToastMsg(toast), 900); msgQueued = true; }

    if (user) {
      // Sync score to backend + handle streak response
      const prevLocalStreak = getLocalStreak();
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, score: parsed.totalScore }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (typeof data.streak === "number") {
            saveLocalStreak(data.streak);
            if (!msgQueued) {
              const streakToast = resolveStreakToast(data.streak, data.streakBroken, data.prevStreak ?? prevLocalStreak);
              if (streakToast) {
                setTimeout(() => setToastMsg(streakToast), 1800);
                msgQueued = true;
              }
            }
          }
        })
        .catch(() => {/* silent fail */});
    }

    // Show registration modal after 5s for unregistered users
    const registrationTimer = !user
      ? setTimeout(() => setShowUnlockModal(true), 5000)
      : null;

    // Fetch leaderboard for ranking snapshot (graceful degradation)
    const lbUrl = user
      ? `/api/leaderboard?email=${encodeURIComponent(user.email)}`
      : "/api/leaderboard";
    fetch(lbUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!data.entries) return;
        setTop3((data.entries as LeaderboardEntry[]).slice(0, 3));
        let resolvedEntry: LeaderboardEntry | null = null;
        if (data.userEntry) {
          resolvedEntry = data.userEntry;
          setUserRankEntry(data.userEntry);
        } else if (user) {
          const found = (data.entries as LeaderboardEntry[]).find(
            (e: LeaderboardEntry) => e.name === user.name
          );
          resolvedEntry = found ?? null;
          setUserRankEntry(found ?? null);
        }
        // Check for rank drop
        if (resolvedEntry) {
          const newRank = resolvedEntry.rank;
          const prevRank = getLastRank();
          if (!msgQueued && prevRank !== null && newRank > prevRank) {
            setToastMsg({ id: "rank_drop", text: `¡Te superaron! Bajaste al puesto #${newRank}. ¿Jugás una partida más?` });
            msgQueued = true;
          }
          saveLastRank(newRank);
        }
      })
      .catch(() => {/* silent fail — card shows without ranking */});

    return () => { if (registrationTimer) clearTimeout(registrationTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="font-rubik text-sukha-mid">Cargando…</p>
      </main>
    );
  }

  const scorePct = Math.round((result.totalScore / MAX_SCORE) * 100);
  const achievement = getAchievement(result.totalScore);
  const level = getLevel(accumulatedScore);
  const nextThreshold = getNextThreshold(accumulatedScore);
  const progressPct = level === "avanzado"
    ? 100
    : Math.min(100, Math.round((accumulatedScore / nextThreshold) * 100));
  const ptsToNext = Math.max(0, nextThreshold - accumulatedScore);
  const levelLabel = level === "principiante" ? "Principiante" : level === "intermedio" ? "Intermedio" : "Avanzado";
  const nextLevelLabel = level === "principiante" ? "Intermedio" : "Avanzado";

  function handleUnlockSuccess(name: string, email: string) {
    setRegisteredUser({ name, email });
    setShowUnlockModal(false);
  }

  async function handleShare(mode: "stories" | "whatsapp") {
    if (!result) return;
    setSharing(mode);
    // Safety reset in case the share sheet never resolves (e.g. iOS + Instagram)
    const safetyTimer = setTimeout(() => setSharing(null), 10000);
    try {
      const blob = await generateShareImage({
        score: result.totalScore,
        correctCount: result.correctCount,
        totalBonus: result.totalBonus,
        top3,
        userRankEntry,
        userName: registeredUser?.name,
      });
      const file = new File([blob], "sukha-trivia.png", { type: "image/png" });
      const shareText = "¿Cuánto sabés sobre yoga? Jugá en trivia.sukhaonline.com.ar";

      if (mode === "stories") {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: "Sukha Trivia" });
        } else {
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "sukha-trivia.png"; a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text: shareText, title: "Sukha Trivia" });
        } else {
          // Fallback: WhatsApp web link
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
        }
      }
      // Analytics: track successful share
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "share" }),
      }).catch(() => {});
    } catch {
      // User cancelled or API not available — silent
    } finally {
      clearTimeout(safetyTimer);
      setSharing(null);
    }
  }

  return (
    <>
      {showUnlockModal && (
        <UnlockModal
          localScore={accumulatedScore}
          onSuccess={handleUnlockSuccess}
          onDismiss={() => setShowUnlockModal(false)}
        />
      )}
      {levelUpData && (
        <LevelUpCelebration
          level={levelUpData.level}
          onClose={() => setLevelUpData(null)}
        />
      )}
      {toastMsg && (
        <ToastMessage
          text={toastMsg.text}
          onClose={() => setToastMsg(null)}
        />
      )}
      {coupon && (
        <CouponModal
          code={coupon.code}
          description={coupon.description}
          expiresAt={coupon.expiresAt}
          hoursValid={coupon.hoursValid}
          onClose={() => setCoupon(null)}
        />
      )}

      <main className="min-h-screen">
        <div className="mx-auto w-full max-w-[512px] px-4 pb-16 pt-12">

          {/* Achievement hero */}
          <div
            className="mb-10 text-center transition-all duration-700"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
          >
            <div className="mb-5 flex justify-center">{achievement.icon}</div>
            <h1 className="font-bree text-4xl text-sukha-dark">{achievement.title}</h1>
            <p className="mt-2 font-rubik text-base font-light text-sukha-dark">
              {achievement.subtitle}
            </p>
            <p className="mt-1 font-rubik text-xs text-sukha-mid">
              {CATEGORY_LABELS[result.category] ?? result.category}
            </p>
          </div>

          {/* Score hero card */}
          <div
            className="mb-4 rounded-3xl bg-white p-8 text-center transition-all duration-700 delay-100"
            style={{
              boxShadow: "0 2px 0 rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.10)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
            }}
          >
            <p className="font-bree text-7xl leading-none text-sukha-dark tabular-nums">
              {result.totalScore}
            </p>
            <p className="mt-4 font-rubik text-sm text-sukha-mid">
              de {MAX_SCORE} puntos posibles
            </p>

            {/* Score bar */}
            <div className="mx-auto mb-6 mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-1000 delay-300"
                style={{
                  width: visible ? `${scorePct}%` : "0%",
                  background: "linear-gradient(90deg, #9993C0, #7b74a8)",
                }}
              />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              <div className="px-3">
                <p className="font-rubik text-2xl font-medium text-sukha-dark">
                  {result.correctCount}
                  <span className="text-sm font-normal text-sukha-mid">/10</span>
                </p>
                <p className="mt-0.5 font-rubik text-xs text-sukha-mid">Correctas</p>
              </div>
              <div className="px-3">
                <p className="font-rubik text-2xl font-medium text-sukha-correct">
                  +{result.totalBonus}
                </p>
                <p className="mt-0.5 font-rubik text-xs text-sukha-mid">Bonus</p>
              </div>
              <div className="px-3">
                <p className="font-rubik text-2xl font-medium text-sukha-dark">
                  {scorePct}<span className="text-sm font-normal text-sukha-mid">%</span>
                </p>
                <p className="mt-0.5 font-rubik text-xs text-sukha-mid">Aciertos</p>
              </div>
            </div>

            {/* Compact ranking snapshot */}
            {top3 && top3.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>
                <p className="mb-2 font-rubik text-xs font-medium uppercase tracking-widest text-sukha-mid/60">
                  Ranking
                </p>
                <div className="flex flex-col gap-1">
                  {top3.map((entry, i) => {
                    const MEDALS = ["🥇", "🥈", "🥉"];
                    return (
                      <div key={entry.rank} className="flex items-center gap-2">
                        <span style={{ fontSize: 14, width: 20, textAlign: "center", flexShrink: 0 }}>
                          {MEDALS[i]}
                        </span>
                        <span className="flex-1 truncate font-rubik text-xs text-sukha-dark">
                          {entry.name}
                        </span>
                        <span className="font-rubik text-xs tabular-nums text-sukha-mid">
                          {entry.totalScore.toLocaleString()}
                          <span className="ml-0.5 text-[10px] text-gray-300">pts</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
                {userRankEntry && !top3.some((e) => e.name === registeredUser?.name) && (
                  <div
                    className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1"
                    style={{ background: "rgba(153,147,192,0.08)" }}
                  >
                    <span className="font-rubik text-xs font-medium" style={{ color: "#9993C0" }}>
                      Vos: #{userRankEntry.rank}
                    </span>
                    <span className="font-rubik text-xs tabular-nums" style={{ color: "#9993C0" }}>
                      · {userRankEntry.totalScore.toLocaleString()} pts
                    </span>
                  </div>
                )}
                {registeredUser && top3.some((e) => e.name === registeredUser.name) && (
                  <div
                    className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1"
                    style={{ background: "rgba(153,147,192,0.08)" }}
                  >
                    <span className="font-rubik text-xs font-medium" style={{ color: "#9993C0" }}>
                      ¡Estás en el top 3! 🎉
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Share buttons */}
          <div
            className="mb-4 flex gap-3 transition-all duration-700"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(12px)",
              transitionDelay: "110ms",
            }}
          >
            <button
              onClick={() => handleShare("stories")}
              disabled={sharing !== null}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 font-rubik font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #9993C0, #7b74a8)" }}
            >
              <Share2 size={18} strokeWidth={2} />
              {sharing === "stories" ? "Generando…" : "Compartir"}
            </button>
            <button
              onClick={() => handleShare("whatsapp")}
              disabled={sharing !== null}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 font-rubik font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: "#25D366" }}
            >
              <MessageCircle size={18} strokeWidth={2} />
              {sharing === "whatsapp" ? "Generando…" : "WhatsApp"}
            </button>
          </div>

          {/* Accumulated progress card */}
          <div
            className="mb-4 rounded-3xl bg-white p-6 transition-all duration-700"
            style={{
              boxShadow: "0 2px 0 rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.10)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(12px)",
              transitionDelay: "120ms",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-rubik text-xs font-medium uppercase tracking-widest text-sukha-mid/60">
                Tu progreso
              </p>
              <span
                className="rounded-full px-2.5 py-0.5 font-rubik text-xs font-medium"
                style={{
                  background: level === "principiante" ? "#F0F0F0" : "#F3F1F9",
                  color: level === "principiante" ? "#606060" : "#6B6494",
                }}
              >
                {levelLabel}
              </span>
            </div>

            <div className="mb-1 flex items-end justify-between">
              <p className="font-bree text-3xl text-sukha-dark tabular-nums">
                {accumulatedScore.toLocaleString()}
              </p>
              <p className="mb-1 font-rubik text-xs text-sukha-mid">
                {level !== "avanzado" ? `/ ${nextThreshold.toLocaleString()} pts` : "Nivel máximo"}
              </p>
            </div>

            {/* Progress bar toward next level */}
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: visible ? `${progressPct}%` : "0%",
                  background: "linear-gradient(90deg, #9993C0, #7b74a8)",
                  transitionDelay: "400ms",
                }}
              />
            </div>

            {level !== "avanzado" && (
              <p className="font-rubik text-xs text-sukha-mid">
                Te faltan <strong>{ptsToNext.toLocaleString()} pts</strong> para el nivel {nextLevelLabel}
              </p>
            )}

            {registeredUser && (
              <p className="mt-2 font-rubik text-xs text-gray-400">
                Guardado como {registeredUser.name} ·{" "}
                <Link href="/leaderboard" className="text-sukha-accent hover:underline">
                  Ver ranking →
                </Link>
              </p>
            )}
          </div>

          {/* Answer review */}
          <div
            className="mb-4 rounded-3xl bg-white p-5 transition-all duration-700"
            style={{
              boxShadow: "0 2px 0 rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.10)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(12px)",
              transitionDelay: "150ms",
            }}
          >
            <p className="mb-3 font-rubik text-xs font-medium uppercase tracking-widest text-sukha-mid/60">
              Repaso
            </p>
            <div className="flex flex-col gap-2">
              {result.answers.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                  style={{
                    backgroundColor: a.isCorrect
                      ? "rgba(107,175,122,0.08)"
                      : "rgba(212,114,106,0.07)",
                  }}
                >
                  <span
                    className="mt-0.5 shrink-0 text-sm font-medium"
                    style={{ color: a.isCorrect ? "#6BAF7A" : "#D4726A" }}
                  >
                    {a.isCorrect ? "✓" : "✕"}
                  </span>
                  <div className="min-w-0">
                    <p className="font-rubik text-xs leading-snug text-sukha-dark">
                      {a.question.question}
                    </p>
                    {!a.isCorrect && (
                      <p className="mt-0.5 font-rubik text-xs text-sukha-mid">
                        {a.question.options[a.question.correct]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div
            className="flex flex-col gap-3 transition-all duration-700"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(12px)",
              transitionDelay: "200ms",
            }}
          >
            <Link
              href={`/play/${result.category}`}
              className="flex w-full items-center justify-center rounded-2xl py-4 font-rubik font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #9993C0, #7b74a8)" }}
            >
              Jugar de nuevo
            </Link>
            <Link
              href="/"
              className="flex w-full items-center justify-center rounded-2xl border-2 border-gray-200 py-4 font-rubik font-medium text-sukha-dark transition-all hover:border-sukha-accent hover:text-sukha-accent active:scale-[0.98]"
            >
              Elegir otra categoría
            </Link>
            {registeredUser && (
              <Link
                href="/leaderboard"
                className="flex w-full items-center justify-center rounded-2xl border-2 border-gray-100 py-3 font-rubik text-sm font-medium text-sukha-mid transition-all hover:border-sukha-accent hover:text-sukha-accent active:scale-[0.98]"
              >
                Ver ranking global →
              </Link>
            )}
          </div>

          <p className="mt-10 text-center font-rubik text-xs text-sukha-mid">
            Una experiencia de <a href="https://www.sukhaonline.com.ar" className="hover:underline">SUKHA</a> · www.sukhaonline.com.ar
          </p>
        </div>
      </main>
    </>
  );
}
