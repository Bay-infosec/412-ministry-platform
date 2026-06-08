import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { TSEC, BORDER, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { SectionLabel } from "../../components/ui/index.js";
import { DailyVerse, ContactForm } from "../../components/shared/index.js";
import { CHECKLIST_ITEMS } from "../../lib/checklist.js";

const TYPE_LABELS = {
  conference:        "Conference",
  youth_conference:  "Youth Conference",
  annual_conference: "Annual Conference",
  openmic:           "Open Mic",
  open_mic:          "Open Mic",
  mission:           "Mission Trip",
  zoom_meeting:      "Zoom Meeting",
  board_meeting:     "Board Meeting",
  other:             "Event",
};

// ── Prayer chain helpers ──────────────────────────────────────────────────────
const CHAIN_START = new Date("2026-07-10");
const NUM_TEAMS = 12;

function getNextPrayerDate(teamNumber) {
  if (!teamNumber) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const offset = teamNumber - 1;
  const d1 = new Date(CHAIN_START); d1.setDate(d1.getDate() + offset);
  const d2 = new Date(CHAIN_START); d2.setDate(d2.getDate() + offset + NUM_TEAMS);
  if (d1 >= today) return d1;
  if (d2 >= today) return d2;
  return null;
}

function fmtShort(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntilMs(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / 86400000);
}

function daysUntilDate(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr + "T00:00:00");
  if (isNaN(d)) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / 86400000);
}

function daysUntilEvent(dateStr) {
  if (!dateStr) return null;
  const m1 = dateStr.match(/([A-Za-z]+ \d+)[–\-]\d+,?\s*(\d{4})/);
  const m2 = dateStr.match(/([A-Za-z]+ \d+,\s*\d{4})/);
  const parsed = m1 ? new Date(`${m1[1]}, ${m1[2]}`) : m2 ? new Date(m2[1]) : null;
  if (!parsed || isNaN(parsed)) return null;
  return Math.ceil((parsed - new Date()) / 86400000);
}

