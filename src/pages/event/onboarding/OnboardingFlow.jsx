import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase.js";
import { TSEC, BORDER, SANS } from "../../../lib/constants.js";
import { Shell } from "../../../components/layout/index.js";
import { Card, SectionLabel } from "../../../components/ui/index.js";
import { ContactForm } from "../../../components/shared/index.js";
import { CHECKLIST_ITEMS } from "../../../lib/checklist.js";

function splitZoomDisplay(zoomStr) {
  if (!zoomStr) return { main: zoomStr, sub: null };
  const parts = zoomStr.split("·").map((s) => s.trim());
  if (parts.length <= 1) return { main: zoomStr, sub: null };
  return { main: parts[0], sub: parts.slice(1).join(" · ") };
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function PrimaryBtn({ children, onClick, disabled, gold }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "14px", border: "none", borderRadius: 12,
        background: "#FF4D00", color: "#fff",
        fontSize: "15px", fontWeight: 700, fontFamily: SANS,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        marginTop: "1rem",
      }}
    >
      {children}
    </button>
  );
}


function StepTitle({ children }) {
  return (
    <div style={{
      fontFamily: SANS, fontSize: "24px", fontWeight: 900,
      color: "#1B2A4A", lineHeight: 1.2, marginBottom: "0.75rem",
      letterSpacing: "-0.03em",
    }}>
      {children}
    </div>
  );
}

function StepBody({ children }) {
  return (
    <div style={{
      fontSize: "14px", color: TSEC, lineHeight: 1.65,
      fontFamily: SANS, marginBottom: "1rem",
    }}>
      {children}
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function WelcomePage({ profile, activeEvent, onNext }) {
  const fullName = profile?.full_name || "Friend";
  return (
    <>
      {/* Hero card */}
      <div style={{
        background: "#1B2A4A", borderRadius: 24, padding: "1.5rem 1.75rem 1.75rem",
        marginBottom: "1.5rem",
      }}>
        {/* Top row: event name left, logo right */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div style={{
            fontSize: "10px", fontWeight: 800, letterSpacing: "0.22em",
            color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS,
          }}>
            {activeEvent?.name || "Set Apart 2026"}
          </div>
          <img src="/logo.png" alt="412 MINISTRY" style={{ width: 34, height: 34, borderRadius: 10, clipPath: "inset(0 round 10px)", objectFit: "cover" }} />
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: SANS, fontSize: "46px", fontWeight: 900,
            color: "#fff", lineHeight: 1.05, marginBottom: "0.25rem",
            letterSpacing: "-0.03em",
          }}>
            {fullName}.
          </div>
          <div style={{
            fontFamily: SANS, fontSize: "22px", fontWeight: 500,
            color: "#FF4D00", fontStyle: "italic", marginBottom: "1.5rem",
          }}>
            Welcome.
          </div>
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "1.25rem",
            fontFamily: SANS, fontSize: "14px", fontStyle: "italic",
            color: "#B8C0D0", lineHeight: 1.75,
          }}>
            {activeEvent?.verse
              ? `"${activeEvent.verse}"`
              : '"You did not choose me, but I chose you."'}
          </div>
        </div>
      </div>

      <StepBody>
        We are so glad you are here. This onboarding walks you through everything
        you need to know before{" "}
        {activeEvent?.name || "the conference"} — your team, your co-leader, and
        what to expect.
      </StepBody>
      <StepBody>
        Take your time with each step. When you are ready, begin.
      </StepBody>
      <div style={{ flex: 1 }} />
      <PrimaryBtn onClick={onNext}>Begin →</PrimaryBtn>
    </>
  );
}

