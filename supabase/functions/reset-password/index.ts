import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function generateTemporaryPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%";
  const all = upper + lower + digits + symbols;
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const required = [
    upper[bytes[0] % upper.length],
    lower[bytes[1] % lower.length],
    digits[bytes[2] % digits.length],
    symbols[bytes[3] % symbols.length],
  ];
  const rest = Array.from(bytes.slice(4), (value) => all[value % all.length]);

  return [...required, ...rest]
    .sort(() => crypto.getRandomValues(new Uint8Array(1))[0] - 128)
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) return json({ success: false, error: "Unauthorized" }, 401);

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("full_name, platform_role")
      .eq("id", caller.id)
      .single();
    if (callerProfile?.platform_role !== "admin") {
      return json({ success: false, error: "Admin access required" }, 403);
    }

    const body = await req.json();
    const userId = String(body.user_id || "").trim();
    if (!userId) return json({ success: false, error: "User is required." }, 400);

    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("id, full_name")
      .eq("id", userId)
      .maybeSingle();
    if (!targetProfile) {
      return json({ success: false, error: "Account not found." }, 404);
    }

    const tempPassword = generateTemporaryPassword();
    const { error: passwordError } = await adminClient.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });
    if (passwordError) {
      return json({ success: false, error: passwordError.message }, 400);
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ password_changed: false })
      .eq("id", userId);

    await adminClient.from("audit_log").insert({
      actor_id: caller.id,
      actor_name: callerProfile.full_name,
      action: "reset_password",
      target_type: "profile",
      target_id: userId,
      target_name: targetProfile.full_name,
      details: {
        forced_password_change: !profileError,
        profile_update_error: profileError?.message || null,
      },
    });

    return json({
      success: true,
      temp_password: tempPassword,
      warning: profileError
        ? "Password changed, but the forced password-change flag could not be saved. Share this password, then ask the user to change it from Profile settings."
        : null,
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error occurred.",
    }, 500);
  }
});
