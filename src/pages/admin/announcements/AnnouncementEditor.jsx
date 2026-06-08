import { useState } from "react";
import { supabase } from "../../../lib/supabase.js";
import { TSEC, BORDER, SANS, SERIF } from "../../../lib/constants.js";
import { Card, Field, Button } from "../../../components/ui/index.js";
import { sendEmail as sendEmailFn, sendAnnouncementEmails } from "../../../lib/email.js";
import { matchesAudience } from "../../../lib/utils.js";

const AUDIENCE_TYPES = [
  { value: "all",      label: "Everyone" },
  { value: "ministry", label: "By Ministry" },
  { value: "team",     label: "By Team" },
  { value: "role",     label: "By Role" },
];

const MINISTRIES = ["EM", "MM"];
const ROLES = ["leader", "coordinator"];

export default function AnnouncementEditor({ data, ann, isAdmin, onSaved, onToast, onCancel }) {
  const { allEvents, profile } = data;
  const activeEventId = data.activeEvent?.id || null;

  const [title, setTitle] = useState(ann?.title || "");
  const [body, setBody] = useState(ann?.body || "");
  const [audienceType, setAudienceType] = useState(() => {
    if (!ann?.audience || ann.audience.length === 0) return "all";
    return ann.audience[0]?.type || "all";
  });
  const [audienceValue, setAudienceValue] = useState(() => {
    if (!ann?.audience || ann.audience.length === 0) return "";
    return ann.audience[0]?.value || "";
  });
  const [busy, setBusy] = useState(false);
  const [sendEmailToggle, setSendEmailToggle] = useState(false);

  const buildAudience = () => {
    if (audienceType === "all") return [{ type: "all" }];
    if (audienceType === "ministry") return [{ type: "ministry", value: audienceValue }];
    if (audienceType === "team") return [{ type: "team", value: audienceValue }];
    if (audienceType === "role") return [{ type: "role", value: audienceValue }];
    return [{ type: "all" }];
  };

  const save = async (submitForApproval = false) => {
    if (!title.trim()) { onToast("Title is required.", "error"); return; }
    if (!body.trim())  { onToast("Body is required.", "error"); return; }

    setBusy(true);
    const payload = {
      title: title.trim(),
      body: body.trim(),
      audience: buildAudience(),
      event_id: activeEventId,
    };

    let status;
    if (submitForApproval) {
      status = isAdmin ? "published" : "pending_approval";
    } else {
      status = "draft";
    }
    payload.status = status;

    let error;
    if (ann?.id) {
      ({ error } = await supabase.from("announcements").update(payload).eq("id", ann.id));
    } else {
      payload.posted_by = profile.id;
      ({ error } = await supabase.from("announcements").insert(payload));
    }

    setBusy(false);
    if (error) { onToast("Could not save.", "error"); return; }

    // Email sending for published announcements
    if (status === "published" && sendEmailToggle) {
      const audience = buildAudience();
      const allProfiles = data.allProfiles || [];
      const matched = allProfiles.filter((p) =>
        matchesAudience(audience, {
          id: p.id,
          ministry: p.ministry,
          team_number: p.team_number,
          event_role: p.event_role,
        })
      );
      (async () => {
        let count = 0;
        for (const p of matched) {
          if (p.email) {
            const ok = await sendEmailFn(
              p.email,
              payload.title,
              `<p>Hi ${p.full_name || "there"},</p><p><strong>${payload.title}</strong></p><p>${payload.body}</p>`
            );
            if (ok) count++;
          }
        }
        onToast(`Announcement published · email sent to ${count} ${count === 1 ? "person" : "people"}`);
      })();
    } else {
      const msg = status === "published"
        ? "Announcement published!"
        : status === "pending_approval"
          ? "Submitted for admin approval."
          : "Saved as draft.";
      onToast(msg);
      if (status === "published" && activeEventId) {
        sendAnnouncementEmails(buildAudience(), { title: payload.title, body: payload.body }, activeEventId);
      }
    }

    onSaved();
  };

  const audienceNeedsValue = audienceType !== "all";

  return (
    <div>
      <div style={{ fontFamily: SANS, fontSize: "18px", fontWeight: 600, color: "#111111", marginBottom: "1.25rem" }}>
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
              color: "#111111", resize: "vertical", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Audience */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: TSEC, marginBottom: 6, letterSpacing: "0.04em", fontFamily: SANS }}>
            AUDIENCE
          </label>
          <select
            value={audienceType}
            onChange={(e) => { setAudienceType(e.target.value); setAudienceValue(""); }}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: "15px", fontFamily: SANS, color: "#111111", background: "#fff", outline: "none" }}
          >
            {AUDIENCE_TYPES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>

          {audienceType === "ministry" && (
            <select
              value={audienceValue}
              onChange={(e) => setAudienceValue(e.target.value)}
              style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: "15px", fontFamily: SANS, color: "#111111", background: "#fff", outline: "none" }}
            >
              <option value="">Select ministry</option>
              {MINISTRIES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          {audienceType === "team" && (
            <input
              type="number"
              min={1}
              max={20}
              value={audienceValue}
              onChange={(e) => setAudienceValue(e.target.value)}
              placeholder="Team number"
              style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: "15px", fontFamily: SANS, color: "#111111", outline: "none", boxSizing: "border-box" }}
            />
          )}
          {audienceType === "role" && (
            <select
              value={audienceValue}
              onChange={(e) => setAudienceValue(e.target.value)}
              style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: "15px", fontFamily: SANS, color: "#111111", background: "#fff", outline: "none" }}
            >
              <option value="">Select role</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </div>
      </Card>

      {isAdmin && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "0.75rem 1rem", marginBottom: "0.5rem",
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10,
        }}>
          <input
            id="send-email-toggle"
            type="checkbox"
            checked={sendEmailToggle}
            onChange={(e) => setSendEmailToggle(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "#111111", cursor: "pointer", flexShrink: 0 }}
          />
          <label htmlFor="send-email-toggle" style={{ fontSize: "14px", color: "#111111", fontFamily: SANS, cursor: "pointer", fontWeight: 500 }}>
            Also send email to audience
          </label>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Primary action */}
        <button
          onClick={() => save(true)}
          disabled={busy}
          style={{
            background: "#FF4D00", color: "#fff", border: "none", borderRadius: 10,
            padding: "14px", fontSize: "15px", fontWeight: 700, fontFamily: SANS,
            cursor: "pointer", width: "100%",
          }}
        >
          {busy ? "Saving…" : isAdmin ? "Publish now" : "Submit for approval"}
        </button>

        {/* Save as draft */}
        <button
          onClick={() => save(false)}
          disabled={busy}
          style={{
            background: "#fff", color: "#111111", border: "1px solid #E5E5E5", borderRadius: 10,
            padding: "12px", fontSize: "14px", fontWeight: 600, fontFamily: SANS,
            cursor: "pointer", width: "100%",
          }}
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
