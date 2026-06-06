import { BG, SANS } from "../../lib/constants.js";

export default function Shell({ children, withNav }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        fontFamily: SANS,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          padding: withNav
            ? "2rem 1.5rem 6rem"
            : "2rem 1.5rem 3rem",
        }}
      >
        {children}
      </div>
    </div>
  );
}
