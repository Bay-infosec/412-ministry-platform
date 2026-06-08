import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { SANS } from "../../lib/constants.js";

const inputStyle = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.25)",
  background: "rgba(255,255,255,0.15)",
  fontSize: "15px",
  fontFamily: SANS,
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
  WebkitTextFillColor: "#fff",
};

const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "rgba(255,255,255,0.7)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontFamily: SANS,
  marginBottom: 8,
};

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
      position: "fixed", inset: 0,
      background: "#FF4D00",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "max(1.5rem, env(safe-area-inset-top)) 1.5rem max(1.5rem, env(safe-area-inset-bottom))",
      fontFamily: SANS,
    }}>
      <style>{`.login-input::placeholder{color:rgba(255,255,255,0.45)}`}</style>

      {/* Logo */}
      <img
        src="/logo.png"
        alt="412 Ministry"
        style={{ width: 100, height: 100, borderRadius: 22, objectFit: "cover", marginBottom: "2rem" }}
      />

      {/* Headline */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ fontSize: "36px", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
          Welcome back.
        </div>
        <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", marginTop: "0.5rem" }}>
          Sign in to continue
        </div>
      </div>

      {/* Form — no card, straight on orange */}
      <div style={{ width: "100%", maxWidth: 380 }}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
      >
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={labelStyle}>Email</label>
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Password</label>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            style={inputStyle}
          />
        </div>
        {err && (
          <div style={{ color: "#fff", background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: "13px", marginBottom: "1rem", fontFamily: SANS }}>
            {err}
          </div>
        )}
        <button
          onClick={submit}
          disabled={busy}
          style={{
            width: "100%", padding: "15px",
            background: "#fff", color: "#FF4D00",
            border: "none", borderRadius: 12,
            fontSize: "15px", fontWeight: 800, fontFamily: SANS,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
        First time? Use the temporary password<br />you received by email.
      </div>
    </div>
  );
}
