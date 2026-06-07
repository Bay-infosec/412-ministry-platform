import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, SectionLabel, Avatar } from "../../components/ui/index.js";
import { CHECKLIST_ITEMS } from "../../lib/checklist.js";

export default function MyTeam({ data, onBack }) {
  const { eventMember, eventChecklist, coLeader, coLeaderChecklist, coordinator } = data;

  const [items, setItems] = useState(eventChecklist?.items || {});
  const [saving, setSaving] = useState(null);

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
      <div style={{ background: NAVY, borderRadius: 16, padding: "1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", color: GOLD, textTransform: "uppercase", marginBottom: "0.25rem", fontFamily: SANS }}>
          Your Team
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "52px", fontWeight: 600, color: GOLD, lineHeight: 1, marginBottom: "0.5rem" }}>
          {eventMember.team_number || "—"}
        </div>
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
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "0.75rem" }}>
            <Avatar url={coLeader.photo_url} name={coLeader.full_name} size={48} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>{coLeader.full_name}</div>
              {coLeader.churches?.name && (
                <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>{coLeader.churches.name}</div>
              )}
            </div>
          </div>
          {coLeader.phone && (
            <a
              href={`tel:${coLeader.phone}`}
              style={{ display: "block", padding: "10px", textAlign: "center", background: ORANGE, color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: "14px", fontWeight: 600, fontFamily: SANS }}
            >
              Call {coLeader.full_name?.split(" ")[0]}
            </a>
          )}
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
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "0.75rem" }}>
              <Avatar url={coordinator.photo_url} name={coordinator.full_name} size={48} />
              <div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>{coordinator.full_name}</div>
                <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>Team Coordinator</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {coordinator.phone && (
                <a href={`tel:${coordinator.phone}`} style={contactBtnStyle(NAVY)}>Call</a>
              )}
              {coordinator.email && (
                <a href={`mailto:${coordinator.email}`} style={contactBtnStyle("transparent", NAVY, BORDER)}>Email</a>
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
            background: allDone ? "#059669" : ORANGE,
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
                <div style={{ fontSize: "14px", fontWeight: 600, fontFamily: SANS, color: done ? "#059669" : NAVY, textDecoration: done ? "line-through" : "none", transition: "color 0.15s", marginBottom: 3 }}>
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

      {/* Co-leader's progress */}
      {coLeader && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: TSEC, textTransform: "uppercase", fontFamily: SANS }}>
              {coLeader.full_name?.split(" ")[0]}'s Progress
            </div>
            <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>
              {coLeaderDone} / {CHECKLIST_ITEMS.length}
            </span>
          </div>

          {/* Co-leader progress bar */}
          <div style={{ height: 5, borderRadius: 3, background: BORDER, overflow: "hidden", marginBottom: "0.75rem" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              background: coLeaderDone === CHECKLIST_ITEMS.length ? "#059669" : NAVY,
              width: `${(coLeaderDone / CHECKLIST_ITEMS.length) * 100}%`,
              transition: "width 0.3s ease",
            }} />
          </div>

          {/* Co-leader item status */}
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", marginBottom: "1.5rem" }}>
            {CHECKLIST_ITEMS.map((item, i) => {
              const done = !!coLeaderItems[item.id];
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "0.875rem 1.25rem",
                    borderBottom: i < CHECKLIST_ITEMS.length - 1 ? `1px solid ${BORDER}` : "none",
                    background: done ? "#F0FDF4" : "none",
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${done ? "#059669" : BORDER}`,
                    background: done ? "#059669" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {done && <span style={{ color: "#fff", fontSize: 9, lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: "13px", fontFamily: SANS, color: done ? "#059669" : TSEC, textDecoration: done ? "line-through" : "none" }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

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
  };
}