function PersonalMessagePage({ eventMember, onNext }) {
  const message = eventMember?.personal_message;
  return (
    <>
      <StepTitle>A word for you.</StepTitle>
      {message ? (
        <div style={{
          background: "#1B2A4A", borderRadius: 20, padding: "1.75rem",
          marginBottom: "1.25rem", position: "relative", overflow: "hidden",
        }}>
          {/* Decorative quote mark */}
          <div style={{
            position: "absolute", top: 12, left: 18,
            fontFamily: SANS, fontSize: "80px", color: "#FF4D00",
            opacity: 0.15, lineHeight: 1, userSelect: "none",
          }}>
            "
          </div>
          <div style={{
            fontFamily: SANS, fontSize: "17px", color: "#fff",
            lineHeight: 1.8, whiteSpace: "pre-wrap", position: "relative",
            marginBottom: "1.25rem",
          }}>
            {message}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.15)",
          }}>
            <div style={{
              width: 28, height: 2, borderRadius: 1, background: "#FF4D00",
            }} />
            <div style={{
              fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "#FF4D00", fontFamily: SANS,
            }}>
              412 MINISTRY Leadership
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          border: `1.5px dashed ${BORDER}`, borderRadius: 20,
          padding: "2rem 1.5rem", textAlign: "center", marginBottom: "1.25rem",
        }}>
          <div style={{
            fontFamily: SANS, fontSize: "32px", color: BORDER, marginBottom: "0.75rem",
          }}>
            ✦
          </div>
          <div style={{
            fontFamily: SANS, fontSize: "16px", color: TSEC, lineHeight: 1.7,
          }}>
            A personal note from the 412 leadership team is on its way.
          </div>
        </div>
      )}
      <div style={{ flex: 1 }} />
      <PrimaryBtn onClick={onNext}>Continue</PrimaryBtn>
    </>
  );
}

function EventInfoPage({ activeEvent, eventMember, onNext }) {
  const rows = [
    { label: "Conference", value: activeEvent?.name },
    { label: "Dates", value: activeEvent?.dates },
    { label: "Location", value: activeEvent?.location },
    { label: "Verse", value: activeEvent?.verse },
    { label: "Teams", value: activeEvent?.team_count ? `${activeEvent.team_count} teams` : null },
    { label: "Your Team", value: eventMember?.team_number ? `Team ${eventMember.team_number}` : "To be assigned" },
    { label: "Ministry", value: eventMember?.ministry || null },
  ].filter((r) => r.value);

  return (
    <>
      <StepTitle>Event overview.</StepTitle>
      <StepBody>Here is everything you need to know about Set Apart 2026.</StepBody>
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: "1rem" }}>
        {rows.map((row, i) => (
          <div key={row.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            padding: "0.75rem 1.25rem", gap: 16,
            borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : "none",
          }}>
            <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, flexShrink: 0 }}>
              {row.label}
            </span>
            <span style={{ fontSize: "13px", color: "#1B2A4A", fontFamily: SANS, textAlign: "right", maxWidth: "65%" }}>
              {row.value}
            </span>
          </div>
        ))}
      </Card>
      <div style={{ flex: 1 }} />
      <PrimaryBtn onClick={onNext}>Continue</PrimaryBtn>
    </>
  );
}

const REQUIREMENTS = [
  {
    id: "req1",
    title: "Attend all sessions",
    body: "As a team leader you are expected to be present for all sessions and activities throughout the full duration of Set Apart 2026. If you have a conflict, please reach out to your coordinator in advance.",
  },
  {
    id: "req2",
    title: "Complete pre-conference preparation",
    body: "You are required to complete all pre-conference checklist items including reading the Field Guide, attending any required training, and confirming your team assignments before arrival.",
  },
];

