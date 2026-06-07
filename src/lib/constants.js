export const C = {
  orange:      "#FF4D00",
  dark:        "#111111",
  dark2:       "#222222",
  white:       "#FFFFFF",
  bg:          "#FAFAFA",
  border:      "#E5E5E5",
  text:        "#111111",
  muted:       "#999999",
  faint:       "#CCCCCC",
  verseBg:     "#FFF5F0",
  verseBorder: "#FFD5C0",
  success:     "#27AE60",
  barBg:       "#F0F0F0",
};

// Legacy aliases — all files using these get new colors automatically
export const NAVY   = C.dark;
export const ORANGE = C.orange;
export const GOLD   = C.orange;
export const TSEC   = C.muted;
export const BORDER = C.border;
export const BG     = C.bg;
export const SANS   = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif";
export const SERIF  = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif";

// ── Profile tag definitions ────────────────────────────────────────────────
export const PROFILE_TAGS = {
  board_member: { label: "412 Board", bg: "#111111", color: "#FF4D00" },
  pastor:       { label: "Pastor",    bg: "#D1FAE5", color: "#065F46" },
};

// Derived tags from platform_role / event_role — not stored in DB
export const ROLE_TAGS = {
  admin:       { label: "Admin",       bg: "#111111", color: "#FF4D00" },
  moderator:   { label: "Moderator",   bg: "#EEF2FC", color: "#1A4FBF" },
  member:      { label: "Member",      bg: "#F0F0F0", color: "#999999" },
  coordinator: { label: "Coordinator", bg: "#F0F0F0", color: "#111111" },
  leader:      { label: "Team Leader", bg: "#FFF5EC", color: "#FF4D00" },
  participant: { label: "Participant", bg: "#E0F2FE", color: "#0369A1" },
  volunteer:   { label: "Volunteer",   bg: "#F5F3FF", color: "#6D28D9" },
};
