"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ToastMessageProps {
  text: string;
  onClose: () => void;
  duration?: number; // ms, default 5000
}

export default function ToastMessage({ text, onClose, duration = 5000 }: ToastMessageProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    const showTimer = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // wait for slide-out animation
    }, duration);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: visible
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(120%)",
        transition: "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: 9000,
        width: "calc(100% - 32px)",
        maxWidth: 480,
      }}
    >
      <div
        style={{
          background: "#2e2840",
          borderRadius: 16,
          padding: "14px 44px 14px 18px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
          position: "relative",
          border: "1px solid rgba(153,147,192,0.25)",
        }}
      >
        <p style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.92)",
          fontFamily: "var(--font-rubik)",
        }}>
          {text}
        </p>
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: "50%",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(255,255,255,0.7)",
            flexShrink: 0,
          }}
          aria-label="Cerrar"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
