import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { NAVY, ORANGE, TSEC, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, Field, Button } from "../../components/ui/index.js";

export default function ChangePassword({ onDone }) {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    if (pw1.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (pw1 !== pw2) {
      setErr("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) {
        setBusy(false);
        setErr("Could not update password.");
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from("profiles")
        .update({ password_changed: true })
        .eq("id", user.id);
      setBusy(false);
      onDone();
    } catch {
      setBusy(false);
      setErr("Could not update password.");
    }
  };

  return (
    <Shell>
      <div
        style={{
          marginTop: "3rem",
          marginBottom: "2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: ORANGE,
            textTransform: "uppercase",
            marginBottom: "0.75rem",
            fontFamily: SANS,
          }}
        >
          One quick step
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: "28px",
            fontWeight: 600,
            color: NAVY,
            lineHeight: 1.2,
          }}
        >
          Set your own password
        </div>
        <div
          style={{
            fontSize: "14px",
            color: TSEC,
            marginTop: "0.75rem",
            lineHeight: 1.6,
            fontFamily: SANS,
          }}
        >
          Replace the temporary password
          <br />
          with one only you know.
        </div>
      </div>

      <Card>
        <Field
          label="NEW PASSWORD"
          type="password"
          value={pw1}
          onChange={setPw1}
          placeholder="At least 8 characters"
        />
        <Field
          label="CONFIRM NEW PASSWORD"
          type="password"
          value={pw2}
          onChange={setPw2}
          placeholder="Type it again"
        />
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
          label={busy ? "Saving..." : "Save and continue"}
          onClick={submit}
          disabled={busy}
        />
      </Card>
    </Shell>
  );
}
