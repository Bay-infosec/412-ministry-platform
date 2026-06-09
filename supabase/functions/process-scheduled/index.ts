import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMAILJS_SERVICE_ID = Deno.env.get("EMAILJS_SERVICE_ID") || "service_7njy4no";
const EMAILJS_TEMPLATE_ID = Deno.env.get("EMAILJS_ANNOUNCE_TEMPLATE") || "template_ecf57nm";
const EMAILJS_WELCOME_TEMPLATE = Deno.env.get("EMAILJS_INVITE_TEMPLATE") || "template_6d9u7bp";
const EMAILJS_PUBLIC_KEY = Deno.env.get("EMAILJS_PUBLIC_KEY") || "FP0ZiFckHYBqYpN6s";
const PLATFORM_URL = Deno.env.get("PLATFORM_URL") || "https://412-ministry-platform.vercel.app";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

type AudienceRule = {
  type: string;
  value?: string | number | null;
  event_id?: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  platform_role: string | null;
};

type Membership = {
  profile_id: string;
  event_id: string;
  event_role: string | null;
  ministry: string | null;
  team_number: number | null;
};

type ScheduledAnnouncement = {
  id: string;
};

type InviteCampaign = {
  id: string;
  event_id: string;
  temporary_password: string;
};

type AuthUser = {
  id: string;
  email?: string | null;
  last_sign_in_at?: string | null;
};

function matchesAudience(
  profile: Profile,
  memberships: Membership[],
  audience: AudienceRule[] | null,
  defaultEventId: string | null,
) {
  if (!audience?.length) return true;

  return audience.some((rule) => {
    if (rule.type === "all") return true;
    if (rule.type === "person") return profile.id === rule.value;
    if (rule.type === "role" && profile.platform_role === rule.value) return true;

    const eventId = rule.event_id || defaultEventId;
    return memberships.some((membership) => {
      if (membership.profile_id !== profile.id) return false;
      if (eventId && membership.event_id !== eventId) return false;
      if (rule.type === "role") return membership.event_role === rule.value;
      if (rule.type === "team") return String(membership.team_number) === String(rule.value);
      if (rule.type === "ministry") return membership.ministry === rule.value;
      return false;
    });
  });
}

async function sendEmail(profile: Profile, title: string, body: string) {
  if (!profile.email) return false;

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: PLATFORM_URL,
      Referer: `${PLATFORM_URL}/`,
    },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: profile.email,
        to_name: profile.full_name || "",
        title,
        body,
        announcement_title: title,
        announcement_body: body,
        subject: title,
        message: body,
        event_name: "412 MINISTRY",
        event_dates: "",
        event_location: "",
        platform_url: PLATFORM_URL,
      },
    }),
  });

  return response.ok;
}

async function sendWelcomeEmail(email: string, fullName: string, tempPassword: string) {
  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: PLATFORM_URL,
      Referer: `${PLATFORM_URL}/`,
    },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_WELCOME_TEMPLATE,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,
        email,
        recipient_email: email,
        to_name: fullName,
        name: fullName,
        temp_password: tempPassword,
        password: tempPassword,
        subject: "Welcome to 412 MINISTRY",
        platform_url: PLATFORM_URL,
      },
    }),
  });
  return response.ok;
}

async function listAuthUsers() {
  const users: AuthUser[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 100) break;
  }
  return users;
}

async function sendPush(profileIds: string[], title: string, body: string) {
  if (!profileIds.length) return true;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      title,
      body: body.slice(0, 120),
      url: "/",
      profile_ids: profileIds,
    }),
  });

  return response.ok;
}

async function processAnnouncement(announcement: ScheduledAnnouncement) {
  const now = new Date().toISOString();
  const { data: claimed, error: claimError } = await admin
    .from("announcements")
    .update({ status: "published", published_at: now, delivery_error: null })
    .eq("id", announcement.id)
    .eq("status", "draft")
    .lte("publish_at", now)
    .select("*")
    .maybeSingle();

  if (claimError || !claimed) return false;

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email, platform_role");
  const { data: memberships } = await admin
    .from("event_members")
    .select("profile_id, event_id, event_role, ministry, team_number");

  const recipients = ((profiles || []) as Profile[]).filter((profile) =>
    matchesAudience(
      profile,
      (memberships || []) as Membership[],
      claimed.audience as AudienceRule[] | null,
      claimed.event_id,
    )
  );

  const errors: string[] = [];
  const deliveryUpdate: Record<string, string | null> = {};

  if (claimed.send_push) {
    const ok = await sendPush(recipients.map((profile) => profile.id), claimed.title, claimed.body);
    if (ok) deliveryUpdate.push_sent_at = now;
    else errors.push("Push notification delivery failed.");
  }

  if (claimed.send_email) {
    let sent = 0;
    for (const profile of recipients) {
      if (await sendEmail(profile, claimed.title, claimed.body)) sent += 1;
    }
    const emailRecipients = recipients.filter((profile) => profile.email).length;
    if (sent === emailRecipients) deliveryUpdate.email_sent_at = now;
    else errors.push(`EmailJS delivered ${sent} of ${emailRecipients} emails.`);
  }

  deliveryUpdate.delivery_error = errors.length ? errors.join(" ") : null;
  await admin.from("announcements").update(deliveryUpdate).eq("id", claimed.id);
  return true;
}

