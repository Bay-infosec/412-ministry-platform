import { useState } from "react";
import { supabase } from "../../../lib/supabase.js";
import { NAVY, ORANGE, TSEC, BORDER, SANS, SERIF } from "../../../lib/constants.js";
import { Card, Field } from "../../../components/ui/index.js";

const EVENT_TYPES = ["Conference", "Open Mic", "Missions", "Workshop", "Other"];

export default function EventEditor({ onSaved, onToast }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Conference");
  const [dates, setDates] = useState("");
  const [location, setLocation] = useState("");
  const [fee, setFee] = useState("");
  const [verse, setVerse] = useState("");
  const [verseText, setVerseText] = useState("");
  const [teamCount, setTeamCount] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim()) { onToast("Event name is required.", "error"); return; }
    setBusy(true);
    const { error } = await supabase.from("events").insert({
      name: name.trim(),
      type,
      dates: dates.trim() || null,
      location: location.trim() || null,
      fee: fee.trim() || null,
      verse: verse.trim() || null,
      verse_text: verseText.trim() || null,
      team_count: teamCount ? parseInt(teamCount, 10) : null,
      registration_url: registrationUrl.trim() || null,
      status: "inactive",
    });
    setBusy(false);
    if (error) { onToast("Could not create event.", "error"); return; }
    onToast(`"${name.trim()}" created as inactive.`);
    onSaved();
  }

  return (
    <div>
      <div style={{ fontFamily: SERIF, fontSize: "18px", fontWeight: 600, color: NAVY, marginBottom: "1.25rem" }}>
        New Event
      </div>

      <Card style={{ marginBottom: "1rem" }}>
        <Field label="EVENT NAME" value={name} onChange={setName} placeholder="e.g. Set Apart 2027" />

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: TSEC, marginBottom: 6, letterSpacing: "0.04em", fontFamily: SANS }}>
            TYPE
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  padding: "7px 14px", borderRadius: 8,
                  border: `1.5px solid ${type === t ? ORANGE : BORDER}`,
                  background: type === t ? "#FFF5EC" : "#fff",
                  color: type === t ? ORANGE : TSEC,
                  fontSize: "13px", fontWeight: 600, fontFamily: SANS, cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Field label="DATES" value={dates} onChange={setDates} placeholder="e.g. August 5–9, 2027" />
        <Field label="LOCATION" value={location} onChange={setLocation} placeholder="e.g. Rhodes Grove Camp, PA" />
        <Field label="REGISTRATION FEE" value={fee} onChange={setFee} placeholder="e.g. $150" />
        <Field label="VERSE REFERENCE" value={verse} onChange={setVerse} placeholder="e.g. Ephesians 4:12" />

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: TSEC, marginBottom: 6, letterSpacing: "0.04em", fontFamily: SANS }}>
            VERSE TEXT (optional)
          </label>
          <textarea
            value={verseText}
            onChange={(e) => setVerseText(e.target.value)}
            placeholder="Full verse text…"
            rows={3}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: `1px solid ${BORDER}`, fontSize: "15px", fontFamily: SANS,
              color: NAVY, resize: "vertical", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <Field
          label="NUMBER OF TEAMS"
          value={teamCount}
          onChange={(v) => setTeamCount(v.replace(/\D/g, ""))}
          placeholder="e.g. 12"
        />
        <Field label="REGISTRATION URL (optional)" value={registrationUrl} onChange={setRegistrationUrl} placeholder="https://…" />
      </Card>

      <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginBottom: "1rem", textAlign: "center" }}>
        Event will be created as <strong>inactive</strong> — publish it when ready to go live.
      </div>

      <button
        onClick={save}
        disabled={busy}
        style={{
          width: "100%", background: ORANGE, color: "#fff", border: "none",
          borderRadius: 10, padding: "14px", fontSize: "15px", fontWeight: 700,
          fontFamily: SANS, cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.6 : 1, marginBottom: 10,
        }}
      >
        {busy ? "Creating…" : "Create Event"}
      </button>
    </div>
  );
}
