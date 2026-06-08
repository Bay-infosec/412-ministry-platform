export const C = {
  orange:      "#FF4D00",
  orangeDeep:  "#E64500",
  orangeTint:  "#FFE4D6",
  dark:        "#1B2A4A",   // navy — the platform's "ink": text, featured cards, dark surfaces (replaces black)
  dark2:       "#2A3D63",   // lighter navy — secondary dark surfaces / pills inside dark cards
  white:       "#FFFFFF",
  bg:          "#FAFAFA",
  border:      "#E5E5E5",
  text:        "#1B2A4A",
  muted:       "#6B7280",   // secondary/meta text on light surfaces (was #999999 — failed contrast on white/gray)
  faint:       "#9CA3AF",
  verseBg:     "#FFF5F0",
  verseBorder: "#FFD5C0",
  success:     "#27AE60",
  barBg:       "#F0F0F0",
  // Text-on-navy tokens — use these instead of #555/#999 inside dark cards (those failed contrast badly)
  onDark:          "#FFFFFF",
  onDarkSecondary: "rgba(255,255,255,0.6)",
  onDarkTertiary:  "rgba(255,255,255,0.4)",
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
  board_member: { label: "412 Board", bg: C.dark, color: C.orange },
  pastor:       { label: "Pastor",    bg: "#D1FAE5", color: "#065F46" },
};

// Derived tags from platform_role / event_role — not stored in DB
export const ROLE_TAGS = {
  admin:       { label: "Admin",       bg: C.dark,    color: C.orange },
  moderator:   { label: "Moderator",   bg: "#EEF2FC", color: "#1A4FBF" },
  member:      { label: "Member",      bg: "#F0F0F0", color: C.muted },
  coordinator: { label: "Coordinator", bg: "#F0F0F0", color: C.dark },
  leader:      { label: "Team Leader", bg: "#FFF5EC", color: "#FF4D00" },
  participant: { label: "Participant", bg: "#E0F2FE", color: "#0369A1" },
  volunteer:   { label: "Volunteer",   bg: "#F5F3FF", color: "#6D28D9" },
};