async function processInviteCampaign(campaign: InviteCampaign) {
  const now = new Date().toISOString();
  const { data: claimed, error: claimError } = await admin
    .from("scheduled_invite_campaigns")
    .update({ status: "processing", started_at: now, error: null })
    .eq("id", campaign.id)
    .eq("status", "queued")
    .lte("run_at", now)
    .select("id, event_id, temporary_password")
    .maybeSingle();

  if (claimError || !claimed) return null;
  if (!claimed.temporary_password) {
    await admin
      .from("scheduled_invite_campaigns")
      .update({ status: "failed", completed_at: now, error: "Temporary password is not configured." })
      .eq("id", claimed.id);
    return null;
  }

  try {
    const { data: members, error: memberError } = await admin
      .from("event_members")
      .select("profile_id, event_role, profiles!event_members_profile_id_fkey(full_name, email)")
      .eq("event_id", claimed.event_id)
      .in("event_role", ["leader", "coordinator"]);
    if (memberError) throw memberError;

    const authUsers = await listAuthUsers();
    const authById = new Map(authUsers.map((user) => [user.id, user]));
    const results = { eligible: 0, sent: 0, skipped_signed_in: 0, failed: 0 };

    for (const member of members || []) {
      const authUser = authById.get(member.profile_id);
      if (!authUser || authUser.last_sign_in_at) {
        results.skipped_signed_in += 1;
        continue;
      }

      const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
      const email = profile?.email || authUser.email;
      const fullName = profile?.full_name || "";
      if (!email) {
        results.failed += 1;
        continue;
      }

      results.eligible += 1;
      if (await sendWelcomeEmail(email, fullName, claimed.temporary_password)) results.sent += 1;
      else results.failed += 1;
    }

    await admin
      .from("scheduled_invite_campaigns")
      .update({
        status: results.failed > 0 ? "completed_with_errors" : "completed",
        completed_at: new Date().toISOString(),
        results,
      })
      .eq("id", claimed.id);
    return results;
  } catch (error) {
    await admin
      .from("scheduled_invite_campaigns")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Invite campaign failed.",
      })
      .eq("id", claimed.id);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const now = new Date().toISOString();
  const { data: announcements } = await admin
    .from("announcements")
    .select("*")
    .eq("status", "draft")
    .not("publish_at", "is", null)
    .lte("publish_at", now)
    .limit(20);

  let publishedAnnouncements = 0;
  for (const announcement of announcements || []) {
    if (await processAnnouncement(announcement as ScheduledAnnouncement)) publishedAnnouncements += 1;
  }

  const { data: dueEvents } = await admin
    .from("events")
    .select("id")
    .eq("status", "inactive")
    .not("publish_at", "is", null)
    .lte("publish_at", now)
    .limit(20);

  let activatedEvents = 0;
  for (const event of dueEvents || []) {
    const { data: activated } = await admin
      .from("events")
      .update({ status: "active", publish_at: null, published_at: now })
      .eq("id", event.id)
      .eq("status", "inactive")
      .lte("publish_at", now)
      .select("id")
      .maybeSingle();
    if (activated) activatedEvents += 1;
  }

  const { data: dueCampaigns } = await admin
    .from("scheduled_invite_campaigns")
    .select("id, event_id, temporary_password")
    .eq("status", "queued")
    .lte("run_at", now)
    .limit(5);

  let processedInviteCampaigns = 0;
  for (const campaign of dueCampaigns || []) {
    if (await processInviteCampaign(campaign as InviteCampaign)) processedInviteCampaigns += 1;
  }

  return new Response(JSON.stringify({ publishedAnnouncements, activatedEvents, processedInviteCampaigns }), {
    headers: { "Content-Type": "application/json" },
  });
});
