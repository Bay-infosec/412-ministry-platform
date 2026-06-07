import { useState } from "react";
import { supabase } from "../../../lib/supabase.js";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SERIF, SANS } from "../../../lib/constants.js";
import { Shell } from "../../../components/layout/index.js";
import { Card, SectionLabel } from "../../../components/ui/index.js";

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

function WelcomePage({ profile, onNext }) {
  const firstName = profile?.full_name?.split(" ")[0] || "Friend";
  return (
    <>
      <StepTag current={1} total={6} />
      <StepTitle>Welcome,<br />{firstName}.</StepTitle>
      <StepBody>
        We are glad you are here. This onboarding will take just a few minutes
        and will introduce you to your team, your co-leader, and what to expect
        at Set Apart 2026.
      </StepBody>
      <StepBody>Take your time with each step. When you are ready, press continue.</StepBody>
      <div style={{ flex: 1 }} />
      <PrimaryBtn onClick={onNext}>Continue</PrimaryBtn>
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
        <Card style={{ padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{
            fontFamily: SERIF, fontSize: "16px", color: NAVY,
            lineHeight: 1.75, marginBottom: "1rem", whiteSpace: "pre-wrap",
          }}>
            {message}
          </div>
          <div style={{
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: ORANGE, fontFamily: SANS,
            paddingTop: "0.75rem", borderTop: `1px solid ${BORDER}`,
          }}>
            412 Ministry Leadership
          </div>
        </Card>
      ) : (
        <StepBody>No personal message yet. Check back later.</StepBody>
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

function TeamRevealPage({ eventMember, onNext }) {
  const coLeader = eventMember?.co_leader || null;
  const teamNumber = eventMember?.team_number;
  const ministry = eventMember?.ministry;

  return (
    <>
      <StepTag current={5} total={6} />
      <StepTitle>Your team.</StepTitle>
      <StepBody>Here is your team assignment and the person you will be leading alongside.</StepBody>
      <div style={{
        background: NAVY, borderRadius: 16, padding: "1.5rem",
        marginBottom: "0.75rem", textAlign: "center",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", color: GOLD, textTransform: "uppercase", marginBottom: 8, fontFamily: SANS }}>
          Team
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "64px", color: GOLD, lineHeight: 1, marginBottom: 8 }}>
          {teamNumber || "—"}
        </div>
        {ministry && (
          <div style={{ fontSize: "12px", color: "#B8C0D0", fontFamily: SANS, letterSpacing: "0.1em" }}>
            {ministry}
          </div>
        )}
      </div>
      {coLeader ? (
        <Card style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: 14, marginBottom: "1rem" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", overflow: "hidden",
            background: BG, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {coLeader.photo_url ? (
              <img src={coLeader.photo_url} alt={coLeader.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontFamily: SERIF, fontSize: 20, color: TSEC }}>
                {coLeader.full_name?.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: 3 }}>
              Your co-leader
            </div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>
              {coLeader.full_name}
            </div>
            {coLeader.ministry_role && (
              <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>{coLeader.ministry_role}</div>
            )}
          </div>
        </Card>
      ) : (
        <Card style={{ padding: "1rem 1.25rem", marginBottom: "1rem", textAlign: "center" }}>
          <span style={{ fontSize: "13px", color: TSEC, fontFamily: SANS }}>
            Co-leader assignment coming soon.
          </span>
        </Card>
      )}
      <div style={{ flex: 1 }} />
      <PrimaryBtn onClick={onNext}>Continue</PrimaryBtn>
    </>
  );
}

const CHECKLIST_ITEMS = [
  { id: "field_guide", label: "Read the Field Guide" },
  { id: "prayer_chain", label: "Review the Prayer Chain" },
  { id: "contact_coleader", label: "Connect with your co-leader" },
  { id: "confirm_attendance", label: "Confirm your attendance" },
];

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

export default function OnboardingFlow({ data, onDone }) {
  const { profile, activeEvent, eventMember } = data;
  const [step, setStep] = useState(0);

  const next = () => setStep((s) => Math.min(s + 1, 5));

  async function handleFinish(checklistData) {
    try {
      await supabase
        .from("event_members")
        .update({ onboarding_completed: true, checklist: checklistData })
        .eq("id", eventMember.id);
      onDone();
    } catch (err) {
      console.error("Finish onboarding error:", err);
    }
  }

  const steps = [
    <WelcomePage key="welcome" profile={profile} onNext={next} />,
    <PersonalMessagePage key="message" eventMember={eventMember} onNext={next} />,
    <EventInfoPage key="info" activeEvent={activeEvent} eventMember={eventMember} onNext={next} />,
    <RequirementsPage key="req" onNext={next} />,
    <TeamRevealPage key="team" eventMember={eventMember} onNext={next} />,
    <ChecklistPage key="checklist" onFinish={handleFinish} />,
  ];

  return (
    <Shell>
      <ProgressBar step={step} total={6} />
      {step > 0 && (
        <button
          onClick={() => setStep((s) => s - 1)}
          style={{
            background: "none", border: "none", color: TSEC,
            fontSize: "14px", cursor: "pointer", padding: 0,
            fontFamily: SANS, marginBottom: "1rem", display: "block",
          }}
        >
          ‹ Back
        </button>
      )}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "70vh" }}>
        {steps[step]}
      </div>
    </Shell>
  );
}
