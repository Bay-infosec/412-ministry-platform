import { useState } from "react";
import { TSEC, BORDER, SANS, BG } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, SectionLabel } from "../../components/ui/index.js";
import { EventsBrowser, TYPE_LABELS } from "../events/index.js";
import { CHECKLIST_ITEMS } from "../../lib/checklist.js";

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

function ViewDropdown({ view, onChange, enrolledEvents }) {
  const options = [
    { key: "browse", label: "All Events" },
    ...enrolledEvents,
    { key: "past", label: "Past Events" },
  ];
  return (
    <div style={{ position: "relative" }}>
      <select
        value={view}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          appearance: "none", WebkitAppearance: "none",
          background: "#fff", border: "1px solid #E5E5E5",
          borderRadius: 12, padding: "13px 44px 13px 16px",
          fontSize: "15px", fontWeight: 700, color: "#1B2A4A",
          fontFamily: SANS, cursor: "pointer", outline: "none",
        }}
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>
      <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

function PastEvents({ history }) {
  const past = (history || []).filter((h) => h.events?.status === "archived");

  if (past.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 900, color: "#1B2A4A", marginBottom: 8 }}>No past events yet</div>
        <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS }}>Archived events you've taken part in will appear here.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {past.map((h) => (
        <div key={h.id} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1rem 1.25rem", opacity: 0.72 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.375rem" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.12em", color: "#FF4D00", textTransform: "uppercase" }}>
              {TYPE_LABELS[h.events.type] || "Event"}
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#F3F4F6", color: "#6B7280" }}>
              Past
            </span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: "16px", fontWeight: 800, color: "#1B2A4A" }}>{h.events.name}</div>
          {h.events.dates && <div style={{ fontSize: "12px", color: TSEC, marginTop: 2 }}>{h.events.dates}</div>}
          {h.team_number && (
            <div style={{ fontSize: "12px", color: TSEC, marginTop: 2 }}>
              Team {h.team_number}{h.event_role ? ` · ${h.event_role}` : ""}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function EventHome({ data, initialEventId, onOpenPage, onNavigate, onOpenAdmin }) {
  const { activeEvent, eventMember, profile, isAdmin, history, eventChecklist } = data;

  // Build enrolled event options from history (non-archived), sorted by start date
  function parseEventStart(startDate, datesStr) {
    if (startDate) {
      const parsed = new Date(`${startDate}T00:00:00`);
      if (!isNaN(parsed)) return parsed;
    }
    if (!datesStr) return new Date(9999, 0, 1);
    const m1 = datesStr.match(/([A-Za-z]+ \d+)[–\-]\d+,?\s*(\d{4})/);
    const m2 = datesStr.match(/([A-Za-z]+ \d+,\s*\d{4})/);
    const parsed = m1 ? new Date(`${m1[1]}, ${m1[2]}`) : m2 ? new Date(m2[1]) : null;
    return parsed && !isNaN(parsed) ? parsed : new Date(9999, 0, 1);
  }

  const enrolledEvents = [];
  const seen = new Set();
  for (const h of (history || [])) {
    if (h.events && h.events.status !== "archived" && !seen.has(h.event_id)) {
      seen.add(h.event_id);
      enrolledEvents.push({ key: `evt_${h.event_id}`, label: h.events.name, eventId: h.event_id, dates: h.events.dates, startDate: h.events.start_date });
    }
  }
  enrolledEvents.sort((a, b) => parseEventStart(a.startDate, a.dates) - parseEventStart(b.startDate, b.dates));

  const savedEventView = localStorage.getItem("event_default_view");
  const validViews = new Set(["browse", "past", ...enrolledEvents.map((event) => event.key)]);
  const hasValidSavedView = validViews.has(savedEventView);
  const requestedEventView = initialEventId ? `evt_${initialEventId}` : null;
  const initialEventView = validViews.has(requestedEventView)
    ? requestedEventView
    : hasValidSavedView
    ? savedEventView
    : enrolledEvents[0]?.key || "browse";
  const [view, setView] = useState(initialEventView);
  const [pinnedView, setPinnedView] = useState(hasValidSavedView ? savedEventView : null);

  function pinCurrentView() {
    localStorage.setItem("event_default_view", view);
    setPinnedView(view);
  }

  // Resolve which activeEvent data to show for the selected view
  const viewEventId = view.startsWith("evt_") ? view.slice(4) : null;
  const viewEvent = viewEventId
    ? (viewEventId === activeEvent?.id
        ? activeEvent
        : (history || []).find((h) => h.event_id === viewEventId)?.events || null)
    : null;
  const showMine = !!viewEvent;

  const isCoordinator = eventMember?.event_role === "coordinator" || isAdmin;
  const days = viewEvent ? daysUntil(viewEvent.dates) : null;

  // Checklist + onboarding progress (for onboarding card)
  const checklistItems = eventChecklist?.items || {};
  const checklistDone = CHECKLIST_ITEMS.filter((i) => checklistItems[i.id]).length;
  const onboardingStep = eventMember?.onboarding_step ?? 0;
  const onboardingComplete = eventMember?.onboarding_completed;
  const TOTAL_STEPS = 6;

  const CONFERENCE_TYPES = ["youth_conference", "annual_conference", "conference"];
  const isConference = CONFERENCE_TYPES.includes(viewEvent?.type);

  const sections = [];
  if (isConference) {
    sections.push(
      { id: "myteam",       label: "My Team",       desc: eventMember?.team_number ? `Team ${eventMember.team_number} · checklist inside` : "Team assignment & checklist" },
      { id: "prayer_chain", label: "Prayer Chain",  desc: "Pray for one another" },
      { id: "the_four",     label: "The Four",       desc: "Your four essentials" },
      { id: "field_guide",  label: "Field Guide",    desc: "Resources and references" },
    );
    if (isCoordinator) {
      sections.push({ id: "coordinator", label: "Coordinator Dashboard", desc: "Overview of teams you oversee" });
    }
  }

  const zoom = viewEvent?.zoom_training_dates ? splitZoomDisplay(viewEvent.zoom_training_dates) : null;
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <Shell withNav>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
        <div style={{ flex: 1 }}>
          <ViewDropdown view={view} onChange={setView} enrolledEvents={enrolledEvents} />
        </div>
        <button
          onClick={pinCurrentView}
          title={view === pinnedView ? "This is your default event page" : "Open this page first next time"}
          aria-label={view === pinnedView ? "Current default event page" : "Set as default event page"}
          style={{
            flexShrink: 0, width: 44, height: 44, borderRadius: 12,
            border: view === pinnedView ? "none" : `1px solid ${BORDER}`,
            background: view === pinnedView ? "#FF4D00" : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill={view === pinnedView ? "#fff" : "none"} stroke={view === pinnedView ? "#fff" : TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </button>
      </div>

      {view === "browse" && (
        <EventsBrowser
          data={data}
          onRefresh={onNavigate ? () => onNavigate("event") : undefined}
          onViewEnrolled={(eventId) => setView(`evt_${eventId}`)}
        />
      )}

      {view === "past" && <PastEvents history={history} />}

      {view.startsWith("evt_") && !viewEvent && (
        <div style={{ fontFamily: SANS, fontSize: "14px", color: TSEC, textAlign: "center", marginTop: "4rem" }}>
          Full details not available for this event.
        </div>
      )}

      {showMine && (
        <>

      {/* Event header card */}
      <div style={{ background: "#1B2A4A", borderRadius: 18, padding: "1.25rem 1.5rem", marginBottom: "1rem", fontFamily: SANS }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
          <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.14em", color: "#FF4D00", textTransform: "uppercase" }}>
            Your Event · Active
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: "0.25rem" }}>
              {viewEvent.name}
            </div>
            {viewEvent.dates && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)" }}>{viewEvent.dates}</div>}
            {viewEvent.location && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)" }}>{viewEvent.location}</div>}
          </div>
          {days !== null && days >= 0 && (
            <div style={{ textAlign: "center", flexShrink: 0, marginLeft: 16 }}>
              {days === 0 ? (
                <div style={{ fontSize: "18px", fontWeight: 900, color: "#FF4D00" }}>It's here!</div>
              ) : (
                <>
                  <div style={{ fontSize: "42px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{days}</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)", fontWeight: 700, letterSpacing: "0.06em" }}>{days === 1 ? "DAY" : "DAYS"}</div>
                </>
              )}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, marginBottom: viewEvent.verse_text ? 10 : 0 }}>
          {viewEvent.fee && (
            <span style={{ background: "#FF4D00", color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: "10px", fontWeight: 800 }}>
              Fee: {viewEvent.fee}
            </span>
          )}
          {viewEvent.registration_url && (
            <a
              href={viewEvent.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: "#2A3D63", color: "#FF4D00", borderRadius: 8, padding: "4px 10px", fontSize: "10px", fontWeight: 800, textDecoration: "none" }}
            >
              Register →
            </a>
          )}
        </div>
        {viewEvent.verse_text && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.75rem" }}>
            <div style={{ fontSize: "13px", color: "#FFF5F0", lineHeight: 1.65, fontStyle: "italic", marginBottom: "0.25rem" }}>
              "{viewEvent.verse_text}"
            </div>
            <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.1em", color: "#FF4D00", textTransform: "uppercase" }}>
              {viewEvent.verse}
            </div>
          </div>
        )}
      </div>

      {/* Onboarding — directly below event information */}
      {eventMember && viewEventId === activeEvent?.id && (
        <div style={{ background: "#FF4D00", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
            <div>
              <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.14em", color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontFamily: SANS, marginBottom: 3 }}>
                Team Leader Onboarding
              </div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", fontFamily: SANS }}>
                {onboardingComplete ? "Onboarding complete" : `Step ${Math.min(onboardingStep + 1, TOTAL_STEPS)} of ${TOTAL_STEPS}`}
              </div>
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", fontFamily: SANS }}>
              {checklistDone}/{CHECKLIST_ITEMS.length} checklist
            </div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 6, height: 5, marginBottom: "0.875rem", overflow: "hidden" }}>
            <div style={{ background: "#fff", height: "100%", borderRadius: 6, width: onboardingComplete ? "100%" : `${Math.min((onboardingStep / TOTAL_STEPS) * 100, 100)}%`, transition: "width 0.3s" }} />
          </div>
          <button
            onClick={() => onOpenPage("onboarding")}
            style={{ width: "100%", background: "#fff", color: "#FF4D00", border: "none", borderRadius: 10, padding: "10px 0", fontSize: "13px", fontWeight: 800, cursor: "pointer", fontFamily: SANS }}
          >
            Start Onboarding →
          </button>
        </div>
      )}

      {/* Sections — conference only */}
      {sections.length > 0 && <SectionLabel>Sections</SectionLabel>}
      {sections.length === 0 && !zoom && (
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1.5rem", marginBottom: "1rem", textAlign: "center" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1B2A4A", fontFamily: SANS, marginBottom: 4 }}>More details coming soon</div>
          <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>Materials and resources for this event will appear here once published by the admin.</div>
        </div>
      )}
      {(sections.length > 0 || zoom) && <Card style={{ padding: 0, overflow: "hidden", marginBottom: "1rem" }}>

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
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS, marginBottom: 4 }}>
                  Leader Zoom Training
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1B2A4A", fontFamily: SANS, marginBottom: zoom.sub ? 2 : 0 }}>
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
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#FF4D00", flexShrink: 0, marginTop: 6 }} />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#1B2A4A", fontFamily: SANS }}>{title}</div>
                        <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>{body}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#1B2A4A", borderRadius: 10, padding: "0.75rem 1rem" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#FF4D00", fontFamily: SANS, marginBottom: 3 }}>
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
              border: "none", borderBottom: `1px solid ${BORDER}`,
              padding: "1rem 1.25rem", cursor: "pointer", fontFamily: SANS,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#1B2A4A" }}>{s.label}</div>
              <div style={{ fontSize: "12px", color: TSEC, marginTop: 2 }}>{s.desc}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ))}

      </Card>}
        </>
      )}
    </Shell>
  );
}
