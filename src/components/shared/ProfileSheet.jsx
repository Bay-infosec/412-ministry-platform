import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { SANS, BORDER, TSEC } from "../../lib/constants.js";
import { Avatar } from "../ui/index.js";

export default function ProfileSheet({ profileId, activeEventId, onClose, onOpenAdmin }) {
  const [person, setPerson] = useState(null);
  const [member, setMember] = useState(null);

  useEffect(() => {
    if (!profileId) return;
    supabase
      .from("profiles")
      .select("id, full_name, nickname, photo_url, phone, email, ministry, platform_role, tags")
      .eq("id", profileId)
      .single()
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

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460,
          background: "#fff", borderRadius: "20px 20px 0 0",
          padding: "1.5rem 1.25rem",
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E5E5E5", margin: "0 auto 1.25rem" }} />

        {!person ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: TSEC, fontFamily: SANS, fontSize: 14 }}>Loading…</div>
        ) : (
          <>
            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "1.25rem" }}>
              <Avatar url={person.photo_url} name={person.full_name} size={60} />
              <div>
                <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 900, color: "#111111", letterSpacing: "-0.02em" }}>
                  {person.full_name}
                </div>
                {person.nickname && (
                  <div style={{ fontFamily: SANS, fontSize: 13, color: TSEC, fontStyle: "italic", marginTop: 2 }}>
                    "{person.nickname}"
                  </div>
                )}
                {(member || person.ministry) && (
                  <div style={{ fontFamily: SANS, fontSize: 12, color: "#FF4D00", fontWeight: 700, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {member?.ministry || person.ministry}
                    {member?.team_number ? ` · Team ${member.team_number}` : ""}
                    {member?.event_role ? ` · ${member.event_role}` : ""}
                  </div>
                )}
              </div>
            </div>

            {/* Contact buttons */}
            <div style={{ display: "flex", gap: 10, marginBottom: "1rem" }}>
              {person.phone && (
                <a
                  href={`tel:${person.phone}`}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    background: "#F0F0F0", borderRadius: 12, padding: "12px",
                    textDecoration: "none", fontFamily: SANS, fontSize: 14, fontWeight: 700, color: "#111111",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.02 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  Call
                </a>
              )}
              {person.email && (
                <a
                  href={`mailto:${person.email}`}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    background: "#F0F0F0", borderRadius: 12, padding: "12px",
                    textDecoration: "none", fontFamily: SANS, fontSize: 14, fontWeight: 700, color: "#111111",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  Email
                </a>
              )}
            </div>

            {/* Admin link */}
            {onOpenAdmin && (
              <button
                onClick={() => { onClose(); onOpenAdmin(person.id); }}
                style={{
                  width: "100%", background: "#111111", border: "none", borderRadius: 12,
                  padding: "12px", fontFamily: SANS, fontSize: 14, fontWeight: 700,
                  color: "#fff", cursor: "pointer",
                }}
              >
                View Full Profile in Admin
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
