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
  board_member: { label: "412 Board", bg: C.orange, color: "#fff" },
  pastor:       { label: "Pastor",    bg: C.orange, color: "#fff" },
};

// Derived tags from platform_role / event_role — not stored in DB
export const ROLE_TAGS = {
  admin:       { label: "Admin",       bg: C.orange, color: "#fff" },
  moderator:   { label: "Moderator",   bg: C.orange, color: "#fff" },
  member:      { label: "Member",      bg: C.orange, color: "#fff" },
  coordinator: { label: "Coordinator", bg: C.orange, color: "#fff" },
  leader:      { label: "Team Leader", bg: C.orange, color: "#fff" },
  participant: { label: "Participant", bg: C.orange, color: "#fff" },
  volunteer:   { label: "Volunteer",   bg: C.orange, color: "#fff" },
};
