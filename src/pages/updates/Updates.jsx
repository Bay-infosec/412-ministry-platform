import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { fmtDateStr } from "../../lib/utils.js";
import { TSEC, BORDER, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { SectionLabel } from "../../components/ui/index.js";

export default function Updates({ data, readIds, onMarkRead, onOpenAdmin }) {
  const { announcements } = data;

  const [expandedIds, setExpandedIds] = useState(() => new Set());

  function toggle(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  const markRead = async (annId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      await supabase.from("announcement_reads").insert({ announcement_id: annId, profile_id: user.id });
      onMarkRead(annId);
    } catch {}
  };

  return (
    <Shell withNav>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
        <div>
          <SectionLabel>412 MINISTRY</SectionLabel>
          <div style={{ fontFamily: SANS, fontSize: "26px", fontWeight: 900, color: "#1B2A4A", letterSpacing: "-0.02em" }}>
            Updates
          </div>
        </div>
        {onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            style={{
              background: "#FF4D00", color: "#fff", border: "none", borderRadius: 8,
              padding: "8px 14px", fontSize: "13px", fontWeight: 700,
              fontFamily: SANS, cursor: "pointer", flexShrink: 0,
            }}
          >
            Manage
          </button>
        )}
      </div>

      {(announcements || []).length === 0 ? (
        <div style={{ textAlign: "center", color: TSEC, fontSize: "14px", marginTop: "3rem", fontFamily: SANS }}>
          No announcements yet. Check back soon.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {(announcements || []).map((a) => {
            const isUnread = !(readIds || []).includes(a.id);
            const isExpanded = expandedIds.has(a.id);

            return (
              <div
                key={a.id}
                style={{
                  background: "#fff",
                  border: `1px solid ${isUnread ? "#FF4D00" : BORDER}`,
                  borderLeft: isUnread ? "3px solid #FF4D00" : `1px solid ${BORDER}`,
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                {/* Header row — always visible, tap to toggle */}
                <button
                  onClick={() => toggle(a.id)}
                  style={{
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    padding: "0.875rem 1rem", textAlign: "left", fontFamily: SANS,
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: "11px", color: TSEC, fontFamily: SANS }}>
                        {fmtDateStr(a.created_at)}
                      </span>
                      {isUnread && (
                        <span style={{ background: "#FF4D00", color: "#fff", fontSize: "9px", fontWeight: 700, borderRadius: 99, padding: "2px 7px", letterSpacing: "0.06em" }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 900, color: "#1B2A4A", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                      {a.title}
                    </div>
                    {!isExpanded && a.body && (
                      <div style={{ fontSize: "13px", color: TSEC, marginTop: 3, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                        {a.body}
                      </div>
                    )}
                  </div>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke={TSEC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Expanded body */}
                {isExpanded && (
                  <div style={{ padding: "0 1rem 1rem", borderTop: `1px solid ${BORDER}` }}>
                    {a.image_url && (
                      <img src={a.image_url} alt="" style={{ width: "100%", borderRadius: 10, marginBottom: "0.75rem", objectFit: "cover", maxHeight: 200, marginTop: "0.75rem" }} />
                    )}
                    <div style={{ fontSize: "14px", color: "#3A3A3A", lineHeight: 1.7, whiteSpace: "pre-line", fontFamily: SANS, marginTop: "0.75rem" }}>
                      {a.body}
                    </div>
                    {isUnread && (
                      <button
                        onClick={() => markRead(a.id)}
                        style={{
                          marginTop: "0.875rem", background: "none", border: `1px solid ${BORDER}`,
                          color: TSEC, fontSize: "12px", fontWeight: 600,
                          padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontFamily: SANS,
                        }}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ height: "1rem" }} />
    </Shell>
  );
}
