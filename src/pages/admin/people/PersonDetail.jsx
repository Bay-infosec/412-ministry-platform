import { useState } from "react";
import { supabase } from "../../../lib/supabase.js";
import { NAVY, ORANGE, TSEC, BORDER, SANS, SERIF } from "../../../lib/constants.js";
import { Avatar, Badge, Modal, SectionLabel } from "../../../components/ui/index.js";

const inputStyle = {
  width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10,
  padding: "10px 12px", fontSize: "15px", fontFamily: SANS, color: NAVY,
  outline: "none", boxSizing: "border-box", background: "#fff",
};

const selectStyle = {
  ...inputStyle, appearance: "none",
};

export default function PersonDetail({ profile, data, onRefresh, onToast, onDone }) {
  const { activeEvent, allEventMembers, churches } = data;

  const em = activeEvent
    ? (allEventMembers || []).find(
        (m) => m.profile_id === profile.id && m.event_id === activeEvent.id
      )
    : null;

  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [newRole, setNewRole] = useState(profile.platform_role);
  const [tempPw, setTempPw] = useState(null);

  const [editMsg, setEditMsg] = useState(false);
  const [msg, setMsg] = useState(em?.personal_message || "");
  const [savingMsg, setSavingMsg] = useState(false);

  const [editTeam, setEditTeam] = useState(false);
  const [teamNum, setTeamNum] = useState(em?.team_number?.toString() || "");
  const [ministry, setMinistry] = useState(em?.ministry || "");
  const [savingTeam, setSavingTeam] = useState(false);

  const [addRole, setAddRole] = useState("leader");
  const [addTeam, setAddTeam] = useState("");
  const [addMinistry, setAddMinistry] = useState("");
  const [addingToEvent, setAddingToEvent] = useState(false);

  const church = (churches || []).find((c) => c.id === profile.church_id)?.name;

  async function changeRole() {
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ platform_role: newRole })
      .eq("id", profile.id);
    setBusy(false);
    setModal(null);
    if (error) { onToast("Could not update role.", "error"); return; }
    onToast(`Role changed to ${newRole} for ${profile.full_name}.`);
    await onRefresh();
    onDone();
  }

  async function resetPassword() {
    setBusy(true);
    const { data: res, error } = await supabase.functions.invoke("reset-password", {
      body: { user_id: profile.id },
    });
    setBusy(false);
    setModal(null);
    if (error || !res?.success) {
      onToast("Password reset failed.", "error");
      return;
    }
    setTempPw(res.temp_password);
  }

  async function saveMessage() {
    if (!em) return;
    setSavingMsg(true);
    const { error } = await supabase
      .from("event_members")
      .update({ personal_message: msg })
      .eq("id", em.id);
    setSavingMsg(false);
    setEditMsg(false);
    if (error) { onToast("Could not save message.", "error"); return; }
    onToast("Personal message saved.");
    onRefresh();
  }

  async function saveTeam() {
    if (!em) return;
    setSavingTeam(true);
    const { error } = await supabase
      .from("event_members")
      .update({
        team_number: teamNum ? parseInt(teamNum, 10) : null,
        ministry: ministry || null,
      })
      .eq("id", em.id);
    setSavingTeam(false);
    setEditTeam(false);
    if (error) { onToast("Could not save team.", "error"); return; }
    onToast("Team assignment saved.");
    onRefresh();
  }

  async function addToEvent() {
    if (!activeEvent) return;
    setAddingToEvent(true);
    const { data: newEm, error } = await supabase
      .from("event_members")
      .insert({
        event_id: activeEvent.id,
        profile_id: profile.id,
        event_role: addRole,
        team_number: addTeam ? parseInt(addTeam, 10) : null,
        ministry: addMinistry || null,
        status: "accepted",
        onboarding_completed: false,
        onboarding_visited: false,
      })
      .select()
      .single();

    if (error) {
      setAddingToEvent(false);
      setModal(null);
      onToast("Could not add to event. They may already be enrolled.", "error");
      return;
    }

    await supabase.from("event_checklist").insert({
      event_member_id: newEm.id,
      items: {},
    });

    setAddingToEvent(false);
    setModal(null);
    onToast(`${profile.full_name} added to ${activeEvent.name}.`);
    await onRefresh();
    onDone();
  }

  async function removeFromEvent() {
    if (!em) return;
    setBusy(true);
    await supabase.from("event_checklist").delete().eq("event_member_id", em.id);
    await supabase.from("event_members").delete().eq("id", em.id);
    setBusy(false);
    setModal(null);
    onToast(`${profile.full_name} removed from ${activeEvent?.name}.`, "info");
    await onRefresh();
    onDone();
  }

  return (
    <div>
      {/* Header card */}
      <div style={{
        background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
        padding: "1.25rem", marginBottom: "1rem",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <Avatar url={profile.photo_url} name={profile.full_name} size={58} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
            {profile.full_name}
          </div>
          {profile.nickname && (
            <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>"{profile.nickname}"</div>
          )}
          <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>
            {profile.email}
          </div>
          <div style={{ marginTop: 6 }}>
            <Badge variant={profile.platform_role} />
          </div>
        </div>
      </div>

      {/* Contact info */}
      <InfoRows rows={[
        ["Phone", profile.phone],
        ["Church", church],
        ["Ministry Role", profile.ministry_role],
      ]} />

      {/* Event section */}
      {activeEvent && (
        <>
          <SectionLabel>{activeEvent.name}</SectionLabel>
          {em ? (
            <InfoRows rows={[
              ["Event Role", em.event_role],
              ["Team", em.team_number ? `Team ${em.team_number}` : "Unassigned"],
              ["Ministry", em.ministry],
              ["Onboarding", em.onboarding_completed ? "Complete ✓" : "In progress"],
              ["Status", em.status],
            ]} />
          ) : (
            <div style={{
              background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
              padding: "1rem 1.25rem", marginBottom: "1rem",
              fontSize: "14px", color: TSEC, fontFamily: SANS,
            }}>
              Not enrolled in this event.
            </div>
          )}
        </>
      )}

      {/* Temp password (after reset) */}
      {tempPw && (
        <div style={{
          background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 14,
          padding: "1.25rem", marginBottom: "1rem",
        }}>
          <div style={{
            fontSize: "11px", fontWeight: 700, color: "#C2410C",
            letterSpacing: "0.1em", fontFamily: SANS, textTransform: "uppercase", marginBottom: 8,
          }}>
            Temporary Password — Share with {profile.full_name} manually
          </div>
          <div style={{
            fontFamily: "monospace", fontSize: "24px", fontWeight: 700, color: NAVY,
            letterSpacing: "0.06em", padding: "0.75rem 1rem", background: "#fff",
            borderRadius: 10, border: `1px solid ${BORDER}`, marginBottom: 8,
          }}>
            {tempPw}
          </div>
          <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginBottom: 10 }}>
            This disappears when you navigate away. Copy it now.
          </div>
          <button onClick={() => setTempPw(null)} style={{
            background: "none", border: "none", color: TSEC,
            fontSize: "13px", cursor: "pointer", fontFamily: SANS, padding: 0,
          }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Personal message */}
      {em && (
        <>
          <SectionLabel>Personal Message</SectionLabel>
          <div style={{
            background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
            padding: "1rem 1.25rem", marginBottom: "1rem",
          }}>
            {!editMsg ? (
              <>
                {em.personal_message ? (
                  <div style={{
                    fontSize: "14px", color: NAVY, fontFamily: SANS,
                    lineHeight: 1.65, marginBottom: "0.75rem", whiteSpace: "pre-wrap",
                  }}>
                    {em.personal_message}
                  </div>
                ) : (
                  <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, marginBottom: "0.75rem" }}>
                    No message written yet.
                  </div>
                )}
                <button onClick={() => { setMsg(em.personal_message || ""); setEditMsg(true); }} style={{
                  background: "none", border: "none", color: ORANGE, fontWeight: 600,
                  fontSize: "13px", cursor: "pointer", fontFamily: SANS, padding: 0,
                }}>
                  {em.personal_message ? "Edit →" : "Write a message →"}
                </button>
              </>
            ) : (
              <>
                <textarea
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  rows={5}
                  placeholder="Write a personal message for this leader…"
                  style={{
                    width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10,
                    padding: "10px 12px", fontSize: "14px", fontFamily: SANS, color: NAVY,
                    resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: "0.75rem",
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setEditMsg(false)} style={{
                    flex: 1, background: "none", border: `1px solid ${BORDER}`, borderRadius: 10,
                    padding: "10px", fontSize: "14px", color: TSEC, cursor: "pointer", fontFamily: SANS,
                  }}>
                    Cancel
                  </button>
                  <button onClick={saveMessage} disabled={savingMsg} style={{
                    flex: 1, background: NAVY, border: "none", borderRadius: 10,
                    padding: "10px", fontSize: "14px", fontWeight: 600, color: "#fff",
                    cursor: savingMsg ? "default" : "pointer", fontFamily: SANS,
                    opacity: savingMsg ? 0.7 : 1,
                  }}>
                    {savingMsg ? "Saving…" : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Team assignment */}
      {em && (
        <>
          <SectionLabel>Team Assignment</SectionLabel>
          <div style={{
            background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
            padding: "1rem 1.25rem", marginBottom: "1rem",
          }}>
            {!editTeam ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>
                    Team {em.team_number || "—"} · {em.ministry || "No ministry"}
                  </div>
                  <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>
                    Role: {em.event_role}
                  </div>
                </div>
                <button onClick={() => { setTeamNum(em?.team_number?.toString() || ""); setMinistry(em?.ministry || ""); setEditTeam(true); }} style={{
                  background: "none", border: "none", color: ORANGE,
                  fontWeight: 600, fontSize: "13px", cursor: "pointer", fontFamily: SANS,
                }}>
                  Edit
                </button>
              </div>
            ) : (
              <>
                <FieldLabel>TEAM NUMBER</FieldLabel>
                <input
                  type="number" value={teamNum} onChange={(e) => setTeamNum(e.target.value)}
                  min="1" max="99" placeholder="e.g. 7"
                  style={{ ...inputStyle, marginBottom: "0.75rem" }}
                />
                <FieldLabel>MINISTRY</FieldLabel>
                <select value={ministry} onChange={(e) => setMinistry(e.target.value)} style={{ ...selectStyle, marginBottom: "0.875rem" }}>
                  <option value="">Select ministry</option>
                  <option value="EM">English Ministry (EM)</option>
                  <option value="MM">Mongolian Ministry (MM)</option>
                </select>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setEditTeam(false)} style={{
                    flex: 1, background: "none", border: `1px solid ${BORDER}`, borderRadius: 10,
                    padding: "10px", fontSize: "14px", color: TSEC, cursor: "pointer", fontFamily: SANS,
                  }}>
                    Cancel
                  </button>
                  <button onClick={saveTeam} disabled={savingTeam} style={{
                    flex: 1, background: NAVY, border: "none", borderRadius: 10,
                    padding: "10px", fontSize: "14px", fontWeight: 600, color: "#fff",
                    cursor: savingTeam ? "default" : "pointer", fontFamily: SANS,
                    opacity: savingTeam ? 0.7 : 1,
                  }}>
                    {savingTeam ? "Saving…" : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Admin Actions */}
      <SectionLabel>Admin Actions</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "2rem" }}>
        <ActionRow
          label="Change platform role"
          sub={`Currently: ${profile.platform_role}`}
          onClick={() => { setNewRole(profile.platform_role); setModal("role"); }}
        />
        {activeEvent && !em && (
          <ActionRow
            label={`Add to ${activeEvent.name}`}
            sub="Enroll in active event"
            onClick={() => setModal("add")}
          />
        )}
        <ActionRow
          label="Reset password"
          sub="Generate new temp password"
          danger
          onClick={() => setModal("reset")}
        />
        {em && (
          <ActionRow
            label={`Remove from ${activeEvent?.name}`}
            sub="Removes team, message, and checklist"
            danger
            onClick={() => setModal("remove")}
          />
        )}
      </div>

      {/* Change role modal */}
      {modal === "role" && (
        <div style={overlay}>
          <div style={sheet}>
            <div style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 600, color: NAVY, marginBottom: "0.75rem" }}>
              Change Platform Role
            </div>
            <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, lineHeight: 1.6, marginBottom: "1.25rem" }}>
              Select a new role for {profile.full_name}.
            </div>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ ...selectStyle, marginBottom: "1.5rem" }}>
              <option value="member">Member</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
            <ModalButtons
              onCancel={() => setModal(null)}
              onConfirm={changeRole}
              confirmLabel={busy ? "Saving…" : "Change Role"}
              disabled={busy || newRole === profile.platform_role}
            />
          </div>
        </div>
      )}

      {/* Add to event modal */}
      {modal === "add" && activeEvent && (
        <div style={overlay}>
          <div style={sheet}>
            <div style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 600, color: NAVY, marginBottom: "0.75rem" }}>
              Add to Event
            </div>
            <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, lineHeight: 1.6, marginBottom: "1rem" }}>
              Enroll {profile.full_name} in {activeEvent.name}.
            </div>
            <FieldLabel>EVENT ROLE</FieldLabel>
            <select value={addRole} onChange={(e) => setAddRole(e.target.value)} style={{ ...selectStyle, marginBottom: "0.75rem" }}>
              <option value="leader">Leader</option>
              <option value="coordinator">Coordinator</option>
              <option value="participant">Participant</option>
              <option value="volunteer">Volunteer</option>
            </select>
            <FieldLabel>TEAM NUMBER (optional)</FieldLabel>
            <input type="number" value={addTeam} onChange={(e) => setAddTeam(e.target.value)} min="1" placeholder="e.g. 7" style={{ ...inputStyle, marginBottom: "0.75rem" }} />
            <FieldLabel>MINISTRY (optional)</FieldLabel>
            <select value={addMinistry} onChange={(e) => setAddMinistry(e.target.value)} style={{ ...selectStyle, marginBottom: "1.5rem" }}>
              <option value="">Select ministry</option>
              <option value="EM">English Ministry (EM)</option>
              <option value="MM">Mongolian Ministry (MM)</option>
            </select>
            <ModalButtons
              onCancel={() => setModal(null)}
              onConfirm={addToEvent}
              confirmLabel={addingToEvent ? "Adding…" : "Add to Event"}
              disabled={addingToEvent}
            />
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {modal === "reset" && (
        <Modal
          title="Reset Password"
          message={`A new temporary password will be generated for ${profile.full_name}. You will see it once on screen to share manually.`}
          confirmLabel="Reset Password"
          variant="danger"
          onCancel={() => setModal(null)}
          onConfirm={resetPassword}
          busy={busy}
        />
      )}

      {/* Remove from event modal */}
      {modal === "remove" && (
        <Modal
          title="Remove from Event"
          message={`Remove ${profile.full_name} from ${activeEvent?.name}? This deletes their team assignment, personal message, and checklist.`}
          confirmLabel="Remove"
          variant="danger"
          onCancel={() => setModal(null)}
          onConfirm={removeFromEvent}
          busy={busy}
        />
      )}
    </div>
  );
}

