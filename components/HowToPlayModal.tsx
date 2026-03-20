"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const STEPS = [
  {
    icon: "🎯",
    title: "Elegí una categoría",
    desc: "O jugá en Modo Aleatorio — 10 preguntas mezcladas de todas las categorías.",
  },
  {
    icon: "⚡",
    title: "Respondé rápido",
    desc: "Tenés 15 segundos por pregunta. Cuanto antes respondés, más puntos sumás (hasta 150 pts c/u).",
  },
  {
    icon: "📈",
    title: "Tu puntaje se acumula",
    desc: "Cada partida suma al total. A 3.000 pts desbloqueás preguntas Intermedias; a 10.000 pts, las Avanzadas.",
  },
  {
    icon: "🏅",
    title: "Registrate y competí",
    desc: "Guardá tu progreso con tu email y entrá al ranking global. ¡Los mejores pueden ganar premios exclusivos de Sukha!",
  },
  {
    icon: "🎁",
    title: "Desbloqueá premios",
    desc: "Al alcanzar ciertos puntajes vas a desbloquear cupones exclusivos de descuento en la tienda de Sukha. ¡Cuanto más jugás, más ganás!",
  },
];

function Modal({ onClose }: { onClose: () => void }) {
  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(30,20,50,0.72)",
        overflowY: "auto",
        padding: "24px 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          margin: "0 auto",
          borderRadius: 24, overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #434344 0%, #5a4a6b 50%, #9993C0 100%)",
          padding: "28px 24px 22px",
          textAlign: "center",
          position: "relative",
        }}>
          {/* X button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(255,255,255,0.15)",
              border: "none", borderRadius: "50%",
              width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "white", fontSize: 18, lineHeight: 1,
            }}
            aria-label="Cerrar"
          >
            ×
          </button>
          <p style={{ fontSize: 36, margin: "0 0 10px" }}>🧘</p>
          <h2 style={{
            fontSize: 22, fontWeight: 600, color: "white",
            margin: "0 0 6px", fontFamily: "var(--font-bree)",
          }}>
            ¿Cómo se juega?
          </h2>
          <p style={{
            fontSize: 13, color: "rgba(255,255,255,0.7)",
            margin: 0, fontFamily: "var(--font-rubik)",
          }}>
            Todo lo que necesitás saber en 30 segundos
          </p>
        </div>

        {/* Steps */}
        <div style={{ background: "white", padding: "20px 20px 8px" }}>
          {STEPS.map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "14px 6px",
                borderBottom: i < STEPS.length - 1 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{step.icon}</span>
              <div>
                <p style={{
                  margin: "0 0 3px",
                  fontSize: 14, fontWeight: 600,
                  color: "#434344", fontFamily: "var(--font-rubik)",
                }}>
                  {step.title}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: 13, color: "#9ca3af",
                  fontFamily: "var(--font-rubik)", lineHeight: 1.5,
                }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}

          <button
            onClick={onClose}
            style={{
              width: "100%", marginTop: 16, marginBottom: 8,
              padding: "14px",
              borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #9993C0, #7b74a8)",
              color: "white", fontSize: 15, fontWeight: 500,
              fontFamily: "var(--font-rubik)", cursor: "pointer",
            }}
          >
            ¡Vamos a jugar!
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function HowToPlayModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 py-4 font-rubik font-medium text-sukha-dark transition-all hover:border-sukha-accent hover:text-sukha-accent active:scale-[0.98]"
      >
        <span style={{ fontSize: 18 }}>🤔</span>
        ¿Cómo se juega?
      </button>

      {open && <Modal onClose={() => setOpen(false)} />}
    </>
  );
}
