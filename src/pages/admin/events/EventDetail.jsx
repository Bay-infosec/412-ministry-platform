import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase.js";
import { TSEC, BORDER, SANS } from "../../../lib/constants.js";
import { Avatar, Badge, Modal, SectionLabel } from "../../../components/ui/index.js";

export default function EventDetail({ event, data, onRefresh, onToast, onBack }) {
  const { allProfiles } = data;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [pendingRemove, setPendingRemove] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [coordModal, setCoordModal] = useState(null); // { teamNumber }
  const [assigningCoord, setAssigningCoord] = useState(false);
  const [addRole, setAddRole] = useState("leader");
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [editBusy, setEditBusy] = useState(false);
  const [teamModal, setTeamModal] = useState(null);
  const [teamInput, setTeamInput] = useState("");
  const [savingTeam, setSavingTeam] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [event.id]);

  async function fetchMembers() {
    setLoading(true);
    const { data: rows } = await supabase
      .from("event_members")
      .select("*, profiles!event_members_profile_id_fkey(id, full_name, photo_url, email, platform_role)")
      .eq("event_id", event.id)
      .order("team_number");
    setMembers(rows || []);
    setLoading(false);
  }

  const enrolledProfileIds = new Set(members.map((m) => m.profile_id));
  const notEnrolled = (allProfiles || []).filter(
    (p) => !enrolledProfileIds.has(p.id) &&
      (addQuery === "" ||
        p.full_name?.toLowerCase().includes(addQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(addQuery.toLowerCase()))
  );

  async function addMember(profile) {
    const { data: newEm, error } = await supabase
      .from("event_members")
      .insert({
        event_id: event.id,
        profile_id: profile.id,
        event_role: addRole,
        status: "accepted",
        onboarding_completed: false,
        onboarding_visited: false,
      })
      .select()
      .single();

    if (error) { onToast("Could not add member.", "error"); return; }
    await supabase.from("event_checklist").insert({ event_member_id: newEm.id, items: {} });
    onToast(`${profile.full_name} added to ${event.name}.`);
    setModal(null);
    setAddQuery("");
    await fetchMembers();
    onRefresh();
  }

  async function removeMember() {
    if (!pendingRemove) return;
    setBusy(true);
    await supabase.from("event_checklist").delete().eq("event_member_id", pendingRemove.id);
    await supabase.from("event_members").delete().eq("id", pendingRemove.id);
    setBusy(false);
    setPendingRemove(null);
    onToast(`${pendingRemove.profiles?.full_name} removed.`, "info");
    await fetchMembers();
    onRefresh();
  }

  const grouped = groupByTeam(members);

  // Map profile_id → profile for all coordinators in this event
  const coordinatorMap = {};
  for (const m of members) {
    if (m.event_role === "coordinator") {
      coordinatorMap[m.profile_id] = m.profiles;
    }
  }
  const coordinatorsList = members.filter((m) => m.event_role === "coordinator");

  async function archiveEvent() {
    setArchiving(true);
    await supabase.from("events").update({ status: "archived" }).eq("id", event.id);
    setArchiving(false);
    setArchiveModal(false);
    onToast(`${event.name} archived.`, "info");
    onRefresh();
  }

  async function publishEvent() {
    setPublishing(true);
    // Archive any currently active event first
    await supabase.from("events").update({ status: "archived" }).eq("status", "active");
    await supabase.from("events").update({ status: "active" }).eq("id", event.id);
    setPublishing(false);
    setPublishModal(false);
    onToast(`${event.name} is now the active event.`);
    onRefresh();
    onBack?.();
  }

  async function duplicateEvent() {
    setDuplicating(true);
    const { id, created_at, status, ...fields } = event;
    await supabase.from("events").insert({ ...fields, status: "inactive" });
    setDuplicating(false);
    onToast(`Duplicated "${event.name}" as inactive.`);
    await onRefresh();
    onBack?.();
  }

  async function deleteEvent() {
    setDeleting(true);
    const { data: memberRows } = await supabase
      .from("event_members").select("id").eq("event_id", event.id);
    if (memberRows?.length) {
      await supabase.from("event_checklist")
        .delete().in("event_member_id", memberRows.map((m) => m.id));
    }
    await supabase.from("event_members").delete().eq("event_id", event.id);
    await supabase.from("events").delete().eq("id", event.id);
    setDeleting(false);
    setDeleteModal(false);
    onToast(`"${event.name}" deleted.`, "info");
    onRefresh();
    onBack?.();
  }

  function openEditModal() {
    setEditFields({
      name: event.name || "",
      type: event.type || "conference",
      dates: event.dates || "",
      location: event.location || "",
      team_count: event.team_count?.toString() || "",
      fee: event.fee || "",
      description: event.description || "",
      verse: event.verse || "",
      verse_text: event.verse_text || "",
      zoom_training_dates: event.zoom_training_dates || "",
      registration_url: event.registration_url || "",
    });
    setEditModal(true);
  }

  async function saveEventFields() {
    setEditBusy(true);
    const payload = { ...editFields };
    payload.team_count = editFields.team_count !== "" ? parseInt(editFields.team_count) || null : null;
    await supabase.from("events").update(payload).eq("id", event.id);
    setEditBusy(false);
    setEditModal(false);
    onToast("Event updated.");
    onRefresh();
  }

  async function saveTeamNumber() {
    if (!teamModal) return;
    setSavingTeam(true);
    const num = teamInput.trim() ? parseInt(teamInput) || null : null;
    await supabase.from("event_members").update({ team_number: num }).eq("id", teamModal.id);
    setSavingTeam(false);
    setTeamModal(null);
    onToast(`Team ${num != null ? num : "cleared"} assigned to ${teamModal.profiles?.full_name}.`);
    await fetchMembers();
  }

  async function assignCoordinator(teamNumber, coordinatorProfileId) {
    setAssigningCoord(true);
    await supabase
      .from("event_members")
      .update({ coordinator_id: coordinatorProfileId })
      .eq("event_id", event.id)
      .eq("team_number", teamNumber)
      .neq("event_role", "coordinator");
    setAssigningCoord(false);
    setCoordModal(null);
    onToast(`Coordinator assigned to Team ${teamNumber}.`);
    await fetchMembers();
  }

  return (
    <div>
      {/* Event info */}
      <div style={{
        background: "#111111", borderRadius: 16, padding: "1.25rem",
        marginBottom: "1.25rem",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", color: "#EFAB25", textTransform: "uppercase", fontFamily: SANS, marginBottom: 4 }}>
          {event.status}
        </div>
        <div style={{ fontFamily: SANS, fontSize: "22px", fontWeight: 600, color: "#fff", lineHeight: 1.2, marginBottom: 8 }}>
          {event.name}
        </div>
        {[event.dates, event.location].filter(Boolean).map((v, i) => (
          <div key={i} style={{ fontSize: "13px", color: "#B8C0D0", fontFamily: SANS }}>{v}</div>
        ))}
        <div style={{ fontSize: "13px", color: "#B8C0D0", fontFamily: SANS, marginTop: 4 }}>
          {members.length} enrolled · {event.team_count || "?"} teams
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={openEditModal} style={eventActionBtn()}>Edit</button>
          {event.status === "inactive" && (
            <button onClick={() => setPublishModal(true)} style={eventActionBtn("#22C55E")}>
              Publish
            </button>
          )}
          <button onClick={duplicateEvent} disabled={duplicating} style={eventActionBtn()}>
            {duplicating ? "…" : "Duplicate"}
          </button>
          {event.status === "active" && (
            <button onClick={() => setArchiveModal(true)} style={eventActionBtn()}>
              Archive
            </button>
          )}
          {event.status === "inactive" && (
            <button onClick={() => setDeleteModal(true)} style={eventActionBtn("#F87171")}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Onboarding progress summary */}
      {!loading && members.length > 0 && (() => {
        const complete    = members.filter((m) => m.onboarding_completed).length;
        const inProgress  = members.filter((m) => !m.onboarding_completed && m.onboarding_visited).length;
        const notStarted  = members.filter((m) => !m.onboarding_completed && !m.onboarding_visited).length;
        return (
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.75rem" }}>
              Onboarding · {members.length} members
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Complete",    count: complete,   bg: "#D1FAE5", color: "#065F46" },
                { label: "In progress", count: inProgress, bg: "#FEF3C7", color: "#92400E" },
                { label: "Not started", count: notStarted, bg: "#FEE2E2", color: "#991B1B" },
              ].map(({ label, count, bg, color }) => (
                <div key={label} style={{ flex: 1, background: bg, borderRadius: 10, padding: "0.625rem", textAlign: "center" }}>
                  <div style={{ fontFamily: SANS, fontSize: "22px", fontWeight: 700, color, lineHeight: 1 }}>{count}</div>
                  <div style={{ fontFamily: SANS, fontSize: "10px", fontWeight: 600, color, marginTop: 3, lineHeight: 1.3 }}>{label}</div>
                </div>
              ))}
            </div>
            {notStarted > 0 && (
              <div style={{ fontSize: "12px", color: "#991B1B", fontFamily: SANS, marginTop: "0.75rem" }}>
                ⚠ {notStarted} member{notStarted !== 1 ? "s have" : " has"} not opened onboarding yet — consider reaching out.
              </div>
            )}
          </div>
        );
      })()}

      {/* Members header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", color: "#E8621A", textTransform: "uppercase", fontFamily: "sans-serif" }}>
          Members
        </div>
        <button
          onClick={() => setModal("add")}
          style={{
            background: "#FF4D00", color: "#fff", border: "none", borderRadius: 8,
            padding: "6px 14px", fontSize: "13px", fontWeight: 600,
            fontFamily: SANS, cursor: "pointer",
          }}
        >
          + Add
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, padding: "2rem 0", textAlign: "center" }}>
          Loading members…
        </div>
      ) : members.length === 0 ? (
        <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, padding: "2rem 0", textAlign: "center" }}>
          No members yet. Add some using the button above.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {grouped.map(({ teamNumber, teamMembers }) => (
            <div key={teamNumber}>
              {teamNumber !== "unassigned" && (() => {
                const leaders = teamMembers.filter((m) => m.event_role === "leader");
                const coordId = leaders[0]?.coordinator_id;
                const coordProfile = coordinatorMap[coordId];
                const coordName = coordProfile?.full_name?.split(" ")[0] || null;
                return (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: "0.375rem", marginTop: "0.5rem",
                  }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.1em", fontFamily: SANS, textTransform: "uppercase" }}>
                      Team {teamNumber}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "11px", color: coordName ? TSEC : "#DC2626", fontFamily: SANS }}>
                        {coordName ? `Coord: ${coordName}` : "No coordinator"}
                      </span>
                      <button
                        onClick={() => setCoordModal({ teamNumber })}
                        style={{
                          background: "none", border: `1px solid ${BORDER}`, borderRadius: 6,
                          padding: "2px 7px", fontSize: "10px", fontWeight: 600,
                          color: TSEC, cursor: "pointer", fontFamily: SANS,
                        }}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                );
              })()}
              {teamMembers.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  onRemove={() => setPendingRemove(m)}
                  onEditMessage={() => {
                    setEditingMessage(m);
                    setMessageText(m.personal_message || "");
                  }}
                  onSetTeam={() => { setTeamModal(m); setTeamInput(m.team_number?.toString() || ""); }}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Add member modal */}
      {modal === "add" && (
        <div style={overlay}>
          <div style={{ ...sheet, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 600, color: "#111111", marginBottom: "0.75rem" }}>
              Add Member
            </div>
            {/* Role picker */}
            <div style={{ display: "flex", gap: 6, marginBottom: "0.75rem" }}>
              {["leader", "coordinator"].map((r) => (
                <button
                  key={r}
                  onClick={() => setAddRole(r)}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${addRole === r ? "#FF4D00" : BORDER}`,
                    background: addRole === r ? "#FFF5EC" : "#fff", color: addRole === r ? "#FF4D00" : TSEC,
                    fontSize: "13px", fontWeight: 600, fontFamily: SANS, cursor: "pointer", textTransform: "capitalize",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              placeholder="Search by name or email…"
              style={{
                width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10,
                padding: "10px 12px", fontSize: "14px", fontFamily: SANS, color: "#111111",
                outline: "none", boxSizing: "border-box", marginBottom: "0.75rem",
              }}
            />
            <div style={{ flex: 1, overflowY: "auto", marginBottom: "0.75rem" }}>
              {notEnrolled.length === 0 ? (
                <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, textAlign: "center", padding: "1rem 0" }}>
                  {addQuery ? "No matches." : "Everyone is already enrolled."}
                </div>
              ) : (
                notEnrolled.slice(0, 20).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addMember(p)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%",
                      background: "none", border: "none", borderRadius: 10,
                      padding: "0.625rem 0", cursor: "pointer", textAlign: "left",
                      borderBottom: `1px solid ${BORDER}`,
                    }}
                  >
                    <Avatar url={p.photo_url} name={p.full_name} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#111111", fontFamily: SANS }}>{p.full_name}</div>
                      <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>{p.email}</div>
                    </div>
                    <span style={{ fontSize: "12px", color: "#FF4D00", fontWeight: 600, fontFamily: SANS }}>Add</span>
                  </button>
                ))
              )}
            </div>
            <button onClick={() => { setModal(null); setAddQuery(""); }} style={{
              width: "100%", background: "none", border: `1px solid ${BORDER}`,
              borderRadius: 10, padding: "11px", fontSize: "14px", fontWeight: 600,
              color: TSEC, cursor: "pointer", fontFamily: SANS,
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Coordinator assignment modal */}
      {coordModal && (
        <div style={overlay}>
          <div style={{ ...sheet, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 600, color: "#111111", marginBottom: 4 }}>
              Assign Coordinator
            </div>
            <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, marginBottom: "1rem" }}>
              Team {coordModal.teamNumber} — pick a coordinator below.
            </div>
            <div style={{ flex: 1, overflowY: "auto", marginBottom: "0.75rem" }}>
              {coordinatorsList.length === 0 ? (
                <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, textAlign: "center", padding: "1rem 0" }}>
                  No coordinators enrolled in this event yet.
                </div>
              ) : (
                coordinatorsList.map((c) => (
                  <button
                    key={c.id}
                    disabled={assigningCoord}
                    onClick={() => assignCoordinator(coordModal.teamNumber, c.profile_id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%",
                      background: "none", border: "none", borderRadius: 10,
                      padding: "0.75rem 0.25rem", cursor: "pointer", textAlign: "left",
                      borderBottom: `1px solid ${BORDER}`,
                      opacity: assigningCoord ? 0.5 : 1,
                    }}
                  >
                    <Avatar url={c.profiles?.photo_url} name={c.profiles?.full_name} size={40} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#111111", fontFamily: SANS }}>
                        {c.profiles?.full_name}
                      </div>
                      <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>
                        Team {c.team_number} · {c.ministry}
                      </div>
                    </div>
                    <span style={{ fontSize: "12px", color: "#FF4D00", fontWeight: 600, fontFamily: SANS }}>
                      {assigningCoord ? "…" : "Assign"}
                    </span>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setCoordModal(null)}
              style={{
                width: "100%", background: "none", border: `1px solid ${BORDER}`,
                borderRadius: 10, padding: "11px", fontSize: "14px", fontWeight: 600,
                color: TSEC, cursor: "pointer", fontFamily: SANS,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Personal message editor */}
      {editingMessage && (
        <div style={overlay}>
          <div style={{ ...sheet, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 600, color: "#111111", marginBottom: 4 }}>
              Personal Message
            </div>
            <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, marginBottom: "1rem" }}>
              For {editingMessage.profiles?.full_name} — shown on their onboarding step 2.
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write a personal note for this leader — encouragement, specific affirmations, or a scripture just for them…"
              rows={7}
              style={{
                width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10,
                padding: "12px 14px", fontSize: "14px", fontFamily: SANS, color: "#111111",
                resize: "vertical", outline: "none", boxSizing: "border-box",
                lineHeight: 1.6, marginBottom: "0.75rem",
              }}
            />
            {messageText.trim() && (
              <div style={{
                background: "#111111", borderRadius: 12, padding: "1rem 1.25rem",
                marginBottom: "0.75rem", position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 8, left: 14,
                  fontFamily: SANS, fontSize: "60px", color: "#EFAB25",
                  opacity: 0.12, lineHeight: 1, userSelect: "none",
                }}>
                  "
                </div>
                <div style={{
                  fontFamily: SANS, fontSize: "14px", color: "#fff",
                  lineHeight: 1.75, whiteSpace: "pre-wrap", position: "relative",
                }}>
                  {messageText.trim()}
                </div>
                <div style={{
                  fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em",
                  textTransform: "uppercase", color: "#EFAB25", fontFamily: SANS,
                  marginTop: "0.75rem",
                }}>
                  Preview
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={async () => {
                  setBusy(true);
                  await supabase
                    .from("event_members")
                    .update({ personal_message: messageText.trim() || null })
                    .eq("id", editingMessage.id);
                  setBusy(false);
                  onToast(`Message saved for ${editingMessage.profiles?.full_name}.`);
                  setEditingMessage(null);
                  await fetchMembers();
                }}
                disabled={busy}
                style={{
                  flex: 1, background: "#FF4D00", color: "#fff", border: "none",
                  borderRadius: 10, padding: "11px", fontSize: "14px",
                  fontWeight: 600, cursor: "pointer", fontFamily: SANS,
                }}
              >
                {busy ? "Saving…" : "Save message"}
              </button>
              <button
                onClick={() => setEditingMessage(null)}
                style={{
                  background: "none", border: `1px solid ${BORDER}`, borderRadius: 10,
                  padding: "11px 16px", fontSize: "14px", color: TSEC,
                  cursor: "pointer", fontFamily: SANS,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirmation */}
      {pendingRemove && (
        <Modal
          title="Remove Member"
          message={`Remove ${pendingRemove.profiles?.full_name} from ${event.name}? This deletes their checklist and team assignment.`}
          confirmLabel="Remove"
          variant="danger"
          onCancel={() => setPendingRemove(null)}
          onConfirm={removeMember}
          busy={busy}
        />
      )}

      {/* Archive confirmation */}
      {archiveModal && (
        <Modal
          title="Archive Event"
          message={`Archive "${event.name}"? It will no longer appear as the active event and members will lose access to event features.`}
          confirmLabel="Archive"
          variant="danger"
          onCancel={() => setArchiveModal(false)}
          onConfirm={archiveEvent}
          busy={archiving}
        />
      )}

      {/* Publish confirmation */}
      {publishModal && (
        <Modal
          title="Publish Event"
          message={`Make "${event.name}" the active event? Any currently active event will be automatically archived.`}
          confirmLabel="Publish"
          onCancel={() => setPublishModal(false)}
          onConfirm={publishEvent}
          busy={publishing}
        />
      )}

      {/* Delete confirmation */}
      {deleteModal && (
        <Modal
          title="Delete Event"
          message={`Permanently delete "${event.name}"? This cannot be undone. All member assignments and checklists for this event will be removed.`}
          confirmLabel="Delete"
          variant="danger"
          onCancel={() => setDeleteModal(false)}
          onConfirm={deleteEvent}
          busy={deleting}
        />
      )}

      {/* Event edit modal */}
      {editModal && (
        <div style={overlay}>
          <div style={{ ...sheet, maxHeight: "88vh", display: "flex", flexDirection: "column", maxWidth: 400 }}>
            <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 700, color: "#111111", marginBottom: "1rem" }}>
              Edit Event
            </div>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { key: "name", label: "Event Name", type: "text" },
                { key: "dates", label: "Dates (e.g. August 5–9, 2026)", type: "text" },
                { key: "location", label: "Location", type: "text" },
                { key: "team_count", label: "Number of Teams", type: "number" },
                { key: "fee", label: "Registration Fee (e.g. $50)", type: "text" },
                { key: "registration_url", label: "Registration URL", type: "text" },
                { key: "zoom_training_dates", label: "Zoom Training Dates", type: "text" },
                { key: "verse", label: "Verse Reference (e.g. John 15:16)", type: "text" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.07em", fontFamily: SANS, marginBottom: 4 }}>{label}</div>
                  <input
                    type={type}
                    value={editFields[key] ?? ""}
                    onChange={(e) => setEditFields((f) => ({ ...f, [key]: e.target.value }))}
                    style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px", fontSize: "14px", fontFamily: SANS, color: "#111111", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.07em", fontFamily: SANS, marginBottom: 4 }}>Verse Text</div>
                <textarea
                  value={editFields.verse_text ?? ""}
                  onChange={(e) => setEditFields((f) => ({ ...f, verse_text: e.target.value }))}
                  rows={3}
                  style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px", fontSize: "14px", fontFamily: SANS, color: "#111111", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.07em", fontFamily: SANS, marginBottom: 4 }}>Description</div>
                <textarea
                  value={editFields.description ?? ""}
                  onChange={(e) => setEditFields((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px", fontSize: "14px", fontFamily: SANS, color: "#111111", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.07em", fontFamily: SANS, marginBottom: 4 }}>Type</div>
                <select
                  value={editFields.type ?? "conference"}
                  onChange={(e) => setEditFields((f) => ({ ...f, type: e.target.value }))}
                  style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px", fontSize: "14px", fontFamily: SANS, color: "#111111", outline: "none", background: "#fff", boxSizing: "border-box" }}
                >
                  {[["conference","Conference"],["annual_conference","Annual Conference"],["youth_conference","Youth Conference"],["openmic","Open Mic"],["mission","Mission Trip"],["zoom_meeting","Zoom Meeting"],["board_meeting","Board Meeting"],["other","Other"]].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: "1rem" }}>
              <button onClick={saveEventFields} disabled={editBusy} style={{ flex: 1, background: editBusy ? "#CCCCCC" : "#FF4D00", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: "14px", fontWeight: 600, fontFamily: SANS, cursor: editBusy ? "default" : "pointer" }}>
                {editBusy ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditModal(false)} style={{ flex: 1, background: "#fff", color: "#111111", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px", fontSize: "14px", fontWeight: 600, fontFamily: SANS, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team assignment modal */}
      {teamModal && (
        <div style={overlay}>
          <div style={{ ...sheet, display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: SANS, fontSize: "18px", fontWeight: 700, color: "#111111", marginBottom: 4 }}>
              Assign Team
            </div>
            <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, marginBottom: "1rem" }}>
              {teamModal.profiles?.full_name}
            </div>
            <input
              type="number"
              value={teamInput}
              onChange={(e) => setTeamInput(e.target.value)}
              placeholder="Team number"
              min="1"
              style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px", fontSize: "22px", fontFamily: SANS, color: "#111111", outline: "none", boxSizing: "border-box", marginBottom: "1rem", textAlign: "center", fontWeight: 700 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveTeamNumber} disabled={savingTeam} style={{ flex: 1, background: savingTeam ? "#CCCCCC" : "#FF4D00", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: "14px", fontWeight: 600, fontFamily: SANS, cursor: savingTeam ? "default" : "pointer" }}>
                {savingTeam ? "Saving…" : "Assign"}
              </button>
              <button onClick={() => setTeamModal(null)} style={{ flex: 1, background: "#fff", color: "#111111", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px", fontSize: "14px", fontWeight: 600, fontFamily: SANS, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function eventActionBtn(color = "rgba(255,255,255,0.55)") {
  return {
    background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8,
    padding: "5px 12px", fontSize: "12px", fontWeight: 600,
    color, cursor: "pointer", fontFamily: SANS,
  };
}

const ONBOARDING_STATUS = {
  complete:    { label: "Complete",     bg: "#D1FAE5", color: "#065F46" },
  in_progress: { label: "In progress",  bg: "#FEF3C7", color: "#92400E" },
  not_started: { label: "Not started",  bg: "#FEE2E2", color: "#991B1B" },
};

function onboardingStatus(member) {
  if (member.onboarding_completed) return "complete";
  if (member.onboarding_visited)   return "in_progress";
  return "not_started";
}

function MemberRow({ member, onRemove, onEditMessage, onSetTeam }) {
  const p = member.profiles || {};
  const status = onboardingStatus(member);
  const st = ONBOARDING_STATUS[status];
  const hasMessage = !!member.personal_message;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12,
      padding: "0.75rem 1rem",
    }}>
      <Avatar url={p.photo_url} name={p.full_name} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#111111", fontFamily: SANS, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {p.full_name}
        </div>
        <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 1, display: "flex", alignItems: "center", gap: 6 }}>
          <span>{member.event_role}{member.ministry ? ` · ${member.ministry}` : ""}</span>
          <button
            onClick={onSetTeam}
            style={{ background: "#F0F0F0", border: "none", borderRadius: 4, padding: "1px 6px", fontSize: "11px", fontWeight: 700, color: "#555", cursor: "pointer", fontFamily: SANS }}
          >
            T{member.team_number ?? "–"}
          </button>
        </div>
      </div>
      <span style={{ fontSize: "10px", fontWeight: 700, background: st.bg, color: st.color, borderRadius: 20, padding: "3px 8px", fontFamily: SANS, flexShrink: 0 }}>
        {st.label}
      </span>
      <button
        onClick={onEditMessage}
        title={hasMessage ? "Edit personal message" : "Write personal message"}
        style={{
          background: "none", border: "none", cursor: "pointer",
          padding: "4px", display: "flex", alignItems: "center",
          color: hasMessage ? "#EFAB25" : BORDER,
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={hasMessage ? "#EFAB25" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
      <button onClick={onRemove} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "#DC2626", fontSize: "13px", fontFamily: SANS, padding: "4px 4px",
        flexShrink: 0,
      }}>
        ✕
      </button>
    </div>
  );
}

function groupByTeam(members) {
  const teams = {};
  for (const m of members) {
    const key = m.team_number?.toString() || "unassigned";
    if (!teams[key]) teams[key] = [];
    teams[key].push(m);
  }
  const keys = Object.keys(teams).sort((a, b) => {
    if (a === "unassigned") return 1;
    if (b === "unassigned") return -1;
    return parseInt(a) - parseInt(b);
  });
  return keys.map((k) => ({ teamNumber: k, teamMembers: teams[k] }));
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(22,32,56,0.6)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 500, padding: "1.5rem",
};

const sheet = {
  background: "#fff", borderRadius: 20, padding: "1.5rem",
  maxWidth: 360, width: "100%",
};
