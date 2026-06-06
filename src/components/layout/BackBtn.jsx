import { TSEC, SANS } from "../../lib/constants.js";

export default function BackBtn({ onBack, label = "← Back" }) {
  return (
    <button
      onClick={onBack}
      style={{
        background: "none",
        border: "none",
        color: TSEC,
        cursor: "pointer",
        fontFamily: SANS,
        fontSize: "13px",
        fontWeight: 600,
        padding: 0,
        marginBottom: "1.25rem",
        display: "block",
      }}
    >
      {label}
    </button>
  );
}
