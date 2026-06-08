import { useState } from "react";
import { supabase } from "../../../lib/supabase.js";
import { TSEC, BORDER, SANS, SERIF } from "../../../lib/constants.js";
import { Card, Field } from "../../../components/ui/index.js";
import { EVENT_TYPES } from "../../../lib/eventTypes.js";

// ── Shared styles ─────────────────────────────────────────────────────────────

const baseInputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: `1px solid ${BORDER}`, fontSize: "14px", fontFamily: SANS,
  color: "#111111", outline: "none", boxSizing: "border-box", background: "#fff",
};

// No appearance:none on selects — kills native picker on iOS/Safari
const selectStyle = { ...baseInputStyle, cursor: "pointer" };

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatDateRange(start, end) {
  if (!start) return null;
  const s = new Date(start + "T12:00:00");
  if (!end || end === start) {
    return s.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  const e = new Date(end + "T12:00:00");
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  if (sameMonth) {
    return `${s.toLocaleDateString("en-US", { month: "long" })} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
  }
  if (sameYear) {
    return `${s.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "long", day: "numeric" })}, ${e.getFullYear()}`;
  }
  return `${s.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
}

function formatTimeLabel(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

// ── Field components ──────────────────────────────────────────────────────────

function FieldLabel({ children, required }) {
  return (
    <div style={{
      fontSize: "12px", fontWeight: 600, color: TSEC,
      letterSpacing: "0.04em", fontFamily: SANS, marginBottom: 6,
      display: "flex", gap: 4, alignItems: "center",
    }}>
      {children}
      {required && <span style={{ color: "#FF4D00", fontSize: "13px", lineHeight: 1 }}>*</span>}
    </div>
  );
}

// Universal date range — used by every event type
function DateRangePicker({ startValue, endValue, onStartChange, onEndChange, required }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <FieldLabel required={required}>DATES</FieldLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginBottom: 4 }}>Start date</div>
          <input
            type="date"
            value={startValue}
            onChange={(e) => onStartChange(e.target.value)}
            style={{ ...baseInputStyle, maxWidth: "100%" }}
          />
        </div>
        <div>
          <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginBottom: 4 }}>End date</div>
          <input
            type="date"
            value={endValue}
            min={startValue || undefined}
            onChange={(e) => onEndChange(e.target.value)}
            style={{ ...baseInputStyle, maxWidth: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}

// Optional time field — for meetings that have a specific start time
function TimePicker({ value, onChange }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <FieldLabel>START TIME</FieldLabel>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={baseInputStyle}
      />
    </div>
  );
}

const AUDIENCE_OPTIONS = [
  { value: "all",          label: "All Members" },
  { value: "leaders",      label: "Leaders only" },
  { value: "em_leaders",   label: "EM Leaders" },
  { value: "mm_leaders",   label: "MM Leaders" },
  { value: "coordinators", label: "Coordinators" },
  { value: "em",           label: "English Ministry (all)" },
  { value: "mm",           label: "Mongolian Ministry (all)" },
  { value: "board",        label: "Board Members" },
];

function AudienceSelect({ value, onChange }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <FieldLabel>AUDIENCE</FieldLabel>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
        {AUDIENCE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 4, required }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...baseInputStyle, resize: "vertical", lineHeight: 1.55 }}
      />
    </div>
  );
}

function ToggleRow({ label, sub, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: `1px solid ${BORDER}`, marginBottom: "1rem" }}>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#111111", fontFamily: SANS }}>{label}</div>
        {sub && <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: value ? "#059669" : "#D1D5DB", position: "relative", flexShrink: 0 }}
      >
        <span style={{ position: "absolute", top: 2, left: value ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
      </button>
    </div>
  );
}

// Required-fields legend shown at top of form
function RequiredNote() {
  return (
    <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginBottom: "1rem" }}>
      Fields marked <span style={{ color: "#FF4D00", fontWeight: 700 }}>*</span> are required.
    </div>
  );
}

// ── TypePicker ────────────────────────────────────────────────────────────────

const TYPE_HINTS = {
  youth_conference:  "Multi-day · teams, verse, co-leaders",
  annual_conference: "Multi-day · team system optional",
  open_mic:          "Date range · info + registration",
  mission:           "Multi-day · destination, details",
  zoom_meeting:      "Date + time · link, audience",
  board_meeting:     "Date + time · location, agenda",
};

