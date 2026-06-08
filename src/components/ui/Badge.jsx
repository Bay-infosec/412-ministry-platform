import { NAVY, ORANGE, SANS } from "../../lib/constants.js";

const VARIANTS = {
  active: { bg: "#E6F4EF", color: "#0A7C42", label: "ACTIVE" },
  upcoming: { bg: "#EEF2FC", color: "#1A4FBF", label: "UPCOMING" },
  archived: { bg: "#F3F4F6", color: "#6B7280", label: "ARCHIVED" },
  pending: { bg: "#FFF7ED", color: "#C2410C", label: "PENDING" },
  accepted: { bg: "#E6F4EF", color: "#0A7C42", label: "ACCEPTED" },
  declined: { bg: "#FEF2F2", color: "#DC2626", label: "DECLINED" },
  admin: { bg: NAVY, color: ORANGE, label: "ADMIN" },
  moderator: { bg: "#EEF2FC", color: "#1A4FBF", label: "MODERATOR" },
  member: { bg: "#F3F4F6", color: "#6B7280", label: "MEMBER" },
};

export default function Badge({ variant, custom }) {
  const v = VARIANTS[variant] || { bg: "#F3F4F6", color: "#6B7280", label: variant?.toUpperCase() || "" };
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 99,
        background: v.bg,
        color: v.color,
        fontFamily: SANS,
        letterSpacing: "0.06em",
        whiteSpace: "nowrap",
      }}
    >
      {custom || v.label}
    </span>
  );
}
