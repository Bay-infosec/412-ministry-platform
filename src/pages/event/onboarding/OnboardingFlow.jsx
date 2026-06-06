import { useState } from "react";
import { supabase } from "../../../lib/supabase.js";
import "./OnboardingFlow.css";

// Step components inline to keep navigation self-contained

function WelcomePage({ profile, onNext }) {
  const firstName = profile?.full_name?.split(" ")[0] || "Friend";
  return (
    <div className="ob-step">
      <span className="ob-step-tag">Step 1 of 6</span>
      <div className="ob-welcome-icon">✦</div>
      <h1 className="ob-step-title">Welcome,<br />{firstName}.</h1>
      <p className="ob-step-body">
        We are glad you are here. This onboarding will take just a few minutes
        and will introduce you to your team, your co-leader, and what to expect
        at Set Apart 2026.
      </p>
      <p className="ob-step-body">
        Take your time with each step. When you are ready, press continue.
      </p>
      <div className="ob-spacer" />
      <button className="ob-btn" onClick={onNext}>Continue</button>
    </div>
  );
}

function PersonalMessagePage({ eventMember, onNext }) {
  const message = eventMember?.personal_message;
  return (
    <div className="ob-step">
      <span className="ob-step-tag">Step 2 of 6</span>
      <h1 className="ob-step-title">A word for you.</h1>
      {message ? (
        <div className="ob-message-card">
          <p className="ob-message-text">{message}</p>
          <div className="ob-message-from">412 Ministry Leadership</div>
        </div>
      ) : (
        <p className="ob-step-body">No personal message yet. Check back later.</p>
      )}
      <div className="ob-spacer" />
      <button className="ob-btn" onClick={onNext}>Continue</button>
    </div>
  );
}

