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

async function findAuthUserByEmail(adminClient: ReturnType<typeof createClient>, email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 100) break;
  }
  return null;
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
      .select("platform_role")
      .eq("id", caller.id)
      .single();
    if (callerProfile?.platform_role !== "admin") {
      return json({ success: false, error: "Admin access required" }, 403);
    }

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.full_name || "").trim();
    if (!email || !fullName) {
      return json({ success: false, error: "Full name and email are required." }, 400);
    }

    const tempPassword = generateTemporaryPassword();
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !created.user) {
      const duplicate = createError?.message?.toLowerCase().includes("already");
      if (duplicate) {
        const existingUser = await findAuthUserByEmail(adminClient, email);
        if (existingUser) {
          const { data: existingProfile } = await adminClient
            .from("profiles")
            .select("password_changed")
            .eq("id", existingUser.id)
            .maybeSingle();

          if (existingProfile?.password_changed) {
            return json({ success: false, error: "This person already has an active account." }, 409);
          }

          const recoveredPassword = generateTemporaryPassword();
          const { error: passwordError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
            password: recoveredPassword,
            email_confirm: true,
            user_metadata: { ...existingUser.user_metadata, full_name: fullName },
          });
          if (passwordError) {
            return json({ success: false, error: "The existing account could not be recovered." }, 400);
          }

          const { error: recoveredProfileError } = await adminClient
            .from("profiles")
            .upsert({
              id: existingUser.id,
              full_name: fullName,
              email,
              phone: body.phone || null,
              church_id: body.church_id || null,
              ministry_role: body.ministry_role || null,
              platform_role: body.platform_role || "member",
              password_changed: false,
            }, { onConflict: "id" });
          if (recoveredProfileError) {
            return json({ success: false, error: "The login exists, but its profile could not be repaired." }, 400);
          }

          return json({
            success: true,
            recovered: true,
            user_id: existingUser.id,
            temp_password: recoveredPassword,
          });
        }
      }
      return json({
        success: false,
        error: duplicate ? "This person already has an account." : createError?.message || "Could not create account.",
      }, duplicate ? 409 : 400);
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        full_name: fullName,
        email,
        phone: body.phone || null,
        church_id: body.church_id || null,
        ministry_role: body.ministry_role || null,
        platform_role: body.platform_role || "member",
        password_changed: false,
      })
      .eq("id", created.user.id);

    if (profileError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ success: false, error: "Could not finish creating the profile." }, 400);
    }

    return json({
      success: true,
      user_id: created.user.id,
      temp_password: tempPassword,
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error occurred.",
    }, 500);
  }
});
