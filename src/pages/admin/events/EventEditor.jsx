import { useState } from "react";
import { supabase } from "../../../lib/supabase.js";
import { NAVY, ORANGE, TSEC, BORDER, SANS, SERIF } from "../../../lib/constants.js";
import { Card, Field } from "../../../components/ui/index.js";
import { EVENT_TYPES } from "../../../lib/eventTypes.js";

export default function EventEditor({ onSaved, onToast }) {
  const [type, setType] = useState(null);
  return type
    ? <EventForm type={type} onBack={() => setType(null)} onSaved={onSaved} onToast={onToast} />
    : <TypePicker onPick={setType} />;
}

function TypePicker({ onPick }) {
  return (
    <div>
      <div style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 600, color: NAVY, marginBottom: 6 }}>
        What kind of event?
      </div>
      <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, marginBottom: "1.5rem" }}>
        Choose a type — each has its own setup form.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {EVENT_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => onPick(t)}
            style={{
              background: t.bg, border: `1.5px solid ${t.color}22`,
              borderRadius: 16, padding: "1.25rem 1rem",
              cursor: "pointer", textAlign: "left",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 700, color: t.color, fontFamily: SANS, lineHeight: 1.3 }}>
              {t.label}
            </div>
            <div style={{ fontSize: "11px", color: t.color, opacity: 0.7, fontFamily: SANS, marginTop: 3 }}>
              {TYPE_HINTS[t.key]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const TYPE_HINTS = {
  youth_conference:  "Teams, verse, co-leaders",
  annual_conference: "Like youth conf, teams optional",
  open_mic:          "Info + registration link",
  mission:           "Destination, dates, details",
  zoom_meeting:      "Link, audience, agenda",
  board_meeting:     "Location, date, agenda",
};

function EventForm({ type, onBack, onSaved, onToast }) {
  const [fields, setFields] = useState({
    name: "", dates: "", location: "", fee: "",
    verse: "", verse_text: "", team_count: "",
    registration_url: "", zoom_url: "", description: "",
    has_teams: type.key === "youth_conference",
  });
  const [busy, setBusy] = useState(false);

  const set = (k) => (v) => setFields((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!fields.name.trim()) { onToast("Event name is required.", "error"); return; }
    if (type.key === "zoom_meeting" && !fields.zoom_url.trim()) {
      onToast("Zoom link is required.", "error"); return;
    }
    setBusy(true);
    const payload = {
      type: type.key,
      status: "inactive",
      name: fields.name.trim() || null,
      dates: fields.dates.trim() || null,
      location: fields.location.trim() || null,
      fee: fields.fee.trim() || null,
      verse: fields.verse.trim() || null,
      verse_text: fields.verse_text.trim() || null,
      team_count: fields.has_teams && fields.team_count ? parseInt(fields.team_count, 10) : null,
      registration_url: fields.registration_url.trim() || null,
      zoom_url: fields.zoom_url.trim() || null,
      description: fields.description.trim() || null,
    };
    const { error } = await supabase.from("events").insert(payload);
    setBusy(false);
    if (error) { onToast("Could not create event.", "error"); return; }
    onToast(`"${payload.name}" created as inactive.`);
    onSaved();
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: TSEC, fontFamily: SANS, fontSize: "14px", padding: 0 }}>
          ← Types
        </button>
        <span style={{ fontSize: "10px", fontWeight: 700, background: type.bg, color: type.color, borderRadius: 20, padding: "3px 10px", fontFamily: SANS }}>
          {type.label}
        </span>
      </div>

      <Card style={{ marginBottom: "1rem" }}>
        <Field label="NAME" value={fields.name} onChange={set("name")} placeholder={NAME_PLACEHOLDERS[type.key]} />

        {/* Conference fields */}
        {isConference(type.key) && <>
          <Field label="DATES" value={fields.dates} onChange={set("dates")} placeholder="e.g. August 5–9, 2027" />
          <Field label="LOCATION" value={fields.location} onChange={set("location")} placeholder="e.g. Rhodes Grove Camp, PA" />
          <Field label="REGISTRATION FEE" value={fields.fee} onChange={set("fee")} placeholder="e.g. $150" />
          <Field label="VERSE REFERENCE" value={fields.verse} onChange={set("verse")} placeholder="e.g. Ephesians 4:12" />
          <TextareaField label="VERSE TEXT" value={fields.verse_text} onChange={set("verse_text")} placeholder="Full verse text…" rows={3} />

          {type.key === "annual_conference" && (
            <ToggleRow
              label="Has team system"
              sub="Teams, co-leaders, coordinators"
              value={fields.has_teams}
              onChange={(v) => setFields((f) => ({ ...f, has_teams: v }))}
            />
          )}
          {fields.has_teams && (
            <Field label="NUMBER OF TEAMS" value={fields.team_count} onChange={(v) => set("team_count")(v.replace(/\D/g, ""))} placeholder="e.g. 12" />
          )}
          <Field label="REGISTRATION URL" value={fields.registration_url} onChange={set("registration_url")} placeholder="https://…" />
        </>}

        {/* Open Mic */}
        {type.key === "open_mic" && <>
          <Field label="DATES" value={fields.dates} onChange={set("dates")} placeholder="e.g. Saturday, July 12, 2027" />
          <Field label="LOCATION" value={fields.location} onChange={set("location")} placeholder="Venue or address" />
          <Field label="ENTRY FEE" value={fields.fee} onChange={set("fee")} placeholder="e.g. Free / $10 (optional)" />
          <Field label="REGISTRATION URL" value={fields.registration_url} onChange={set("registration_url")} placeholder="https://…" />
          <TextareaField label="DESCRIPTION" value={fields.description} onChange={set("description")} placeholder="What to expect, theme, etc." rows={4} />
        </>}

        {/* Mission */}
        {type.key === "mission" && <>
          <Field label="DESTINATION" value={fields.location} onChange={set("location")} placeholder="e.g. Manila, Philippines" />
          <Field label="DATES" value={fields.dates} onChange={set("dates")} placeholder="e.g. July 5–15, 2027" />
          <Field label="FEE / COST" value={fields.fee} onChange={set("fee")} placeholder="e.g. $1,200 (flights incl.)" />
          <TextareaField label="DESCRIPTION" value={fields.description} onChange={set("description")} placeholder="Mission purpose, activities, what to bring…" rows={5} />
          <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, padding: "0.5rem 0" }}>
            Participant availability submissions can be collected after publishing.
          </div>
        </>}

        {/* Zoom Meeting */}
        {type.key === "zoom_meeting" && <>
          <Field label="DATE & TIME" value={fields.dates} onChange={set("dates")} placeholder="e.g. Sunday, July 13 at 7:00 PM EST" />
          <Field label="ZOOM LINK" value={fields.zoom_url} onChange={set("zoom_url")} placeholder="https://zoom.us/j/…" />
          <Field label="TARGET AUDIENCE" value={fields.location} onChange={set("location")} placeholder="e.g. EM Leaders, All Coordinators" />
          <TextareaField label="AGENDA / DESCRIPTION" value={fields.description} onChange={set("description")} placeholder="Topics, agenda items…" rows={4} />
        </>}

        {/* Board Meeting */}
        {type.key === "board_meeting" && <>
          <Field label="DATE & TIME" value={fields.dates} onChange={set("dates")} placeholder="e.g. Saturday, Aug 2 at 10:00 AM" />
          <Field label="LOCATION" value={fields.location} onChange={set("location")} placeholder="Address or room" />
          <Field label="FEE" value={fields.fee} onChange={set("fee")} placeholder="Optional" />
          <TextareaField label="AGENDA / NOTES" value={fields.description} onChange={set("description")} placeholder="Agenda items, preparation notes…" rows={5} />
        </>}
      </Card>

      <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, textAlign: "center", marginBottom: "1rem" }}>
        Saved as <strong>inactive</strong> — publish when ready to go live.
      </div>
      <button
        onClick={save}
        disabled={busy}
        style={{
          width: "100%", background: type.color, color: "#fff", border: "none",
          borderRadius: 10, padding: "14px", fontSize: "15px", fontWeight: 700,
          fontFamily: SANS, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Creating…" : "Create Event"}
      </button>
    </div>
  );
}

function isConference(key) {
  return key === "youth_conference" || key === "annual_conference";
}

const NAME_PLACEHOLDERS = {
  youth_conference:  "e.g. Set Apart 2027",
  annual_conference: "e.g. Annual Conference 2027",
  open_mic:          "e.g. Spring Open Mic Night",
  mission:           "e.g. Philippines Mission 2027",
  zoom_meeting:      "e.g. EM Leaders Check-in",
  board_meeting:     "e.g. 412 Board Meeting — Q3",
};

function TextareaField({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: TSEC, marginBottom: 6, letterSpacing: "0.04em", fontFamily: SANS }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 10,
          border: `1px solid ${BORDER}`, fontSize: "14px", fontFamily: SANS,
          color: NAVY, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.55,
        }}
      />
    </div>
  );
}

function ToggleRow({ label, sub, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: `1px solid ${BORDER}`, marginBottom: "1rem" }}>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>{label}</div>
        {sub && <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
          background: value ? "#059669" : "#D1D5DB", position: "relative", flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 2, left: value ? 22 : 2,
          width: 20, height: 20, borderRadius: "50%", background: "#fff",
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}
