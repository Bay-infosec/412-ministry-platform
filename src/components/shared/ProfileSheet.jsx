import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { SANS, BORDER } from "../../lib/constants.js";

export default function ProfileSheet({ profileId, activeEventId, onClose, onOpenAdmin, onMessage }) {
  const [person, setPerson] = useState(null);
  const [member, setMember] = useState(null);

  useEffect(() => {
    if (!profileId) { setPerson(null); setMember(null); return; }
    setPerson(null);
    setMember(null);

    // Use SECURITY DEFINER RPC to read another user's profile (bypasses RLS)
    supabase
      .rpc("get_member_profile", { p_profile_id: profileId })
      .then(({ data }) => setPerson(data));

    if (activeEventId) {
      supabase
        .from("event_members")
        .select("team_number, event_role, ministry")
        .eq("profile_id", profileId)
        .eq("event_id", activeEventId)
        .maybeSingle()
        .then(({ data }) => setMember(data));
    }
  }, [profileId, activeEventId]);

  if (!profileId) return null;

  const displayName = person?.nickname || person?.full_name || "";
  const realName = person?.nickname ? person.full_name : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460,
          background: "#fff",
          borderRadius: "24px 24px 0 0",
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          overflow: "hidden",
        }}
      >
        {/* Drag handle */}
        <div style={{ paddingTop: "0.875rem", paddingBottom: "0.5rem", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E5E5E5" }} />
        </div>

        {!person ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "#999", fontFamily: SANS, fontSize: 14 }}>Loading…</div>
        ) : (
          <>
            {/* Hero — photo + name */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0.75rem 1.5rem 1.25rem", textAlign: "center" }}>
              {/* Avatar */}
              {person.photo_url ? (
                <img
                  src={person.photo_url}
                  alt={displayName}
                  style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: `3px solid ${BORDER}`, marginBottom: "0.875rem" }}
                />
              ) : (
                <div style={{
                  width: 88, height: 88, borderRadius: "50%", background: "#FF4D00",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: SANS, fontSize: 32, fontWeight: 900, color: "#fff",
                  marginBottom: "0.875rem", flexShrink: 0,
                }}>
                  {(person.full_name || "").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
              )}

              {/* Name */}
              <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 900, color: "#111", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                {displayName}
              </div>
              {realName && (
                <div style={{ fontFamily: SANS, fontSize: 13, color: "#999", marginTop: 3 }}>{realName}</div>
              )}

              {/* Ministry / team pill */}
              {(member || person.ministry_role) && (
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {member?.ministry && (
                    <span style={{ background: "#FFF0EB", color: "#FF4D00", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: SANS }}>
                      {member.ministry}
                    </span>
                  )}
                  {member?.team_number && (
                    <span style={{ background: "#F5F5F5", color: "#555", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: SANS }}>
                      Team {member.team_number}
                    </span>
                  )}
                  {member?.event_role && (
                    <span style={{ background: "#111", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: SANS, textTransform: "capitalize" }}>
                      {member.event_role}
                    </span>
                  )}
                  {!member && person.ministry_role && (
                    <span style={{ background: "#FFF0EB", color: "#FF4D00", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: SANS }}>
                      {person.ministry_role}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Info rows */}
            {(person.church_name || person.hobby) && (
              <div style={{ margin: "0 1.25rem 1rem", background: "#FAFAFA", borderRadius: 14, overflow: "hidden", border: `1px solid ${BORDER}` }}>
                {person.church_name && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.75rem 1rem", borderBottom: person.hobby ? `1px solid ${BORDER}` : "none" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: SANS }}>Church</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111", fontFamily: SANS, marginTop: 1 }}>{person.church_name}</div>
                    </div>
                  </div>
                )}
                {person.hobby && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.75rem 1rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: SANS }}>Hobby</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111", fontFamily: SANS, marginTop: 1 }}>{person.hobby}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, padding: "0 1.25rem", marginBottom: "0.875rem" }}>
              {onMessage && (
                <button
                  onClick={() => { onClose(); onMessage(person); }}
                  style={actionBtn("#FF4D00", "#fff")}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  Message
                </button>
              )}
              {person.phone && (
                <a href={`tel:${person.phone}`} style={actionBtn("#F5F5F5", "#111")}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.02 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  Call
                </a>
              )}
              {person.email && (
                <a href={`mailto:${person.email}`} style={actionBtn("#F5F5F5", "#111")}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Email
                </a>
              )}
            </div>

            {/* Admin link */}
            {onOpenAdmin && (
              <div style={{ padding: "0 1.25rem" }}>
                <button
                  onClick={() => { onClose(); onOpenAdmin(person.id); }}
                  style={{ width: "100%", background: "#111", border: "none", borderRadius: 12, padding: "12px", fontFamily: SANS, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}
                >
                  View Full Profile in Admin
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function actionBtn(bg, color) {
  return {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    background: bg, color, border: "none", borderRadius: 12, padding: "12px 10px",
    fontFamily: SANS, fontSize: 14, fontWeight: 700, cursor: "pointer", textDecoration: "none",
  };
}
