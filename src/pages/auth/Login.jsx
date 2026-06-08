import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { TSEC, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, Field, Button } from "../../components/ui/index.js";

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
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 20, padding: "1.5rem" }}>
        <div onKeyDown={(e) => { if (e.key === "Enter") submit(); }}>
          <Field label="EMAIL" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Field label="PASSWORD" type="password" value={password} onChange={setPassword} placeholder="Your password" />
        </div>
        {err && (
          <div style={{ color: "#C0392B", fontSize: "13px", marginBottom: "0.75rem" }}>
            {err}
          </div>
        )}
        <Button label={busy ? "Signing in..." : "Sign in"} onClick={submit} disabled={busy} />
      </div>

      <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
        First time? Use the temporary password
        <br />you received by email.
      </div>
    </div>
  );
}
