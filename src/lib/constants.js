export const NAVY = "#162038";
export const ORANGE = "#E8621A";
export const GOLD = "#EFAB25";
export const BORDER = "#E2DDD6";
export const TSEC = "#8A8498";
export const BG = "#F7F4EF";
export const SANS = "'DM Sans', sans-serif";
export const SERIF = "'Cormorant Garamond', serif";

// ── Profile tag definitions ────────────────────────────────────────────────
// Custom tags stored in profiles.tags[] — editable by admin
export const PROFILE_TAGS = {
  board_member: { label: "412 Board",   bg: "#162038", color: "#EFAB25" },
  pastor:       { label: "Pastor",      bg: "#D1FAE5", color: "#065F46" },
};

// Derived tags from platform_role / event_role — not stored in DB
export const ROLE_TAGS = {
  admin:       { label: "Admin",       bg: "#162038", color: "#EFAB25" },
  moderator:   { label: "Moderator",   bg: "#EEF2FC", color: "#1A4FBF" },
  member:      { label: "Member",      bg: "#F0EDE8", color: "#8A8498" },
  // event roles
  coordinator: { label: "Coordinator", bg: "#F3F4F6", color: "#374151" },
  leader:      { label: "Team Leader", bg: "#FFF5EC", color: "#C2410C" },
  participant: { label: "Participant", bg: "#E0F2FE", color: "#0369A1" },
  volunteer:   { label: "Volunteer",   bg: "#F5F3FF", color: "#6D28D9" },
};

export const EMAILJS_SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID;
export const EMAILJS_INVITE_TPL = import.meta.env.VITE_EMAILJS_INVITE_TEMPLATE_ID;
export const EMAILJS_ANN_TPL = import.meta.env.VITE_EMAILJS_ANNOUNCEMENT_TEMPLATE_ID;
export const EMAILJS_PUBLIC = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
