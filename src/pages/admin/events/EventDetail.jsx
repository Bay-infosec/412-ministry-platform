import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase.js";
import { TSEC, BORDER, ORANGE, SANS } from "../../../lib/constants.js";
import { Avatar, Modal } from "../../../components/ui/index.js";
import { CHECKLIST_ITEMS } from "../../../lib/checklist.js";

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
  const [coordModal, setCoordModal] = useState(null);
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
  const [teamSetupOpen, setTeamSetupOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  // Edit modal — coordinator slots + team chips
  const [editCoordCount, setEditCoordCount] = useState(0);
  const [editCoordPicks, setEditCoordPicks] = useState([]);
  const [editTeams, setEditTeams] = useState(new Set());
  const [activeCoordSlot, setActiveCoordSlot] = useState(null);
  const [editCoordSearch, setEditCoordSearch] = useState("");

  // Team Setup section
  const [addLeaderModal, setAddLeaderModal] = useState(null);
  const [addLeaderQuery, setAddLeaderQuery] = useState("");
  const [settingMinistry, setSettingMinistry] = useState(null);

  useEffect(() => { fetchMembers(); }, [event.id]);

  async function fetchMembers() {
    setLoading(true);
    const { data: rows } = await supabase
      .from("event_members")
      .select("*, profiles!event_members_profile_id_fkey(id, full_name, photo_url, email, platform_role, password_changed, last_seen_at), event_checklist(items)")
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
      .insert({ event_id: event.id, profile_id: profile.id, event_role: addRole, status: "accepted", onboarding_completed: false, onboarding_visited: false })
      .select().single();
    if (error) { onToast("Could not add member.", "error"); return; }
    if (isConference) {
      await supabase.from("event_checklist").insert({ event_member_id: newEm.id, items: {} });
    }
    onToast(`${profile.full_name} added to ${event.name}.`);
    setModal(null); setAddQuery("");
    await fetchMembers(); onRefresh();
  }

  async function removeMember() {
    if (!pendingRemove) return;
    setBusy(true);
    await supabase.from("event_checklist").delete().eq("event_member_id", pendingRemove.id);
    await supabase.from("event_members").delete().eq("id", pendingRemove.id);
    setBusy(false); setPendingRemove(null);
    onToast(`${pendingRemove.profiles?.full_name} removed.`, "info");
    await fetchMembers(); onRefresh();
  }

  const grouped = groupByTeam(members);
  const coordinatorMap = {};
  for (const m of members) {
    if (m.event_role === "coordinator") coordinatorMap[m.profile_id] = m.profiles;
  }
  const coordinatorsList = members.filter((m) => m.event_role === "coordinator");

  async function archiveEvent() {
    setArchiving(true);
    await supabase.from("events").update({ status: "archived" }).eq("id", event.id);
    setArchiving(false); setArchiveModal(false);
    onToast(`${event.name} archived.`, "info"); onRefresh();
  }

  async function publishEvent() {
    setPublishing(true);
    await supabase.from("events").update({
      status: "active",
      publish_at: null,
      published_at: new Date().toISOString(),
    }).eq("id", event.id);
    setPublishing(false); setPublishModal(false);
    onToast(`${event.name} is now the active event.`);
    onRefresh(); onBack?.();
  }

  async function duplicateEvent() {
    setDuplicating(true);
    const { id, created_at, status, publish_at, published_at, ...fields } = event;
    await supabase.from("events").insert({ ...fields, status: "inactive", publish_at: null, published_at: null });
    setDuplicating(false);
    onToast(`Duplicated "${event.name}" as inactive.`);
    await onRefresh(); onBack?.();
  }

  async function deleteEvent() {
    setDeleting(true);
    const { data: memberRows } = await supabase.from("event_members").select("id").eq("event_id", event.id);
    if (memberRows?.length) {
      await supabase.from("event_checklist").delete().in("event_member_id", memberRows.map((m) => m.id));
    }
    await supabase.from("event_members").delete().eq("event_id", event.id);
    await supabase.from("events").delete().eq("id", event.id);
    setDeleting(false); setDeleteModal(false);
    onToast(`"${event.name}" deleted.`, "info");
    onRefresh(); onBack?.();
  }

  function openEditModal() {
    setEditFields({
      name: event.name || "",
      type: event.type || "conference",
      dates: event.dates || "",
      location: event.location || "",
      fee: event.fee || "",
      description: event.description || "",
      verse: event.verse || "",
      verse_text: event.verse_text || "",
      zoom_training_dates: event.zoom_training_dates || "",
      registration_url: event.registration_url || "",
    });
    const tc = event.team_count || 0;
    setEditTeams(new Set(Array.from({ length: tc }, (_, i) => i + 1)));
    const currentCoords = coordinatorsList.map((c) => c.profile_id);
    setEditCoordCount(currentCoords.length);
    setEditCoordPicks([...currentCoords]);
    setActiveCoordSlot(null);
    setEditCoordSearch("");
    setEditModal(true);
  }

  async function saveEditModal() {
    setEditBusy(true);
    const teamArr = Array.from(editTeams);
    const teamCount = teamArr.length > 0 ? Math.max(...teamArr) : null;
    const payload = { ...editFields, team_count: teamCount };
    await supabase.from("events").update(payload).eq("id", event.id);

    const currentCoordMap = {};
    for (const c of coordinatorsList) currentCoordMap[c.profile_id] = c;
    const desiredIds = new Set(editCoordPicks.filter(Boolean));

    for (const c of coordinatorsList) {
      if (!desiredIds.has(c.profile_id)) {
        await supabase.from("event_checklist").delete().eq("event_member_id", c.id);
        await supabase.from("event_members").delete().eq("id", c.id);
      }
    }
    for (const pid of desiredIds) {
      if (!currentCoordMap[pid]) {
        const { data: newEm } = await supabase.from("event_members")
          .insert({ event_id: event.id, profile_id: pid, event_role: "coordinator", status: "accepted", onboarding_completed: false, onboarding_visited: false })
          .select().single();
        if (newEm) await supabase.from("event_checklist").insert({ event_member_id: newEm.id, items: {} });
      }
    }

    setEditBusy(false); setEditModal(false);
    onToast("Event updated."); onRefresh(); await fetchMembers();
  }

  async function saveTeamNumber() {
    if (!teamModal) return;
    setSavingTeam(true);
    const num = teamInput.trim() ? parseInt(teamInput) || null : null;
    await supabase.from("event_members").update({ team_number: num }).eq("id", teamModal.id);
    setSavingTeam(false); setTeamModal(null);
    onToast(`Team ${num != null ? num : "cleared"} assigned to ${teamModal.profiles?.full_name}.`);
    await fetchMembers();
  }

  async function assignCoordinator(teamNumber, coordinatorProfileId) {
    setAssigningCoord(true);
    await supabase.from("event_members")
      .update({ coordinator_id: coordinatorProfileId })
      .eq("event_id", event.id)
      .eq("team_number", teamNumber)
      .neq("event_role", "coordinator");
    setAssigningCoord(false); setCoordModal(null);
    onToast(`Coordinator assigned to Team ${teamNumber}.`);
    await fetchMembers();
  }

  async function setTeamMinistry(teamNum, ministry) {
    setSettingMinistry(teamNum);
    await supabase.from("event_members")
      .update({ ministry })
      .eq("event_id", event.id)
      .eq("team_number", teamNum)
      .eq("event_role", "leader");
    setSettingMinistry(null);
    await fetchMembers();
  }

  async function addLeaderToTeam(profile) {
    if (!addLeaderModal) return;
    const existingMember = members.find((m) => m.profile_id === profile.id);
    if (existingMember) {
      await supabase.from("event_members")
        .update({ team_number: addLeaderModal.teamNumber, event_role: "leader" })
        .eq("id", existingMember.id);
    } else {
      const { data: newEm, error } = await supabase.from("event_members")
        .insert({ event_id: event.id, profile_id: profile.id, event_role: "leader", team_number: addLeaderModal.teamNumber, status: "accepted", onboarding_completed: false, onboarding_visited: false })
        .select().single();
      if (error) { onToast("Could not add leader.", "error"); return; }
      await supabase.from("event_checklist").insert({ event_member_id: newEm.id, items: {} });
    }
    onToast(`${profile.full_name} added to Team ${addLeaderModal.teamNumber}.`);
    setAddLeaderModal(null); setAddLeaderQuery("");
    await fetchMembers(); onRefresh();
  }

  const leaderCandidates = addLeaderModal
    ? (() => {
        const inTeam = new Set(
          members.filter((m) => m.team_number === addLeaderModal.teamNumber && m.event_role === "leader").map((m) => m.profile_id)
        );
        return (allProfiles || []).filter(
          (p) => !inTeam.has(p.id) &&
            (addLeaderQuery === "" ||
              p.full_name?.toLowerCase().includes(addLeaderQuery.toLowerCase()) ||
              p.email?.toLowerCase().includes(addLeaderQuery.toLowerCase()))
        );
      })()
    : [];

  const coordCandidates = (allProfiles || []).filter(
    (p) => editCoordSearch === "" ||
      p.full_name?.toLowerCase().includes(editCoordSearch.toLowerCase()) ||
      p.email?.toLowerCase().includes(editCoordSearch.toLowerCase())
  ).slice(0, 8);

  const isConference = ["conference", "annual_conference", "youth_conference"].includes(event.type);

  return (
    <div>
      {/* Hero */}
      <div style={{ background: "#1B2A4A", borderRadius: 16, padding: "1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: 4 }}>
          {event.status === "inactive" && event.publish_at ? "scheduled" : event.status}
        </div>
        <div style={{ fontFamily: SANS, fontSize: "22px", fontWeight: 600, color: "#fff", lineHeight: 1.2, marginBottom: 8 }}>
          {event.name}
        </div>
        {[event.dates, event.location].filter(Boolean).map((v, i) => (
          <div key={i} style={{ fontSize: "13px", color: "#B8C0D0", fontFamily: SANS }}>{v}</div>
        ))}
        {event.status === "inactive" && event.publish_at && (
          <div style={{ fontSize: "12px", color: "#FFB896", fontFamily: SANS, fontWeight: 700, marginTop: 4 }}>
            Publishes {new Date(event.publish_at).toLocaleString()}
          </div>
        )}
        <div style={{ fontSize: "13px", color: "#B8C0D0", fontFamily: SANS, marginTop: 4 }}>
          {members.length} enrolled{isConference && event.team_count ? ` · ${event.team_count} teams` : ""}
        </div>
        <button
          onClick={openEditModal}
          style={{ width: "100%", marginTop: 14, background: "#FF4D00", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: "15px", fontWeight: 700, fontFamily: SANS, cursor: "pointer" }}
        >
          Edit Event
        </button>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {event.status === "inactive" && (
            <button onClick={() => setPublishModal(true)} style={actionBtn("#22C55E")}>Publish now</button>
          )}
          <button onClick={duplicateEvent} disabled={duplicating} style={actionBtn()}>
            {duplicating ? "…" : "Duplicate"}
          </button>
          {event.status === "active" && (
            <button onClick={() => setArchiveModal(true)} style={actionBtn()}>Archive</button>
          )}
          {event.status === "inactive" && (
            <button onClick={() => setDeleteModal(true)} style={actionBtn("#F87171")}>Delete</button>
          )}
        </div>
      </div>

      {/* Team Setup */}
      {isConference && event.team_count > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <SectionToggle label="Team Setup" detail={`${event.team_count} teams`} open={teamSetupOpen} onClick={() => setTeamSetupOpen((open) => !open)} />
          {teamSetupOpen && Array.from({ length: event.team_count }, (_, i) => i + 1).map((teamNum) => {
            const teamLeaders = members.filter((m) => m.team_number === teamNum && m.event_role === "leader");
            const ministry = teamLeaders[0]?.ministry || null;
            const coordId = teamLeaders[0]?.coordinator_id;
            const coordProfile = coordId ? coordinatorMap[coordId] : null;
            const isBusy = settingMinistry === teamNum;
            return (
              <div key={teamNum} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "0.625rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div style={{ fontFamily: SANS, fontSize: "14px", fontWeight: 800, color: "#1B2A4A" }}>Team {teamNum}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "11px", color: coordProfile ? TSEC : "#DC2626", fontFamily: SANS }}>
                      {coordProfile ? coordProfile.full_name.split(" ")[0] : "No coord"}
                    </span>
                    <button
                      onClick={() => setCoordModal({ teamNumber: teamNum })}
                      style={{ background: "#F0F0F0", border: "none", borderRadius: 6, padding: "3px 9px", fontSize: "11px", fontWeight: 600, color: "#555", cursor: "pointer", fontFamily: SANS }}
                    >
                      {coordProfile ? "Change" : "Assign"}
                    </button>
                  </div>
                </div>

                {/* Ministry toggle */}
                <div style={{ display: "flex", gap: 4, marginBottom: "0.75rem" }}>
                  {["EM", "MM", "BOTH"].map((m) => (
                    <button
                      key={m}
                      onClick={() => !isBusy && setTeamMinistry(teamNum, m)}
                      disabled={isBusy}
                      style={{
                        flex: 1, padding: "7px 0", borderRadius: 8,
                        border: `1.5px solid ${ministry === m ? "#FF4D00" : BORDER}`,
                        background: ministry === m ? "#FFF5EC" : "#fff",
                        color: ministry === m ? "#FF4D00" : TSEC,
                        fontSize: "12px", fontWeight: 700, fontFamily: SANS,
                        cursor: isBusy ? "default" : "pointer",
                        opacity: isBusy ? 0.6 : 1, transition: "opacity 0.15s",
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Leaders */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "0.5rem" }}>
                  {teamLeaders.map((ldr) => (
                    <div key={ldr.id} style={{ display: "flex", alignItems: "center", gap: 4, background: "#F5F5F5", borderRadius: 20, padding: "4px 10px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#1B2A4A", fontFamily: SANS }}>
                        {ldr.profiles?.full_name?.split(" ")[0] || "—"}
                      </span>
                      <button
                        onClick={() => setPendingRemove(ldr)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: TSEC, fontSize: "13px", padding: "0 2px", lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {teamLeaders.length === 0 && (
                    <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>No leaders assigned</span>
                  )}
                </div>
                <button
                  onClick={() => { setAddLeaderModal({ teamNumber: teamNum }); setAddLeaderQuery(""); }}
                  style={{ background: "none", border: `1px dashed ${BORDER}`, borderRadius: 8, padding: "5px 12px", fontSize: "12px", fontWeight: 600, color: TSEC, cursor: "pointer", fontFamily: SANS }}
                >
                  + Add leader
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Members */}
      <div style={{ marginBottom: "0.75rem" }}>
        <SectionToggle label="Members" detail={`${members.length} enrolled`} open={membersOpen} onClick={() => setMembersOpen((open) => !open)} action={
          <button
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              setAddRole(isConference ? "leader" : "participant");
              setModal("add");
            }}
            style={{ background: "#FF4D00", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: "13px", fontWeight: 700, fontFamily: SANS, cursor: "pointer" }}
          >
            + Add
          </button>
        } />
      </div>

      {membersOpen && (loading ? (
        <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, padding: "2rem 0", textAlign: "center" }}>Loading members…</div>
      ) : members.length === 0 ? (
        <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, padding: "2rem 0", textAlign: "center" }}>No members yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {grouped.map(({ teamNumber, teamMembers }) => (
            <div key={teamNumber}>
              {teamNumber !== "unassigned" && (() => {
                const leaders = teamMembers.filter((m) => m.event_role === "leader");
                const coordId = leaders[0]?.coordinator_id;
                const coordName = coordinatorMap[coordId]?.full_name?.split(" ")[0] || null;
                return (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem", marginTop: "0.5rem" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.1em", fontFamily: SANS, textTransform: "uppercase" }}>
                      Team {teamNumber}
                    </div>
                    <span style={{ fontSize: "11px", color: coordName ? TSEC : "#DC2626", fontFamily: SANS }}>
                      {coordName ? `Coord: ${coordName}` : "No coordinator"}
                    </span>
                  </div>
                );
              })()}
              {teamMembers.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  onRemove={() => setPendingRemove(m)}
                  onEditMessage={isConference ? () => { setEditingMessage(m); setMessageText(m.personal_message || ""); } : null}
                  onSetTeam={isConference ? () => { setTeamModal(m); setTeamInput(m.team_number?.toString() || ""); } : null}
                  showConferenceStatus={isConference}
                />
              ))}
            </div>
          ))}
        </div>
      ))}

      {/* Add member modal */}
      {modal === "add" && (
        <div style={overlayStyle}>
          <div style={{ ...sheetStyle, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 600, color: "#1B2A4A", marginBottom: "0.75rem" }}>Add Member</div>
            <div style={{ display: "flex", gap: 6, marginBottom: "0.75rem" }}>
              {(isConference ? ["leader", "coordinator"] : ["participant", "volunteer"]).map((r) => (
                <button key={r} onClick={() => setAddRole(r)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${addRole === r ? "#FF4D00" : BORDER}`, background: addRole === r ? "#FFF5EC" : "#fff", color: addRole === r ? "#FF4D00" : TSEC, fontSize: "13px", fontWeight: 600, fontFamily: SANS, cursor: "pointer", textTransform: "capitalize" }}>
                  {r}
                </button>
              ))}
            </div>
            <input value={addQuery} onChange={(e) => setAddQuery(e.target.value)} placeholder="Search by name or email…" style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px", fontSize: "14px", fontFamily: SANS, color: "#1B2A4A", outline: "none", boxSizing: "border-box", marginBottom: "0.75rem" }} />
            <div style={{ flex: 1, overflowY: "auto", marginBottom: "0.75rem" }}>
              {notEnrolled.length === 0 ? (
                <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, textAlign: "center", padding: "1rem 0" }}>{addQuery ? "No matches." : "Everyone is already enrolled."}</div>
              ) : notEnrolled.slice(0, 20).map((p) => (
                <button key={p.id} onClick={() => addMember(p)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", borderRadius: 10, padding: "0.625rem 0", cursor: "pointer", textAlign: "left", borderBottom: `1px solid ${BORDER}` }}>
                  <Avatar url={p.photo_url} name={p.full_name} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1B2A4A", fontFamily: SANS }}>{p.full_name}</div>
                    <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>{p.email}</div>
                  </div>
                  <span style={{ fontSize: "12px", color: "#FF4D00", fontWeight: 600, fontFamily: SANS }}>Add</span>
                </button>
              ))}
            </div>
            <button onClick={() => { setModal(null); setAddQuery(""); }} style={cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add leader to team modal */}
      {addLeaderModal && (
        <div style={overlayStyle}>
          <div style={{ ...sheetStyle, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 600, color: "#1B2A4A", marginBottom: 4 }}>Add Leader</div>
            <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, marginBottom: "1rem" }}>Team {addLeaderModal.teamNumber}</div>
            <input value={addLeaderQuery} onChange={(e) => setAddLeaderQuery(e.target.value)} placeholder="Search by name or email…" autoFocus style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px", fontSize: "14px", fontFamily: SANS, color: "#1B2A4A", outline: "none", boxSizing: "border-box", marginBottom: "0.75rem" }} />
            <div style={{ flex: 1, overflowY: "auto", marginBottom: "0.75rem" }}>
              {leaderCandidates.length === 0 ? (
                <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, textAlign: "center", padding: "1rem 0" }}>No matches.</div>
              ) : leaderCandidates.slice(0, 20).map((p) => (
                <button key={p.id} onClick={() => addLeaderToTeam(p)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", borderRadius: 10, padding: "0.625rem 0", cursor: "pointer", textAlign: "left", borderBottom: `1px solid ${BORDER}` }}>
                  <Avatar url={p.photo_url} name={p.full_name} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1B2A4A", fontFamily: SANS }}>{p.full_name}</div>
                    <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>{p.email}</div>
                  </div>
                  <span style={{ fontSize: "12px", color: "#FF4D00", fontWeight: 600, fontFamily: SANS }}>Add</span>
                </button>
              ))}
            </div>
            <button onClick={() => { setAddLeaderModal(null); setAddLeaderQuery(""); }} style={cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Coordinator assignment modal */}
      {coordModal && (
        <div style={overlayStyle}>
          <div style={{ ...sheetStyle, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 600, color: "#1B2A4A", marginBottom: 4 }}>Assign Coordinator</div>
            <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, marginBottom: "1rem" }}>Team {coordModal.teamNumber}</div>
            <div style={{ flex: 1, overflowY: "auto", marginBottom: "0.75rem" }}>
              {coordinatorsList.length === 0 ? (
                <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, textAlign: "center", padding: "1rem 0" }}>No coordinators enrolled. Add them via Edit Event.</div>
              ) : coordinatorsList.map((c) => (
                <button key={c.id} disabled={assigningCoord} onClick={() => assignCoordinator(coordModal.teamNumber, c.profile_id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none", borderRadius: 10, padding: "0.75rem 0.25rem", cursor: "pointer", textAlign: "left", borderBottom: `1px solid ${BORDER}`, opacity: assigningCoord ? 0.5 : 1 }}>
                  <Avatar url={c.profiles?.photo_url} name={c.profiles?.full_name} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1B2A4A", fontFamily: SANS }}>{c.profiles?.full_name}</div>
                    <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>Team {c.team_number} · {c.ministry}</div>
                  </div>
                  <span style={{ fontSize: "12px", color: "#FF4D00", fontWeight: 600, fontFamily: SANS }}>{assigningCoord ? "…" : "Assign"}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setCoordModal(null)} style={cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Personal message editor */}
      {isConference && editingMessage && (
        <div style={overlayStyle}>
          <div style={{ ...sheetStyle, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 600, color: "#1B2A4A", marginBottom: 4 }}>Personal Message</div>
            <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, marginBottom: "1rem" }}>For {editingMessage.profiles?.full_name} — shown on their onboarding step 2.</div>
            <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Write a personal note…" rows={7} style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px", fontSize: "14px", fontFamily: SANS, color: "#1B2A4A", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, marginBottom: "0.75rem" }} />
            {messageText.trim() && (
              <div style={{ background: "#1B2A4A", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "0.75rem", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 8, left: 14, fontFamily: SANS, fontSize: "60px", color: ORANGE, opacity: 0.12, lineHeight: 1, userSelect: "none" }}>"</div>
                <div style={{ fontFamily: SANS, fontSize: "14px", color: "#fff", lineHeight: 1.75, whiteSpace: "pre-wrap", position: "relative" }}>{messageText.trim()}</div>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: ORANGE, fontFamily: SANS, marginTop: "0.75rem" }}>Preview</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={async () => {
                  setBusy(true);
                  await supabase.from("event_members").update({ personal_message: messageText.trim() || null }).eq("id", editingMessage.id);
                  setBusy(false);
                  onToast(`Message saved for ${editingMessage.profiles?.full_name}.`);
                  setEditingMessage(null); await fetchMembers();
                }}
                disabled={busy}
                style={{ flex: 1, background: "#FF4D00", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: SANS }}
              >
                {busy ? "Saving…" : "Save message"}
              </button>
              <button onClick={() => setEditingMessage(null)} style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px 16px", fontSize: "14px", color: TSEC, cursor: "pointer", fontFamily: SANS }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {pendingRemove && (
        <Modal title="Remove Member" message={`Remove ${pendingRemove.profiles?.full_name} from ${event.name}? This deletes their checklist and team assignment.`} confirmLabel="Remove" variant="danger" onCancel={() => setPendingRemove(null)} onConfirm={removeMember} busy={busy} />
      )}
      {archiveModal && (
        <Modal title="Archive Event" message={`Archive "${event.name}"? It will no longer appear as the active event.`} confirmLabel="Archive" variant="danger" onCancel={() => setArchiveModal(false)} onConfirm={archiveEvent} busy={archiving} />
      )}
      {publishModal && (
        <Modal title="Publish Event" message={`Make "${event.name}" active? Other active events will not be affected.`} confirmLabel="Publish" onCancel={() => setPublishModal(false)} onConfirm={publishEvent} busy={publishing} />
      )}
      {deleteModal && (
        <Modal title="Delete Event" message={`Permanently delete "${event.name}"? This cannot be undone.`} confirmLabel="Delete" variant="danger" onCancel={() => setDeleteModal(false)} onConfirm={deleteEvent} busy={deleting} />
      )}

      {/* Edit Event modal */}
      {editModal && (
        <div style={overlayStyle}>
          <div style={{ ...sheetStyle, maxHeight: "88vh", display: "flex", flexDirection: "column", maxWidth: 420 }}>
            <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 700, color: "#1B2A4A", marginBottom: "1rem" }}>Edit Event</div>
            <div style={{ flex: 1, overflowY: "auto" }}>

              {/* Event Details */}
              <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.12em", color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.75rem" }}>
                Event Details
              </div>
              {[
                { key: "name", label: "Event Name" },
                { key: "dates", label: "Dates (e.g. August 5–9, 2026)" },
                { key: "location", label: "Location" },
                { key: "fee", label: "Registration Fee (e.g. $50)" },
                { key: "registration_url", label: "Registration URL" },
                { key: "zoom_training_dates", label: "Zoom Training Dates" },
                { key: "verse", label: "Verse Reference (e.g. John 15:16)" },
              ].map(({ key, label }) => (
                <div key={key} style={{ marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.07em", fontFamily: SANS, marginBottom: 4 }}>{label}</div>
                  <input type="text" value={editFields[key] ?? ""} onChange={(e) => setEditFields((f) => ({ ...f, [key]: e.target.value }))} style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px", fontSize: "14px", fontFamily: SANS, color: "#1B2A4A", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.07em", fontFamily: SANS, marginBottom: 4 }}>Verse Text</div>
                <textarea value={editFields.verse_text ?? ""} onChange={(e) => setEditFields((f) => ({ ...f, verse_text: e.target.value }))} rows={3} style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px", fontSize: "14px", fontFamily: SANS, color: "#1B2A4A", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.07em", fontFamily: SANS, marginBottom: 4 }}>Description</div>
                <textarea value={editFields.description ?? ""} onChange={(e) => setEditFields((f) => ({ ...f, description: e.target.value }))} rows={3} style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px", fontSize: "14px", fontFamily: SANS, color: "#1B2A4A", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.07em", fontFamily: SANS, marginBottom: 4 }}>Type</div>
                <select value={editFields.type ?? "conference"} onChange={(e) => setEditFields((f) => ({ ...f, type: e.target.value }))} style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px", fontSize: "14px", fontFamily: SANS, color: "#1B2A4A", outline: "none", background: "#fff", boxSizing: "border-box" }}>
                  {[["conference","Conference"],["annual_conference","Annual Conference"],["youth_conference","Youth Conference"],["openmic","Open Mic"],["mission","Mission Trip"],["zoom_meeting","Zoom Meeting"],["board_meeting","Board Meeting"],["other","Other"]].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Conference Structure */}
              {["conference","annual_conference","youth_conference"].includes(editFields.type) && (
                <>
                  <div style={{ height: 1, background: BORDER, marginBottom: "1.25rem" }} />
                  <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.12em", color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS, marginBottom: "1rem" }}>
                    Conference Structure
                  </div>

                  {/* Coordinator count stepper */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.07em", fontFamily: SANS, marginBottom: 8 }}>Number of Coordinators</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button
                        onClick={() => {
                          const n = Math.max(0, editCoordCount - 1);
                          setEditCoordCount(n);
                          setEditCoordPicks((p) => p.slice(0, n));
                        }}
                        style={stepperBtn}
                      >−</button>
                      <span style={{ fontSize: "26px", fontWeight: 900, color: "#1B2A4A", fontFamily: SANS, minWidth: 32, textAlign: "center" }}>{editCoordCount}</span>
                      <button
                        onClick={() => {
                          setEditCoordCount((n) => n + 1);
                          setEditCoordPicks((p) => [...p, null]);
                        }}
                        style={stepperBtn}
                      >+</button>
                    </div>
                  </div>

                  {/* Coordinator picker slots */}
                  {editCoordCount > 0 && (
                    <div style={{ marginBottom: "1.25rem" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.07em", fontFamily: SANS, marginBottom: 8 }}>Coordinator Picks</div>
                      {Array.from({ length: editCoordCount }, (_, i) => {
                        const pickedId = editCoordPicks[i] || null;
                        const pickedProfile = pickedId ? (allProfiles || []).find((p) => p.id === pickedId) : null;
                        const isOpen = activeCoordSlot === i;
                        return (
                          <div key={i} style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: TSEC, fontFamily: SANS, marginBottom: 4 }}>
                              Coordinator {i + 1}
                            </div>
                            {pickedProfile && !isOpen ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFF5EC", borderRadius: 8, padding: "8px 12px", border: "1.5px solid #FF4D00" }}>
                                <Avatar url={pickedProfile.photo_url} name={pickedProfile.full_name} size={26} />
                                <span style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: "#1B2A4A", fontFamily: SANS }}>{pickedProfile.full_name}</span>
                                <button onClick={() => { setActiveCoordSlot(i); setEditCoordSearch(""); }} style={{ background: "none", border: "none", fontSize: "11px", color: "#FF4D00", fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Change</button>
                                <button onClick={() => setEditCoordPicks((p) => p.map((x, j) => j === i ? null : x))} style={{ background: "none", border: "none", fontSize: "15px", color: TSEC, cursor: "pointer", padding: "0 2px" }}>×</button>
                              </div>
                            ) : (
                              <div>
                                <input
                                  value={isOpen ? editCoordSearch : ""}
                                  onChange={(e) => setEditCoordSearch(e.target.value)}
                                  onFocus={() => { setActiveCoordSlot(i); setEditCoordSearch(""); }}
                                  placeholder="Search to pick coordinator…"
                                  style={{ width: "100%", border: `1px solid ${isOpen ? "#FF4D00" : BORDER}`, borderRadius: 8, padding: "9px 12px", fontSize: "13px", fontFamily: SANS, color: "#1B2A4A", outline: "none", boxSizing: "border-box" }}
                                />
                                {isOpen && (
                                  <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden", marginTop: 4, maxHeight: 160, overflowY: "auto" }}>
                                    {coordCandidates.length === 0 ? (
                                      <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, padding: "0.75rem", textAlign: "center" }}>No matches</div>
                                    ) : coordCandidates.map((p) => (
                                      <button
                                        key={p.id}
                                        onClick={() => {
                                          setEditCoordPicks((picks) => picks.map((x, j) => j === i ? p.id : x));
                                          setActiveCoordSlot(null);
                                          setEditCoordSearch("");
                                        }}
                                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "#fff", border: "none", borderBottom: `1px solid ${BORDER}`, padding: "8px 12px", cursor: "pointer", textAlign: "left" }}
                                      >
                                        <Avatar url={p.photo_url} name={p.full_name} size={26} />
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#1B2A4A", fontFamily: SANS }}>{p.full_name}</div>
                                          <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS }}>{p.email}</div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Team chips */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.07em", fontFamily: SANS, marginBottom: 8 }}>Teams</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      {Array.from(editTeams).sort((a, b) => a - b).map((n) => (
                        <div key={n} style={{ display: "flex", alignItems: "center", gap: 4, background: "#FFF5EC", border: "1.5px solid #FF4D00", borderRadius: 20, padding: "4px 12px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#FF4D00", fontFamily: SANS }}>Team {n}</span>
                          <button
                            onClick={() => setEditTeams((t) => { const s = new Set(t); s.delete(n); return s; })}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#FF4D00", fontSize: "14px", padding: "0 0 0 4px", lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {editTeams.size === 0 && (
                        <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, padding: "4px 0" }}>No teams yet</span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const max = editTeams.size > 0 ? Math.max(...editTeams) : 0;
                        setEditTeams((t) => new Set([...t, max + 1]));
                      }}
                      style={{ background: "#F5F5F5", border: `1px dashed ${BORDER}`, borderRadius: 8, padding: "6px 14px", fontSize: "12px", fontWeight: 600, color: TSEC, cursor: "pointer", fontFamily: SANS }}
                    >
                      + Add team
                    </button>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: "1rem" }}>
              <button onClick={saveEditModal} disabled={editBusy} style={{ flex: 1, background: editBusy ? "#CCCCCC" : "#FF4D00", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: "14px", fontWeight: 600, fontFamily: SANS, cursor: editBusy ? "default" : "pointer" }}>
                {editBusy ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditModal(false)} style={{ flex: 1, background: "#fff", color: "#1B2A4A", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px", fontSize: "14px", fontWeight: 600, fontFamily: SANS, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team assignment modal */}
      {teamModal && (
        <div style={overlayStyle}>
          <div style={{ ...sheetStyle, display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: SANS, fontSize: "18px", fontWeight: 700, color: "#1B2A4A", marginBottom: 4 }}>Assign Team</div>
            <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, marginBottom: "1rem" }}>{teamModal.profiles?.full_name}</div>
            <input type="number" value={teamInput} onChange={(e) => setTeamInput(e.target.value)} placeholder="Team number" min="1" style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px", fontSize: "22px", fontFamily: SANS, color: "#1B2A4A", outline: "none", boxSizing: "border-box", marginBottom: "1rem", textAlign: "center", fontWeight: 700 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveTeamNumber} disabled={savingTeam} style={{ flex: 1, background: savingTeam ? "#CCCCCC" : "#FF4D00", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: "14px", fontWeight: 600, fontFamily: SANS, cursor: savingTeam ? "default" : "pointer" }}>
                {savingTeam ? "Saving…" : "Assign"}
              </button>
              <button onClick={() => setTeamModal(null)} style={{ flex: 1, background: "#fff", color: "#1B2A4A", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px", fontSize: "14px", fontWeight: 600, fontFamily: SANS, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function actionBtn(color = "rgba(255,255,255,0.55)") {
  return {
    background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8,
    padding: "5px 12px", fontSize: "12px", fontWeight: 600,
    color, cursor: "pointer", fontFamily: SANS,
  };
}

const stepperBtn = {
  width: 36, height: 36, borderRadius: 8, background: "#F0F0F0", border: "none",
  fontSize: "20px", cursor: "pointer", color: "#333", fontFamily: SANS,
  display: "flex", alignItems: "center", justifyContent: "center",
};

const cancelBtn = {
  width: "100%", background: "none", border: `1px solid #E5E5E5`,
  borderRadius: 10, padding: "11px", fontSize: "14px", fontWeight: 600,
  color: "#888", cursor: "pointer", fontFamily: SANS,
};

function MemberRow({ member, onRemove, onEditMessage, onSetTeam, showConferenceStatus }) {
  const p = member.profiles || {};
  const hasMessage = !!member.personal_message;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "0.75rem 1rem" }}>
      <Avatar url={p.photo_url} name={p.full_name} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1B2A4A", fontFamily: SANS, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.full_name}</div>
        <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 1, display: "flex", alignItems: "center", gap: 6 }}>
          <span>{member.event_role}{member.ministry ? ` · ${member.ministry}` : ""}</span>
          {onSetTeam && (
            <button onClick={onSetTeam} style={{ background: "#F0F0F0", border: "none", borderRadius: 4, padding: "1px 6px", fontSize: "11px", fontWeight: 700, color: "#555", cursor: "pointer", fontFamily: SANS }}>
              T{member.team_number ?? "–"}
            </button>
          )}
        </div>
      </div>
      {showConferenceStatus && <ReadinessIndicator member={member} />}
      {onEditMessage && (
        <button onClick={onEditMessage} title={hasMessage ? "Edit personal message" : "Write personal message"} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", color: hasMessage ? ORANGE : BORDER, flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={hasMessage ? ORANGE : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", fontSize: "13px", fontFamily: SANS, padding: "4px", flexShrink: 0 }}>✕</button>
    </div>
  );
}

function checklistProgress(member) {
  const items = Array.isArray(member.event_checklist)
    ? member.event_checklist[0]?.items
    : member.event_checklist?.items;
  const values = items || {};
  return {
    done: CHECKLIST_ITEMS.filter((item) => values[item.id]).length,
    total: CHECKLIST_ITEMS.length,
  };
}

function readinessState(member) {
  const progress = checklistProgress(member);
  if (!member.profiles?.last_seen_at) {
    return { key: "no_login", label: "No login", progress };
  }
  if (!member.onboarding_visited) {
    return { key: "not_started", label: "Not started", progress };
  }
  if (progress.done === progress.total) {
    return { key: "ready", label: "Ready", progress };
  }
  return { key: "in_progress", label: "In progress", progress };
}

function ReadinessIndicator({ member }) {
  const state = readinessState(member);

  if (state.key === "ready") {
    return (
      <span style={{ fontSize: "10px", fontWeight: 800, background: "#D1FAE5", color: "#067647", borderRadius: 20, padding: "4px 9px", fontFamily: SANS, flexShrink: 0 }}>
        Ready
      </span>
    );
  }

  if (state.key === "no_login") {
    return (
      <span style={{ fontSize: "10px", fontWeight: 800, background: "#F0F0F0", color: "#777", borderRadius: 20, padding: "4px 9px", fontFamily: SANS, flexShrink: 0 }}>
        No login
      </span>
    );
  }

  if (state.key === "not_started") {
    return (
      <span style={{ fontSize: "10px", fontWeight: 800, background: "#FFF0EA", color: "#C2410C", borderRadius: 20, padding: "4px 9px", fontFamily: SANS, flexShrink: 0 }}>
        Not started
      </span>
    );
  }

  return (
    <div aria-label={`Checklist ${state.progress.done} of ${state.progress.total}`} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
      {Array.from({ length: state.progress.total }, (_, index) => (
        <span
          key={index}
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: index < state.progress.done ? "#F5B700" : "#FFF9DB",
            border: "1px solid #D99F00",
          }}
        />
      ))}
    </div>
  );
}

function SectionToggle({ label, detail, open, onClick, action }) {
  return (
    <div style={{ width: "100%", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "0.5rem 0.625rem", display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={onClick} aria-expanded={open} style={{ flex: 1, minWidth: 0, background: "none", border: "none", padding: "0.25rem", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left" }}>
        <span style={{ width: 24, height: 24, borderRadius: 7, background: "#F0F0F0", color: "#555", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontSize: "15px", fontWeight: 800, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.18s" }}>›</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 800, letterSpacing: "0.14em", color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS }}>{label}</span>
          <span style={{ display: "block", fontSize: "11px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>{detail}</span>
        </span>
      </button>
      {action}
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

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(22,32,56,0.6)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 500, padding: "1.5rem",
};

const sheetStyle = {
  background: "#fff", borderRadius: 20, padding: "1.5rem",
  maxWidth: 360, width: "100%",
};
