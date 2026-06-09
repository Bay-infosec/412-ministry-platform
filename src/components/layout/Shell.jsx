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
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          padding: withNav ? "3.5rem 1rem 6rem" : "3.5rem 1rem 3rem",
        }}
      >
        {children}
      </div>
    </div>
  );
}
