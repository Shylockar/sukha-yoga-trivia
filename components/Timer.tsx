"use client";

import { QUESTION_TIMER } from "@/lib/scoring";

interface TimerProps {
  timeLeft: number;    // integer seconds — for display
  progress: number;    // 0–1 float — for smooth SVG arc
}

const SIZE = 64;
const STROKE = 4.5;
const RADIUS = (SIZE - STROKE) / 2;          // 29.75
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;  // ≈186.9
const CENTER = SIZE / 2;                      // 32

function arcColor(timeLeft: number): string {
  if (timeLeft <= 5)  return "#D4726A"; // red
  if (timeLeft <= 10) return "#E8936A"; // orange
  return "#9993C0";                     // accent
}

function textColor(timeLeft: number): string {
  if (timeLeft <= 5)  return "#D4726A";
  if (timeLeft <= 10) return "#E8936A";
  return "#606060";
}

export default function Timer({ timeLeft, progress }: TimerProps) {
  const offset = CIRCUMFERENCE * (1 - progress);
  const color  = arcColor(timeLeft);
  const tColor = textColor(timeLeft);
  const isUrgent  = timeLeft <= 5;
  const isWarning = timeLeft <= 10 && timeLeft > 5;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${
        isUrgent ? "animate-timerPulse" : ""
      }`}
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ transform: "rotate(-90deg)" }}
        aria-label={`${timeLeft} segundos restantes`}
      >
        {/* Track */}
        <circle
          cx={CENTER} cy={CENTER} r={RADIUS}
          fill="none"
          stroke="rgba(67,67,68,0.07)"
          strokeWidth={STROKE}
        />
        {/* Progress arc */}
        <circle
          cx={CENTER} cy={CENTER} r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.12s linear, stroke 0.5s ease" }}
        />
        {/* Warning glow ring */}
        {(isUrgent || isWarning) && (
          <circle
            cx={CENTER} cy={CENTER} r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE + 4}
            strokeOpacity="0.12"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        )}
      </svg>

      {/* Number */}
      <span
        className="absolute font-rubik text-sm font-medium tabular-nums"
        style={{ color: tColor, transition: "color 0.5s ease" }}
      >
        {timeLeft}
      </span>
    </div>
  );
}
