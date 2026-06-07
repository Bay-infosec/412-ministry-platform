import { useState } from "react";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, SectionLabel } from "../../components/ui/index.js";

function splitZoomDisplay(zoomStr) {
  if (!zoomStr) return { main: zoomStr, sub: null };
  const parts = zoomStr.split("·").map((s) => s.trim());
  if (parts.length <= 1) return { main: zoomStr, sub: null };
  return { main: parts[0], sub: parts.slice(1).join(" · ") };
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const m1 = dateStr.match(/([A-Za-z]+ \d+)[–\-]\d+,?\s*(\d{4})/);
  const m2 = dateStr.match(/([A-Za-z]+ \d+,\s*\d{4})/);
  const parsed = m1 ? new Date(`${m1[1]}, ${m1[2]}`) : m2 ? new Date(m2[1]) : null;
  if (!parsed || isNaN(parsed)) return null;
  return Math.ceil((parsed - new Date()) / 86400000);
}

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
  const days = daysUntil(activeEvent?.dates);

  const sections = [
    ...(eventMember ? [{ id: "onboarding", label: "Onboarding", desc: eventMember.onboarding_completed ? "Review your setup" : "Complete your setup" }] : []),
    { id: "myteam", label: "My Team", desc: eventMember?.team_number ? `Team ${eventMember.team_number} · checklist inside` : "Team assignment & checklist" },
    { id: "prayer_chain", label: "Prayer Chain", desc: "Pray for one another" },
    { id: "the_four", label: "The Four", desc: "Your four essentials" },
    { id: "field_guide", label: "Field Guide", desc: "Resources and references" },
  ];

  if (isCoordinator) {
    sections.push({ id: "coordinator", label: "My Teams", desc: "Overview of teams you oversee" });
  }

  const zoom = activeEvent.zoom_training_dates ? splitZoomDisplay(activeEvent.zoom_training_dates) : null;
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <Shell withNav>
      {/* Event header card */}
      <div style={{ background: NAVY, borderRadius: 16, padding: "1.5rem", marginBottom: "1rem", fontFamily: SANS }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", color: GOLD, textTransform: "uppercase", marginBottom: "0.25rem" }}>
              Active Event
            </div>
            <div style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 600, color: "#fff", lineHeight: 1.2, marginBottom: "0.25rem" }}>
              {activeEvent.name}
            </div>
            {activeEvent.dates && <div style={{ fontSize: "13px", color: "#B8C0D0" }}>{activeEvent.dates}</div>}
            {activeEvent.location && <div style={{ fontSize: "13px", color: "#B8C0D0" }}>{activeEvent.location}</div>}
          </div>
          {days !== null && days >= 0 && (
            <div style={{ textAlign: "center", flexShrink: 0, marginLeft: 16 }}>
              {days === 0 ? (
                <div style={{ fontFamily: SERIF, fontSize: "18px", fontWeight: 600, color: ORANGE }}>It's here!</div>
              ) : (
                <>
                  <div style={{ fontFamily: SERIF, fontSize: "42px", fontWeight: 600, color: "#fff", lineHeight: 1 }}>{days}</div>
                  <div style={{ fontSize: "10px", color: "#B8C0D0", fontWeight: 600, letterSpacing: "0.06em" }}>{days === 1 ? "DAY" : "DAYS"}</div>
                </>
              )}
            </div>
          )}
        </div>
        {activeEvent.fee && (
          <div style={{ fontSize: "13px", color: "#B8C0D0", marginBottom: "0.75rem" }}>
            Registration fee: <span style={{ color: GOLD, fontWeight: 600 }}>{activeEvent.fee}</span>
          </div>
        )}
        {activeEvent.verse_text && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.75rem" }}>
            <div style={{ fontFamily: SERIF, fontSize: "14px", color: "#FFE066", lineHeight: 1.65, fontStyle: "italic", marginBottom: "0.25rem" }}>
              "{activeEvent.verse_text}"
            </div>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: GOLD, textTransform: "uppercase", fontFamily: SANS }}>
              {activeEvent.verse}
            </div>
          </div>
        )}
        {activeEvent.registration_url && (
          <a
            href={activeEvent.registration_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block", marginTop: "1rem", background: ORANGE, color: "#fff",
              borderRadius: 10, padding: "11px 0", textAlign: "center",
              fontSize: "14px", fontWeight: 700, fontFamily: SANS, textDecoration: "none",
            }}
          >
            Register now →
          </a>
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

        {/* Zoom training — expandable info row at top of sections card */}
        {zoom && (
          <div style={{ borderBottom: `1px solid ${BORDER}`, background: BG }}>
            <button
              onClick={() => setZoomOpen(o => !o)}
              style={{
                width: "100%", textAlign: "left", background: "none", border: "none",
                padding: "1rem 1.25rem", cursor: "pointer", fontFamily: SANS,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", color: GOLD, textTransform: "uppercase", fontFamily: SANS, marginBottom: 4 }}>
                  Leader Zoom Training
                </div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: NAVY, fontFamily: SANS, marginBottom: zoom.sub ? 2 : 0 }}>
                  {zoom.main}
                </div>
                {zoom.sub && (
                  <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>{zoom.sub}</div>
                )}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: zoomOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginLeft: 12 }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {zoomOpen && (
              <div style={{ padding: "0 1.25rem 1.25rem" }}>
                <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.7, marginBottom: "1rem" }}>
                  Training materials alone are not enough. The zoom call is where we bring everything together — in practice, as a team.
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1rem" }}>
                  {[
                    { title: "Case scenarios", body: "We will walk through real situations you are likely to face during the conference and practice how to respond." },
                    { title: "Getting to know each other", body: "You will meet your fellow leaders before the event. Arriving knowing each other makes everything easier." },
                    { title: "Deeper preparation", body: "We will go beyond the handbook — talking through what it actually feels like to lead, and how to stay grounded when things get hard." },
                    { title: "God's word", body: "Our speaker will open the scripture with us. This is not just a training session — it is a time of spiritual preparation together." },
                    { title: "Coordinator testimonies", body: "Our coordinators will share from their own experience — what they have learned from leading, and practical insights on each section of the handbook." },
                    { title: "Open Q&A", body: "Anything on your mind — bring it. This is a space to ask, talk, and be heard before the conference begins." },
                  ].map(({ title, body }) => (
                    <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: ORANGE, flexShrink: 0, marginTop: 6 }} />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: NAVY, fontFamily: SANS }}>{title}</div>
                        <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>{body}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: NAVY, borderRadius: 10, padding: "0.75rem 1rem" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: GOLD, fontFamily: SANS, marginBottom: 3 }}>
                    Mandatory for all team leaders
                  </div>
                  <div style={{ fontSize: "12px", color: "#B8C0D0", fontFamily: SANS, lineHeight: 1.6 }}>
                    Mark the last checklist item once you have attended. Your coordinator will also confirm attendance.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
