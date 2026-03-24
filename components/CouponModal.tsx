"use client";

import { useState } from "react";
import { Copy, Check, Gift } from "lucide-react";

interface CouponModalProps {
  code: string;
  description: string;
  expiresAt: string; // ISO string
  hoursValid: number;
  onClose: () => void;
}

function formatExpiryDate(isoString: string): string {
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month} a las ${hours}:${mins}`;
}

export default function CouponModal({ code, description, expiresAt, hoursValid, onClose }: CouponModalProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(20,14,36,0.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.45)",
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #434344 0%, #5a4a6b 45%, #9993C0 100%)",
          padding: "32px 28px 24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 14 }}>
            <Gift size={52} strokeWidth={1.5} color="white" style={{ display: "inline-block" }} />
          </div>
          <h2 style={{
            margin: "0 0 8px",
            fontSize: 24,
            fontWeight: 700,
            color: "white",
            fontFamily: "var(--font-bree)",
            lineHeight: 1.15,
          }}>
            ¡Ganaste un premio!
          </h2>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: "rgba(255,255,255,0.82)",
            fontFamily: "var(--font-rubik)",
            lineHeight: 1.5,
          }}>
            {description}
          </p>
        </div>

        {/* Code section */}
        <div style={{ background: "white", padding: "22px 24px 24px" }}>
          <p style={{
            margin: "0 0 10px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "#9ca3af",
            fontFamily: "var(--font-rubik)",
            textTransform: "uppercase",
          }}>
            Tu código
          </p>

          {/* Code display */}
          <button
            onClick={handleCopy}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 14,
              border: "2px dashed #9993C0",
              background: "rgba(153,147,192,0.05)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
              transition: "background 200ms ease",
            }}
          >
            <span style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#434344",
              fontFamily: "var(--font-rubik)",
              letterSpacing: "0.04em",
            }}>
              {code}
            </span>
            <span style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              fontWeight: 500,
              color: copied ? "#6BAF7A" : "#9993C0",
              fontFamily: "var(--font-rubik)",
              flexShrink: 0,
              transition: "color 200ms ease",
            }}>
              {copied
                ? <><Check size={15} strokeWidth={2.5} /> Copiado</>
                : <><Copy size={15} strokeWidth={2} /> Copiar</>
              }
            </span>
          </button>

          {/* Validity period — prominent */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}>
            <span style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#9993C0",
              fontFamily: "var(--font-rubik)",
            }}>
              Válido por {hoursValid} horas
            </span>
          </div>

          {/* Exact expiry — small, gray */}
          <p style={{
            margin: "0 0 18px",
            fontSize: 12,
            color: "#9ca3af",
            fontFamily: "var(--font-rubik)",
            lineHeight: 1.5,
          }}>
            Vence el {formatExpiryDate(expiresAt)} · Usalo en{" "}
            <a
              href="https://www.sukhaonline.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#9993C0", textDecoration: "underline" }}
            >
              sukhaonline.com.ar
            </a>
          </p>

          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #9993C0, #7b74a8)",
              color: "white",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "var(--font-rubik)",
              cursor: "pointer",
              letterSpacing: "0.01em",
            }}
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
}
