import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, SectionLabel } from "../../components/ui/index.js";

export default function EventHome({ data, onOpenPage, onNavigate }) {
  const { activeEvent, eventMember, profile, isAdmin } = data;

  if (!activeEvent) {
    return (
      <Shell withNav>
        <div style={{ fontFamily: SANS, fontSize: "14px", color: TSEC, textAlign: "center", marginTop: "4rem" }}>
          No active event right now.
        </div>
      </Shell>
    );
  }

  const isCoordinator = eventMember?.event_role === "coordinator" || isAdmin;

  const sections = [
    ...(eventMember ? [{ id: "onboarding", label: "Onboarding", desc: eventMember.onboarding_completed ? "Review your setup" : "Complete your setup" }] : []),
    { id: "myteam", label: "My Team", desc: eventMember?.team_number ? `Team ${eventMember.team_number}` : "Team assignment" },
    { id: "prayer_chain", label: "Prayer Chain", desc: "Pray for one another" },
    { id: "the_four", label: "The Four", desc: "Your four essentials" },
    { id: "field_guide", label: "Field Guide", desc: "Resources and references" },
    { id: "chat", label: "Chat", desc: "Team conversation" },
  ];

  if (isCoordinator) {
    sections.push({ id: "coordinator", label: "My Teams", desc: "Overview of teams you oversee" });
  }

  return (
    <Shell withNav>
      {/* Event header card */}
      <div style={{
        background: NAVY,
        borderRadius: 16,
        padding: "1.5rem",
        marginBottom: "1rem",
        fontFamily: SANS,
      }}>
        <div style={{
          fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em",
          color: GOLD, textTransform: "uppercase", marginBottom: "0.25rem",
        }}>
          Active Event
        </div>
        <div style={{
          fontFamily: SERIF, fontSize: "22px", fontWeight: 600,
          color: "#fff", lineHeight: 1.2, marginBottom: "0.5rem",
        }}>
          {activeEvent.name}
        </div>
        {activeEvent.dates && (
          <div style={{ fontSize: "13px", color: "#B8C0D0" }}>{activeEvent.dates}</div>
        )}
        {activeEvent.location && (
          <div style={{ fontSize: "13px", color: "#B8C0D0" }}>{activeEvent.location}</div>
        )}
        {activeEvent.verse && (
          <div style={{
            marginTop: "0.75rem", fontSize: "13px", color: GOLD,
            fontStyle: "italic", fontFamily: SERIF, opacity: 0.9, lineHeight: 1.5,
          }}>
            "{activeEvent.verse}"
          </div>
        )}
      </div>

      {/* Onboarding banner */}
      {eventMember && !eventMember.onboarding_completed && (
        <button
          onClick={() => onOpenPage("onboarding")}
          style={{
            width: "100%", textAlign: "left", background: ORANGE,
            borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1rem",
            border: "none", cursor: "pointer", fontFamily: SANS,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: "#fff", opacity: 0.85 }}>
              GET STARTED
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginTop: 2 }}>
              Complete your onboarding
            </div>
            <div style={{ fontSize: "12px", color: "#fff", opacity: 0.8, marginTop: 2 }}>
              A few quick steps to get you set up
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}

      {/* Sections */}
      <SectionLabel>Sections</SectionLabel>
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: "1rem" }}>
        {sections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onOpenPage(s.id)}
            style={{
              width: "100%", textAlign: "left", background: "none",
              border: "none", borderBottom: i < sections.length - 1 ? `1px solid ${BORDER}` : "none",
              padding: "1rem 1.25rem", cursor: "pointer", fontFamily: SANS,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: NAVY }}>{s.label}</div>
              <div style={{ fontSize: "12px", color: TSEC, marginTop: 2 }}>{s.desc}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ))}
      </Card>
    </Shell>
  );
}
