import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase.js";
import { NAVY, ORANGE, TSEC, BORDER, BG, SANS, SERIF } from "../../../lib/constants.js";

const ACTION_LABELS = {
  assigned_moderator: "assigned as moderator for",
  removed_moderator_assignment: "removed from moderator role for",
  invited_user: "invited",
  reset_password: "reset password for",
  changed_role: "changed role of",
  approved_join_request: "approved join request from",
  declined_join_request: "declined join request from",
};

function getActionLabel(action) {
  return ACTION_LABELS[action] || action;
}

function relativeTime(isoStr) {
  const now = new Date();
  const date = new Date(isoStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDayLabel(isoStr) {
  const now = new Date();
  const date = new Date(isoStr);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((nowDay - entryDay) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

function groupByDay(entries) {
  const groups = [];
  const seen = new Map();

  for (const entry of entries) {
    const label = getDayLabel(entry.created_at);
    if (!seen.has(label)) {
      seen.set(label, groups.length);
      groups.push({ label, items: [] });
    }
    groups[seen.get(label)].items.push(entry);
  }

  return groups;
}

function formatDetails(details) {
  if (!details || typeof details !== "object") return null;
  const parts = [];
  if (details.event_name) parts.push(`Event: ${details.event_name}`);
  if (details.new_role) parts.push(`New role: ${details.new_role}`);
  if (details.old_role) parts.push(`Previous: ${details.old_role}`);
  if (details.email) parts.push(details.email);
  const remaining = Object.entries(details)
    .filter(([k]) => !["event_name", "new_role", "old_role", "email"].includes(k))
    .map(([k, v]) => `${k}: ${v}`);
  parts.push(...remaining);
  return parts.join(" · ") || null;
}

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error) setEntries(data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          border: `3px solid ${BORDER}`, borderTop: `3px solid ${NAVY}`,
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const groups = groupByDay(entries);

  return (
    <div style={{ fontFamily: SANS }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 600, color: NAVY }}>
          Audit Log
        </div>
        <div style={{ fontSize: "13px", color: TSEC, marginTop: 4 }}>
          Admin activity · last 200 entries
        </div>
      </div>

      {entries.length === 0 ? (
        <div style={{ textAlign: "center", color: TSEC, fontSize: "14px", padding: "3rem 0" }}>
          No activity recorded yet.
        </div>
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.label} style={{ marginBottom: "1.5rem" }}>
              {/* Day header */}
              <div style={{
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em",
                color: ORANGE, textTransform: "uppercase", fontFamily: SANS,
                marginBottom: "0.625rem",
              }}>
                {group.label}
              </div>

              <div style={{
                background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
                overflow: "hidden",
              }}>
                {group.items.map((entry, i) => {
                  const detail = formatDetails(entry.details);
                  return (
                    <div
                      key={entry.id}
                      style={{
                        padding: "0.875rem 1.25rem",
                        borderBottom: i < group.items.length - 1 ? `1px solid ${BORDER}` : "none",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: NAVY }}>
                            {entry.actor_name || "Unknown"}
                          </span>
                          {" "}
                          <span style={{ fontSize: "14px", color: TSEC }}>
                            {getActionLabel(entry.action)}
                          </span>
                          {" "}
                          {entry.target_name && (
                            <span style={{ fontSize: "14px", fontWeight: 600, color: NAVY }}>
                              {entry.target_name}
                            </span>
                          )}

                          {detail && (
                            <div style={{ fontSize: "12px", color: TSEC, marginTop: 3, fontStyle: "italic" }}>
                              {detail}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: "11px", color: TSEC, whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}>
                          {relativeTime(entry.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