function RequirementsPage({ profile, onNext }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <StepTitle>Requirements.</StepTitle>
      <StepBody>Please read and acknowledge the following before continuing.</StepBody>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
        {REQUIREMENTS.map((req, i) => (
          <Card key={req.id} style={{ padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#FF4D00", fontFamily: SANS }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#1B2A4A", fontFamily: SANS }}>
                {req.title}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: TSEC, lineHeight: 1.6, margin: 0, fontFamily: SANS }}>
              {req.body}
            </p>
          </Card>
        ))}
      </div>
      <button
        onClick={() => setAcknowledged((a) => !a)}
        style={{
          display: "flex", alignItems: "flex-start", gap: 12,
          background: "none", border: "none", cursor: "pointer",
          padding: 0, marginBottom: "0.75rem", textAlign: "left", width: "100%",
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
          border: `2px solid ${acknowledged ? "#1B2A4A" : BORDER}`,
          background: acknowledged ? "#1B2A4A" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}>
          {acknowledged && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
        </div>
        <span style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.5 }}>
          I have read and understood the requirements for Set Apart 2026.
        </span>
      </button>
      <button
        onClick={() => setShowContact(true)}
        style={{
          width: "100%", padding: "12px", background: "transparent",
          color: "#1B2A4A", border: `1px solid ${BORDER}`, borderRadius: 12,
          fontSize: "14px", fontFamily: SANS, cursor: "pointer",
        }}
      >
        Email us with questions
      </button>
      <div style={{ flex: 1 }} />
      <PrimaryBtn onClick={onNext} disabled={!acknowledged}>
        I acknowledge and continue
      </PrimaryBtn>
      {showContact && <ContactForm profile={profile} onClose={() => setShowContact(false)} />}
    </>
  );
}

