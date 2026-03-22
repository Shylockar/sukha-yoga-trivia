"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

interface LevelUpCelebrationProps {
  level: "intermedio" | "avanzado";
  onClose: () => void;
}

const CONFETTI_COLORS = ["#9993C0", "#7b74a8", "#6BAF7A", "#f59e0b", "#ec4899", "#60a5fa"];

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    id: i,
    x: 5 + (i * 4.3) % 90,
    delay: (i * 0.11) % 1.2,
    duration: 1.4 + (i * 0.07) % 1.0,
    size: 7 + (i * 3) % 8,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    shape: i % 3 === 0 ? "2px" : "50%", // mix of squares and circles
  })), []);

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(520px) rotate(540deg); opacity: 0; }
        }
      `}</style>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", borderRadius: "inherit" }}>
        {pieces.map(p => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: 0,
              width: p.size,
              height: p.size,
              borderRadius: p.shape,
              background: p.color,
              animation: `confettiFall ${p.duration}s ${p.delay}s ease-in both`,
            }}
          />
        ))}
      </div>
    </>
  );
}

export default function LevelUpCelebration({ level, onClose }: LevelUpCelebrationProps) {
  const router = useRouter();
  const levelNum = level === "intermedio" ? 2 : 3;
  const levelLabel = level === "intermedio" ? "Intermedio" : "Avanzado";
  const icon = level === "intermedio" ? "🌟" : "✨";
  const subtitle = level === "intermedio"
    ? "Nuevas preguntas más desafiantes te esperan. ¡Seguí acumulando puntos para ganar premios exclusivos de Sukha!"
    : "¡Llegaste al nivel máximo! Sos un maestro del yoga. ¡Seguí acumulando puntos para ganar premios exclusivos!";

  function handlePlay() {
    onClose();
    router.push(`/?level=${levelNum}`);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(20,14,36,0.80)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%", maxWidth: 420,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.45)",
        }}
      >
        {/* Confetti layer */}
        <Confetti />

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #434344 0%, #5a4a6b 45%, #9993C0 100%)",
          padding: "36px 28px 28px",
          textAlign: "center",
          position: "relative",
        }}>
          <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 14 }}>{icon}</div>
          <h2 style={{
            margin: "0 0 10px",
            fontSize: 28,
            fontWeight: 700,
            color: "white",
            fontFamily: "var(--font-bree)",
            lineHeight: 1.1,
          }}>
            ¡Subiste a {levelLabel}!
          </h2>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: "rgba(255,255,255,0.82)",
            fontFamily: "var(--font-rubik)",
            lineHeight: 1.5,
          }}>
            {subtitle}
          </p>
        </div>

        {/* Actions */}
        <div style={{ background: "white", padding: "22px 24px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={handlePlay}
            style={{
              width: "100%", padding: "15px",
              borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #9993C0, #7b74a8)",
              color: "white", fontSize: 15, fontWeight: 600,
              fontFamily: "var(--font-rubik)", cursor: "pointer",
              letterSpacing: "0.01em",
            }}
          >
            Jugar {levelLabel}
          </button>
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "12px",
              borderRadius: 14, border: "none",
              background: "transparent",
              color: "#9ca3af", fontSize: 13,
              fontFamily: "var(--font-rubik)", cursor: "pointer",
            }}
          >
            Ver mis resultados
          </button>
        </div>
      </div>
    </div>
  );
}
