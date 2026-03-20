"use client";

import { Check, X } from "lucide-react";
import { Question } from "@/lib/types";

type OptionState =
  | "idle"
  | "selected-correct"
  | "selected-wrong"
  | "reveal-correct"
  | "dimmed";

interface QuestionCardProps {
  question: Question;
  selectedOption: number | null;
  answered: boolean;
  onSelect: (index: number) => void;
}

function getOptionState(
  index: number,
  selectedOption: number | null,
  correctIndex: number,
  answered: boolean
): OptionState {
  if (!answered) return "idle";
  if (index === correctIndex && index === selectedOption) return "selected-correct";
  if (index === correctIndex) return "reveal-correct";
  if (index === selectedOption) return "selected-wrong";
  return "dimmed";
}

const LETTERS = ["A", "B", "C", "D"];

export default function QuestionCard({
  question,
  selectedOption,
  answered,
  onSelect,
}: QuestionCardProps) {
  return (
    <div className="flex flex-col gap-[10px]">
      {question.options.map((option, index) => {
        const state = getOptionState(index, selectedOption, question.correct, answered);
        const isSelected = selectedOption === index;

        // idle: dark circle (#606060 bg, white text), white card, gray border
        // answered states: green/red override
        let borderColor = "#e5e7eb";
        let bgColor     = "#ffffff";
        let textColor   = "#434344";
        let badgeBg     = "#606060";
        let badgeText   = "#ffffff";
        let opacity     = 1;

        if (state === "selected-correct" || state === "reveal-correct") {
          borderColor = "#6BAF7A";
          bgColor     = "rgba(107,175,122,0.08)";
          badgeBg     = "#6BAF7A";
        } else if (state === "selected-wrong") {
          borderColor = "#D4726A";
          bgColor     = "rgba(212,114,106,0.07)";
          badgeBg     = "#D4726A";
        } else if (state === "dimmed") {
          opacity = 0.4;
        }

        const showCheck = state === "selected-correct" || state === "reveal-correct";
        const showCross = state === "selected-wrong";
        const showLabel = answered && isSelected;

        return (
          <button
            key={`${index}-${answered}`}
            onClick={() => !answered && onSelect(index)}
            disabled={answered}
            className="w-full text-left font-rubik outline-none select-none"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "13px 16px",
              borderRadius: 14,
              border: `1.5px solid ${borderColor}`,
              backgroundColor: bgColor,
              color: textColor,
              opacity,
              cursor: answered ? "default" : "pointer",
              boxShadow: state === "idle" ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              if (answered) return;
              (e.currentTarget as HTMLElement).style.borderColor = "#9993C0";
              (e.currentTarget as HTMLElement).style.backgroundColor = "#F3F1F9";
              // update circle bg too
              const circle = (e.currentTarget as HTMLElement).querySelector(".letter-badge") as HTMLElement;
              if (circle) circle.style.backgroundColor = "#9993C0";
            }}
            onMouseLeave={(e) => {
              if (answered) return;
              (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb";
              (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff";
              const circle = (e.currentTarget as HTMLElement).querySelector(".letter-badge") as HTMLElement;
              if (circle) circle.style.backgroundColor = "#606060";
            }}
          >
            {/* Letter badge — 28px circle */}
            <span
              className="letter-badge"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: badgeBg,
                color: badgeText,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                flexShrink: 0,
                transition: "background-color 200ms ease",
              }}
            >
              {showCheck ? <Check size={13} strokeWidth={2.5} /> : showCross ? <X size={13} strokeWidth={2.5} /> : LETTERS[index]}
            </span>

            {/* Option text */}
            <span style={{ flex: 1, fontSize: 15, lineHeight: 1.4, fontWeight: isSelected && answered ? 500 : 400 }}>
              {option}
            </span>

            {/* CORRECTA / INCORRECTA micro-label */}
            {showLabel && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.5px",
                  color: state === "selected-correct" ? "#5a9a68" : "#c0524a",
                  whiteSpace: "nowrap",
                }}
              >
                {state === "selected-correct" ? "CORRECTA" : "INCORRECTA"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
