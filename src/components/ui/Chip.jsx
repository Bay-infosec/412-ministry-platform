import { ORANGE, NAVY, BORDER, SANS } from "../../lib/constants.js";

export default function Chip({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 99,
        border: `1px solid ${active ? ORANGE : BORDER}`,
        background: active ? ORANGE : "#fff",
        color: active ? "#fff" : NAVY,
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: SANS,
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}
