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
    <Shell>
      <div
        style={{
          textAlign: "center",
          marginTop: "3rem",
          marginBottom: "2.5rem",
        }}
      >
        <img
          src="/logo.png"
          alt="412 Ministry"
          style={{ width: 110, height: "auto", marginBottom: "1.5rem" }}
        />
        <div
          style={{
            fontFamily: SANS,
            fontSize: "36px",
            fontWeight: 900,
            color: "#111111",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          Welcome back.
        </div>
        <div
          style={{
            fontSize: "14px",
            color: TSEC,
            marginTop: "0.5rem",
            fontFamily: SANS,
          }}
        >
          Sign in to continue
        </div>
      </div>

      <Card>
        <div onKeyDown={(e) => { if (e.key === "Enter") submit(); }}>
        <Field
          label="EMAIL"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
        />
        <Field
          label="PASSWORD"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Your password"
        />
        </div>
        {err && (
          <div
            style={{
              color: "#C0392B",
              fontSize: "13px",
              marginBottom: "0.75rem",
              fontFamily: SANS,
            }}
          >
            {err}
          </div>
        )}
        <Button
          label={busy ? "Signing in..." : "Sign in"}
          onClick={submit}
          disabled={busy}
        />
      </Card>

      <div
        style={{
          textAlign: "center",
          marginTop: "1.25rem",
          fontSize: "13px",
          color: TSEC,
          lineHeight: 1.6,
          fontFamily: SANS,
        }}
      >
        First time? Use the temporary password
        <br />
        you received by email.
      </div>
    </Shell>
  );
}
