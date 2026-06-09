import { useState, useRef } from "react";
import { supabase } from "../../../lib/supabase.js";
import { TSEC, BORDER, SANS } from "../../../lib/constants.js";
import { Card, Field } from "../../../components/ui/index.js";

// All roles in the platform hierarchy
const ROLE_OPTIONS = [
  { value: "leader",      label: "Leader (event)" },
  { value: "coordinator", label: "Coordinator (event)" },
  { value: "participant", label: "Participant (event)" },
  { value: "volunteer",   label: "Volunteer (event)" },
  { value: "member",      label: "Member (platform)" },
  { value: "moderator",   label: "Moderator (platform)" },
  { value: "admin",       label: "Admin (platform)" },
];

const AUDIENCE_TYPES = [
  { value: "all",    label: "Everyone" },
  { value: "role",   label: "By Role" },
  { value: "team",   label: "By Event & Team" },
  { value: "person", label: "Specific People" },
];

// ── Person search component ───────────────────────────────────────────────────

function PersonPicker({ allProfiles, selected, onChange }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const selectedIds = new Set(selected.map((p) => p.id));
  const results = query.trim().length > 0
    ? (allProfiles || []).filter(
        (p) =>
          !selectedIds.has(p.id) &&
          (p.full_name || "").toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  function add(p) {
    onChange([...selected, { id: p.id, full_name: p.full_name }]);
    setQuery("");
    inputRef.current?.focus();
  }

  function remove(id) {
    onChange(selected.filter((p) => p.id !== id));
  }

  return (
    <div style={{ marginTop: 8 }}>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {selected.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 5, background: "#1B2A4A", color: "#fff", borderRadius: 20, padding: "4px 10px 4px 12px", fontSize: "13px", fontFamily: SANS }}>
              {p.full_name}
              <button
                onClick={() => remove(p.id)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 0, fontSize: 16, lineHeight: 1, marginLeft: 2 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 10,
            border: `1px solid ${BORDER}`, fontSize: "14px", fontFamily: SANS,
            color: "#1B2A4A", outline: "none", boxSizing: "border-box",
          }}
        />
        {results.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
            background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10,
            marginTop: 4, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          }}>
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => add(p)}
                style={{
                  width: "100%", background: "none", border: "none", cursor: "pointer",
                  padding: "10px 14px", textAlign: "left", fontFamily: SANS,
                  fontSize: "14px", color: "#1B2A4A", borderBottom: `1px solid ${BORDER}`,
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FF4D00", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff", fontFamily: SANS }}>
                    {(p.full_name || "?")[0]}
                  </span>
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.full_name}</div>
                  {p.email && <div style={{ fontSize: "11px", color: TSEC }}>{p.email}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected.length === 0 && (
        <div style={{ fontSize: "12px", color: TSEC, marginTop: 6, fontFamily: SANS }}>
          Start typing to search for people to target.
        </div>
      )}
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────