function EventInfoPage({ activeEvent, eventMember, onNext }) {
  const rows = [
    { label: "Conference", value: activeEvent?.name },
    { label: "Dates", value: formatDateRange(activeEvent?.start_date, activeEvent?.end_date) },
    { label: "Location", value: activeEvent?.location },
    { label: "Verse", value: activeEvent?.verse },
    { label: "Teams", value: activeEvent?.team_count ? `${activeEvent.team_count} teams` : null },
    { label: "Your Team", value: eventMember?.team_number ? `Team ${eventMember.team_number}` : "To be assigned" },
    { label: "Ministry", value: eventMember?.ministry || null },
  ].filter((r) => r.value);

  return (
    <div className="ob-step">
      <span className="ob-step-tag">Step 3 of 6</span>
      <h1 className="ob-step-title">Event overview.</h1>
      <p className="ob-step-body">Here is everything you need to know about Set Apart 2026.</p>
      <div className="ob-info-card">
        {rows.map((row) => (
          <div key={row.label} className="ob-info-row">
            <span className="ob-info-label">{row.label}</span>
            <span className="ob-info-value">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="ob-spacer" />
      <button className="ob-btn" onClick={onNext}>Continue</button>
    </div>
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
    <div className="ob-step">
      <span className="ob-step-tag">Step 4 of 6</span>
      <h1 className="ob-step-title">Requirements.</h1>
      <p className="ob-step-body">
        Please read and acknowledge the following before continuing.
      </p>
      <div className="ob-req-list">
        {REQUIREMENTS.map((req, i) => (
          <div key={req.id} className="ob-req-card">
            <div className="ob-req-header">
              <span className="ob-req-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="ob-req-title">{req.title}</span>
            </div>
            <p className="ob-req-body">{req.body}</p>
          </div>
        ))}
      </div>
      <button
        className="ob-acknowledge"
        onClick={() => setAcknowledged((a) => !a)}
      >
        <div className={`ob-checkbox ${acknowledged ? "ob-checked" : ""}`}>
          {acknowledged && <span className="ob-checkmark">✓</span>}
        </div>
        <span className="ob-acknowledge-text">
          I have read and understood the requirements for Set Apart 2026.
        </span>
      </button>
      <button className="ob-outline-btn" onClick={handleEmail}>
        Email us with questions
      </button>
      <div className="ob-spacer" />
      <button
        className="ob-btn"
        onClick={onNext}
        disabled={!acknowledged}
        style={{ opacity: acknowledged ? 1 : 0.35 }}
      >
        I acknowledge and continue
      </button>
    </div>
  );
}

function TeamRevealPage({ eventMember, onNext }) {
  const coLeader = eventMember?.co_leader_profile || null;
  const teamNumber = eventMember?.team_number;
  const ministry = eventMember?.ministry;

  return (
    <div className="ob-step">
      <span className="ob-step-tag">Step 5 of 6</span>
      <h1 className="ob-step-title">Your team.</h1>
      <p className="ob-step-body">
        Here is your team assignment and the person you will be leading alongside.
      </p>
      <div className="ob-team-card">
        <span className="ob-team-label">Team</span>
        <span className="ob-team-number">{teamNumber || "—"}</span>
        {ministry && <span className="ob-team-ministry">{ministry}</span>}
      </div>
      {coLeader ? (
        <div className="ob-coleader-card">
          <div className="ob-coleader-avatar">
            {coLeader.photo_url ? (
              <img src={coLeader.photo_url} alt={coLeader.full_name} />
            ) : (
              <span className="ob-avatar-initial">
                {coLeader.full_name?.charAt(0)}
              </span>
            )}
          </div>
          <div className="ob-coleader-info">
            <span className="ob-coleader-tag">Your co-leader</span>
            <span className="ob-coleader-name">{coLeader.full_name}</span>
            {coLeader.ministry_role && (
              <span className="ob-coleader-role">{coLeader.ministry_role}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="ob-coleader-card ob-coleader-empty">
          <p>Co-leader assignment coming soon.</p>
        </div>
      )}
      <div className="ob-spacer" />
      <button className="ob-btn" onClick={onNext}>Continue</button>
    </div>
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

  function toggle(id) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  }

  async function handleFinish() {
    setSaving(true);
    await onFinish(checked);
  }

  return (
    <div className="ob-step">
      <span className="ob-step-tag">Step 6 of 6</span>
      <h1 className="ob-step-title">Before you go.</h1>
      <p className="ob-step-body">
        Complete these four items before the conference. You can return to this
        list anytime from the Event tab.
      </p>
      <div className="ob-checklist">
        {CHECKLIST_ITEMS.map((item, i) => (
          <button
            key={item.id}
            className="ob-checklist-row"
            onClick={() => toggle(item.id)}
            style={{
              borderBottom:
                i < CHECKLIST_ITEMS.length - 1 ? "1px solid #f0ece4" : "none",
            }}
          >
            <div className={`ob-circle ${checked[item.id] ? "ob-circle-done" : ""}`}>
              {checked[item.id] && <span className="ob-checkmark">✓</span>}
            </div>
            <span
              className="ob-checklist-label"
              style={{
                color: checked[item.id] ? "#9a9488" : "#1a1a1a",
                textDecoration: checked[item.id] ? "line-through" : "none",
              }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
      {!allChecked && (
        <p className="ob-skip-note">
          You can finish these later. Press Done to complete onboarding.
        </p>
      )}
      <div className="ob-spacer" />
      <button
        className={`ob-btn ${allChecked ? "ob-btn-gold" : ""}`}
        onClick={handleFinish}
        disabled={saving}
      >
        {saving ? "Saving..." : allChecked ? "All done — finish" : "Done"}
      </button>
    </div>
  );
}

// Main shell
export default function OnboardingFlow({ data, onDone }) {
  const { profile, activeEvent, eventMember } = data;
  const [step, setStep] = useState(0);

  const next = () => setStep((s) => Math.min(s + 1, 5));

  async function handleFinish(checklistData) {
    try {
      await supabase
        .from("event_members")
        .update({
          onboarding_completed: true,
          checklist: checklistData,
        })
        .eq("id", eventMember.id);

      onDone(); // triggers App.loadData() to refresh and remove banner
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
    <div className="ob-root">
      <div className="ob-progress-bar">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`ob-progress-dot ${i <= step ? "ob-dot-active" : ""}`}
          />
        ))}
      </div>
      {step > 0 && (
        <button className="ob-back" onClick={() => setStep((s) => s - 1)}>
          ‹ Back
        </button>
      )}
      <div className="ob-step-wrap">{steps[step]}</div>
    </div>
  );
}

function formatDateRange(start, end) {
  if (!start) return "";
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const opts = { month: "long", day: "numeric", year: "numeric" };
  if (!e) return s.toLocaleDateString("en-US", opts);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
}
