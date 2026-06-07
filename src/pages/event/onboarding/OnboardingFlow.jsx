import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase.js";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SERIF, SANS } from "../../../lib/constants.js";
import { Shell } from "../../../components/layout/index.js";
import { Card, SectionLabel } from "../../../components/ui/index.js";
import { CHECKLIST_ITEMS } from "../../../lib/checklist.js";

// ── Shared primitives ─────────────────────────────────────────────────────────

function PrimaryBtn({ children, onClick, disabled, gold }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "14px", border: "none", borderRadius: 12,
        background: gold ? ORANGE : NAVY, color: "#fff",
        fontSize: "15px", fontWeight: 600, fontFamily: SANS,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        marginTop: "1rem",
      }}
    >
      {children}
    </button>
  );
}

function StepTag({ current, total }) {
  return (
    <div style={{
      fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em",
      color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.5rem",
    }}>
      Step {current} of {total}
    </div>
  );
}

function StepTitle({ children }) {
  return (
    <div style={{
      fontFamily: SERIF, fontSize: "26px", fontWeight: 600,
      color: NAVY, lineHeight: 1.2, marginBottom: "0.75rem",
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
  const firstName = profile?.full_name?.split(" ")[0] || "Friend";
  return (
    <>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <img src="/logo.png" alt="412 Ministry" style={{ height: 96, width: "auto" }} />
      </div>

      {/* Hero card */}
      <div style={{
        background: NAVY, borderRadius: 24, padding: "2rem 1.75rem 1.75rem",
        marginBottom: "1.5rem", textAlign: "center",
      }}>
        <div style={{
          fontSize: "10px", fontWeight: 700, letterSpacing: "0.22em",
          color: GOLD, textTransform: "uppercase", fontFamily: SANS, marginBottom: "1.25rem",
        }}>
          {activeEvent?.name || "Set Apart 2026"}
        </div>
        <div style={{
          fontFamily: SERIF, fontSize: "52px", fontWeight: 600,
          color: "#fff", lineHeight: 1.05, marginBottom: "0.25rem",
        }}>
          {firstName}.
        </div>
        <div style={{
          fontFamily: SERIF, fontSize: "22px", fontWeight: 400,
          color: GOLD, fontStyle: "italic", marginBottom: "1.5rem",
        }}>
          Welcome.
        </div>
        {activeEvent?.verse ? (
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "1.25rem",
            fontFamily: SERIF, fontSize: "14px", fontStyle: "italic",
            color: "#B8C0D0", lineHeight: 1.75,
          }}>
            "{activeEvent.verse}"
          </div>
        ) : (
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "1.25rem",
            fontFamily: SERIF, fontSize: "14px", fontStyle: "italic",
            color: "#B8C0D0", lineHeight: 1.75,
          }}>
            "You did not choose me, but I chose you."
          </div>
        )}
      </div>

      <StepTag current={1} total={6} />
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
      <StepTag current={2} total={6} />
      <StepTitle>A word for you.</StepTitle>
      {message ? (
        <div style={{
          background: NAVY, borderRadius: 20, padding: "1.75rem",
          marginBottom: "1.25rem", position: "relative", overflow: "hidden",
        }}>
          {/* Decorative quote mark */}
          <div style={{
            position: "absolute", top: 12, left: 18,
            fontFamily: SERIF, fontSize: "80px", color: GOLD,
            opacity: 0.15, lineHeight: 1, userSelect: "none",
          }}>
            "
          </div>
          <div style={{
            fontFamily: SERIF, fontSize: "17px", color: "#fff",
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
              width: 28, height: 2, borderRadius: 1, background: GOLD,
            }} />
            <div style={{
              fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: GOLD, fontFamily: SANS,
            }}>
              412 Ministry Leadership
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          border: `1.5px dashed ${BORDER}`, borderRadius: 20,
          padding: "2rem 1.5rem", textAlign: "center", marginBottom: "1.25rem",
        }}>
          <div style={{
            fontFamily: SERIF, fontSize: "32px", color: BORDER, marginBottom: "0.75rem",
          }}>
            ✦
          </div>
          <div style={{
            fontFamily: SERIF, fontSize: "16px", color: TSEC, lineHeight: 1.7,
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
      <StepTag current={3} total={6} />
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
            <span style={{ fontSize: "13px", color: NAVY, fontFamily: SANS, textAlign: "right", maxWidth: "65%" }}>
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

function RequirementsPage({ onNext }) {
  const [acknowledged, setAcknowledged] = useState(false);

  function handleEmail() {
    const sub = encodeURIComponent("Set Apart 2026 Question");
    const body = encodeURIComponent("Hi,\n\nI have a question about the requirements for Set Apart 2026.\n\n");
    window.location.href = `mailto:info@412ministry.com?subject=${sub}&body=${body}`;
  }

  return (
    <>
      <StepTag current={4} total={6} />
      <StepTitle>Requirements.</StepTitle>
      <StepBody>Please read and acknowledge the following before continuing.</StepBody>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
        {REQUIREMENTS.map((req, i) => (
          <Card key={req.id} style={{ padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: ORANGE, fontFamily: SANS }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>
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
          border: `2px solid ${acknowledged ? NAVY : BORDER}`,
          background: acknowledged ? NAVY : "transparent",
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
        onClick={handleEmail}
        style={{
          width: "100%", padding: "12px", background: "transparent",
          color: NAVY, border: `1px solid ${BORDER}`, borderRadius: 12,
          fontSize: "14px", fontFamily: SANS, cursor: "pointer",
        }}
      >
        Email us with questions
      </button>
      <div style={{ flex: 1 }} />
      <PrimaryBtn onClick={onNext} disabled={!acknowledged}>
        I acknowledge and continue
      </PrimaryBtn>
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
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,171,37,0.3); }
          50%       { box-shadow: 0 0 0 14px rgba(239,171,37,0); }
        }
        .reveal-card { animation: revealIn 0.65s cubic-bezier(0.34,1.2,0.64,1) forwards; }
        .pulse-orb   { animation: pulse-orb 2s ease-in-out infinite; }
      `}</style>

      <StepTag current={5} total={6} />
      <StepTitle>Your team.</StepTitle>
      <StepBody>You have been assigned to lead one of the twelve teams at Set Apart 2026.</StepBody>

      {/* Team number card */}
      <div style={{
        background: NAVY, borderRadius: 20, padding: "1.5rem",
        marginBottom: "0.75rem", textAlign: "center",
      }}>
        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.22em", color: GOLD, textTransform: "uppercase", marginBottom: 8, fontFamily: SANS }}>
          Team
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "72px", color: GOLD, lineHeight: 1, marginBottom: 6 }}>
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
          background: NAVY, borderRadius: 20, padding: "2rem 1.75rem",
          marginBottom: "1rem", textAlign: "center",
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "scale(0.92)" : "scale(1)",
          transition: "opacity 0.45s ease, transform 0.45s ease",
        }}>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", color: GOLD, textTransform: "uppercase", fontFamily: SANS, marginBottom: "1.5rem" }}>
            Your Co-Leader
          </div>

          {/* Mystery orb */}
          <div className="pulse-orb" style={{
            width: 90, height: 90, borderRadius: "50%",
            margin: "0 auto 1.5rem",
            background: "radial-gradient(circle at 40% 35%, rgba(239,171,37,0.25), rgba(22,32,56,0.6))",
            border: "2px solid rgba(239,171,37,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: SERIF, fontSize: "44px", color: "rgba(239,171,37,0.55)", lineHeight: 1 }}>?</span>
          </div>

          <div style={{
            fontFamily: SERIF, fontSize: "15px", color: "#B8C0D0",
            fontStyle: "italic", lineHeight: 1.75, marginBottom: "0.5rem",
          }}>
            "Two are better than one, because they have a good return for their labor."
          </div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(239,171,37,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: SANS, marginBottom: "1.75rem" }}>
            Ecclesiastes 4:9
          </div>

          <button
            onClick={handleReveal}
            disabled={transitioning}
            style={{
              width: "100%", padding: "15px", border: "none", borderRadius: 14,
              background: transitioning ? "rgba(232,98,26,0.5)" : ORANGE,
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
          background: NAVY, borderRadius: 20, padding: "2rem 1.75rem",
          marginBottom: "1rem", textAlign: "center",
        }}>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", color: GOLD, textTransform: "uppercase", fontFamily: SANS, marginBottom: "1.5rem" }}>
            Your Co-Leader
          </div>

          {/* Avatar with gold ring */}
          <div style={{
            width: 96, height: 96, borderRadius: "50%",
            margin: "0 auto 1.25rem",
            border: `3px solid ${GOLD}`,
            padding: 3,
            background: NAVY,
          }}>
            <div style={{
              width: "100%", height: "100%", borderRadius: "50%",
              overflow: "hidden", background: BG,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {coLeader.photo_url ? (
                <img src={coLeader.photo_url} alt={coLeader.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontFamily: SERIF, fontSize: 36, color: TSEC }}>
                  {coLeader.full_name?.charAt(0)}
                </span>
              )}
            </div>
          </div>

          <div style={{ fontFamily: SERIF, fontSize: "28px", fontWeight: 600, color: "#fff", lineHeight: 1.2, marginBottom: 4 }}>
            {coLeader.full_name}
          </div>
          {coLeader.ministry_role && (
            <div style={{ fontSize: "13px", color: "#B8C0D0", fontFamily: SANS, marginBottom: "1.5rem" }}>
              {coLeader.ministry_role}
            </div>
          )}

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "1.25rem" }}>
            <div style={{ fontFamily: SERIF, fontSize: "16px", color: GOLD, fontStyle: "italic", lineHeight: 1.65 }}>
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


function ChecklistPage({ onFinish }) {
  const [checked, setChecked] = useState({});
  const [saving, setSaving] = useState(false);
  const allChecked = CHECKLIST_ITEMS.every((item) => checked[item.id]);

  async function handleFinish() {
    setSaving(true);
    await onFinish(checked);
  }

  return (
    <>
      <StepTag current={6} total={6} />
      <StepTitle>Before you go.</StepTitle>
      <StepBody>
        Complete these four items before the conference. You can return to this list anytime from the Event tab.
      </StepBody>
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
              border: `2px solid ${checked[item.id] ? ORANGE : BORDER}`,
              background: checked[item.id] ? ORANGE : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
              {checked[item.id] && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
            </div>
            <span style={{
              fontSize: "14px", fontFamily: SANS,
              color: checked[item.id] ? TSEC : NAVY,
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

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step, total }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i <= step ? NAVY : BORDER,
          transition: "background 0.3s",
        }} />
      ))}
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
    <EventInfoPage key="info" activeEvent={activeEvent} eventMember={eventMember} onNext={next} />,
    <RequirementsPage key="req" onNext={next} />,
    <TeamRevealPage key="team" eventMember={eventMember} coLeader={coLeader} onNext={next} />,
    <ChecklistPage key="checklist" onFinish={handleFinish} />,
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
      <ProgressBar step={step} total={6} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "70vh" }}>
        {steps[step]}
      </div>
    </Shell>
  );
}