export default function AnnouncementEditor({ data, ann, isAdmin, onSaved, onToast, onCancel }) {
  const { allEvents = [], allProfiles = [], profile } = data;
  const activeEventId = data.activeEvent?.id || null;

  const [title, setTitle] = useState(ann?.title || "");
  const [body, setBody] = useState(ann?.body || "");

  // Parse existing audience
  const initAudienceType = () => {
    if (!ann?.audience || ann.audience.length === 0) return "all";
    const t = ann.audience[0]?.type;
    if (t === "person") return "person";
    return t || "all";
  };
  const [audienceType, setAudienceType] = useState(initAudienceType);
  const [audienceValue, setAudienceValue] = useState(() => {
    if (!ann?.audience || ann.audience.length === 0) return "";
    return ann.audience[0]?.value || "";
  });
  const [selectedEventId, setSelectedEventId] = useState(() => {
    if (!ann?.audience || ann.audience.length === 0) return activeEventId || "";
    return ann.audience[0]?.event_id || activeEventId || "";
  });
  const [selectedPeople, setSelectedPeople] = useState(() => {
    if (!ann?.audience) return [];
    const people = ann.audience.filter((r) => r.type === "person");
    return people.map((r) => {
      const p = (allProfiles || []).find((x) => x.id === r.value);
      return p ? { id: p.id, full_name: p.full_name } : { id: r.value, full_name: r.value };
    });
  });

  const [busy, setBusy] = useState(false);
  const [sendEmailToggle, setSendEmailToggle] = useState(ann?.send_email || false);
  const [sendPushToggle, setSendPushToggle] = useState(ann?.send_push ?? true);
  const [scheduledAt, setScheduledAt] = useState(() => toLocalDateTime(ann?.publish_at));

  const buildAudience = () => {
    if (audienceType === "all") return [{ type: "all" }];
    if (audienceType === "role") return audienceValue ? [{ type: "role", value: audienceValue }] : [{ type: "all" }];
    if (audienceType === "team") return audienceValue ? [{ type: "team", value: audienceValue, event_id: selectedEventId || null }] : [{ type: "all" }];
    if (audienceType === "person") return selectedPeople.length > 0 ? selectedPeople.map((p) => ({ type: "person", value: p.id })) : [{ type: "all" }];
    return [{ type: "all" }];
  };

  const audienceSummary = () => {
    if (audienceType === "all") return "Everyone";
    if (audienceType === "role") return audienceValue ? `Role: ${audienceValue}` : "Everyone";
    if (audienceType === "team") {
      const ev = allEvents.find((e) => e.id === selectedEventId);
      return audienceValue ? `Team ${audienceValue}${ev ? ` · ${ev.name}` : ""}` : "Everyone";
    }
    if (audienceType === "person") return selectedPeople.length > 0 ? `${selectedPeople.length} person${selectedPeople.length !== 1 ? "s" : ""}` : "Everyone";
    return "Everyone";
  };

  const save = async (mode) => {
    if (!title.trim()) { onToast("Title is required.", "error"); return; }
    if (!body.trim())  { onToast("Body is required.", "error"); return; }
    if (mode === "schedule") {
      const scheduleDate = new Date(scheduledAt);
      if (!scheduledAt || Number.isNaN(scheduleDate.getTime())) {
        onToast("Choose a valid schedule date and time.", "error");
        return;
      }
      if (scheduleDate.getTime() <= Date.now()) {
        onToast("Schedule time must be in the future.", "error");
        return;
      }
    }

    setBusy(true);
    const publishAt = mode === "publish"
      ? new Date().toISOString()
      : mode === "schedule"
        ? new Date(scheduledAt).toISOString()
        : null;
    const payload = {
      title: title.trim(),
      body: body.trim(),
      audience: buildAudience(),
      event_id: audienceType === "team" ? selectedEventId || activeEventId : activeEventId,
      publish_at: publishAt,
      send_email: isAdmin && sendEmailToggle,
      send_push: isAdmin ? sendPushToggle : true,
      delivery_error: null,
    };

    payload.status = mode === "submit" ? "pending_approval" : "draft";
    if (mode === "publish" || mode === "schedule") payload.approved_by = profile.id;

    let error;
    if (ann?.id) {
      ({ error } = await supabase.from("announcements").update(payload).eq("id", ann.id));
    } else {
      payload.posted_by = profile.id;
      ({ error } = await supabase.from("announcements").insert(payload));
    }

    if (error) {
      setBusy(false);
      onToast("Could not save.", "error");
      return;
    }

    if (mode === "publish") {
      const { error: processorError } = await supabase.functions.invoke("process-scheduled", { body: {} });
      onToast(processorError ? "Announcement queued and will publish within one minute." : "Announcement published!");
    } else if (mode === "schedule") {
      onToast(`Announcement scheduled for ${formatScheduleDate(publishAt)}.`);
    } else if (mode === "submit") {
      onToast("Submitted for admin approval.");
    } else {
      onToast("Saved as draft.");
    }

    setBusy(false);
    onSaved();
  };

  return (
    <div>
      <div style={{ fontFamily: SANS, fontSize: "18px", fontWeight: 600, color: "#1B2A4A", marginBottom: "1.25rem" }}>
        {ann?.id ? "Edit Announcement" : "New Announcement"}
      </div>

      <Card style={{ marginBottom: "1rem" }}>
        <Field label="TITLE" value={title} onChange={setTitle} placeholder="Announcement title" />

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: TSEC, marginBottom: 6, letterSpacing: "0.04em", fontFamily: SANS }}>
            MESSAGE
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your announcement here…"
            rows={5}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: `1px solid ${BORDER}`, fontSize: "15px", fontFamily: SANS,
              color: "#1B2A4A", resize: "vertical", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Audience */}
        <div style={{ marginBottom: "0.5rem" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: TSEC, marginBottom: 6, letterSpacing: "0.04em", fontFamily: SANS }}>
            AUDIENCE
          </label>

          {/* Type selector — pill buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {AUDIENCE_TYPES.map((a) => (
              <button
                key={a.value}
                onClick={() => { setAudienceType(a.value); setAudienceValue(""); setSelectedPeople([]); }}
                style={{
                  background: audienceType === a.value ? "#1B2A4A" : "#F5F5F5",
                  color: audienceType === a.value ? "#fff" : "#666",
                  border: "none", borderRadius: 20, padding: "6px 14px",
                  fontSize: "13px", fontWeight: 600, fontFamily: SANS, cursor: "pointer",
                }}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Role selector */}
          {audienceType === "role" && (
            <select
              value={audienceValue}
              onChange={(e) => setAudienceValue(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: "14px", fontFamily: SANS, color: "#1B2A4A", background: "#fff", outline: "none" }}
            >
              <option value="">Select role…</option>
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          )}

          {/* Team — event selector + team number */}
          {audienceType === "team" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: "14px", fontFamily: SANS, color: "#1B2A4A", background: "#fff", outline: "none" }}
              >
                <option value="">Select event…</option>
                {allEvents.filter((e) => e.status !== "archived").map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={24}
                value={audienceValue}
                onChange={(e) => setAudienceValue(e.target.value)}
                placeholder="Team number"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: "14px", fontFamily: SANS, color: "#1B2A4A", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          )}

          {/* Person search */}
          {audienceType === "person" && (
            <PersonPicker
              allProfiles={allProfiles}
              selected={selectedPeople}
              onChange={setSelectedPeople}
            />
          )}

          {/* Summary pill */}
          <div style={{ marginTop: 8, fontSize: "12px", color: TSEC, fontFamily: SANS }}>
            Sending to: <strong style={{ color: "#1B2A4A" }}>{audienceSummary()}</strong>
          </div>
        </div>
      </Card>

      {isAdmin && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.75rem 1rem", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10 }}>
            <input id="send-push-toggle" type="checkbox" checked={sendPushToggle} onChange={(e) => setSendPushToggle(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#FF4D00", cursor: "pointer", flexShrink: 0 }} />
            <label htmlFor="send-push-toggle" style={{ fontSize: "14px", color: "#1B2A4A", fontFamily: SANS, cursor: "pointer", fontWeight: 500 }}>
              Send push notification to audience
            </label>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.75rem 1rem", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10 }}>
            <input id="send-email-toggle" type="checkbox" checked={sendEmailToggle} onChange={(e) => setSendEmailToggle(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#FF4D00", cursor: "pointer", flexShrink: 0 }} />
            <label htmlFor="send-email-toggle" style={{ fontSize: "14px", color: "#1B2A4A", fontFamily: SANS, cursor: "pointer", fontWeight: 500 }}>
              Also send email to audience
            </label>
          </div>
          <div style={{ padding: "0.85rem 1rem", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10 }}>
            <label htmlFor="announcement-schedule" style={{ display: "block", fontSize: "11px", fontWeight: 800, color: TSEC, letterSpacing: "0.08em", fontFamily: SANS, marginBottom: 6 }}>
              SCHEDULE DATE & TIME
            </label>
            <input
              id="announcement-schedule"
              type="datetime-local"
              value={scheduledAt}
              min={toLocalDateTime(new Date().toISOString())}
              onChange={(event) => setScheduledAt(event.target.value)}
              style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 9, padding: "10px 12px", fontSize: "14px", fontFamily: SANS, color: "#1B2A4A", boxSizing: "border-box", background: "#fff" }}
            />
            <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginTop: 6 }}>
              Uses your device's local time. Email and push options above will run at the same time.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => save(isAdmin ? "publish" : "submit")}
          disabled={busy}
          style={{ background: "#FF4D00", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: "15px", fontWeight: 700, fontFamily: SANS, cursor: "pointer", width: "100%" }}
        >
          {busy ? "Saving…" : isAdmin ? "Publish now" : "Submit for approval"}
        </button>
        {isAdmin && (
          <button
            onClick={() => save("schedule")}
            disabled={busy || !scheduledAt}
            style={{ background: "#1B2A4A", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: "14px", fontWeight: 700, fontFamily: SANS, cursor: busy || !scheduledAt ? "not-allowed" : "pointer", width: "100%", opacity: busy || !scheduledAt ? 0.45 : 1 }}
          >
            Schedule announcement
          </button>
        )}
        <button
          onClick={() => save("draft")}
          disabled={busy}
          style={{ background: "#fff", color: "#1B2A4A", border: "1px solid #E5E5E5", borderRadius: 10, padding: "12px", fontSize: "14px", fontWeight: 600, fontFamily: SANS, cursor: "pointer", width: "100%" }}
        >
          Save as draft
        </button>
        <button
          onClick={onCancel}
          style={{ background: "none", border: "none", color: TSEC, fontSize: "13px", cursor: "pointer", fontFamily: SANS, padding: "8px 0" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatScheduleDate(value) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