function TypePicker({ onPick }) {
  return (
    <div>
      <div style={{ fontFamily: SANS, fontSize: "22px", fontWeight: 600, color: "#111111", marginBottom: 6 }}>
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
            style={{ background: t.bg, border: `1.5px solid ${t.color}22`, borderRadius: 16, padding: "1.25rem 1rem", cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ fontSize: "13px", fontWeight: 700, color: t.color, fontFamily: SANS, lineHeight: 1.3 }}>{t.label}</div>
            <div style={{ fontSize: "11px", color: t.color, opacity: 0.7, fontFamily: SANS, marginTop: 3 }}>{TYPE_HINTS[t.key]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── EventForm ─────────────────────────────────────────────────────────────────

const NAME_PLACEHOLDERS = {
  youth_conference:  "e.g. Set Apart 2027",
  annual_conference: "e.g. Annual Conference 2027",
  open_mic:          "e.g. Spring Open Mic Night",
  mission:           "e.g. Philippines Mission 2027",
  zoom_meeting:      "e.g. EM Leaders Check-in",
  board_meeting:     "e.g. 412 Board Meeting — Q3",
};

function isConference(key) {
  return key === "youth_conference" || key === "annual_conference";
}

function isMeeting(key) {
  return key === "zoom_meeting" || key === "board_meeting";
}

function RequiredField({ label, value, onChange, placeholder, required }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={baseInputStyle}
      />
    </div>
  );
}

function EventForm({ type, onBack, onSaved, onToast }) {
  const [fields, setFields] = useState({
    name: "",
    startDate: "", endDate: "",
    startTime: "",
    location: "",
    fee: "", verse: "", verse_text: "", team_count: "",
    registration_url: "", zoom_url: "", description: "",
    audience: "all",
    has_teams: type.key === "youth_conference",
    visible_to_public: false,
    allow_join_requests: false,
  });
  const [busy, setBusy] = useState(false);

  const set = (k) => (v) => setFields((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!fields.name.trim()) {
      onToast("Event name is required.", "error"); return;
    }
    if (!fields.startDate) {
      onToast("Start date is required.", "error"); return;
    }
    if (type.key === "zoom_meeting" && !fields.zoom_url.trim()) {
      onToast("Zoom link is required.", "error"); return;
    }

    // Build human-readable dates string
    let datesStr = formatDateRange(fields.startDate, fields.endDate);
    if (isMeeting(type.key) && fields.startTime) {
      const dayStr = datesStr || "";
      datesStr = dayStr ? `${dayStr} at ${formatTimeLabel(fields.startTime)}` : formatTimeLabel(fields.startTime);
    }

    setBusy(true);
    const payload = {
      type: type.key,
      status: "inactive",
      name: fields.name.trim() || null,
      dates: datesStr || null,
      start_date: fields.startDate || null,
      end_date: fields.endDate || fields.startDate || null,
      start_time: fields.startTime || null,
      location: fields.location.trim() || null,
      fee: fields.fee.trim() || null,
      verse: fields.verse.trim() || null,
      verse_text: fields.verse_text.trim() || null,
      team_count: fields.has_teams && fields.team_count ? parseInt(fields.team_count, 10) : null,
      registration_url: fields.registration_url.trim() || null,
      zoom_url: fields.zoom_url.trim() || null,
      description: fields.description.trim() || null,
      audience: fields.audience || "all",
      visible_to_public: fields.visible_to_public,
      allow_join_requests: fields.allow_join_requests,
    };
    const { error } = await supabase.from("events").insert(payload);
    setBusy(false);
    if (error) {
      console.error(error);
      onToast("Could not create event: " + (error.message || "unknown error"), "error");
      return;
    }
    onToast(`"${payload.name}" created as inactive.`);
    onSaved();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: TSEC, fontFamily: SANS, fontSize: "14px", padding: 0 }}>
          ← Types
        </button>
        <span style={{ fontSize: "10px", fontWeight: 700, background: type.bg, color: type.color, borderRadius: 20, padding: "3px 10px", fontFamily: SANS }}>
          {type.label}
        </span>
      </div>

      <RequiredNote />

      <Card style={{ marginBottom: "1rem" }}>

        {/* Name — required for all */}
        <div style={{ marginBottom: "1rem" }}>
          <FieldLabel required>NAME</FieldLabel>
          <input
            type="text"
            value={fields.name}
            onChange={(e) => set("name")(e.target.value)}
            placeholder={NAME_PLACEHOLDERS[type.key]}
            style={baseInputStyle}
          />
        </div>

        {/* ── Conferences ─────────────────────────────────── */}
        {isConference(type.key) && <>
          <DateRangePicker
            required
            startValue={fields.startDate} endValue={fields.endDate}
            onStartChange={set("startDate")} onEndChange={set("endDate")}
          />
          <Field label="LOCATION" value={fields.location} onChange={set("location")} placeholder="e.g. Rhodes Grove Camp, PA" />
          <Field label="REGISTRATION FEE" value={fields.fee} onChange={set("fee")} placeholder="e.g. $150" />
          <Field label="VERSE REFERENCE" value={fields.verse} onChange={set("verse")} placeholder="e.g. Ephesians 4:12" />
          <TextareaField label="VERSE TEXT" value={fields.verse_text} onChange={set("verse_text")} placeholder="Full verse text…" rows={3} />
          {type.key === "annual_conference" && (
            <ToggleRow label="Has team system" sub="Teams, co-leaders, coordinators" value={fields.has_teams} onChange={(v) => setFields((f) => ({ ...f, has_teams: v }))} />
          )}
          {fields.has_teams && (
            <Field label="NUMBER OF TEAMS" value={fields.team_count} onChange={(v) => set("team_count")(v.replace(/\D/g, ""))} placeholder="e.g. 12" />
          )}
          <Field label="REGISTRATION URL" value={fields.registration_url} onChange={set("registration_url")} placeholder="https://…" />
        </>}

        {/* ── Open Mic ─────────────────────────────────────── */}
        {type.key === "open_mic" && <>
          <DateRangePicker
            required
            startValue={fields.startDate} endValue={fields.endDate}
            onStartChange={set("startDate")} onEndChange={set("endDate")}
          />
          <Field label="LOCATION" value={fields.location} onChange={set("location")} placeholder="Venue or address" />
          <Field label="ENTRY FEE" value={fields.fee} onChange={set("fee")} placeholder="e.g. Free / $10" />
          <Field label="REGISTRATION URL" value={fields.registration_url} onChange={set("registration_url")} placeholder="https://…" />
          <TextareaField label="DESCRIPTION" value={fields.description} onChange={set("description")} placeholder="What to expect, theme, etc." rows={4} />
        </>}

        {/* ── Mission ──────────────────────────────────────── */}
        {type.key === "mission" && <>
          <Field label="DESTINATION" value={fields.location} onChange={set("location")} placeholder="e.g. Manila, Philippines" />
          <DateRangePicker
            required
            startValue={fields.startDate} endValue={fields.endDate}
            onStartChange={set("startDate")} onEndChange={set("endDate")}
          />
          <Field label="FEE / COST" value={fields.fee} onChange={set("fee")} placeholder="e.g. $1,200 (flights incl.)" />
          <TextareaField label="DESCRIPTION" value={fields.description} onChange={set("description")} placeholder="Mission purpose, activities, what to bring…" rows={5} />
        </>}

        {/* ── Zoom Meeting ─────────────────────────────────── */}
        {type.key === "zoom_meeting" && <>
          <DateRangePicker
            required
            startValue={fields.startDate} endValue={fields.endDate}
            onStartChange={set("startDate")} onEndChange={set("endDate")}
          />
          <TimePicker value={fields.startTime} onChange={set("startTime")} />
          <div style={{ marginBottom: "1rem" }}>
            <FieldLabel required>ZOOM LINK</FieldLabel>
            <input
              type="url"
              value={fields.zoom_url}
              onChange={(e) => set("zoom_url")(e.target.value)}
              placeholder="https://zoom.us/j/…"
              style={baseInputStyle}
            />
          </div>
          <TextareaField label="AGENDA / DESCRIPTION" value={fields.description} onChange={set("description")} placeholder="Topics, agenda items…" rows={4} />
        </>}

        {/* ── Board Meeting ─────────────────────────────────── */}
        {type.key === "board_meeting" && <>
          <DateRangePicker
            required
            startValue={fields.startDate} endValue={fields.endDate}
            onStartChange={set("startDate")} onEndChange={set("endDate")}
          />
          <TimePicker value={fields.startTime} onChange={set("startTime")} />
          <Field label="LOCATION" value={fields.location} onChange={set("location")} placeholder="Address or room" />
          <TextareaField label="AGENDA / NOTES" value={fields.description} onChange={set("description")} placeholder="Agenda items, preparation notes…" rows={5} />
        </>}

        {/* Audience — applies to all event types */}
        <AudienceSelect value={fields.audience} onChange={set("audience")} />

        {/* Visibility */}
        <ToggleRow
          label="Visible to public"
          sub="Show in the public Events browser"
          value={fields.visible_to_public}
          onChange={set("visible_to_public")}
        />
        {fields.visible_to_public && (
          <ToggleRow
            label="Allow join requests"
            sub="Members can request to join this event"
            value={fields.allow_join_requests}
            onChange={set("allow_join_requests")}
          />
        )}

      </Card>

      <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, textAlign: "center", marginBottom: "1rem" }}>
        Saved as <strong>inactive</strong> — publish when ready.
      </div>
      <button
        onClick={save}
        disabled={busy}
        style={{
          width: "100%", background: "#FF4D00", color: "#fff", border: "none",
          borderRadius: 10, padding: "14px", fontSize: "15px", fontWeight: 700,
          fontFamily: SANS, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Creating…" : "Create Event"}
      </button>
    </div>
  );
}

export default function EventEditor({ onSaved, onToast }) {
  const [type, setType] = useState(null);
  return type
    ? <EventForm type={type} onBack={() => setType(null)} onSaved={onSaved} onToast={onToast} />
    : <TypePicker onPick={setType} />;
}
