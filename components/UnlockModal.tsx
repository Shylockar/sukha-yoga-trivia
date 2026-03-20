"use client";

import { useState } from "react";
import { saveRegisteredUser } from "@/lib/progress";

interface UnlockModalProps {
  localScore: number;
  onSuccess: (name: string, email: string) => void;
  onDismiss: () => void;
}

export default function UnlockModal({ localScore, onSuccess, onDismiss }: UnlockModalProps) {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Completá nombre y email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), localScore }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al registrar");
      saveRegisteredUser(email.trim().toLowerCase(), name.trim());
      onSuccess(name.trim(), email.trim().toLowerCase());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(30,20,50,0.72)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 420,
          borderRadius: 20, overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #434344 0%, #5a4a6b 50%, #9993C0 100%)",
          padding: "24px 24px 20px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 32, margin: "0 0 6px" }}>🏆</p>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "white", margin: "0 0 6px", fontFamily: "var(--font-bree)" }}>
            ¿Querés guardar tu puntaje?
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0, fontFamily: "var(--font-rubik)", lineHeight: 1.4 }}>
            Registrate en 2 segundos y entrá al ranking global. Los jugadores registrados desbloquean cupones de descuento y premios exclusivos de Sukha.
          </p>
        </div>

        {/* Form */}
        <div style={{ background: "white", padding: "24px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <input
                type="text"
                placeholder="Tu nombre o apodo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "12px 14px", borderRadius: 10,
                  border: "1.5px solid #e5e7eb",
                  fontSize: 15, fontFamily: "var(--font-rubik)",
                  outline: "none", color: "#434344",
                }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "12px 14px", borderRadius: 10,
                  border: "1.5px solid #e5e7eb",
                  fontSize: 15, fontFamily: "var(--font-rubik)",
                  outline: "none", color: "#434344",
                }}
              />
            </div>
            {error && (
              <p style={{ fontSize: 12, color: "#D4726A", marginBottom: 12, fontFamily: "var(--font-rubik)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "14px",
                borderRadius: 12, border: "none",
                background: loading ? "#b0aac8" : "linear-gradient(135deg, #9993C0, #7b74a8)",
                color: "white", fontSize: 15, fontWeight: 500,
                fontFamily: "var(--font-rubik)", cursor: loading ? "not-allowed" : "pointer",
                marginBottom: 10,
              }}
            >
              {loading ? "Guardando…" : "Registrarme"}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              style={{
                width: "100%", padding: "12px",
                borderRadius: 12, border: "none",
                background: "transparent", color: "#9ca3af",
                fontSize: 13, fontFamily: "var(--font-rubik)", cursor: "pointer",
              }}
            >
              Más adelante
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
