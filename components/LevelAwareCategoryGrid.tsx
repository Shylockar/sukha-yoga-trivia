"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Flame, Dumbbell, Heart, Lightbulb, Shuffle, Lock } from "lucide-react";
import { getLocalScore, getLevel, INTERMEDIATE_THRESHOLD, ADVANCED_THRESHOLD } from "@/lib/progress";

const CATEGORIES = [
  { category: "historia",     label: "Historia",      description: "Orígenes, textos sagrados y figuras históricas", icon: <BookOpen size={20} strokeWidth={1.6} /> },
  { category: "filosofia",    label: "Filosofía",     description: "Los 8 limbos, yamas, niyamas y conceptos",      icon: <Flame size={20} strokeWidth={1.6} /> },
  { category: "posturas",     label: "Posturas",      description: "Sánscrito, alineación y secuencias clásicas",   icon: <Dumbbell size={20} strokeWidth={1.6} /> },
  { category: "anatomia",     label: "Anatomía",      description: "Músculos, beneficios y sistema nervioso",       icon: <Heart size={20} strokeWidth={1.6} /> },
  { category: "curiosidades", label: "Curiosidades",  description: "Datos curiosos, récords y yoga en el mundo",    icon: <Lightbulb size={20} strokeWidth={1.6} /> },
];

const LEVEL_META: Record<1 | 2 | 3, { label: string; color: string; bg: string }> = {
  1: { label: "Principiante", color: "#606060", bg: "#F0F0F0" },
  2: { label: "Intermedio",   color: "#6B6494", bg: "#F3F1F9" },
  3: { label: "Avanzado",     color: "#6B6494", bg: "#F3F1F9" },
};

function LevelPill({ level }: { level: 1 | 2 | 3 }) {
  const m = LEVEL_META[level];
  return (
    <span style={{
      display: "inline-block",
      fontSize: 10, fontFamily: "var(--font-rubik)", fontWeight: 500,
      letterSpacing: "0.03em",
      background: m.bg, color: m.color,
      borderRadius: 6, padding: "2px 7px",
    }}>
      {m.label}
    </span>
  );
}

export default function LevelAwareCategoryGrid() {
  const [maxLevel, setMaxLevel] = useState<1 | 2 | 3>(1);
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const score = getLocalScore();
    const lv = getLevel(score) === "avanzado" ? 3 : getLevel(score) === "intermedio" ? 2 : 1;
    setMaxLevel(lv as 1 | 2 | 3);
    setActiveLevel(lv as 1 | 2 | 3);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const ALL_LEVELS: (1 | 2 | 3)[] = [1, 2, 3];

  return (
    <>
      {/* Level selector — always visible; locked levels are non-clickable */}
      <div className="mb-4 flex items-center gap-2">
        <span className="font-rubik text-xs text-sukha-dark">Nivel:</span>
        {ALL_LEVELS.map((lv) => {
          const m = LEVEL_META[lv];
          const active = lv === activeLevel;
          const locked = lv > maxLevel;
          return (
            <button
              key={lv}
              onClick={() => !locked && setActiveLevel(lv)}
              disabled={locked}
              style={{
                padding: "5px 12px", borderRadius: 8, fontSize: 12,
                fontFamily: "var(--font-rubik)", fontWeight: active ? 600 : 400,
                border: active ? `1.5px solid ${m.color}` : locked ? "1.5px solid #CCCCCC" : "1.5px solid #e5e7eb",
                background: active ? m.bg : locked ? "#FFFFFF" : "transparent",
                color: active ? m.color : locked ? "#888888" : "#606060",
                cursor: locked ? "not-allowed" : "pointer",
                transition: "all 150ms",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              {locked && <Lock size={10} strokeWidth={2} style={{ flexShrink: 0 }} />}
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Aleatorio */}
      <div className="animate-fadeInUp mb-3" style={{ animationDelay: "80ms" }}>
        <Link
          href={`/play/aleatorio?level=${activeLevel}`}
          className="group relative flex w-full items-center gap-4 overflow-hidden rounded-3xl px-7 py-5 text-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #9993C0 0%, #7b74a8 100%)" }}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Shuffle size={22} strokeWidth={1.8} className="animate-slowSpin text-white" />
          </div>
          <div className="flex-1">
            <p className="font-rubik text-base font-medium">Modo Aleatorio</p>
            <p className="font-rubik text-sm opacity-75">Todas las categorías · 10 preguntas</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <LevelPill level={activeLevel} />
            <svg className="opacity-60 transition-transform duration-300 group-hover:translate-x-1" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15l5-5-5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((cat, index) => {
          const isLastOdd = index === CATEGORIES.length - 1 && CATEGORIES.length % 2 !== 0;
          return (
          <Link
            key={cat.category}
            href={`/play/${cat.category}?level=${activeLevel}`}
            className={`group relative flex flex-col gap-4 overflow-hidden rounded-3xl border-l-4 border-l-sukha-accent bg-white p-5 transition-all duration-250 hover:scale-[1.02] active:scale-[0.98] animate-fadeInUp${isLastOdd ? " col-span-2 max-w-[calc(50%-6px)] mx-auto w-full" : ""}`}
            style={{
              boxShadow: "0 2px 0 rgba(0,0,0,0.06), 0 8px 20px rgba(0,0,0,0.09)",
              background: "linear-gradient(145deg, #ffffff 0%, rgba(153,147,192,0.04) 100%)",
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sukha-accent/10 text-sukha-accent transition-transform duration-250 group-hover:scale-110">
                {cat.icon}
              </div>
              <LevelPill level={activeLevel} />
            </div>
            <div className="flex-1">
              <h3 className="font-rubik text-sm font-medium text-sukha-dark transition-colors duration-200 group-hover:text-sukha-accent">
                {cat.label}
              </h3>
              <p className="mt-1 font-rubik text-xs leading-relaxed text-sukha-mid/80">
                {cat.description}
              </p>
            </div>
          </Link>
          );
        })}
      </div>
    </>
  );
}
