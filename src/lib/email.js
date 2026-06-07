import { supabase } from "./supabase.js";

// Sends one email via the `send-email` Supabase Edge Function, which calls
// Resend server-side (the Resend API key never reaches the browser).
export async function sendEmail(to, subject, html) {
  try {
    const { error } = await supabase.functions.invoke("send-email", {
      body: { to, subject, html },
    });
    return !error;
  } catch {
    return false;
  }
}

function announcementHtml(toName, title, body) {
  return `<p>Hi ${toName || "there"},</p><p><strong>${title}</strong></p><p>${body}</p>`;
}

// Sends announcement email to all event members matching the audience rule.
export async function sendAnnouncementEmails(audience, announcement, eventId) {
  if (!audience?.length || !eventId) return;
  const rule = audience[0];

  let query = supabase
    .from("event_members")
    .select("profile_id, ministry, team_number, event_role, profiles(full_name, email)")
    .eq("event_id", eventId);

  if (rule.type === "ministry" && rule.value) {
    query = query.eq("ministry", rule.value);
  } else if (rule.type === "team" && rule.value) {
    query = query.eq("team_number", parseInt(rule.value, 10));
  } else if (rule.type === "role" && rule.value) {
    query = query.eq("event_role", rule.value);
  } else if (rule.type === "person" && rule.value) {
    query = query.eq("profile_id", rule.value);
  }

  const { data: members } = await query;
  if (!members?.length) return;

  for (const m of members) {
    const p = m.profiles;
    if (p?.email) {
      await sendEmail(p.email, announcement.title, announcementHtml(p.full_name, announcement.title, announcement.body));
    }
  }
}
