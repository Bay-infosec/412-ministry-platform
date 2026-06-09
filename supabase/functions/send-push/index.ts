import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    let vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
    let vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    if (!vapidPublic || !vapidPrivate) {
      const { data: config, error: configError } = await supabase
        .from("app_runtime_secrets")
        .select("key, value")
        .in("key", ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"]);
      if (configError) throw configError;
      const values = Object.fromEntries((config || []).map((row) => [row.key, row.value]));
      vapidPublic ||= values.VAPID_PUBLIC_KEY || "";
      vapidPrivate ||= values.VAPID_PRIVATE_KEY || "";
    }

    if (!vapidPublic || !vapidPrivate) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails("mailto:admin@412ministry.org", vapidPublic, vapidPrivate);

    const { title, body, url, profile_ids } = await req.json();
    let query = supabase.from("push_subscriptions").select("*");
    if (profile_ids?.length) query = query.in("profile_id", profile_ids);
    const { data: subs, error } = await query;
    if (error) throw error;

    const payload = JSON.stringify({ title, body, url: url || "/" });
    let sent = 0;
    const stale: string[] = [];
    const failed: string[] = [];

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        sent += 1;
      } catch (error) {
        const statusCode = error?.statusCode;
        if (statusCode === 410 || statusCode === 404) stale.push(sub.endpoint);
        else failed.push(sub.endpoint);
      }
    }

    if (stale.length) {
      await supabase.from("push_subscriptions").delete().in("endpoint", stale);
    }

    return new Response(JSON.stringify({
      sent,
      total: subs?.length ?? 0,
      stale: stale.length,
      failed: failed.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
