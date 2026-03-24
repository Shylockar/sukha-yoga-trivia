"use client";

interface WelcomeModalProps {
  onClose: () => void;
}

const FEATURES = [
  {
    emoji: "🧘",
    title: "5 categorías de preguntas",
    desc: "Historia, Filosofía, Posturas, Anatomía y Curiosidades",
  },
  {
    emoji: "⭐",
    title: "3 niveles de dificultad",
    desc: "Principiante → Intermedio (5.000 pts) → Avanzado (15.000 pts)",
  },
  {
    emoji: "🎁",
    title: "Premios reales",
    desc: "Envío gratis, 10%, 15%, 20% y 25% de descuento en la tienda de Sukha",
  },
  {
    emoji: "🏆",
    title: "Ranking global",
    desc: "Competí con otros yoguis y trepá al top",
  },
];

export default function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(20,14,36,0.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 440,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.45)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header — fixed, not scrollable */}
        <div style={{
          background: "linear-gradient(135deg, #434344 0%, #5a4a6b 45%, #9993C0 100%)",
          padding: "32px 28px 24px",
          textAlign: "center",
          flexShrink: 0,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/flor-sukha.svg"
            alt=""
            width={52}
            height={52}
            aria-hidden="true"
            style={{ marginBottom: 14, display: "inline-block" }}
          />
          <h2 style={{
            margin: "0 0 8px",
            fontSize: 26,
            fontWeight: 700,
            color: "white",
            fontFamily: "var(--font-bree)",
            lineHeight: 1.15,
          }}>
            Bienvenido a Sukha Trivia
          </h2>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: "rgba(255,255,255,0.82)",
            fontFamily: "var(--font-rubik)",
            lineHeight: 1.5,
          }}>
            Poné a prueba tu conocimiento sobre yoga y ganá premios
          </p>
        </div>

        {/* Scrollable body */}
        <div style={{
          background: "white",
          overflowY: "auto",
          flex: 1,
          padding: "22px 24px 24px",
        }}>
          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 22 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{
                  fontSize: 24,
                  lineHeight: 1,
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  {f.emoji}
                </span>
                <div>
                  <p style={{
                    margin: "0 0 2px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#434344",
                    fontFamily: "var(--font-rubik)",
                  }}>
                    {f.title}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#6b7280",
                    fontFamily: "var(--font-rubik)",
                    lineHeight: 1.45,
                  }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#f3f4f6", marginBottom: 18 }} />

          {/* Prize note */}
          <p style={{
            margin: "0 0 18px",
            fontSize: 12,
            color: "#9993C0",
            fontFamily: "var(--font-rubik)",
            lineHeight: 1.5,
            textAlign: "center",
            fontWeight: 500,
          }}>
            Solo los jugadores registrados pueden acceder a cupones de descuento y premios exclusivos de Sukha.
          </p>

          {/* CTA */}
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #9993C0, #7b74a8)",
              color: "white",
              fontSize: 16,
              fontWeight: 600,
              fontFamily: "var(--font-bree)",
              cursor: "pointer",
              letterSpacing: "0.01em",
            }}
          >
            ¡Empezar a jugar!
          </button>
        </div>
      </div>
    </div>
  );
}
