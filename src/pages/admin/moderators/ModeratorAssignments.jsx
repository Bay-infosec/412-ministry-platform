import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase.js";
import { TSEC, BORDER, SANS, SERIF } from "../../../lib/constants.js";
import { Card, SectionLabel, Modal } from "../../../components/ui/index.js";

export default function ModeratorAssignments({ data, onToast }) {
  const { allProfiles, allEvents, profile: myProfile } = data;
  const myId = myProfile?.id;

  const moderators = (allProfiles || []).filter((p) => p.platform_role === "moderator");

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(null); // moderator profile | null
  const [selectedEventId, setSelectedEventId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("moderator_assignments")
      .select("*, events(name, status)")
      .order("created_at");
    if (error) {
      onToast("Failed to load assignments.", "error");
    } else {
      setAssignments(rows || []);
    }
    setLoading(false);
  }

  function getAssignmentsFor(moderatorId) {
    return assignments.filter((a) => a.moderator_id === moderatorId);
  }

  async function addAssignment() {
    if (!selectedEventId) { onToast("Select an event.", "error"); return; }
    if (!assignModal) return;

    const moderatorId = assignModal.id;
    const moderatorName = assignModal.full_name;
    const event = (allEvents || []).find((e) => e.id === selectedEventId);
    const eventName = event?.name || selectedEventId;

    // Check for duplicate
    const exists = assignments.find(
      (a) => a.moderator_id === moderatorId && a.event_id === selectedEventId
    );
    if (exists) { onToast("Already assigned to this event.", "error"); return; }

    setBusy(true);
    const { error } = await supabase.from("moderator_assignments").insert({
      moderator_id: moderatorId,
      event_id: selectedEventId,
      assigned_by: myId,
    });

    if (error) {
      setBusy(false);
      onToast("Could not assign moderator.", "error");
      return;
    }

    // Audit log
    await supabase.from("audit_log").insert({
      actor_id: myId,
      actor_name: myProfile?.full_name || "",
      action: "assigned_moderator",
      target_type: "moderator_assignment",
      target_id: moderatorId,
      target_name: moderatorName,
      details: { event_name: eventName },
    });

    setBusy(false);
    onToast(`${moderatorName} assigned to ${eventName}.`);
    setAssignModal(null);
    setSelectedEventId("");
    load();
  }

  async function removeAssignment(assignment) {
    const moderator = (allProfiles || []).find((p) => p.id === assignment.moderator_id);
    const moderatorName = moderator?.full_name || assignment.moderator_id;
    const eventName = assignment.events?.name || assignment.event_id;

    const { error } = await supabase
      .from("moderator_assignments")
      .delete()
      .eq("id", assignment.id);

    if (error) { onToast("Could not remove assignment.", "error"); return; }

    // Audit log
    await supabase.from("audit_log").insert({
      actor_id: myId,
      actor_name: myProfile?.full_name || "",
      action: "removed_moderator_assignment",
      target_type: "moderator_assignment",
      target_id: assignment.moderator_id,
      target_name: moderatorName,
      details: { event_name: eventName },
    });

    onToast(`Removed ${moderatorName} from ${eventName}.`);
    load();
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          border: `3px solid ${BORDER}`, borderTop: "3px solid #111111",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: SANS }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: SANS, fontSize: "22px", fontWeight: 600, color: "#111111" }}>
          Moderator Assignments
        </div>
        <div style={{ fontSize: "13px", color: TSEC, marginTop: 4 }}>
          Assign platform moderators to specific events.
        </div>
      </div>

      {moderators.length === 0 ? (
        <div style={{ textAlign: "center", color: TSEC, fontSize: "14px", padding: "2rem 0" }}>
          No moderators found. Assign platform_role = "moderator" to users first.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {moderators.map((mod) => {
            const modAssignments = getAssignmentsFor(mod.id);
            return (
              <Card key={mod.id} style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#111111", marginBottom: 6 }}>
                      {mod.full_name}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {modAssignments.length === 0 ? (
                        <span style={{ fontSize: "12px", color: TSEC }}>No events assigned</span>
                      ) : (
                        modAssignments.map((a) => (
                          <span
                            key={a.id}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              background: "#EEF2FC", color: "#1A4FBF",
                              borderRadius: 20, padding: "4px 10px",
                              fontSize: "12px", fontWeight: 600,
                            }}
                          >
                            {a.events?.name || a.event_id}
                            {a.events?.status && (
                              <span style={{ fontSize: "10px", color: "#6B7280" }}>({a.events.status})</span>
                            )}
                            <button
                              onClick={() => removeAssignment(a)}
                              title="Remove"
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                padding: "0 2px", display: "flex", alignItems: "center",
                                color: "#6B7280", lineHeight: 1,
                              }}
                            >
                              <TrashIcon />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { setAssignModal(mod); setSelectedEventId(""); }}
                    style={{
                      background: "#FF4D00", color: "#fff", border: "none", borderRadius: 8,
                      padding: "7px 14px", fontSize: "12px", fontWeight: 700,
                      fontFamily: SANS, cursor: "pointer", flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    + Assign to event
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign modal */}
      {assignModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "1.5rem",
            width: "100%", maxWidth: 380, boxShadow: "0 8px 40px rgba(22,32,56,0.18)",
            fontFamily: SANS,
          }}>
            <div style={{ fontFamily: SANS, fontSize: "18px", fontWeight: 600, color: "#111111", marginBottom: 6 }}>
              Assign to Event
            </div>
            <div style={{ fontSize: "13px", color: TSEC, marginBottom: "1rem" }}>
              Assigning: <strong style={{ color: "#111111" }}>{assignModal.full_name}</strong>
            </div>

            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: TSEC, marginBottom: 6, letterSpacing: "0.04em" }}>
              EVENT
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: `1px solid ${BORDER}`, fontSize: "15px", fontFamily: SANS,
                color: "#111111", background: "#fff", outline: "none", marginBottom: "1.25rem",
                boxSizing: "border-box",
              }}
            >
              <option value="">Select an event…</option>
              {(allEvents || []).map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={addAssignment}
                disabled={busy || !selectedEventId}
                style={{
                  flex: 1, background: busy || !selectedEventId ? "#CCCCCC" : "#FF4D00", color: "#fff", border: "none", borderRadius: 8,
                  padding: "11px", fontSize: "14px", fontWeight: 700, fontFamily: SANS,
                  cursor: busy || !selectedEventId ? "not-allowed" : "pointer",
                }}
              >
                {busy ? "Assigning…" : "Assign"}
              </button>
              <button
                onClick={() => { setAssignModal(null); setSelectedEventId(""); }}
                style={{
                  flex: 1, background: "#fff", color: "#111111", border: "1px solid #E5E5E5", borderRadius: 8,
                  padding: "11px", fontSize: "14px", fontWeight: 600, fontFamily: SANS,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
