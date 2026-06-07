import { PROFILE_TAGS, ROLE_TAGS, SANS } from "../../lib/constants.js";

function TagChip({ label, bg, color }) {
  return (
    <span style={{
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
      padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap",
      background: bg, color, fontFamily: SANS,
    }}>
      {label}
    </span>
  );
}

/**
 * Renders all applicable tag chips for a profile.
 * @param {object} profile   — profiles row (needs: platform_role, tags[])
 * @param {object} [eventMember] — event_members row (needs: event_role); optional
 * @param {boolean} [showRole] — include platform role chip (default true)
 */
export default function ProfileTags({ profile, eventMember, showRole = true }) {
  if (!profile) return null;

  const chips = [];

  // 1. Custom tags stored in DB
  for (const key of (profile.tags || [])) {
    if (PROFILE_TAGS[key]) chips.push({ key, ...PROFILE_TAGS[key] });
  }

  // 2. Platform role (admin / moderator / member)
  if (showRole && profile.platform_role && ROLE_TAGS[profile.platform_role]) {
    chips.push({ key: `role_${profile.platform_role}`, ...ROLE_TAGS[profile.platform_role] });
  }

  // 3. Event role if provided
  if (eventMember?.event_role && ROLE_TAGS[eventMember.event_role]) {
    chips.push({ key: `event_${eventMember.event_role}`, ...ROLE_TAGS[eventMember.event_role] });
  }

  if (chips.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
      {chips.map((c) => <TagChip key={c.key} label={c.label} bg={c.bg} color={c.color} />)}
    </div>
  );
}