function TeamRevealPage({ eventMember, coLeader, onNext }) {
  const teamNumber = eventMember?.team_number;
  const ministry = eventMember?.ministry;
  const alreadyRevealed = eventMember?.coleader_revealed;

  const [revealed, setRevealed] = useState(!!alreadyRevealed);
  const [transitioning, setTransitioning] = useState(false);

  async function handleReveal() {
    if (revealed || transitioning) return;
    setTransitioning(true);
    await supabase
      .from("event_members")
      .update({ coleader_revealed: true })
      .eq("id", eventMember.id);
    setTimeout(() => {
      setRevealed(true);
      setTransitioning(false);
    }, 500);
  }

  const firstName = coLeader?.full_name?.split(" ")[0] || "them";

  return (
    <>
      <style>{`
        @keyframes revealIn {
          0%  { opacity: 0; transform: scale(0.82); }
          60% { transform: scale(1.04); }
          100%{ opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-orb {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,77,0,0.25); }
          50%       { box-shadow: 0 0 0 14px rgba(255,77,0,0); }
        }
        .reveal-card { animation: revealIn 0.65s cubic-bezier(0.34,1.2,0.64,1) forwards; }
        .pulse-orb   { animation: pulse-orb 2s ease-in-out infinite; }
      `}</style>

      <StepTitle>Your team.</StepTitle>
      <StepBody>You have been assigned to lead one of the twelve teams at Set Apart 2026.</StepBody>

      {/* Team number card */}
      <div style={{
        background: "#1B2A4A", borderRadius: 20, padding: "1.5rem",
        marginBottom: "0.75rem", textAlign: "center",
      }}>
        <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.22em", color: "#FF4D00", textTransform: "uppercase", marginBottom: 8, fontFamily: SANS }}>
          Team
        </div>
        <div style={{ fontFamily: SANS, fontSize: "72px", fontWeight: 900, color: "#FF4D00", lineHeight: 1, marginBottom: 6 }}>
          {teamNumber || "—"}
        </div>
        {ministry && (
          <div style={{ fontSize: "12px", color: "#B8C0D0", fontFamily: SANS, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {ministry === "EM" ? "English Ministry" : ministry === "MM" ? "Mongolian Ministry" : ministry}
          </div>
        )}
      </div>

      {/* Co-leader section */}
      {!revealed ? (
        /* ── Mystery card ── */
        <div style={{
          background: "#1B2A4A", borderRadius: 20, padding: "2rem 1.75rem",
          marginBottom: "1rem", textAlign: "center",
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "scale(0.92)" : "scale(1)",
          transition: "opacity 0.45s ease, transform 0.45s ease",
        }}>
          <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.2em", color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS, marginBottom: "1.5rem" }}>
            Your Co-Leader
          </div>

          {/* Mystery orb */}
          <div className="pulse-orb" style={{
            width: 90, height: 90, borderRadius: "50%",
            margin: "0 auto 1.5rem",
            background: "radial-gradient(circle at 40% 35%, rgba(255,77,0,0.15), rgba(27,42,74,0.6))",
            border: "2px solid rgba(255,77,0,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: SANS, fontSize: "44px", fontWeight: 900, color: "rgba(255,77,0,0.5)", lineHeight: 1 }}>?</span>
          </div>

          <div style={{
            fontFamily: SANS, fontSize: "15px", color: "#B8C0D0",
            fontStyle: "italic", lineHeight: 1.75, marginBottom: "0.5rem",
          }}>
            "Two are better than one, because they have a good return for their labor."
          </div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#FF4D00", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: SANS, marginBottom: "1.75rem" }}>
            Ecclesiastes 4:9
          </div>

          <button
            onClick={handleReveal}
            disabled={transitioning}
            style={{
              width: "100%", padding: "15px", border: "none", borderRadius: 14,
              background: transitioning ? "rgba(255,77,0,0.5)" : "#FF4D00",
              color: "#fff", fontSize: "15px", fontWeight: 700, fontFamily: SANS,
              cursor: transitioning ? "wait" : "pointer",
              letterSpacing: "0.02em",
              transition: "background 0.2s",
            }}
          >
            {transitioning ? "Revealing…" : "Reveal your co-leader →"}
          </button>
        </div>
      ) : coLeader ? (
        /* ── Revealed card ── */
        <div className="reveal-card" style={{
          background: "#1B2A4A", borderRadius: 20, padding: "2rem 1.75rem",
          marginBottom: "1rem", textAlign: "center",
        }}>
          <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.2em", color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS, marginBottom: "1.5rem" }}>
            Your Co-Leader
          </div>

          {/* Avatar with orange ring */}
          <div style={{
            width: 96, height: 96, borderRadius: "50%",
            margin: "0 auto 1.25rem",
            border: "3px solid #FF4D00",
            padding: 3,
            background: "#1B2A4A",
          }}>
            <div style={{
              width: "100%", height: "100%", borderRadius: "50%",
              overflow: "hidden", background: "#FAFAFA",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {coLeader.photo_url ? (
                <img src={coLeader.photo_url} alt={coLeader.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontFamily: SANS, fontSize: 36, fontWeight: 900, color: "#FF4D00" }}>
                  {coLeader.full_name?.charAt(0)}
                </span>
              )}
            </div>
          </div>

          <div style={{ fontFamily: SANS, fontSize: "28px", fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 4, letterSpacing: "-0.02em" }}>
            {coLeader.full_name}
          </div>
          {coLeader.ministry_role && (
            <div style={{ fontSize: "13px", color: "#B8C0D0", fontFamily: SANS, marginBottom: "1.25rem" }}>
              {coLeader.ministry_role}
            </div>
          )}

          {/* Contact info rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.25rem" }}>
            {coLeader.phone && (
              <a href={`tel:${coLeader.phone}`} style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 012 1.18 2 2 0 014 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9a16 16 0 006.91 6.91l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  <span style={{ fontSize: "13px", color: "#fff", fontFamily: SANS }}>{coLeader.phone}</span>
                </div>
              </a>
            )}
            {coLeader.email && (
              <a href={`mailto:${coLeader.email}`} style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span style={{ fontSize: "13px", color: "#fff", fontFamily: SANS }}>{coLeader.email}</span>
                </div>
              </a>
            )}
            {coLeader.churches?.name && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span style={{ fontSize: "13px", color: "#fff", fontFamily: SANS }}>{coLeader.churches.name}</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "1.25rem" }}>
            <div style={{ fontFamily: SANS, fontSize: "16px", fontWeight: 500, color: "#FF4D00", fontStyle: "italic", lineHeight: 1.65 }}>
              You and {firstName} will lead Team {teamNumber} together.
            </div>
          </div>
        </div>
      ) : (
        <Card style={{ padding: "1.25rem", marginBottom: "1rem", textAlign: "center" }}>
          <span style={{ fontSize: "14px", color: TSEC, fontFamily: SANS }}>
            Co-leader assignment coming soon.
          </span>
        </Card>
      )}

      <div style={{ flex: 1 }} />
      <PrimaryBtn onClick={onNext} disabled={transitioning}>Continue</PrimaryBtn>
    </>
  );
}


const PRAYER_TOPICS = [
  { num: 1, text: "Pray for the young people you have not met yet. Ask God to prepare their hearts before you even arrive." },
  { num: 2, text: "Pray for your co-leader. Ask God for unity, wisdom, and the ability to cover for each other." },
  { num: 3, text: "Pray for the conference. Ask that what happens in those days would stay with people for years." },
  { num: 4, text: "Pray for your fellow leaders. Ask that each one feels supported and not alone in this." },
  { num: 5, text: "Pray for the organizing team. Ask that every detail they carry is done in His strength." },
  { num: 6, text: "Pray that God would show you what He already sees in each person on your team." },
  { num: 7, text: "Pray for yourself. Ask that you lead from the Spirit and not just your own effort." },
];

function PrayerTopicsPage({ onNext }) {
  return (
    <>
      <StepTitle>Pray together.</StepTitle>
      <StepBody>
        Before the conference, connect with your co-leader and pray through each of these topics together.
        This is part of your pre-conference preparation.
      </StepBody>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1rem" }}>
        {PRAYER_TOPICS.map((topic) => (
          <div key={topic.num} style={{
            background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
            padding: "1rem 1.25rem", display: "flex", gap: 14, alignItems: "flex-start",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "#1B2A4A", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#FF4D00", fontFamily: SANS }}>{topic.num}</span>
            </div>
            <p style={{ fontSize: "13px", color: "#1B2A4A", fontFamily: SANS, lineHeight: 1.65, margin: 0 }}>
              {topic.text}
            </p>
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <PrimaryBtn onClick={onNext}>Continue</PrimaryBtn>
    </>
  );
}

function ChecklistPage({ onFinish, activeEvent }) {
  const [checked, setChecked] = useState({});
  const [saving, setSaving] = useState(false);
  const allChecked = CHECKLIST_ITEMS.every((item) => checked[item.id]);

  async function handleFinish() {
    setSaving(true);
    await onFinish(checked);
  }

  return (
    <>
      <StepTitle>Before you go.</StepTitle>
      <StepBody>
        Complete these four items before the conference. You can return to this list anytime from the Event tab.
      </StepBody>

      {/* Zoom training info */}
      {activeEvent?.zoom_training_dates && (() => {
        const { main, sub } = splitZoomDisplay(activeEvent.zoom_training_dates);
        return (
          <div style={{ background: "#1B2A4A", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.14em", color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS, marginBottom: 4 }}>
              Leader Zoom Training
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", fontFamily: SANS, marginBottom: sub ? 2 : 4 }}>
              {main}
            </div>
            {sub && <div style={{ fontSize: "12px", color: "#B8C0D0", fontFamily: SANS, marginBottom: 4 }}>{sub}</div>}
            <div style={{ fontSize: "12px", color: "#B8C0D0", fontFamily: SANS }}>
              Mandatory — mark the last item below once you have attended.
            </div>
          </div>
        );
      })()}

      <Card style={{ padding: 0, overflow: "hidden", marginBottom: "0.75rem" }}>
        {CHECKLIST_ITEMS.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setChecked((c) => ({ ...c, [item.id]: !c[item.id] }))}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              width: "100%", background: "none", border: "none",
              borderBottom: i < CHECKLIST_ITEMS.length - 1 ? `1px solid ${BORDER}` : "none",
              padding: "1rem 1.25rem", cursor: "pointer", textAlign: "left",
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
              border: `2px solid ${checked[item.id] ? "#FF4D00" : BORDER}`,
              background: checked[item.id] ? "#FF4D00" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
              {checked[item.id] && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
            </div>
            <span style={{
              fontSize: "14px", fontFamily: SANS,
              color: checked[item.id] ? TSEC : "#1B2A4A",
              textDecoration: checked[item.id] ? "line-through" : "none",
              transition: "color 0.15s",
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </Card>
      {!allChecked && (
        <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, textAlign: "center", fontStyle: "italic", marginBottom: 8 }}>
          You can finish these later. Press Done to complete onboarding.
        </div>
      )}
      <div style={{ flex: 1 }} />
      <PrimaryBtn onClick={handleFinish} disabled={saving} gold={allChecked}>
        {saving ? "Saving..." : allChecked ? "All done — finish" : "Done"}
      </PrimaryBtn>
    </>
  );
}

// ── Progress dots ─────────────────────────────────────────────────────────────

function ProgressDots({ step, total }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: "1.5rem" }}>
      {Array.from({ length: total }).map((_, i) => {
        const isCurrent = i === step;
        const isPast = i < step;
        return (
          <div key={i} style={{
            height: 8,
            width: isCurrent ? 24 : 8,
            borderRadius: 4,
            background: isCurrent ? "#FF4D00" : isPast ? "#1B2A4A" : BORDER,
            transition: "all 0.3s ease",
          }} />
        );
      })}
    </div>
  );
}

// ── Main shell ────────────────────────────────────────────────────────────────

export default function OnboardingFlow({ data, onDone, onExit }) {
  const { profile, activeEvent, eventMember, coLeader } = data;
  const savedStep = eventMember?.onboarding_step || 0;
  const [step, setStep] = useState(savedStep);

  useEffect(() => {
    if (eventMember?.id && !eventMember.onboarding_visited) {
      supabase.from("event_members").update({ onboarding_visited: true }).eq("id", eventMember.id);
    }
  }, [eventMember?.id]);

  async function handleExit() {
    await supabase.from("event_members")
      .update({ onboarding_step: step })
      .eq("id", eventMember.id);
    onExit();
  }

  const next = () => setStep((s) => Math.min(s + 1, 5));

  async function handleFinish(checklistData) {
    try {
      await Promise.all([
        supabase
          .from("event_members")
          .update({ onboarding_completed: true })
          .eq("id", eventMember.id),
        supabase
          .from("event_checklist")
          .update({ items: checklistData })
          .eq("event_member_id", eventMember.id),
      ]);
      onDone();
    } catch (err) {
      console.error("Finish onboarding error:", err);
    }
  }

  const steps = [
    <WelcomePage key="welcome" profile={profile} activeEvent={activeEvent} onNext={next} />,
    <PersonalMessagePage key="message" eventMember={eventMember} onNext={next} />,
    <RequirementsPage key="req" profile={profile} onNext={next} />,
    <TeamRevealPage key="team" eventMember={eventMember} coLeader={coLeader} onNext={next} />,
    <PrayerTopicsPage key="prayer" onNext={next} />,
    <ChecklistPage key="checklist" onFinish={handleFinish} activeEvent={activeEvent} />,
  ];

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            style={{ background: "none", border: "none", color: TSEC, fontSize: "14px", cursor: "pointer", padding: 0, fontFamily: SANS }}
          >
            ‹ Back
          </button>
        ) : <div />}
        <button
          onClick={handleExit}
          style={{ background: "none", border: "none", color: TSEC, fontSize: "13px", cursor: "pointer", padding: 0, fontFamily: SANS }}
        >
          Save & exit
        </button>
      </div>
      <ProgressDots step={step} total={6} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "70vh" }}>
        {steps[step]}
      </div>
    </Shell>
  );
}
