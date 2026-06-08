import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { SANS } from "../../lib/constants.js";

export default function Login({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    if (!email || !password) {
      setErr("Please enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      setBusy(false);
      if (error) {
        setErr("Email or password is incorrect.");
        return;
      }
      onLoggedIn();
    } catch {
      setBusy(false);
      setErr("Could not connect. Please try again.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#FF4D00",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "env(safe-area-inset-top) 1.25rem env(safe-area-inset-bottom)",
      fontFamily: SANS,
    }}>
      {/* Logo */}
      <img
        src="/logo.png"
        alt="412 Ministry"
        style={{ width: 100, height: 100, borderRadius: 22, objectFit: "cover", marginBottom: "2rem" }}
      />

      {/* Headline */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "36px", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
          Welcome back.
        </div>
        <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginTop: "0.5rem" }}>
          Sign in to continue
        </div>
      </div>

      {/* Form card */}
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 20, padding: "1.5rem" }}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#999", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: SANS, marginBottom: 6 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "none", background: "#F5F5F5", fontSize: "15px", fontFamily: SANS, color: "#111", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#999", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: SANS, marginBottom: 6 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "none", background: "#F5F5F5", fontSize: "15px", fontFamily: SANS, color: "#111", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        {err && (
          <div style={{ color: "#C0392B", fontSize: "13px", marginBottom: "0.75rem", fontFamily: SANS }}>
            {err}
          </div>
        )}
        <button
          onClick={submit}
          disabled={busy}
          style={{ width: "100%", padding: "14px", background: busy ? "#ccc" : "#FF4D00", color: "#fff", border: "none", borderRadius: 12, fontSize: "15px", fontWeight: 700, fontFamily: SANS, cursor: busy ? "default" : "pointer" }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
        First time? Use the temporary password
        <br />you received by email.
      </div>
    </div>
  );
}
