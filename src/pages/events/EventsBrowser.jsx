import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { TSEC, BORDER, SANS } from "../../lib/constants.js";

export const TYPE_LABELS = {
  conference: "Conference",
  youth_conference: "Youth Conference",
  annual_conference: "Annual Conference",
  openmic: "Open Mic",
  open_mic: "Open Mic",
  mission: "Mission Trip",
  zoom_meeting: "Zoom Meeting",
  board_meeting: "Board Meeting",
  other: "Event",
};

const STATUS_STYLE = {
  active: { label: "Happening now", bg: "#DCFCE7", color: "#166534" },
  upcoming: { label: "Upcoming", bg: "#EEF2FC", color: "#1A4FBF" },
  archived: { label: "Past", bg: "#F0EDE8", color: "#8A8498" },
  inactive: { label: "Inactive", bg: "#F0EDE8", color: "#8A8498" },
};

export default function EventsBrowser({ data, onRefresh }) {
  const { publicEvents = [], profile, eventMember, activeEvent } = data;
  const myId = profile.id;

  const [requesting, setRequesting] = useState(null);
  const [requestedIds, setRequestedIds] = useState(new Set());
  const [msgInputs, setMsgInputs] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function requestJoin(event) {
    setRequesting(event.id);
    const message = msgInputs[event.id]?.trim() || "";
    const { error } = await supabase.from("event_join_requests").insert({
      event_id: event.id,
      profile_id: myId,
      message: message || null,
      status: "pending",
    });
    if (error) {
      showToast("Could not submit request. Please try again.", "error");
    } else {
      setRequestedIds((prev) => new Set([...prev, event.id]));
      showToast(`Request sent for "${event.name}"`);
      if (onRefresh) onRefresh();
    }
    setRequesting(null);
  }

  const myEventIds = new Set([activeEvent?.id].filter(Boolean));

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "error" ? "#DC2626" : "#111111",
          color: "#fff", borderRadius: 10, padding: "10px 20px",
          fontSize: "13px", fontFamily: SANS, fontWeight: 600, zIndex: 9999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)", whiteSpace: "nowrap",
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.16em", color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.25rem" }}>
          Ministry Events
        </div>
        <div style={{ fontFamily: SANS, fontSize: "24px", fontWeight: 900, color: "#111111", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
          Events & Opportunities
        </div>
        <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, marginTop: "0.375rem" }}>
          Public events open for anyone to join.
        </div>
      </div>

      {publicEvents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 900, color: "#111111", marginBottom: 8, letterSpacing: "-0.02em" }}>Nothing upcoming yet</div>
          <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS }}>Check back soon for new events and opportunities.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {publicEvents.map((ev) => {
            const isMember = myEventIds.has(ev.id);
            const hasRequested = requestedIds.has(ev.id);
            const isExpanded = expandedId === ev.id;
            const statusStyle = STATUS_STYLE[ev.status] || STATUS_STYLE.upcoming;
            const typeLabel = TYPE_LABELS[ev.type] || "Event";

            return (
              <div key={ev.id} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                  style={{
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    padding: "1rem 1.25rem", textAlign: "left", fontFamily: SANS,
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.375rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.12em", color: "#FF4D00", textTransform: "uppercase" }}>
                        {typeLabel}
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: statusStyle.bg, color: statusStyle.color }}>
                        {statusStyle.label}
                      </span>
                      {isMember && (
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#DCFCE7", color: "#166534" }}>
                          You're in
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: "18px", fontWeight: 900, color: "#111111", lineHeight: 1.2, marginBottom: "0.25rem", letterSpacing: "-0.02em" }}>
                      {ev.name}
                    </div>
                    {ev.dates && <div style={{ fontSize: "12px", color: TSEC }}>{ev.dates}</div>}
                    {ev.location && <div style={{ fontSize: "12px", color: TSEC }}>{ev.location}</div>}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginTop: 4 }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ padding: "0 1.25rem 1.25rem", borderTop: `1px solid ${BORDER}` }}>
                    {ev.description && (
                      <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.7, marginTop: "0.875rem", marginBottom: "0.875rem" }}>
                        {ev.description}
                      </div>
                    )}
                    {ev.fee && (
                      <div style={{ fontSize: "13px", fontFamily: SANS, marginBottom: "0.5rem" }}>
                        <span style={{ color: TSEC }}>Registration fee: </span>
                        <span style={{ fontWeight: 700, color: "#111111" }}>{ev.fee}</span>
                      </div>
                    )}

                    {/* Actions */}
                    {!isMember && ev.allow_join_requests && ev.status !== "archived" && (
                      <div style={{ marginTop: "0.875rem" }}>
                        {!hasRequested ? (
                          <>
                            <textarea
                              value={msgInputs[ev.id] || ""}
                              onChange={(e) => setMsgInputs((prev) => ({ ...prev, [ev.id]: e.target.value }))}
                              placeholder="Optional message to coordinators..."
                              rows={2}
                              style={{
                                width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8,
                                padding: "0.5rem 0.75rem", fontFamily: SANS, fontSize: "13px",
                                color: "#111111", background: "#FAFAFA", resize: "none", outline: "none",
                                marginBottom: "0.625rem", boxSizing: "border-box",
                              }}
                            />
                            <button
                              onClick={() => requestJoin(ev)}
                              disabled={requesting === ev.id}
                              style={{
                                width: "100%", background: requesting === ev.id ? TSEC : "#FF4D00",
                                color: "#fff", border: "none", borderRadius: 8,
                                padding: "11px", fontFamily: SANS, fontWeight: 700,
                                fontSize: "14px", cursor: requesting === ev.id ? "default" : "pointer",
                              }}
                            >
                              {requesting === ev.id ? "Sending…" : "Request to Join"}
                            </button>
                          </>
                        ) : (
                          <div style={{ background: "#DCFCE7", borderRadius: 8, padding: "10px 14px", fontSize: "13px", color: "#166534", fontFamily: SANS, fontWeight: 600, textAlign: "center" }}>
                            Request submitted — you'll be notified when approved.
                          </div>
                        )}
                      </div>
                    )}

                    {!isMember && !ev.allow_join_requests && ev.status !== "archived" && (
                      <div style={{ background: "#FAFAFA", borderRadius: 8, padding: "10px 14px", fontSize: "13px", color: TSEC, fontFamily: SANS, textAlign: "center", marginTop: "0.875rem" }}>
                        Contact a coordinator to join this event.
                      </div>
                    )}

                    {ev.registration_url && (
                      <a
                        href={ev.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "block", marginTop: "0.75rem", background: "#111111", color: "#fff",
                          borderRadius: 8, padding: "11px", textAlign: "center",
                          fontSize: "14px", fontWeight: 700, fontFamily: SANS, textDecoration: "none",
                        }}
                      >
                        Register →
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height: "1.5rem" }} />
    </>
  );
}
