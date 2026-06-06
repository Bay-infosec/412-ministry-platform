import { NAVY, BORDER, TSEC, SANS } from "../../lib/constants.js";

export default function TabBar({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: 4,
        marginBottom: "1.25rem",
        gap: 4,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            flex: 1,
            padding: "9px 6px",
            borderRadius: 9,
            border: "none",
            background: active === t.key ? NAVY : "transparent",
            color: active === t.key ? "#fff" : TSEC,
            fontWeight: 600,
            fontSize: "12px",
            cursor: "pointer",
            fontFamily: SANS,
            transition: "all 0.15s",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
