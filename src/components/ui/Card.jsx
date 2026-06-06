import { BORDER } from "../../lib/constants.js";

export default function Card({ children, style }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "1.25rem 1.5rem",
        border: `1px solid ${BORDER}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
