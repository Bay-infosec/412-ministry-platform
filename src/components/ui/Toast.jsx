import { useEffect } from "react";
import { SANS, NAVY } from "../../lib/constants.js";

export default function Toast({ message, type = "success", onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;

  const colors = {
    success: { bg: "#E6F4EF", border: "#A7F3D0", color: "#166534" },
    error: { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626" },
    info: { bg: "#EEF2FC", border: "#BFDBFE", color: "#1A4FBF" },
  };

  const c = colors[type] || colors.success;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 90,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: 400,
        width: "90%",
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: "0.875rem 1.25rem",
        zIndex: 600,
        fontFamily: SANS,
        fontSize: "14px",
        fontWeight: 500,
        color: c.color,
        lineHeight: 1.5,
        boxShadow: "0 4px 24px rgba(22,32,56,0.12)",
      }}
    >
      {message}
    </div>
  );
}
