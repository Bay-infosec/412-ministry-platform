import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { SANS } from "../../lib/constants.js";

const PLATFORM_URL = "https://412-ministry-platform.vercel.app";

export default function Login({ onLoggedIn }) {
  const [view, setView] = useState("login"); // "login" | "forgot" | "forgot_sent"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const submit = async () => {
    setErr("");
    if (!email || !password) { setErr("Please enter your email and password."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      setBusy(false);
      if (error) { setErr("Email or password is incorrect."); return; }
      onLoggedIn();
    } catch {
      setBusy(false);
      setErr("Could not connect. Please try again.");
    }
  };

  const sendReset = async () => {
    setErr("");
    if (!resetEmail.trim()) { setErr("Please enter your email address."); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
      redirectTo: `${PLATFORM_URL}/?reset=1`,
    });
    setBusy(false);
    if (error) { setErr("Could not send reset link. Check the email address."); return; }
    setView("forgot_sent");
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#1B2A4A",
      display: "flex", flexDirection: "column",
      fontFamily: SANS,
      overflow: "hidden",
    }}>
      <style>{`
        .login-input::placeholder { color: rgba(27,42,74,0.35); }
        .login-input:focus { border-color: #FF4D00 !important; }
        .reset-input::placeholder { color: rgba(255,255,255,0.35); }
        .reset-input:focus { border-color: rgba(255,255,255,0.6) !important; }
      `}</style>

      {/* Top — navy brand area */}
      <div style={{
        flex: "0 0 auto",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "max(3rem, env(safe-area-inset-top)) 2rem 2.5rem",
        minHeight: "38vh",
      }}>
        <img
          src="/logo.png"
          alt="412 Ministry"
          style={{ width: 80, height: 80, borderRadius: 23, clipPath: "inset(0 round 23px)", objectFit: "cover", marginBottom: "1.25rem", border: "2.5px solid rgba(255,77,0,0.6)", boxShadow: "0 0 0 6px rgba(255,77,0,0.12), 0 12px 32px rgba(0,0,0,0.3)" }}
        />
        <div style={{ fontSize: "28px", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          412 <span style={{ color: "#FF4D00" }}>MINISTRY</span>
        </div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "0.4rem", letterSpacing: "0.04em" }}>
          Leadership Platform
        </div>
      </div>

      {/* Bottom — white form card */}
      <div style={{
        flex: 1,
        background: "#fff",
        borderRadius: "24px 24px 0 0",
        padding: "2rem 1.75rem max(2rem, env(safe-area-inset-bottom))",
        overflowY: "auto",
      }}>
        {view === "login" && (
          <>
            <div style={{ marginBottom: "1.75rem" }}>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#1B2A4A", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
                Welcome back
              </div>
              <div style={{ fontSize: "13px", color: "#6B7280" }}>
                Sign in to continue
              </div>
            </div>

            <div
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            >
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>Email</label>
                <input
                  className="login-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "1.5px solid #E5E5E5", background: "#FAFAFA", fontSize: "15px", fontFamily: SANS, color: "#1B2A4A", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                />
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>Password</label>
                <input
                  className="login-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "1.5px solid #E5E5E5", background: "#FAFAFA", fontSize: "15px", fontFamily: SANS, color: "#1B2A4A", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                />
              </div>

              {/* Forgot password link */}
              <div style={{ textAlign: "right", marginBottom: "1.25rem" }}>
                <button
                  onClick={() => { setErr(""); setResetEmail(email); setView("forgot"); }}
                  style={{ background: "none", border: "none", fontSize: "13px", color: "#FF4D00", fontWeight: 600, cursor: "pointer", fontFamily: SANS, padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>

              {err && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", fontSize: "13px", color: "#B91C1C", marginBottom: "1rem", fontFamily: SANS }}>
                  {err}
                </div>
              )}

              <button
                onClick={submit}
                disabled={busy}
                style={{ width: "100%", padding: "15px", background: "#FF4D00", color: "#fff", border: "none", borderRadius: 12, fontSize: "15px", fontWeight: 800, fontFamily: SANS, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, marginBottom: "1rem" }}
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </div>

            <div style={{ textAlign: "center", fontSize: "12px", color: "#9CA3AF", lineHeight: 1.65 }}>
              First time? Use the temporary password<br />you received by email.
            </div>
          </>
        )}

        {view === "forgot" && (
          <>
            <button
              onClick={() => { setErr(""); setView("login"); }}
              style={{ background: "none", border: "none", color: "#6B7280", fontSize: "14px", cursor: "pointer", fontFamily: SANS, padding: "0 0 1.25rem 0", display: "block" }}
            >
              ‹ Back to sign in
            </button>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#1B2A4A", letterSpacing: "-0.02em", marginBottom: "0.375rem" }}>
                Reset password
              </div>
              <div style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>
                Enter your email and we'll send a reset link.
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>Email</label>
              <input
                className="login-input"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendReset(); }}
                placeholder="you@example.com"
                autoFocus
                style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "1.5px solid #E5E5E5", background: "#FAFAFA", fontSize: "15px", fontFamily: SANS, color: "#1B2A4A", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
              />
            </div>

            {err && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", fontSize: "13px", color: "#B91C1C", marginBottom: "1rem", fontFamily: SANS }}>
                {err}
              </div>
            )}

            <button
              onClick={sendReset}
              disabled={busy}
              style={{ width: "100%", padding: "15px", background: "#FF4D00", color: "#fff", border: "none", borderRadius: 12, fontSize: "15px", fontWeight: 800, fontFamily: SANS, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </>
        )}

        {view === "forgot_sent" && (
          <div style={{ textAlign: "center", paddingTop: "1rem" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#FF4D00", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#1B2A4A", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
              Check your email
            </div>
            <div style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.65, marginBottom: "1.75rem" }}>
              We sent a reset link to<br />
              <strong style={{ color: "#1B2A4A" }}>{resetEmail}</strong>
            </div>
            <button
              onClick={() => { setErr(""); setView("login"); }}
              style={{ width: "100%", padding: "14px", background: "#1B2A4A", color: "#fff", border: "none", borderRadius: 12, fontSize: "15px", fontWeight: 700, fontFamily: SANS, cursor: "pointer" }}
            >
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
