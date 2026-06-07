import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase.js";
import { TSEC, BORDER, SANS, SERIF } from "../../../lib/constants.js";
import { Card, SectionLabel, Field, Modal } from "../../../components/ui/index.js";

export default function ChurchList({ onToast }) {
  const [churches, setChurches] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} | {id,...}
  const [busy, setBusy] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from("churches").select("*").order("name"),
      supabase.from("profiles").select("id, full_name, church_name_custom")
        .not("church_name_custom", "is", null)
        .neq("church_name_custom", ""),
    ]);
    setChurches(c || []);
    setPending(p || []);
    setLoading(false);
  }

  async function save() {
    const { name, city, state } = editing;
    if (!name?.trim()) { onToast("Church name is required.", "error"); return; }
    setBusy(true);
    const payload = { name: name.trim(), city: city?.trim() || null, state: state?.trim() || null };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from("churches").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("churches").insert(payload));
    }
    setBusy(false);
    if (error) { onToast("Could not save.", "error"); return; }
    onToast(editing.id ? "Church updated." : "Church added.");
    setEditing(null);
    load();
  }

  async function approve(profile) {
    setBusy(true);
    const name = profile.church_name_custom.trim();
    const { data: newChurch, error: insertErr } = await supabase
      .from("churches").insert({ name }).select().single();
    if (insertErr) { setBusy(false); onToast("Could not add church.", "error"); return; }
    const { error: updateErr } = await supabase.from("profiles").update({
      church_id: newChurch.id,
      church_name_custom: null,
    }).eq("id", profile.id);
    setBusy(false);
    if (updateErr) { onToast("Church added but profile not updated.", "error"); return; }
    onToast(`"${name}" added and ${profile.full_name} updated.`);
    setConfirmApprove(null);
    load();
  }

  async function dismiss(profile) {
    setBusy(true);
    await supabase.from("profiles").update({ church_name_custom: null }).eq("id", profile.id);
    setBusy(false);
    onToast(`Dismissed ${profile.full_name}'s submission.`);
    load();
  }

  if (loading) {
    return <div style={{ textAlign: "center", padding: "3rem 0", color: TSEC, fontFamily: SANS, fontSize: "14px" }}>Loading…</div>;
  }

  if (editing !== null) {
    return (
      <div>
        <div style={{ fontFamily: SANS, fontSize: "18px", fontWeight: 600, color: "#111111", marginBottom: "1.25rem" }}>
          {editing.id ? "Edit Church" : "Add Church"}
        </div>
        <Card style={{ marginBottom: "1rem" }}>
          <Field label="CHURCH NAME" value={editing.name || ""} onChange={(v) => setEditing((e) => ({ ...e, name: v }))} placeholder="Full church name" />
          <Field label="CITY" value={editing.city || ""} onChange={(v) => setEditing((e) => ({ ...e, city: v }))} placeholder="City" />
          <Field label="STATE" value={editing.state || ""} onChange={(v) => setEditing((e) => ({ ...e, state: v }))} placeholder="State abbreviation (e.g. CA)" />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={save} disabled={busy} style={{
            background: "#FF4D00", color: "#fff", border: "none", borderRadius: 10,
            padding: "14px", fontSize: "15px", fontWeight: 700, fontFamily: SANS,
            cursor: "pointer", width: "100%",
          }}>
            {busy ? "Saving…" : editing.id ? "Save Changes" : "Add Church"}
          </button>
          <button onClick={() => setEditing(null)} style={{
            background: "none", border: "none", color: TSEC, fontSize: "13px",
            cursor: "pointer", fontFamily: SANS, padding: "8px 0",
          }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setEditing({ name: "", city: "", state: "" })}
        style={{
          width: "100%", background: "#FF4D00", color: "#fff", border: "none",
          borderRadius: 10, padding: "12px", fontFamily: SANS, fontSize: "14px",
          fontWeight: 700, cursor: "pointer", marginBottom: "1.25rem",
        }}
      >
        + Add Church
      </button>

      {/* Pending submissions */}
      {pending.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <SectionLabel>Pending Submissions ({pending.length})</SectionLabel>
          {pending.map((p) => (
            <Card key={p.id} style={{ marginBottom: "0.75rem", padding: "1rem 1.25rem" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#111111", fontFamily: SANS, marginBottom: 2 }}>
                {p.church_name_custom}
              </div>
              <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginBottom: 10 }}>
                Submitted by {p.full_name}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setConfirmApprove(p)}
                  style={{ fontSize: "12px", fontWeight: 600, color: "#fff", background: "#059669", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: SANS }}
                >
                  Approve & Add
                </button>
                <button
                  onClick={() => dismiss(p)}
                  disabled={busy}
                  style={{ fontSize: "12px", fontWeight: 600, color: "#B91C1C", background: "#FEE2E2", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: SANS }}
                >
                  Dismiss
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Church list */}
      <SectionLabel>All Churches ({churches.length})</SectionLabel>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {churches.map((c, i) => (
          <div key={c.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.875rem 1.25rem",
            borderBottom: i < churches.length - 1 ? `1px solid ${BORDER}` : "none",
          }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#111111", fontFamily: SANS }}>{c.name}</div>
              {(c.city || c.state) && (
                <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 1 }}>
                  {[c.city, c.state].filter(Boolean).join(", ")}
                </div>
              )}
            </div>
            <button
              onClick={() => setEditing({ id: c.id, name: c.name, city: c.city || "", state: c.state || "" })}
              style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: "12px", fontWeight: 600, color: "#111111", cursor: "pointer", fontFamily: SANS }}
            >
              Edit
            </button>
          </div>
        ))}
      </Card>

      {confirmApprove && (
        <Modal
          title="Approve Church"
          message={`Add "${confirmApprove.church_name_custom}" to the official list and assign it to ${confirmApprove.full_name}?`}
          confirmLabel="Approve & Add"
          onCancel={() => setConfirmApprove(null)}
          onConfirm={() => approve(confirmApprove)}
          busy={busy}
        />
      )}
    </div>
  );
}
