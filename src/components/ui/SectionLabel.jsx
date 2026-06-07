import { SANS } from "../../lib/constants.js";

export default function SectionLabel({ children, color }) {
  return (
    <div
      style={{
        fontSize: "10px",
        fontWeight: 800,
        letterSpacing: "0.14em",
        color: color || "#999999",
        textTransform: "uppercase",
        marginBottom: "0.5rem",
        fontFamily: SANS,
      }}
    >
      {children}
    </div>
  );
}