function InfoRows({ rows }) {
  const visible = rows.filter(([, v]) => v);
  if (!visible.length) return null;
  return (
    <div style={{
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
      overflow: "hidden", marginBottom: "1rem",
    }}>
      {visible.map(([label, val], i) => (
        <div key={label} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "0.875rem 1.25rem",
          borderBottom: i < visible.length - 1 ? `1px solid ${BORDER}` : "none",
        }}>
          <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>{label}</span>
          <span style={{ fontSize: "14px", color: NAVY, fontFamily: SANS, textAlign: "right", maxWidth: "65%" }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

function ActionRow({ label, sub, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", background: "#fff",
        border: `1px solid ${danger ? "#FECACA" : BORDER}`,
        borderRadius: 14, padding: "0.875rem 1.25rem",
        cursor: "pointer", textAlign: "left",
        display: "flex", flexDirection: "column", gap: 3,
      }}
    >
      <span style={{ fontSize: "14px", fontWeight: 600, color: danger ? "#DC2626" : NAVY, fontFamily: SANS }}>
        {label}
      </span>
      <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>{sub}</span>
    </button>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{
      fontSize: "11px", fontWeight: 700, color: TSEC,
      letterSpacing: "0.08em", fontFamily: SANS, marginBottom: 5,
    }}>
      {children}
    </div>
  );
}

function ModalButtons({ onCancel, onConfirm, confirmLabel, disabled }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={onCancel} style={{
        flex: 1, background: "none", border: `1px solid ${BORDER}`, borderRadius: 10,
        padding: "12px", fontSize: "15px", fontWeight: 600, color: NAVY,
        cursor: "pointer", fontFamily: SANS,
      }}>
        Cancel
      </button>
      <button onClick={onConfirm} disabled={disabled} style={{
        flex: 1, background: disabled ? "#C9B7A8" : NAVY, border: "none", borderRadius: 10,
        padding: "12px", fontSize: "15px", fontWeight: 600, color: "#fff",
        cursor: disabled ? "default" : "pointer", fontFamily: SANS,
      }}>
        {confirmLabel}
      </button>
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(22,32,56,0.6)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 500, padding: "1.5rem",
};

const sheet = {
  background: "#fff", borderRadius: 20, padding: "1.75rem",
  maxWidth: 360, width: "100%",
};
