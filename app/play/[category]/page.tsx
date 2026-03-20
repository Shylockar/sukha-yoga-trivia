"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Star, Sparkles, ChevronRight } from "lucide-react";
import QuestionCard from "@/components/QuestionCard";
import Timer from "@/components/Timer";
import { getQuestionsByCategory } from "@/lib/questions";
import { calculateScore, QUESTION_TIMER } from "@/lib/scoring";
import { AnswerRecord, Category, GameResult, Question } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  historia: "Historia",
  filosofia: "Filosofía",
  posturas: "Posturas",
  anatomia: "Anatomía",
  curiosidades: "Curiosidades",
  aleatorio: "Modo Aleatorio",
};

const TOTAL_QUESTIONS = 10;

function useAnimatedScore(target: number): number {
  const [displayed, setDisplayed] = useState(target);
  const prevRef = useRef(target);
  const rafRef  = useRef<number | null>(null);

  useEffect(() => {
    if (prevRef.current === target) return;
    const start = prevRef.current;
    const startTime = Date.now();
    const duration = 450;
    const tick = () => {
      const p = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 2);
      setDisplayed(Math.round(start + (target - start) * eased));
      if (p < 1) { rafRef.current = requestAnimationFrame(tick); }
    };
    rafRef.current = requestAnimationFrame(tick);
    prevRef.current = target;
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  return displayed;
}

interface GamePageProps {
  params: Promise<{ category: string }>;
}

const LEVEL_LABELS: Record<number, string> = { 1: "Principiante", 2: "Intermedio", 3: "Avanzado" };
const LEVEL_COLORS: Record<number, string> = { 1: "#606060", 2: "#6B6494", 3: "#6B6494" };
const LEVEL_BG: Record<number, string> = {
  1: "#F0F0F0",
  2: "#F3F1F9",
  3: "#F3F1F9",
};

export default function GamePage({ params }: GamePageProps) {
  const { category } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const level = (Number(searchParams.get("level") ?? "1") as 1 | 2 | 3);

  const [questions] = useState<Question[]>(() =>
    getQuestionsByCategory(category, TOTAL_QUESTIONS, level)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft]         = useState(QUESTION_TIMER);
  const [timerProgress, setTimerProgress] = useState(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered]         = useState(false);
  const [score, setScore]               = useState(0);
  const [lastPoints, setLastPoints]     = useState<{ base: number; bonus: number } | null>(null);
  const [answers, setAnswers]           = useState<AnswerRecord[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [scoreKey, setScoreKey]         = useState(0);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading]         = useState(false);
  const [isLastQuestion, setIsLastQuestion] = useState(false);

  const displayedScore = useAnimatedScore(score);

  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafTimerRef   = useRef<number | null>(null);
  const answeredRef   = useRef(false);
  const answersRef    = useRef<AnswerRecord[]>([]);
  const timerStartRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timerRef.current)    { clearInterval(timerRef.current); timerRef.current = null; }
    if (rafTimerRef.current) { cancelAnimationFrame(rafTimerRef.current); rafTimerRef.current = null; }
  }, []);

  const handleAdvance = useCallback(() => {
    if (isLastQuestion) {
      router.push("/results");
    } else {
      setShowFeedback(false);
      answeredRef.current = false;
      setCurrentIndex((i) => i + 1);
      setTimeLeft(QUESTION_TIMER);
      setTimerProgress(1);
      setSelectedOption(null);
      setAnswered(false);
      setLastPoints(null);
      setAiExplanation(null);
      setAiLoading(false);
      setIsLastQuestion(false);
    }
  }, [isLastQuestion, router]);

  const handleAnswer = useCallback(
    (optionIndex: number | null, currentTimeLeft: number) => {
      if (answeredRef.current) return;
      answeredRef.current = true;

      clearTimers();
      setAnswered(true);
      setSelectedOption(optionIndex);
      setTimeout(() => setShowFeedback(true), 200);

      const question = questions[currentIndex];
      const isCorrect = optionIndex !== null && optionIndex === question.correct;

      setAiLoading(true);
      fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          question: question.question,
          correctAnswer: question.options[question.correct],
          userAnswer: optionIndex !== null ? question.options[optionIndex] : null,
          isCorrect,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.error) console.error("[explain] error:", data.error);
          setAiExplanation(data.explanation ?? null);
        })
        .catch((err) => console.error("[explain fetch]", err))
        .finally(() => setAiLoading(false));

      let base = 0, bonus = 0;
      if (isCorrect) {
        const scored = calculateScore(currentTimeLeft);
        base = scored.base; bonus = scored.bonus;
      }

      setScore((prev) => prev + base + bonus);
      setLastPoints({ base, bonus });
      if (base > 0) setScoreKey((k) => k + 1);

      const record: AnswerRecord = {
        question, selectedOption: optionIndex, isCorrect,
        timeLeft: currentTimeLeft, pointsEarned: base, bonusEarned: bonus,
      };
      const updatedAnswers = [...answersRef.current, record];
      answersRef.current = updatedAnswers;
      setAnswers(updatedAnswers);

      if (currentIndex === TOTAL_QUESTIONS - 1) {
        const result: GameResult = {
          category: category as Category,
          level,
          totalScore: updatedAnswers.reduce((s, a) => s + a.pointsEarned + a.bonusEarned, 0),
          totalBonus: updatedAnswers.reduce((s, a) => s + a.bonusEarned, 0),
          correctCount: updatedAnswers.filter((a) => a.isCorrect).length,
          answers: updatedAnswers,
        };
        sessionStorage.setItem("gameResult", JSON.stringify(result));
        setIsLastQuestion(true);
      }
    },
    [clearTimers, currentIndex, questions, category]
  );

  useEffect(() => {
    if (answered) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [answered, currentIndex]);

  useEffect(() => {
    if (answered) return;
    timerStartRef.current = Date.now();
    setTimerProgress(1);
    const tick = () => {
      const elapsed = (Date.now() - timerStartRef.current) / 1000;
      const progress = Math.max(0, 1 - elapsed / QUESTION_TIMER);
      setTimerProgress(progress);
      if (progress > 0) { rafTimerRef.current = requestAnimationFrame(tick); }
    };
    rafTimerRef.current = requestAnimationFrame(tick);
    return () => { if (rafTimerRef.current) { cancelAnimationFrame(rafTimerRef.current); rafTimerRef.current = null; } };
  }, [answered, currentIndex]);

  useEffect(() => {
    if (timeLeft === 0 && !answered) handleAnswer(null, 0);
  }, [timeLeft, answered, handleAnswer]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Analytics: track game started once on mount
  useEffect(() => {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "game_started" }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (questions.length === 0) return null;
  const question = questions[currentIndex];
  if (!question) return null;

  const currentAnswer = answers[currentIndex];
  const isCorrect  = currentAnswer?.isCorrect ?? false;
  const isTimeout  = answered && selectedOption === null;
  const levelColor = LEVEL_COLORS[level];

  return (
    <main style={{ minHeight: "100vh" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{ maxWidth: 512, margin: "0 auto", padding: "20px 16px 14px" }}>

        {/* Top row: ← category (left) | level badge + score (right) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", color: "#606060" }}>
              <ChevronLeft size={20} strokeWidth={2} />
            </Link>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#434344", fontFamily: "var(--font-rubik)" }}>
              {CATEGORY_LABELS[category] ?? category}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 10, fontFamily: "var(--font-rubik)", fontWeight: 600,
              letterSpacing: "0.03em",
              background: LEVEL_BG[level], color: levelColor,
              borderRadius: 6, padding: "3px 8px",
            }}>
              {LEVEL_LABELS[level]}
            </span>
            <div
              key={scoreKey}
              className={scoreKey > 0 ? "animate-scorePop" : ""}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <Star size={12} fill={levelColor} color={levelColor} />
              <span style={{
                fontSize: 16, fontWeight: 600, color: "#434344",
                fontFamily: "var(--font-rubik)", fontVariantNumeric: "tabular-nums",
              }}>
                {displayedScore}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar: 10 equal segments */}
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => {
            const isCurrent = i === currentIndex;
            const rec = answers[i];
            let bg = "#D1D5DB";
            if (isCurrent) bg = "#9993C0";
            else if (rec?.isCorrect) bg = "#6BAF7A";
            else if (rec && !rec.isCorrect) bg = "#D4726A";
            return (
              <div
                key={i}
                style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: bg, transition: "background-color 300ms ease" }}
              />
            );
          })}
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────── */}
      <div
        className="animate-fadeIn"
        style={{ maxWidth: 512, margin: "0 auto", padding: "8px 16px 40px" }}
      >

        {/* White floating question card */}
        <div style={{
          background: "white",
          borderRadius: 20,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 2px 0 rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.10)",
          padding: "20px 22px 24px",
          marginBottom: 14,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.8px", color: "#9ca3af", fontFamily: "var(--font-rubik)", fontWeight: 500 }}>
              PREGUNTA {currentIndex + 1} DE {TOTAL_QUESTIONS}
            </span>
            <Timer timeLeft={timeLeft} progress={timerProgress} />
          </div>

          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500, lineHeight: 1.5, color: "#434344", fontFamily: "var(--font-rubik)" }}>
            {question.question}
          </h2>
        </div>

        {/* Options (outside card) */}
        <QuestionCard
          question={question}
          selectedOption={selectedOption}
          answered={answered}
          onSelect={(index) => handleAnswer(index, timeLeft)}
        />

        {/* ── Feedback + AI explanation ─────────────────────────── */}
        <div
          style={{
            marginTop: 14,
            transition: "all 350ms cubic-bezier(0.16, 1, 0.3, 1)",
            maxHeight: showFeedback ? 400 : 0,
            opacity: showFeedback ? 1 : 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              background: isTimeout
                ? "rgba(156,163,175,0.08)"
                : isCorrect
                ? "rgba(107,175,122,0.09)"
                : "rgba(212,114,106,0.08)",
              border: `1px solid ${
                isTimeout ? "rgba(156,163,175,0.18)" : isCorrect ? "rgba(107,175,122,0.25)" : "rgba(212,114,106,0.22)"
              }`,
              borderRadius: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {isTimeout ? (
                <span style={{ fontSize: 13, color: "#9ca3af", fontFamily: "var(--font-rubik)" }}>
                  ⏱ Tiempo agotado
                </span>
              ) : isCorrect ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6BAF7A" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#5a9a68", fontFamily: "var(--font-rubik)" }}>
                    +{(lastPoints?.base ?? 0) + (lastPoints?.bonus ?? 0)} pts
                  </span>
                  {lastPoints && lastPoints.bonus > 0 && (
                    <span style={{ fontSize: 11, color: "#5a9a68", opacity: 0.75, fontFamily: "var(--font-rubik)" }}>
                      bonus velocidad +{lastPoints.bonus}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4726A" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#c0524a", fontFamily: "var(--font-rubik)" }}>
                    Respuesta correcta: {question.options[question.correct]}
                  </span>
                </>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <Sparkles size={13} color="#9993C0" strokeWidth={1.8} style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "#606060", margin: 0, fontFamily: "var(--font-rubik)" }}>
                {aiLoading
                  ? <span style={{ fontStyle: "italic", color: "#b0aac8" }}>Generando explicación…</span>
                  : aiExplanation ?? null
                }
              </p>
            </div>
          </div>
        </div>

        {/* ── Next / Results button ──────────────────────────────── */}
        <div
          style={{
            marginTop: 12,
            transition: "all 350ms cubic-bezier(0.16, 1, 0.3, 1)",
            maxHeight: showFeedback ? 60 : 0,
            opacity: showFeedback ? 1 : 0,
            overflow: "hidden",
          }}
        >
          <button
            onClick={handleAdvance}
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #9993C0, #7b74a8)",
              color: "white",
              fontSize: 15,
              fontWeight: 500,
              fontFamily: "var(--font-rubik)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          >
            {isLastQuestion ? "Ver resultados" : "Siguiente pregunta"}
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 11, color: "#606060", marginTop: 32, letterSpacing: "0.5px", fontFamily: "var(--font-rubik)" }}>
          SUKHA · sukhaonline.com.ar
        </p>
      </div>
    </main>
  );
}
