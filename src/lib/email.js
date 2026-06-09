import { supabase } from "./supabase.js";

// These are EmailJS client identifiers, not secret server credentials.
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_7njy4no";
const WELCOME_TEMPLATE = import.meta.env.VITE_EMAILJS_INVITE_TEMPLATE || "template_6d9u7bp";
const ANNOUNCEMENT_TEMPLATE = import.meta.env.VITE_EMAILJS_ANNOUNCE_TEMPLATE || "template_ecf57nm";
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "FP0ZiFckHYBqYpN6s";

async function sendTemplate(templateId, templateParams) {
  if (!SERVICE_ID || !templateId || !PUBLIC_KEY) return false;

  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: SERVICE_ID,
        template_id: templateId,
        user_id: PUBLIC_KEY,
        template_params: templateParams,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function htmlToText(html) {
  if (!html) return "";
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.textContent || container.innerText || "";
}

export function sendInviteEmail({ toEmail, toName, tempPassword }) {
  return sendTemplate(WELCOME_TEMPLATE, {
    to_email: toEmail,
    to_name: toName,
    temp_password: tempPassword,
    platform_url: window.location.origin,
  });
}

// The free EmailJS plan has two templates. Reuse Announcement for platform
// announcements and contact-form messages; Welcome is reserved for invites.
export function sendEmail(to, subject, html, toName = "") {
  const body = htmlToText(html);
  return sendTemplate(ANNOUNCEMENT_TEMPLATE, {
    to_email: to,
    to_name: toName,
    title: subject,
    body,
    announcement_title: subject,
    announcement_body: body,
    subject,
    message: body,
    event_name: "412 MINISTRY",
    event_dates: "",
    event_location: "",
    platform_url: window.location.origin,
  });
}

// Sends announcement email to all event members matching the audience rule.
export async function sendAnnouncementEmails(audience, announcement, eventId) {
  if (!audience?.length || !eventId) return;
  const rule = audience[0];

  let query = supabase
    .from("event_members")
    .select("profile_id, ministry, team_number, event_role, profiles(full_name, email)")
    .eq("event_id", rule.event_id || eventId);

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

  for (const member of members) {
    const person = member.profiles;
    if (person?.email) {
      await sendEmail(
        person.email,
        announcement.title,
        announcement.body,
        person.full_name || "",
      );
    }
  }
}
