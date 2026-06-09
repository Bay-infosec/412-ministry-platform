import { useState } from "react";
import { supabase } from "../../../lib/supabase.js";
import { TSEC, BORDER, SANS, SERIF } from "../../../lib/constants.js";
import { sendInviteEmail } from "../../../lib/email.js";

const inputStyle = {
  width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10,
  padding: "10px 12px", fontSize: "15px", fontFamily: SANS, color: "#1B2A4A",
  outline: "none", boxSizing: "border-box", background: "#fff",
};

export default function InviteFlow({ data, onSuccess, onToast }) {
  const { churches } = data;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [churchId, setChurchId] = useState("");
  const [ministryRole, setMinistryRole] = useState("");
  const [platformRole, setPlatformRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    setLoading(true);

    const { data: res, error } = await supabase.functions.invoke("create-user", {
      body: {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        church_id: churchId || undefined,
        ministry_role: ministryRole.trim() || undefined,
        platform_role: platformRole,
      },
    });

    if (error || !res?.success) {
      setLoading(false);
      const msg = res?.error || "Could not create account. Email may already be in use.";
      onToast(msg, "error");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { data: createdProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    let emailSent = false;
    let tempPassword = null;
    if (createdProfile?.id) {
      const { data: resetResult } = await supabase.functions.invoke("reset-password", {
        body: { user_id: createdProfile.id },
      });
      tempPassword = resetResult?.temp_password || null;
      if (tempPassword) {
        emailSent = await sendInviteEmail({
          toEmail: normalizedEmail,
          toName: fullName.trim(),
          tempPassword,
        });
      }
    }

    setLoading(false);
    setDone({ name: fullName.trim(), emailSent, tempPassword });
  }

  if (done) {
    return (
      <div style={{ textAlign: "center", paddingTop: "2rem" }}>
        <div style={{ fontSize: "48px", marginBottom: "1rem" }}>✓</div>
        <div style={{ fontFamily: SANS, fontSize: "26px", fontWeight: 600, color: "#1B2A4A", marginBottom: "0.75rem" }}>
          {done.name} invited!
        </div>
        {done.emailSent ? (
          <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, lineHeight: 1.65 }}>
            An invite email with their temporary password has been sent. They can log in and will be prompted to change their password immediately.
          </div>
        ) : (
          <div style={{
            background: "#111111", border: "none", borderRadius: 12,
            padding: "1rem", marginTop: "0.5rem",
            fontSize: "14px", color: "#FFFFFF", fontFamily: SANS, lineHeight: 1.65,
          }}>
            Account created, but EmailJS did not confirm delivery.
            {done.tempPassword ? ` Share this temporary password manually: ${done.tempPassword}` : " Reset the password from the user profile and share it manually."}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: SANS, fontSize: "22px", fontWeight: 600, color: "#1B2A4A", marginBottom: 4 }}>
          Invite a new leader
        </div>
        <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>
          A temporary password will be emailed to them automatically.
        </div>
      </div>

      <FormSection label="FULL NAME *">
        <input
          value={fullName} onChange={(e) => setFullName(e.target.value)}
          placeholder="First and last name" required style={inputStyle}
        />
      </FormSection>

      <FormSection label="EMAIL ADDRESS *">
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="their@email.com" required style={inputStyle}
        />
      </FormSection>

      <FormSection label="PHONE (optional)">
        <input
          type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 000-0000" style={inputStyle}
        />
      </FormSection>

      <FormSection label="CHURCH (optional)">
        <select value={churchId} onChange={(e) => setChurchId(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
          <option value="">Select a church</option>
          {(churches || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.city ? ` — ${c.city}` : ""}</option>
          ))}
        </select>
      </FormSection>

      <FormSection label="MINISTRY ROLE (optional)">
        <input
          value={ministryRole} onChange={(e) => setMinistryRole(e.target.value)}
          placeholder="e.g. Youth Pastor, Engineer, Nurse" style={inputStyle}
        />
      </FormSection>

      <FormSection label="PLATFORM ROLE">
        <select value={platformRole} onChange={(e) => setPlatformRole(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
          <option value="member">Member</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
      </FormSection>

      <button
        type="submit"
        disabled={loading || !fullName.trim() || !email.trim()}
        style={{
          width: "100%", padding: "14px", background: "#FF4D00",
          color: "#fff", border: "none", borderRadius: 12,
          fontSize: "15px", fontWeight: 600, fontFamily: SANS,
          cursor: loading || !fullName.trim() || !email.trim() ? "default" : "pointer",
          opacity: loading || !fullName.trim() || !email.trim() ? 0.6 : 1,
          marginTop: "0.5rem",
        }}
      >
        {loading ? "Sending invite…" : "Send Invite"}
      </button>
    </form>
  );
}

function FormSection({ label, children }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{
        fontSize: "11px", fontWeight: 700, color: TSEC,
        letterSpacing: "0.08em", fontFamily: SANS, marginBottom: 6,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}
