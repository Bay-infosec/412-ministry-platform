import { useState } from "react";
import { supabase } from "../../../lib/supabase.js";
import { NAVY, ORANGE, TSEC, BORDER, SANS, SERIF } from "../../../lib/constants.js";
import { Card, SectionLabel } from "../../../components/ui/index.js";
import { sendAnnouncementEmails } from "../../../lib/email.js";

const STATUS_COLORS = {
  published:        { bg: "#D1FAE5", color: "#065F46" },
  pending_approval: { bg: "#FEF3C7", color: "#92400E" },
  draft:            { bg: "#F3F4F6", color: "#374151" },
};

const STATUS_LABELS = {
  published:        "Published",
  pending_approval: "Pending",
  draft:            "Draft",
};

function AudienceChip({ audience }) {
  if (!audience || audience.length === 0) return <span style={{ fontSize: "11px", color: TSEC, fontFamily: SANS }}>Everyone</span>;
  return (
    <span style={{ fontSize: "11px", color: TSEC, fontFamily: SANS }}>
      {audience.map((r) => {
        if (r.type === "all") return "Everyone";
        if (r.type === "ministry") return r.value;
        if (r.type === "team") return `Team ${r.value}`;
        if (r.type === "role") return r.value;
        if (r.type === "person") return "Specific person";
        return r.type;
      }).join(", ")}
    </span>
  );
}

export default function AnnouncementList({ data, onNew, onEdit, onToast, isAdmin }) {
  const { allAnnouncements = [], activeEvent } = data;
  const [busy, setBusy] = useState(null);

  const grouped = {
    pending_approval: allAnnouncements.filter((a) => a.status === "pending_approval"),
    published:        allAnnouncements.filter((a) => a.status === "published"),
    draft:            allAnnouncements.filter((a) => a.status === "draft"),
  };

  const approve = async (ann) => {
    setBusy(ann.id + "_approve");
    const { error } = await supabase.from("announcements").update({ status: "published" }).eq("id", ann.id);
    setBusy(null);
    if (error) { onToast("Could not approve.", "error"); return; }
    onToast(`"${ann.title}" published.`);
    data.allAnnouncements = allAnnouncements.map((a) => a.id === ann.id ? { ...a, status: "published" } : a);
    if (activeEvent?.id) {
      sendAnnouncementEmails(ann.audience, ann, activeEvent.id);
    }
  };

  const reject = async (ann) => {
    setBusy(ann.id + "_reject");
    const { error } = await supabase.from("announcements").update({ status: "draft" }).eq("id", ann.id);
    setBusy(null);
    if (error) { onToast("Could not reject.", "error"); return; }
    onToast(`"${ann.title}" moved back to draft.`);
  };

  const unpublish = async (ann) => {
    setBusy(ann.id + "_unpublish");
    const { error } = await supabase.from("announcements").update({ status: "draft" }).eq("id", ann.id);
    setBusy(null);
    if (error) { onToast("Could not unpublish.", "error"); return; }
    onToast(`"${ann.title}" unpublished.`);
  };

  const renderGroup = (label, items, showApproval) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: "1.25rem" }}>
        <SectionLabel>{label}</SectionLabel>
        {items.map((ann) => {
          const sc = STATUS_COLORS[ann.status] || STATUS_COLORS.draft;
          return (
            <Card key={ann.id} style={{ marginBottom: "0.75rem", padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                <div style={{ fontFamily: SANS, fontSize: "14px", fontWeight: 600, color: NAVY, flex: 1 }}>{ann.title}</div>
                <span style={{ fontSize: "10px", fontWeight: 700, background: sc.bg, color: sc.color, borderRadius: 20, padding: "2px 8px", fontFamily: SANS, flexShrink: 0 }}>
                  {STATUS_LABELS[ann.status]}
                </span>
              </div>
              <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.5, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {ann.body}
              </div>
              <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginBottom: 10 }}>
                To: <AudienceChip audience={ann.audience} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => onEdit(ann)}
                  style={{ fontSize: "12px", fontWeight: 600, color: NAVY, background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: SANS }}
                >
                  Edit
                </button>
                {showApproval && isAdmin && (
                  <>
                    <button
                      onClick={() => approve(ann)}
                      disabled={busy === ann.id + "_approve"}
                      style={{ fontSize: "12px", fontWeight: 600, color: "#fff", background: "#059669", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: SANS }}
                    >
                      {busy === ann.id + "_approve" ? "…" : "Approve & Publish"}
                    </button>
                    <button
                      onClick={() => reject(ann)}
                      disabled={busy === ann.id + "_reject"}
                      style={{ fontSize: "12px", fontWeight: 600, color: "#B91C1C", background: "#FEE2E2", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: SANS }}
                    >
                      {busy === ann.id + "_reject" ? "…" : "Send back"}
                    </button>
                  </>
                )}
                {ann.status === "published" && isAdmin && (
                  <button
                    onClick={() => unpublish(ann)}
                    disabled={busy === ann.id + "_unpublish"}
                    style={{ fontSize: "12px", fontWeight: 600, color: TSEC, background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: SANS }}
                  >
                    {busy === ann.id + "_unpublish" ? "…" : "Unpublish"}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <button
        onClick={onNew}
        style={{
          width: "100%", background: ORANGE, color: "#fff", border: "none",
          borderRadius: 10, padding: "12px", fontFamily: SANS, fontSize: "14px",
          fontWeight: 700, cursor: "pointer", marginBottom: "1.25rem",
        }}
      >
        + New Announcement
      </button>

      {allAnnouncements.length === 0 ? (
        <div style={{ textAlign: "center", color: TSEC, fontFamily: SANS, fontSize: "14px", paddingTop: "2rem" }}>
          No announcements yet.
        </div>
      ) : (
        <>
          {renderGroup("Pending Approval", grouped.pending_approval, true)}
          {renderGroup("Published", grouped.published, false)}
          {renderGroup("Drafts", grouped.draft, false)}
        </>
      )}
    </div>
  );
}
