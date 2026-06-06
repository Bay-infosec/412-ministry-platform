export function fmtPhone(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 11) return `+${d[0]} (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  return raw || "";
}

export function fmtDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtDateStr(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  } catch { return ""; }
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
      case "role": return ctx.event_role === rule.value;
      case "person": return ctx.id === rule.value;
      default: return false;
    }
  });
}

export async function sendInviteEmail({ to_email, to_name, temp_password, platform_url }) {
  const { EMAILJS_SERVICE, EMAILJS_INVITE_TPL, EMAILJS_PUBLIC } = await import("./constants.js");
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE,
        template_id: EMAILJS_INVITE_TPL,
        user_id: EMAILJS_PUBLIC,
        template_params: { to_email, to_name, temp_password, platform_url: window.location.origin }
      })
    });
    return res.ok;
  } catch { return false; }
}

export async function sendAnnouncementEmail({ to_email, to_name, announcement_title, announcement_body, event_name, event_dates, event_location }) {
  const { EMAILJS_SERVICE, EMAILJS_ANN_TPL, EMAILJS_PUBLIC } = await import("./constants.js");
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE,
        template_id: EMAILJS_ANN_TPL,
        user_id: EMAILJS_PUBLIC,
        template_params: { to_email, to_name, announcement_title, announcement_body, event_name: event_name || "412 Ministry", event_dates: event_dates || "", event_location: event_location || "" }
      })
    });
    return res.ok;
  } catch { return false; }
}

export function generateTempPassword() {
  const words = ["Grace", "Faith", "Hope", "Light", "Peace", "Joy", "Love", "Truth"];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(100 + Math.random() * 900);
  const symbols = ["!", "@", "#", "$"];
  const sym = symbols[Math.floor(Math.random() * symbols.length)];
  return `${word}${num}${sym}`;
}
