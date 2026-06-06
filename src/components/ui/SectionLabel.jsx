import { ORANGE, SANS } from "../../lib/constants.js";

export default function SectionLabel({ children, color }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.14em",
        color: color || ORANGE,
        textTransform: "uppercase",
        marginBottom: "0.5rem",
        fontFamily: SANS,
      }}
    >
      {children}
    </div>
  );
}
