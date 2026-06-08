import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase.js";
import { TSEC, BORDER, SANS, SERIF } from "../../../lib/constants.js";
import { Card, SectionLabel, Field } from "../../../components/ui/index.js";

const TYPES = ["article", "link", "video"];

const TYPE_COLORS = {
  article: { bg: "#EEF2FC", color: "#1A4FBF" },
  link:    { bg: "#FFF5EC", color: "#E8621A" },
  video:   { bg: "#F0FDF4", color: "#059669" },
};

export default function TrainingMaterials({ onToast }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} | {id,...}
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("training_materials").select("*").order("display_order");
    setMaterials(data || []);
    setLoading(false);
  }

  async function save() {
    const { title, body, type, external_url } = editing;
    if (!title?.trim()) { onToast("Title is required.", "error"); return; }
    setBusy(true);
    const maxOrder = materials.length ? Math.max(...materials.map((m) => m.display_order || 0)) : 0;
    const payload = {
      title: title.trim(),
      body: body?.trim() || null,
      type: type || "article",
      external_url: external_url?.trim() || null,
      published: editing.published ?? false,
    };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from("training_materials").update(payload).eq("id", editing.id));
    } else {
      payload.display_order = maxOrder + 1;
      ({ error } = await supabase.from("training_materials").insert(payload));
    }
    setBusy(false);
    if (error) { onToast("Could not save.", "error"); return; }
    onToast(editing.id ? "Material updated." : "Material added.");
    setEditing(null);
    load();
  }

  async function togglePublished(mat) {
    await supabase.from("training_materials").update({ published: !mat.published }).eq("id", mat.id);
    setMaterials((prev) => prev.map((m) => m.id === mat.id ? { ...m, published: !m.published } : m));
    onToast(mat.published ? "Unpublished." : "Published.");
  }

  async function move(mat, direction) {
    const idx = materials.findIndex((m) => m.id === mat.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= materials.length) return;
    const swap = materials[swapIdx];
    await Promise.all([
      supabase.from("training_materials").update({ display_order: swap.display_order }).eq("id", mat.id),
      supabase.from("training_materials").update({ display_order: mat.display_order }).eq("id", swap.id),
    ]);
    load();
  }

  async function remove(mat) {
    await supabase.from("training_materials").delete().eq("id", mat.id);
    onToast(`"${mat.title}" deleted.`);
    load();
  }

  if (loading) {
    return <div style={{ textAlign: "center", padding: "3rem 0", color: TSEC, fontFamily: SANS, fontSize: "14px" }}>Loading…</div>;
  }

  if (editing !== null) {
    return (
      <div>
        <div style={{ fontFamily: SANS, fontSize: "18px", fontWeight: 600, color: "#1B2A4A", marginBottom: "1.25rem" }}>
          {editing.id ? "Edit Material" : "Add Material"}
        </div>
        <Card style={{ marginBottom: "1rem" }}>
          <Field label="TITLE" value={editing.title || ""} onChange={(v) => setEditing((e) => ({ ...e, title: v }))} placeholder="Material title" />

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: TSEC, marginBottom: 6, letterSpacing: "0.04em", fontFamily: SANS }}>TYPE</label>
            <div style={{ display: "flex", gap: 8 }}>
              {TYPES.map((t) => {
                const active = (editing.type || "article") === t;
                return (
                  <button
                    key={t}
                    onClick={() => setEditing((e) => ({ ...e, type: t }))}
                    style={{
                      padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${active ? "#FF4D00" : BORDER}`,
                      background: active ? "#FFF5EC" : "#fff", color: active ? "#FF4D00" : TSEC,
                      fontSize: "13px", fontWeight: 600, fontFamily: SANS, cursor: "pointer", textTransform: "capitalize",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: TSEC, marginBottom: 6, letterSpacing: "0.04em", fontFamily: SANS }}>BODY (optional)</label>
            <textarea
              value={editing.body || ""}
              onChange={(e) => setEditing((ed) => ({ ...ed, body: e.target.value }))}
              placeholder="Description or content…"
              rows={4}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: "15px", fontFamily: SANS, color: "#1B2A4A", resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <Field label="EXTERNAL URL (optional)" value={editing.external_url || ""} onChange={(v) => setEditing((e) => ({ ...e, external_url: v }))} placeholder="https://…" />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0 0" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#1B2A4A", fontFamily: SANS }}>Published</span>
            <button
              onClick={() => setEditing((e) => ({ ...e, published: !e.published }))}
              style={{
                width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                background: editing.published ? "#059669" : "#D1D5DB",
                position: "relative", transition: "background 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: 2, left: editing.published ? 22 : 2,
                width: 20, height: 20, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s",
              }} />
            </button>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={save} disabled={busy} style={{
            background: "#FF4D00", color: "#fff", border: "none", borderRadius: 10,
            padding: "14px", fontSize: "15px", fontWeight: 700, fontFamily: SANS,
            cursor: "pointer", width: "100%",
          }}>
            {busy ? "Saving…" : editing.id ? "Save Changes" : "Add Material"}
          </button>
          {editing.id && (
            <button
              onClick={() => { if (window.confirm(`Delete "${editing.title}"?`)) { remove(editing); setEditing(null); } }}
              style={{ background: "#FEE2E2", border: "none", borderRadius: 10, padding: "12px", fontSize: "14px", fontWeight: 600, color: "#B91C1C", cursor: "pointer", fontFamily: SANS, width: "100%" }}
            >
              Delete
            </button>
          )}
          <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: TSEC, fontSize: "13px", cursor: "pointer", fontFamily: SANS, padding: "8px 0" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setEditing({ title: "", body: "", type: "article", external_url: "", published: false })}
        style={{
          width: "100%", background: "#FF4D00", color: "#fff", border: "none",
          borderRadius: 10, padding: "12px", fontFamily: SANS, fontSize: "14px",
          fontWeight: 700, cursor: "pointer", marginBottom: "1.25rem",
        }}
      >
        + Add Material
      </button>

      {materials.length === 0 ? (
        <div style={{ textAlign: "center", color: TSEC, fontFamily: SANS, fontSize: "14px", paddingTop: "2rem" }}>
          No training materials yet.
        </div>
      ) : (
        <>
          <SectionLabel>Materials ({materials.length})</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {materials.map((mat, i) => {
              const tc = TYPE_COLORS[mat.type] || TYPE_COLORS.article;
              return (
                <Card key={mat.id} style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, background: tc.bg, color: tc.color, borderRadius: 20, padding: "2px 8px", fontFamily: SANS, textTransform: "capitalize" }}>
                          {mat.type}
                        </span>
                        <span style={{ fontSize: "10px", fontWeight: 700, background: mat.published ? "#D1FAE5" : "#F3F4F6", color: mat.published ? "#065F46" : "#6B7280", borderRadius: 20, padding: "2px 8px", fontFamily: SANS }}>
                          {mat.published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#1B2A4A", fontFamily: SANS }}>{mat.title}</div>
                      {mat.body && (
                        <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {mat.body}
                        </div>
                      )}
                    </div>
                    {/* Reorder */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                      <button onClick={() => move(mat, -1)} disabled={i === 0} style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? "#D1D5DB" : TSEC, padding: "2px 4px", fontSize: "14px" }}>▲</button>
                      <button onClick={() => move(mat, 1)} disabled={i === materials.length - 1} style={{ background: "none", border: "none", cursor: i === materials.length - 1 ? "default" : "pointer", color: i === materials.length - 1 ? "#D1D5DB" : TSEC, padding: "2px 4px", fontSize: "14px" }}>▼</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => setEditing({ ...mat })}
                      style={{ fontSize: "12px", fontWeight: 600, color: "#1B2A4A", background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: SANS }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => togglePublished(mat)}
                      style={{ fontSize: "12px", fontWeight: 600, color: mat.published ? TSEC : "#059669", background: mat.published ? "#F3F4F6" : "#D1FAE5", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: SANS }}
                    >
                      {mat.published ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
