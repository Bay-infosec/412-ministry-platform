export function fmtPhone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") d = d.slice(1);
  if (d.length === 10) return `(${d.slice(0,3)})${d.slice(3,6)}-${d.slice(6)}`;
  return raw || "";
}

export function formatPhoneInput(raw) {
  let d = raw.replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") d = d.slice(1);
  d = d.slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0,3)})${d.slice(3)}`;
  return `(${d.slice(0,3)})${d.slice(3,6)}-${d.slice(6)}`;
}

export function validatePassword(pw) {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password must include at least one capital letter.";
  if (!/[0-9]/.test(pw)) return "Password must include at least one number.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Password must include at least one special character.";
  return null;
}

export function fmtDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtDateStr(iso) {
  const d = new Date(typeof iso === "string" && iso.length === 10 ? iso + "T12:00:00" : iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr.split("–")[0].trim() + " 2026");
  const diff = Math.ceil((target - new Date()) / 86400000);
  return diff > 0 ? diff : 0;
}

export function matchesAudience(audience, ctx) {
  if (!audience || !Array.isArray(audience) || audience.length === 0) return true;
  return audience.some(rule => {
    switch (rule.type) {
      case "all": return true;
      case "ministry": return ctx.ministry === rule.value;
      case "team": return String(ctx.team_number) === String(rule.value);
      case "role": return ctx.event_role === rule.value || ctx.platform_role === rule.value;
      case "person": return ctx.id === rule.value;
      default: return false;
    }
  });
}

export function generateTempPassword() {
  const words = ["Grace", "Faith", "Hope", "Light", "Peace", "Love", "Truth"];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(100 + Math.random() * 900);
  const symbols = ["!", "@", "#", "$"];
  const sym = symbols[Math.floor(Math.random() * symbols.length)];
  return `${word}${num}${sym}`;
}
