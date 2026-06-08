import { BORDER, SANS } from "../../lib/constants.js";

export default function Avatar({ url, name, size = 44 }) {
  const initials = (name || "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: `2px solid ${BORDER}`,
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#FF4D00",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        fontSize: size * 0.36,
        fontFamily: SANS,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
