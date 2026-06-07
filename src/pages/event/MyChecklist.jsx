import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { NAVY, ORANGE, TSEC, BORDER, BG, SANS, SERIF } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card } from "../../components/ui/index.js";
import { CHECKLIST_ITEMS } from "../../lib/checklist.js";

export default function MyChecklist({ data, onBack }) {
  const { eventMember, eventChecklist } = data;
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

  return (
    <Shell withNav>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: TSEC,
        fontSize: "14px", cursor: "pointer", padding: "0 0 1rem 0",
        fontFamily: SANS, display: "block",
      }}>
        ‹ Back
      </button>

      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.25rem" }}>
          Pre-Conference
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "24px", fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
          My Checklist
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>
            {doneCount} of {CHECKLIST_ITEMS.length} complete
          </span>
          {allDone && (
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#059669", fontFamily: SANS }}>
              All done ✓
            </span>
          )}
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

      <Card style={{ padding: 0, overflow: "hidden" }}>
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
                width: "100%", background: done ? "#F0FDF4" : "none",
                border: "none",
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
                <div style={{
                  fontSize: "14px", fontWeight: 600, fontFamily: SANS,
                  color: done ? "#059669" : NAVY,
                  textDecoration: done ? "line-through" : "none",
                  transition: "color 0.15s",
                  marginBottom: 3,
                }}>
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

      <div style={{ marginTop: "1rem", fontSize: "12px", color: TSEC, fontFamily: SANS, textAlign: "center", fontStyle: "italic" }}>
        Your progress saves automatically as you check each item.
      </div>
    </Shell>
  );
}
