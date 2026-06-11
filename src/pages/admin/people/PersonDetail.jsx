import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase.js";
import { TSEC, BORDER, SANS, PROFILE_TAGS } from "../../../lib/constants.js";
import { Avatar, Modal, SectionLabel, ProfileTags } from "../../../components/ui/index.js";

const inputStyle = {
  width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10,
  padding: "10px 12px", fontSize: "15px", fontFamily: SANS, color: "#1B2A4A",
  outline: "none", boxSizing: "border-box", background: "#fff",
};

const selectStyle = { ...inputStyle, cursor: "pointer" };

export default function PersonDetail({ profile, data, onRefresh, onToast, onDone }) {
  const { activeEvent, churches } = data;
  const church = (churches || []).find((c) => c.id === profile.church_id)?.name;

  // Fetch event membership only to know if "Add to event" is available
  const [em, setEm] = useState(null);
  const [emLoading, setEmLoading] = useState(true);

  useEffect(() => {
    async function fetchEm() {
      setEmLoading(true);
      if (!activeEvent) { setEm(null); setEmLoading(false); return; }
      const { data: row } = await supabase
        .from("event_members")
        .select("id")
        .eq("profile_id", profile.id)
        .eq("event_id", activeEvent.id)
        .maybeSingle();
      setEm(row || null);
      setEmLoading(false);
    }
    fetchEm();
  }, [profile.id, activeEvent?.id]);

  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tempPw, setTempPw] = useState(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [resetWarning, setResetWarning] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Platform role (select first, save explicitly)
  const [currentRole, setCurrentRole] = useState(profile.platform_role);
  const [selectedRole, setSelectedRole] = useState(profile.platform_role);
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    setCurrentRole(profile.platform_role);
    setSelectedRole(profile.platform_role);
  }, [profile.id, profile.platform_role]);

  // Profile tags
  const [tags, setTags] = useState(profile.tags || []);
  const [savingTag, setSavingTag] = useState(null);

  // Add to event
  const [addRole, setAddRole] = useState("leader");
  const [addTeam, setAddTeam] = useState("");
  const [addMinistry, setAddMinistry] = useState("");
  const [addingToEvent, setAddingToEvent] = useState(false);

  async function saveRole() {
    if (selectedRole === currentRole || savingRole) return;
    setSavingRole(true);
    const { error } = await supabase
      .from("profiles")
      .update({ platform_role: selectedRole })
      .eq("id", profile.id);
    setSavingRole(false);
    if (error) { onToast("Could not update role.", "error"); return; }
    setCurrentRole(selectedRole);
    onToast(`Role changed to ${selectedRole} for ${profile.full_name}.`);
    onRefresh();
  }

  async function toggleTag(key) {
    setSavingTag(key);
    const isAdding = !tags.includes(key);
    const next = isAdding ? [...tags, key] : tags.filter((t) => t !== key);
    const { error } = await supabase.from("profiles").update({ tags: next }).eq("id", profile.id);
    if (error) {
      setSavingTag(null);
      onToast(`Could not ${isAdding ? "add" : "remove"} the ${key === "pastor" ? "Pastor" : "412 Board"} tag.`, "error");
      return;
    }
    setTags(next);

    // Auto-sync the corresponding system group conversation
    const groupKey = key === "pastor" ? "pastors" : key === "board_member" ? "board" : null;
    if (groupKey) {
      const { data: conv } = await supabase
        .from("conversations").select("id").eq("system_key", groupKey).maybeSingle();
      if (conv?.id) {
        if (isAdding) {
          await supabase.from("conversation_participants")
            .upsert({ conversation_id: conv.id, profile_id: profile.id }, { onConflict: "conversation_id,profile_id" });
        } else {
          await supabase.from("conversation_participants")
            .delete().eq("conversation_id", conv.id).eq("profile_id", profile.id);
        }
      }
    }

    setSavingTag(null);
    onRefresh();
  }

  async function resetPassword() {
    setBusy(true);
    setTempPw(null);
    setPasswordCopied(false);
    setResetWarning(null);
    const { data: res, error } = await supabase.functions.invoke("reset-password", {
      body: { user_id: profile.id },
    });
    setBusy(false);
    if (error || !res?.success || !res?.temp_password) {
      setModal(null);
      onToast(res?.error || error?.message || "Password reset failed.", "error");
      return;
    }
    setTempPw(res.temp_password);
    setResetWarning(res.warning || null);
    setModal("reset-result");
  }

  async function copyTemporaryPassword() {
    try {
      await navigator.clipboard.writeText(tempPw);
      setPasswordCopied(true);
      onToast("Temporary password copied.");
    } catch {
      onToast("Could not copy automatically. Press and hold the password to copy it.", "error");
    }
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setBusy(true);
    const { data: result, error } = await supabase.functions.invoke("delete-user", {
      body: { user_id: profile.id },
    });
    setBusy(false);
    if (error || !result?.success) {
      onToast(result?.error || "Could not remove account.", "error");
      return;
    }
    setModal(null);
    onToast(`${profile.full_name}'s account was permanently removed.`);
    await onRefresh();
    onDone();
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
    await supabase.from("event_checklist").insert({ event_member_id: newEm.id, items: {} });
    setAddingToEvent(false);
    setModal(null);
    onToast(`${profile.full_name} added to ${activeEvent.name}.`);
    setEm(newEm);
    await onRefresh();
  }

  const ROLE_CHIPS = [
    { key: "admin",     label: "Admin",     bg: "#FF4D00", color: "#fff" },
    { key: "moderator", label: "Moderator", bg: "#FF4D00", color: "#fff" },
    { key: "member",    label: "User",      bg: "#FF4D00", color: "#fff" },
  ];

  const TAG_CHIPS = [
    { key: "board_member", label: "412 Board", bg: "#FF4D00", color: "#fff" },
    { key: "pastor",       label: "Pastor",    bg: "#FF4D00", color: "#fff" },
  ];

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
          <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 600, color: "#1B2A4A", lineHeight: 1.2 }}>
            {profile.full_name}
          </div>
          {profile.nickname && (
            <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>"{profile.nickname}"</div>
          )}
          <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>
            {profile.email}
          </div>
          <ProfileTags profile={{ ...profile, tags }} />
        </div>
      </div>

      {/* Contact info */}
      <InfoRows rows={[
        ["Phone", profile.phone],
        ["Church", church],
        ["Ministry Role", profile.ministry_role],
      ]} />

      {/* Unified role & tags chip grid */}
      <SectionLabel>Role & Tags</SectionLabel>
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1.1rem 1.25rem", marginBottom: "1rem" }}>
        <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginBottom: "1rem", lineHeight: 1.5 }}>
          Select one platform role, then save the change. Tags can be combined freely.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ROLE_CHIPS.map(({ key, label, bg, color }) => {
            const active = selectedRole === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedRole(key)}
                disabled={savingRole}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 99,
                  cursor: savingRole ? "default" : "pointer",
                  border: active ? "none" : `1.5px dashed ${BORDER}`,
                  background: active ? bg : "#fff",
                  color: active ? color : TSEC,
                  fontSize: "13px", fontWeight: 700, fontFamily: SANS, letterSpacing: "0.02em",
                  opacity: savingRole ? 0.5 : 1, transition: "opacity 0.15s ease",
                }}
              >
                {active ? "✓ " : ""}{label}
              </button>
            );
          })}
          <button
            onClick={saveRole}
            disabled={savingRole || selectedRole === currentRole}
            style={{
              padding: "8px 16px", borderRadius: 99, border: "none",
              background: selectedRole === currentRole ? "#E5E5E5" : "#111",
              color: selectedRole === currentRole ? TSEC : "#fff",
              fontSize: "13px", fontWeight: 800, fontFamily: SANS,
              cursor: savingRole || selectedRole === currentRole ? "default" : "pointer",
            }}
          >
            {savingRole ? "Saving…" : "Save role"}
          </button>
          {TAG_CHIPS.map(({ key, label, bg, color }) => {
            const active = tags.includes(key);
            const isSaving = savingTag === key;
            return (
              <button
                key={key}
                onClick={() => toggleTag(key)}
                disabled={isSaving}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 99,
                  cursor: isSaving ? "default" : "pointer",
                  border: active ? "none" : `1.5px dashed ${BORDER}`,
                  background: active ? bg : "#fff",
                  color: active ? color : TSEC,
                  fontSize: "13px", fontWeight: 700, fontFamily: SANS, letterSpacing: "0.02em",
                  opacity: isSaving ? 0.5 : 1, transition: "opacity 0.15s ease",
                }}
              >
                {isSaving ? "…" : active ? "✓ " : "+ "}{label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Actions */}
      <SectionLabel>Admin Actions</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "2rem" }}>
        {activeEvent && !em && !emLoading && (
          <ActionRow label={`Add to ${activeEvent.name}`} sub="Enroll in active event" onClick={() => setModal("add")} />
        )}
        <ActionRow label="Reset password" sub="Generate new temp password" danger onClick={() => setModal("reset")} />
        <ActionRow label="Remove account" sub="Permanently delete this test or duplicate account" danger onClick={() => { setDeleteConfirm(""); setModal("delete"); }} />
      </div>

      {/* Add to event modal */}
      {modal === "add" && activeEvent && (
        <div style={overlay}>
          <div style={sheet}>
            <div style={{ fontFamily: SANS, fontSize: "22px", fontWeight: 600, color: "#1B2A4A", marginBottom: "0.75rem" }}>Add to Event</div>
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
            <ModalButtons onCancel={() => setModal(null)} onConfirm={addToEvent} confirmLabel={addingToEvent ? "Adding…" : "Add to Event"} disabled={addingToEvent} />
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

      {modal === "reset-result" && tempPw && (
        <div style={overlay}>
          <div style={sheet}>
            <div style={{ fontFamily: SANS, fontSize: "22px", fontWeight: 800, color: "#111", marginBottom: "0.5rem" }}>
              Password Reset
            </div>
            <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, lineHeight: 1.6, marginBottom: "1rem" }}>
              Share this temporary password with {profile.full_name}. They will be required to replace it after signing in.
            </div>
            <div
              role="status"
              aria-label="Temporary password"
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "22px",
                fontWeight: 800,
                color: "#111",
                letterSpacing: "0.06em",
                padding: "1rem",
                background: "#F5F5F5",
                borderRadius: 12,
                border: `1px solid ${BORDER}`,
                marginBottom: "0.75rem",
                textAlign: "center",
                userSelect: "all",
                overflowWrap: "anywhere",
              }}
            >
              {tempPw}
            </div>
            <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, lineHeight: 1.5, marginBottom: "1rem" }}>
              This password is shown only once. Copy it before closing this window.
            </div>
            {resetWarning && (
              <div style={{ background: "#111", color: "#fff", borderRadius: 10, padding: "0.75rem", fontSize: "12px", lineHeight: 1.5, fontFamily: SANS, marginBottom: "1rem" }}>
                {resetWarning}
              </div>
            )}
            <button
              onClick={copyTemporaryPassword}
              style={{
                width: "100%",
                background: "#FF4D00",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px",
                fontSize: "14px",
                fontWeight: 800,
                fontFamily: SANS,
                cursor: "pointer",
                marginBottom: 8,
              }}
            >
              {passwordCopied ? "Copied" : "Copy Password"}
            </button>
            <button
              onClick={() => { setModal(null); setTempPw(null); setPasswordCopied(false); setResetWarning(null); }}
              style={{
                width: "100%",
                background: "#fff",
                color: "#111",
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: "11px",
                fontSize: "14px",
                fontWeight: 700,
                fontFamily: SANS,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {modal === "delete" && (
        <div style={overlay}>
          <div style={sheet}>
            <div style={{ fontFamily: SANS, fontSize: "22px", fontWeight: 700, color: "#111", marginBottom: "0.75rem" }}>Remove Account</div>
            <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, lineHeight: 1.6, marginBottom: "1rem" }}>
              This permanently deletes {profile.full_name}'s login and profile. Use it only for accidental, test, or duplicate accounts.
            </div>
            <FieldLabel>TYPE DELETE TO CONFIRM</FieldLabel>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              style={{ ...inputStyle, marginBottom: "1.25rem" }}
            />
            <ModalButtons
              onCancel={() => setModal(null)}
              onConfirm={deleteAccount}
              confirmLabel={busy ? "Removing…" : "Remove Account"}
              disabled={busy || deleteConfirm !== "DELETE"}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRows({ rows }) {
  const visible = rows.filter(([, v]) => v);
  if (!visible.length) return null;
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", marginBottom: "1rem" }}>
      {visible.map(([label, val], i) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 1.25rem", borderBottom: i < visible.length - 1 ? `1px solid ${BORDER}` : "none" }}>
          <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>{label}</span>
          <span style={{ fontSize: "14px", color: "#1B2A4A", fontFamily: SANS, textAlign: "right", maxWidth: "65%" }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

function ActionRow({ label, sub, onClick, danger }) {
  return (
    <button onClick={onClick} style={{ width: "100%", background: "#fff", border: `1px solid ${danger ? "#FECACA" : BORDER}`, borderRadius: 14, padding: "0.875rem 1.25rem", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: "14px", fontWeight: 600, color: danger ? "#DC2626" : "#1B2A4A", fontFamily: SANS }}>{label}</span>
      <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>{sub}</span>
    </button>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: "11px", fontWeight: 700, color: TSEC, letterSpacing: "0.08em", fontFamily: SANS, marginBottom: 5 }}>{children}</div>;
}

function ModalButtons({ onCancel, onConfirm, confirmLabel, disabled }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={onCancel} style={{ flex: 1, background: "none", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px", fontSize: "15px", fontWeight: 600, color: "#1B2A4A", cursor: "pointer", fontFamily: SANS }}>Cancel</button>
      <button onClick={onConfirm} disabled={disabled} style={{ flex: 1, background: disabled ? "#CCCCCC" : "#FF4D00", border: "none", borderRadius: 10, padding: "12px", fontSize: "15px", fontWeight: 600, color: "#fff", cursor: disabled ? "default" : "pointer", fontFamily: SANS }}>
        {confirmLabel}
      </button>
    </div>
  );
}

const overlay = { position: "fixed", inset: 0, background: "rgba(22,32,56,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: "1.5rem" };
const sheet = { background: "#fff", borderRadius: 20, padding: "1.75rem", maxWidth: 360, width: "100%" };
