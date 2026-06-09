import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { validatePassword } from "../../lib/utils.js";
import { SANS } from "../../lib/constants.js";

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmation) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError("This reset link is invalid or expired. Request a new link.");
      return;
    }
    onDone();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#1B2A4A",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "max(1.5rem, env(safe-area-inset-top)) 1.5rem max(1.5rem, env(safe-area-inset-bottom))",
      fontFamily: SANS,
    }}>
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 20, padding: "1.75rem" }}>
        <img
          src="/logo.png"
          alt="412 MINISTRY"
          style={{ width: 64, height: 64, borderRadius: 19, clipPath: "inset(0 round 19px)", objectFit: "cover", display: "block", marginBottom: "1.25rem" }}
        />
        <div style={{ fontSize: "25px", fontWeight: 900, color: "#1B2A4A", letterSpacing: "-0.03em", marginBottom: 6 }}>
          Create a new password
        </div>
        <div style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          Use at least 8 characters with a capital letter, number, and symbol.
        </div>

        <div onKeyDown={(event) => { if (event.key === "Enter") submit(); }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>
            New password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            style={{ width: "100%", padding: "13px 14px", borderRadius: 11, border: "1.5px solid #E5E5E5", background: "#FAFAFA", color: "#1B2A4A", outline: "none", boxSizing: "border-box", marginBottom: "1rem" }}
          />

          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>
            Confirm password
          </label>
          <input
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            style={{ width: "100%", padding: "13px 14px", borderRadius: 11, border: "1.5px solid #E5E5E5", background: "#FAFAFA", color: "#1B2A4A", outline: "none", boxSizing: "border-box", marginBottom: "1rem" }}
          />

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 12px", color: "#B91C1C", fontSize: "13px", lineHeight: 1.5, marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={busy}
            style={{ width: "100%", padding: "14px", border: "none", borderRadius: 11, background: "#FF4D00", color: "#fff", fontSize: "15px", fontWeight: 800, fontFamily: SANS, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </div>
      </div>
    </div>
  );
}
