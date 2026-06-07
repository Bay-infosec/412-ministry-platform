import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { TSEC, BORDER, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, SectionLabel, Avatar } from "../../components/ui/index.js";
import { CHECKLIST_ITEMS } from "../../lib/checklist.js";

export default function MyTeam({ data, onBack }) {
  const { eventMember, eventChecklist, coLeader, coLeaderChecklist, coLeaderVisited, coordinator } = data;

  const [items, setItems] = useState(eventChecklist?.items || {});
  const [saving, setSaving] = useState(null);

  // Team name
  const [teamName, setTeamName] = useState(eventMember?.team_name || "");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(eventMember?.team_name || "");
  const [nameSaving, setNameSaving] = useState(false);

  async function saveTeamName() {
    const trimmed = nameDraft.trim();
    setNameSaving(true);
    // Update all members on this team so co-leader sees the same name
    await supabase
      .from("event_members")
      .update({ team_name: trimmed || null })
      .eq("event_id", eventMember.event_id)
      .eq("team_number", eventMember.team_number);
    setTeamName(trimmed);
    setNameSaving(false);
    setEditingName(false);
  }

  const doneCount = CHECKLIST_ITEMS.filter((i) => items[i.id]).length;
  const allDone = doneCount === CHECKLIST_ITEMS.length;

  async function toggle(id) {
    const next = { ...items, [id]: !items[id] };
    setItems(next);
    setSaving(id);
    await supabase
      .from("event_checklist")
      .update({ items: next })
      .eq("event_member_id", eventMember.id);
    setSaving(null);
  }

  const coLeaderItems = coLeaderChecklist?.items || {};
  const coLeaderDone = CHECKLIST_ITEMS.filter((i) => coLeaderItems[i.id]).length;

  if (!eventMember) {
    return (
      <Shell withNav>
        <BackBtn onBack={onBack} />
        <div style={{ textAlign: "center", marginTop: "4rem", color: TSEC, fontFamily: SANS, fontSize: "14px" }}>
          No team assignment yet.
        </div>
      </Shell>
    );
  }

  return (
    <Shell withNav>
      <BackBtn onBack={onBack} />

      {/* Team header */}
      <div style={{ background: "#111111", borderRadius: 16, padding: "1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.14em", color: "#FF4D00", textTransform: "uppercase", marginBottom: "0.25rem", fontFamily: SANS }}>
          Your Team
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <div style={{ fontFamily: SANS, fontSize: "52px", fontWeight: 900, color: "#FF4D00", lineHeight: 1 }}>
            {eventMember.team_number || "—"}
          </div>
          {!editingName && (
            <button
              onClick={() => { setNameDraft(teamName); setEditingName(true); }}
              style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: SANS, fontSize: "12px", fontWeight: 600, color: "#fff" }}
            >
              {teamName ? "Rename" : "Set team name"}
            </button>
          )}
        </div>

        {/* Team name display or edit */}
        {editingName ? (
          <div style={{ display: "flex", gap: 8, marginBottom: "0.5rem" }}>
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveTeamName(); if (e.key === "Escape") setEditingName(false); }}
              placeholder="e.g. Team Courage"
              maxLength={40}
              style={{
                flex: 1, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 8, padding: "8px 12px", color: "#fff", fontFamily: SANS, fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              onClick={saveTeamName}
              disabled={nameSaving}
              style={{ background: "#FF4D00", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: SANS, fontSize: "13px", fontWeight: 700, color: "#fff" }}
            >
              {nameSaving ? "…" : "Save"}
            </button>
            <button
              onClick={() => setEditingName(false)}
              style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontFamily: SANS, fontSize: "13px", color: "#fff" }}
            >
              ✕
            </button>
          </div>
        ) : teamName ? (
          <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "0.25rem" }}>
            {teamName}
          </div>
        ) : null}

        {eventMember.ministry && (
          <div style={{ fontSize: "13px", color: "#B8C0D0", fontFamily: SANS, letterSpacing: "0.06em" }}>
            {eventMember.ministry}
          </div>
        )}
      </div>

      {/* Co-leader */}
      <SectionLabel>Co-Leader</SectionLabel>
      {coLeader ? (
        <Card style={{ padding: "1rem 1.25rem", marginBottom: "1rem" }}>
          {/* Name + avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "0.875rem" }}>
            <Avatar url={coLeader.photo_url} name={coLeader.full_name} size={48} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#111111", fontFamily: SANS }}>{coLeader.full_name}</div>
              {coLeader.churches?.name && (
                <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>{coLeader.churches.name}</div>
              )}
            </div>
          </div>

          {/* Co-leader checklist progress */}
          <div style={{ marginBottom: "0.875rem" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: TSEC, textTransform: "uppercase", fontFamily: SANS, marginBottom: 8 }}>
              Checklist
            </div>
            {!coLeaderVisited ? (
              <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, fontStyle: "italic" }}>
                Not started yet
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: "11px", color: TSEC, fontFamily: SANS }}>{coLeaderDone} / {CHECKLIST_ITEMS.length} done</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: BORDER, overflow: "hidden", marginBottom: 10 }}>
                  <div style={{ height: "100%", borderRadius: 3, background: "#FF4D00", width: `${(coLeaderDone / CHECKLIST_ITEMS.length) * 100}%`, transition: "width 0.3s ease" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {CHECKLIST_ITEMS.map((item) => {
                    const done = !!coLeaderItems[item.id];
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                          border: `2px solid ${done ? "#FF4D00" : BORDER}`,
                          background: done ? "#FF4D00" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {done && <span style={{ color: "#fff", fontSize: 8, lineHeight: 1 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: "12px", fontFamily: SANS, color: done ? "#FF4D00" : "#999999", textDecoration: done ? "line-through" : "none" }}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Contact buttons */}
          <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${BORDER}`, paddingTop: "0.875rem" }}>
            {coLeader.phone && (
              <a href={`tel:${coLeader.phone}`} style={contactBtnStyle("#FF4D00")}>
                <PhoneIcon color="#fff" />
                Call {coLeader.full_name?.split(" ")[0]}
              </a>
            )}
            {coLeader.email && (
              <a href={`mailto:${coLeader.email}`} style={contactBtnStyle("transparent", "#111111", BORDER)}>
                <MailIcon color="#111111" />
                Email
              </a>
            )}
          </div>
        </Card>
      ) : (
        <Card style={{ padding: "1rem 1.25rem", marginBottom: "1rem", textAlign: "center" }}>
          <span style={{ fontSize: "13px", color: TSEC, fontFamily: SANS }}>Co-leader assignment coming soon.</span>
        </Card>
      )}

      {/* Coordinator */}
      {coordinator && (
        <>
          <SectionLabel>Your Coordinator</SectionLabel>
          <Card style={{ padding: "1rem 1.25rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "0.875rem" }}>
              <Avatar url={coordinator.photo_url} name={coordinator.full_name} size={48} />
              <div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#111111", fontFamily: SANS }}>{coordinator.full_name}</div>
                <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>Team Coordinator</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {coordinator.phone && (
                <a href={`tel:${coordinator.phone}`} style={contactBtnStyle("#111111")}>
                  <PhoneIcon color="#fff" />
                  Call
                </a>
              )}
              {coordinator.email && (
                <a href={`mailto:${coordinator.email}`} style={contactBtnStyle("transparent", "#111111", BORDER)}>
                  <MailIcon color="#111111" />
                  Email
                </a>
              )}
            </div>
          </Card>
        </>
      )}

      {/* ── Pre-conference checklist ────────────────────────────────────── */}
      <SectionLabel>Pre-Conference Checklist</SectionLabel>

      {/* Progress bar */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>{doneCount} of {CHECKLIST_ITEMS.length} complete</span>
          {allDone && <span style={{ fontSize: "12px", fontWeight: 700, color: "#059669", fontFamily: SANS }}>All done ✓</span>}
        </div>
        <div style={{ height: 6, borderRadius: 3, background: BORDER, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            background: allDone ? "#059669" : "#FF4D00",
            width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`,
            transition: "width 0.3s ease, background 0.3s ease",
          }} />
        </div>
      </div>

      {/* My checklist items */}
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: "1.25rem" }}>
        {CHECKLIST_ITEMS.map((item, i) => {
          const done = !!items[item.id];
          const isSaving = saving === item.id;
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              disabled={isSaving}
              style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                width: "100%", background: done ? "#F0FDF4" : "none", border: "none",
                borderBottom: i < CHECKLIST_ITEMS.length - 1 ? `1px solid ${BORDER}` : "none",
                padding: "1rem 1.25rem", cursor: "pointer", textAlign: "left",
                transition: "background 0.2s",
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                border: `2px solid ${done ? "#059669" : BORDER}`,
                background: done ? "#059669" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}>
                {done && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
                {isSaving && <span style={{ color: TSEC, fontSize: 9 }}>…</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, fontFamily: SANS, color: done ? "#059669" : "#111111", textDecoration: done ? "line-through" : "none", transition: "color 0.15s", marginBottom: 3 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, lineHeight: 1.5 }}>
                  {item.desc}
                </div>
              </div>
            </button>
          );
        })}
      </Card>


      <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, textAlign: "center", fontStyle: "italic", marginBottom: "1rem" }}>
        Your progress saves automatically.
      </div>
    </Shell>
  );
}

function BackBtn({ onBack }) {
  return (
    <button onClick={onBack} style={{ background: "none", border: "none", color: TSEC, fontSize: "14px", cursor: "pointer", padding: "0 0 1rem 0", fontFamily: SANS, display: "block" }}>
      ‹ Back
    </button>
  );
}

function contactBtnStyle(bg, color = "#fff", border = "transparent") {
  return {
    flex: 1, padding: "10px", textAlign: "center",
    background: bg, color, border: `1px solid ${border}`,
    borderRadius: 8, textDecoration: "none",
    fontSize: "14px", fontWeight: 600, fontFamily: SANS,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  };
}

function PhoneIcon({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function MailIcon({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