function splitZoomDisplay(zoomStr) {
  if (!zoomStr) return { main: zoomStr, sub: null };
  const parts = zoomStr.split("·").map((s) => s.trim());
  if (parts.length <= 1) return { main: zoomStr, sub: null };
  return { main: parts[0], sub: parts.slice(1).join(" · ") };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HScroll({ children }) {
  return (
    <div style={{
      display: "flex",
      overflowX: "auto",
      gap: 10,
      margin: "0 -16px",
      padding: "2px 16px 12px",
      scrollbarWidth: "none",
      WebkitOverflowScrolling: "touch",
      msOverflowStyle: "none",
    }}>
      {children}
      {/* Trailing spacer so last card doesn't clip */}
      <div style={{ minWidth: 4, flexShrink: 0 }} />
    </div>
  );
}

function EventCard({ ev, onClick }) {
  const days = ev.start_date ? daysUntilDate(ev.start_date) : daysUntilEvent(ev.dates);
  return (
    <button
      onClick={onClick}
      style={{
        minWidth: 185, maxWidth: 185,
        background: "#1B2A4A",
        border: "none",
        borderRadius: 16, padding: "13px 14px",
        display: "flex", flexDirection: "column", gap: 6,
        cursor: "pointer", textAlign: "left", flexShrink: 0,
        boxShadow: "0 2px 10px rgba(27,42,74,0.2)",
      }}
    >
      <div>
        <span style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FF4D00" }}>
          {TYPE_LABELS[ev.type] || "Event"}
        </span>
      </div>
      <div style={{ fontSize: "15px", fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
        {ev.name}
      </div>
      {ev.dates && (
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
          {ev.dates}
        </div>
      )}
      {ev.location && (
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
          {ev.location}
        </div>
      )}
      {days !== null && days >= 0 && (
        <div style={{ marginTop: 2, fontSize: "11px", fontWeight: 700, color: "#FF4D00" }}>
          {days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `In ${days} days`}
        </div>
      )}
    </button>
  );
}

function UpcomingCard({ label, title, sub, onClick, tag }) {
  return (
    <button
      onClick={onClick}
      style={{
        minWidth: 170, maxWidth: 170,
        background: "#fff", border: "1px solid #E5E5E5",
        borderRadius: 14, padding: "13px 14px",
        display: "flex", flexDirection: "column", gap: 6,
        cursor: "pointer", textAlign: "left", flexShrink: 0,
      }}
    >
      <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.12em", color: "#FF4D00", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: "14px", fontWeight: 800, color: "#1B2A4A", lineHeight: 1.25 }}>
        {title}
      </div>
      {sub && (
        <div style={{ fontSize: "11px", color: "#999", lineHeight: 1.4 }}>
          {sub}
        </div>
      )}
      {tag && (
        <div style={{ marginTop: "auto", fontSize: "9px", fontWeight: 700, background: "#1B2A4A", color: "#fff", borderRadius: 6, padding: "2px 7px", alignSelf: "flex-start" }}>
          {tag}
        </div>
      )}
    </button>
  );
}

function MemberCard({ m, onPress }) {
  const opened = m.onboarding_visited || m.onboarding_completed;
  const clItems = m.event_checklist?.[0]?.items || {};
  const fullName = m.profiles?.full_name || "";
  const parts = fullName.trim().split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";

  // 4 progress stages: started onboarding / finished onboarding / started checklist / finished checklist
  const doneCount = CHECKLIST_ITEMS.filter((i) => !!clItems[i.id]).length;
  const stages = [
    !!opened,
    !!m.onboarding_completed,
    doneCount > 0,
    doneCount >= CHECKLIST_ITEMS.length,
  ];

  return (
    <button onClick={onPress} style={{ minWidth: 78, maxWidth: 78, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#FF4D00", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {m.profiles?.photo_url
          ? <img src={m.profiles.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: "18px", fontWeight: 900, color: "#fff", fontFamily: SANS }}>{firstName[0] || "?"}</span>}
      </div>
      <div style={{ textAlign: "center", width: "100%" }}>
        <div style={{ fontSize: "12px", fontWeight: 800, color: "#1B2A4A", lineHeight: 1.1, fontFamily: SANS, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {firstName}
        </div>
        <div style={{ fontSize: "10px", color: "#999", lineHeight: 1.1, fontFamily: SANS, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {lastName}
        </div>
      </div>
      <div style={{ fontSize: "9px", fontWeight: 800, color: "#FF4D00", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: SANS }}>
        T{m.team_number}
      </div>
      {!opened ? (
        <div style={{ fontSize: "8px", fontWeight: 700, color: "#bbb", letterSpacing: "0.04em", fontFamily: SANS, textAlign: "center", lineHeight: 1.2 }}>
          NOT<br />STARTED
        </div>
      ) : (
        <div style={{ display: "flex", gap: 3 }}>
          {stages.map((done, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: done ? "#FF4D00" : "#E5E5E5" }} />
          ))}
        </div>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Home({
  data, onNavigate, onOpenChat, onOpenOnboarding, onOpenMyTeam, onOpenUpdates, onOpenEventPage, chatUnread, readIds, onMarkRead, onViewProfile,
}) {
  const {
    profile, eventMember, eventChecklist, announcements, unreadCount,
    activeEvent, trainingMaterials, publicEvents = [], history = [],
  } = data;

  const displayName = profile.nickname || (profile.full_name || "").split(" ")[0];
  const [showContact, setShowContact] = useState(false);

  async function dismissAnnouncement(annId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try { await supabase.from("announcement_reads").insert({ announcement_id: annId, profile_id: user.id }); } catch {}
    onMarkRead?.(annId);
  }

  // Coordinator team progress
  const isCoordinator = eventMember?.event_role === "coordinator";
  const [teamProgress, setTeamProgress] = useState([]);
  useEffect(() => {
    if (!isCoordinator || !activeEvent || !profile?.id) return;
    supabase
      .from("event_members")
      .select("id, profile_id, team_number, onboarding_completed, onboarding_visited, onboarding_step, profiles!event_members_profile_id_fkey(full_name, photo_url), event_checklist(items)")
      .eq("event_id", activeEvent.id)
      .eq("coordinator_id", profile.id)
      .neq("event_role", "coordinator")
      .order("team_number")
      .then(({ data: rows }) => setTeamProgress(rows || []));
  }, [isCoordinator, activeEvent?.id, profile?.id]);

  // Derived data
  const myEventIds = new Set([
    activeEvent?.id,
    ...(history || []).map((h) => h.event_id),
  ].filter(Boolean));

  const myEvents = (publicEvents || []).filter((ev) => myEventIds.has(ev.id));

  const checklistItems = eventChecklist?.items || {};
  const checklistDone = CHECKLIST_ITEMS.filter((i) => checklistItems[i.id]).length;
  const onboardingStep = eventMember?.onboarding_step ?? 0;
  const onboardingComplete = eventMember?.onboarding_completed;
  const TOTAL_STEPS = 6;

  const latestAnn = (announcements || []).find(() => true);
  const nextPrayer = getNextPrayerDate(eventMember?.team_number);
  const hasUpcomingTasks = nextPrayer || activeEvent?.zoom_training_dates;

  return (
    <Shell withNav>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontFamily: SANS, fontSize: "22px", fontWeight: 900, letterSpacing: "-0.02em", color: "#1B2A4A", lineHeight: 1, marginBottom: "0.875rem" }}>
          412 <span style={{ color: "#FF4D00" }}>Ministry</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.14em", color: "#6B7280", textTransform: "uppercase", fontFamily: SANS, marginBottom: 4 }}>
              Good morning
            </div>
            <div style={{ fontFamily: SANS, fontSize: "36px", fontWeight: 900, color: "#1B2A4A", lineHeight: 1.1, letterSpacing: "-0.04em" }}>
              {displayName}
            </div>
          </div>
          <button
            onClick={onOpenChat}
            style={{
              position: "relative", display: "flex", alignItems: "center", gap: 6,
              background: "#FF4D00", border: "none", borderRadius: 99,
              padding: "9px 14px 9px 11px", cursor: "pointer", flexShrink: 0, marginBottom: 4,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span style={{ fontFamily: SANS, fontSize: "13px", fontWeight: 800, color: "#fff" }}>Chat</span>
            {chatUnread && (
              <div style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#E53E3E", border: "2px solid #FF4D00" }} />
            )}
          </button>
        </div>
      </div>

      {/* ── Announcement banner ─────────────────────────────────────── */}
      {latestAnn && !(readIds || []).includes(latestAnn.id) && (
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <button
            onClick={onOpenUpdates}
            style={{
              width: "100%", textAlign: "left",
              background: "#fff", borderRadius: 14, padding: "1rem 1.25rem", paddingRight: "2.75rem",
              border: "none", borderLeft: "3px solid #FF4D00",
              cursor: "pointer", fontFamily: SANS,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.1em", color: "#FF4D00", textTransform: "uppercase" }}>
                Announcement
              </div>
              {unreadCount > 0 && (
                <div style={{ background: "#E53E3E", color: "#fff", fontSize: "10px", fontWeight: 700, borderRadius: 99, padding: "2px 7px" }}>
                  {unreadCount} new
                </div>
              )}
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1B2A4A", marginBottom: 3 }}>{latestAnn.title}</div>
            <div style={{
              fontSize: "13px", color: "#666", lineHeight: 1.5,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {latestAnn.body}
            </div>
          </button>
          <button
            onClick={() => dismissAnnouncement(latestAnn.id)}
            style={{
              position: "absolute", top: 10, right: 10,
              background: "rgba(0,0,0,0.07)", border: "none", borderRadius: "50%",
              width: 24, height: 24, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#999", fontSize: "16px", lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Daily verse ─────────────────────────────────────────────── */}
      <DailyVerse />

      {/* ── Your Events ─────────────────────────────────────────────── */}
      {myEvents.length > 0 && (
        <div style={{ marginBottom: "0.25rem" }}>
          <SectionLabel>Your Events</SectionLabel>
          <HScroll>
            {myEvents.map((ev) => (
              <EventCard
                key={ev.id}
                ev={ev}
                onClick={() => ev.id === activeEvent?.id ? onNavigate("event") : onNavigate("events")}
              />
            ))}
          </HScroll>
        </div>
      )}

      {/* ── Onboarding progress (compact) ───────────────────────────── */}
      {eventMember && !onboardingComplete && (
        <div style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 14, padding: "0.875rem 1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#1B2A4A", fontFamily: SANS }}>
              Onboarding — Step {Math.min(onboardingStep + 1, TOTAL_STEPS)} of {TOTAL_STEPS}
            </div>
            <div style={{ fontSize: "11px", color: "#FF4D00", fontFamily: SANS, fontWeight: 700 }}>
              {checklistDone}/{CHECKLIST_ITEMS.length} checklist
            </div>
          </div>
          <div style={{ height: 4, borderRadius: 3, background: "#F0F0F0", overflow: "hidden", marginBottom: 10 }}>
            <div style={{
              height: "100%", borderRadius: 3, background: "#FF4D00",
              width: `${Math.round((onboardingStep / TOTAL_STEPS) * 100)}%`,
              transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onOpenMyTeam}
              style={{ flex: 1, background: "#F5F5F5", color: "#FF4D00", border: "none", borderRadius: 10, padding: "9px", fontSize: "12px", fontWeight: 700, fontFamily: SANS, cursor: "pointer" }}
            >
              Checklist
            </button>
            <button
              onClick={onOpenOnboarding}
              style={{ flex: 1, background: "#FF4D00", color: "#fff", border: "none", borderRadius: 10, padding: "9px", fontSize: "12px", fontWeight: 700, fontFamily: SANS, cursor: "pointer" }}
            >
              {onboardingStep > 0 ? "Continue →" : "Start →"}
            </button>
          </div>
        </div>
      )}

      {/* ── Upcoming Tasks ──────────────────────────────────────────── */}
      {hasUpcomingTasks && (
        <div style={{ marginBottom: "0.25rem" }}>
          <SectionLabel>Upcoming Tasks</SectionLabel>
          <HScroll>
            {nextPrayer && (() => {
              const days = daysUntilMs(nextPrayer);
              return (
                <UpcomingCard
                  label="Prayer Day"
                  title={days === 0 ? "Today!" : fmtShort(nextPrayer)}
                  sub={days === 0 ? "Pray for your assigned team" : `In ${days} day${days === 1 ? "" : "s"} · Team ${eventMember?.team_number}`}
                  tag={activeEvent?.name}
                  onClick={() => onOpenEventPage?.("prayer_chain")}
                />
              );
            })()}

            {activeEvent?.zoom_training_dates && (() => {
              const { main, sub } = splitZoomDisplay(activeEvent.zoom_training_dates);
              return (
                <UpcomingCard
                  label="Zoom Training"
                  title={main}
                  sub={sub || "Mandatory for team leaders"}
                  tag={activeEvent?.name}
                  onClick={() => onOpenEventPage?.("zoom_training")}
                />
              );
            })()}

          </HScroll>
        </div>
      )}

      {/* ── Coordinator Dashboard ───────────────────────────────────── */}
      {isCoordinator && teamProgress.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <SectionLabel style={{ marginBottom: 0 }}>Coordinator Dashboard</SectionLabel>
            <button
              onClick={() => onNavigate("event")}
              style={{ fontSize: "11px", color: "#FF4D00", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: SANS, padding: 0 }}
            >
              Full view →
            </button>
          </div>
          <HScroll>
            {teamProgress.map((m) => (
              <MemberCard key={m.id} m={m} onPress={() => onViewProfile?.(m.profile_id)} />
            ))}
          </HScroll>
        </div>
      )}

      {/* ── Training Materials ──────────────────────────────────────── */}
      {(trainingMaterials || []).length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <SectionLabel>Training Materials</SectionLabel>
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            {trainingMaterials.map((mat, i) => (
              <a
                key={mat.id}
                href={mat.external_url || undefined}
                target={mat.external_url ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={!mat.external_url ? (e) => e.preventDefault() : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "0.875rem 1.25rem", textDecoration: "none",
                  borderBottom: i < trainingMaterials.length - 1 ? `1px solid ${BORDER}` : "none",
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#1B2A4A", fontFamily: SANS }}>{mat.title}</div>
                  {mat.body && <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{mat.body}</div>}
                </div>
                {mat.external_url && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Contact ──────────────────────────────────────────────────── */}
      <button
        onClick={() => setShowContact(true)}
        style={{
          width: "100%", background: "#1B2A4A", border: "none",
          borderRadius: 16, padding: "1.25rem 1.5rem", cursor: "pointer",
          fontFamily: SANS, display: "flex", alignItems: "center", gap: 14,
          marginBottom: "0.5rem",
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FF4D00", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>Contact Us</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Send a message to the 412 team</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {showContact && <ContactForm profile={profile} onClose={() => setShowContact(false)} />}
      <div style={{ height: "1rem" }} />
    </Shell>
  );
}
