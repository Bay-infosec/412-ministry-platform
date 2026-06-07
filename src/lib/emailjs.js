import { supabase } from "./supabase.js";

const SERVICE_ID   = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const ANN_TEMPLATE = import.meta.env.VITE_EMAILJS_ANNOUNCE_TEMPLATE;
const PUBLIC_KEY   = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

async function sendOne(toEmail, toName, title, body) {
  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: SERVICE_ID,
        template_id: ANN_TEMPLATE,
        user_id: PUBLIC_KEY,
        template_params: {
          to_email: toEmail,
          to_name: toName,
          title,
          body,
          platform_url: window.location.origin,
        },
      }),
    });
  } catch {
    // non-blocking — email failure should never break the publish flow
  }
}

// Sends announcement email to all event members matching the audience rule.
// EmailJS template_ecf57nm must accept: to_email, to_name, title, body, platform_url
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
      await sendOne(p.email, p.full_name || "", announcement.title, announcement.body);
    }
  }
}
