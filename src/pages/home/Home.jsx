import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { TSEC, BORDER, BG, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { SectionLabel } from "../../components/ui/index.js";
import { DailyVerse, ContactForm } from "../../components/shared/index.js";
import { CHECKLIST_ITEMS } from "../../lib/checklist.js";

// ── Prayer chain helpers (mirrors PrayerChain.jsx) ────────────────────────────
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

function fmtDate(d) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function daysUntil(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / 86400000);
}

// Multi-timezone display for zoom meetings stored as PT time
// e.g. start_date="2026-06-27" + start_time="18:00" → "6:00 PM PT · 7:00 PM MT · 8:00 PM CT · 9:00 PM ET"
function formatZoomTimezones(startDate, startTime) {
  if (!startDate || !startTime) return null;
  const [year, month, day] = startDate.split("-").map(Number);
  const [hour, min] = startTime.split(":").map(Number);
  // June–August in Los Angeles = PDT = UTC−7
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour + 7, min));
  const zones = [
    { tz: "America/Los_Angeles", label: "PT" },
    { tz: "America/Denver",      label: "MT" },
    { tz: "America/Chicago",     label: "CT" },
    { tz: "America/New_York",    label: "ET" },
  ];
  return zones.map(({ tz, label }) => {
    const t = utcDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
    return `${t} ${label}`;
  }).join(" · ");
}

// Parse event.dates string (e.g. "August 5–9, 2026") → days until start
function daysUntilEvent(dateStr) {
  if (!dateStr) return null;
  const m1 = dateStr.match(/([A-Za-z]+ \d+)[–\-]\d+,?\s*(\d{4})/);
  const m2 = dateStr.match(/([A-Za-z]+ \d+,\s*\d{4})/);
  const parsed = m1 ? new Date(`${m1[1]}, ${m1[2]}`) : m2 ? new Date(m2[1]) : null;
  if (!parsed || isNaN(parsed)) return null;
  return Math.ceil((parsed - new Date()) / 86400000);
}

// Split "June 27 — 6:00 PM PT · 7:00 PM MT · 8:00 PM CT · 9:00 PM ET"
// into main = "June 27 — 6:00 PM PT" and sub = "7:00 PM MT · 8:00 PM CT · 9:00 PM ET"
function splitZoomDisplay(zoomStr) {
  if (!zoomStr) return { main: zoomStr, sub: null };
  const parts = zoomStr.split("·").map((s) => s.trim());
  if (parts.length <= 1) return { main: zoomStr, sub: null };
  return { main: parts[0], sub: parts.slice(1).join(" · ") };
}

function TileChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: 12 }}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Home({
  data, onNavigate, onOpenChat, onOpenOnboarding, onOpenMyTeam, onOpenUpdates, onOpenEventPage, chatUnread, onlineUsers,
}) {
  const { profile, eventMember, eventChecklist, announcements, unreadCount, activeEvent, trainingMaterials } = data;

  const othersOnline = (onlineUsers || []).filter((u) => u.user_id !== profile.id);
  const displayName = profile.nickname || (profile.full_name || "").split(" ")[0];

  // Dismissals (session-only)
  const [annDismissed, setAnnDismissed] = useState(false);
  const [showContact, setShowContact] = useState(false);

  // Standalone zoom/board meetings (not part of a conference)
  const [meetings, setMeetings] = useState([]);
  useEffect(() => {
    supabase
      .from("events")
      .select("id, name, type, dates, start_date, start_time, location, audience, zoom_url")
      .in("type", ["zoom_meeting", "board_meeting"])
      .neq("status", "archived")
      .order("start_date", { ascending: true, nullsFirst: false })
      .then(({ data: rows }) => setMeetings(rows || []));
  }, []);

  // Coordinator: fetch team leaders' onboarding + checklist progress
  const isCoordinator = eventMember?.event_role === "coordinator";
  const [teamProgress, setTeamProgress] = useState([]);
  useEffect(() => {
    if (!isCoordinator || !activeEvent || !profile?.id) return;
    supabase
      .from("event_members")
      .select("id, team_number, onboarding_completed, onboarding_visited, onboarding_step, event_role, profiles!event_members_profile_id_fkey(full_name, photo_url), event_checklist(items)")
      .eq("event_id", activeEvent.id)
      .eq("coordinator_id", profile.id)
      .neq("event_role", "coordinator")
      .order("team_number")
      .then(({ data: rows }) => setTeamProgress(rows || []));
  }, [isCoordinator, activeEvent?.id, profile?.id]);

  // Checklist stats
  const checklistItems = eventChecklist?.items || {};
  const checklistDone = CHECKLIST_ITEMS.filter((i) => checklistItems[i.id]).length;
  const onboardingStep = eventMember?.onboarding_step ?? 0;
  const onboardingComplete = eventMember?.onboarding_completed;
  const TOTAL_STEPS = 6;

  // Latest announcement
  const latestAnn = (announcements || []).find(() => true);

  // Next prayer date for this team
  const nextPrayer = getNextPrayerDate(eventMember?.team_number);

  // Upcoming meeting (first one)
  const nextMeeting = meetings[0] || null;

  return (
    <Shell withNav>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.14em", color: "#999999", textTransform: "uppercase", fontFamily: SANS, marginBottom: 4 }}>
            Good morning
          </div>
          <div style={{ fontFamily: SANS, fontSize: "36px", fontWeight: 900, color: "#111111", lineHeight: 1.1, letterSpacing: "-0.04em" }}>
            {displayName}
          </div>
        </div>
        {/* Chat button */}
        <button
          onClick={onOpenChat}
          style={{ position: "relative", width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "1px solid #E5E5E5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 4 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {chatUnread && (
            <div style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: "#E53E3E" }} />
          )}
        </button>
      </div>

      {/* ── Announcement ───────────────────────────────────────────── */}
      {latestAnn && !annDismissed && (
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <button
            onClick={onOpenUpdates}
            style={{
              width: "100%", textAlign: "left", background: "#EEF2FC",
              borderRadius: 14, padding: "1rem 1.25rem", paddingRight: "2.75rem",
              border: "none", cursor: "pointer", fontFamily: SANS,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "#1A4FBF", textTransform: "uppercase" }}>
                Announcement
              </div>
              {unreadCount > 0 && (
                <div style={{ background: "#E53E3E", color: "#fff", fontSize: "10px", fontWeight: 700, borderRadius: 99, padding: "2px 7px" }}>
                  {unreadCount} new
                </div>
              )}
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1A3080", marginBottom: 3 }}>{latestAnn.title}</div>
            <div style={{
              fontSize: "13px", color: "#1A3080", lineHeight: 1.5, opacity: 0.8,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {latestAnn.body}
            </div>
          </button>
          <button
            onClick={() => setAnnDismissed(true)}
            style={{
              position: "absolute", top: 10, right: 10,
              background: "rgba(26,79,191,0.12)", border: "none", borderRadius: "50%",
              width: 24, height: 24, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#1A4FBF", fontSize: "16px", lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Bible verse ─────────────────────────────────────────────── */}
      <DailyVerse />

      {/* ── Onboarding invitation (all leaders) ────────────────────── */}
      {eventMember && (
        <div style={{
          background: "#FFF5F0", border: "1px solid #FFD5C0", borderRadius: 16, padding: "1.25rem 1.5rem",
          marginBottom: "1rem",
        }}>
          <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.14em", color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS, marginBottom: 4 }}>
            Onboarding Invitation
          </div>
          <div style={{ fontFamily: SANS, fontSize: "14px", color: "#666666", lineHeight: 1.5, marginBottom: 12 }}>
            Walk through your orientation steps and complete your pre-conference checklist before {activeEvent?.name || "the conference"}.
          </div>

          {/* Onboarding step progress */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#111111", fontFamily: SANS }}>
                Onboarding
              </span>
              <span style={{ fontSize: "11px", color: "#999999", fontFamily: SANS }}>
                {onboardingComplete ? "Complete ✓" : `Step ${Math.min(onboardingStep + 1, TOTAL_STEPS)} of ${TOTAL_STEPS}`}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,77,0,0.12)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: "#FF4D00",
                width: onboardingComplete ? "100%" : `${Math.round((onboardingStep / TOTAL_STEPS) * 100)}%`,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>

          {/* Checklist progress */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#111111", fontFamily: SANS }}>
                Pre-Conference Checklist
              </span>
              <span style={{ fontSize: "11px", color: "#999999", fontFamily: SANS }}>
                {checklistDone} / {CHECKLIST_ITEMS.length}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,77,0,0.12)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: "#FF4D00",
                width: `${Math.round((checklistDone / CHECKLIST_ITEMS.length) * 100)}%`,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onOpenMyTeam}
              style={{
                flex: 1, background: "rgba(255,77,0,0.1)", color: "#FF4D00", border: "none",
                borderRadius: 10, padding: "11px", fontSize: "13px", fontWeight: 600,
                fontFamily: SANS, cursor: "pointer",
              }}
            >
              View Checklist
            </button>
            <button
              onClick={onOpenOnboarding}
              style={{
                flex: 1, background: "#FF4D00", color: "#fff", border: "none",
                borderRadius: 10, padding: "11px", fontSize: "13px", fontWeight: 700,
                fontFamily: SANS, cursor: "pointer",
              }}
            >
              {onboardingStep > 0 && !onboardingComplete ? "Continue →" : "Start →"}
            </button>
          </div>
        </div>
      )}

      {/* ── Active event card (same style as Event tab) ─────────────── */}
      {activeEvent && (
        <div style={{ background: "#111111", borderRadius: 18, padding: "1.25rem 1.5rem", marginBottom: "1rem", fontFamily: SANS }}>
          <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.14em", color: "#FF4D00", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Your Event · Active
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: "0.25rem" }}>
                {activeEvent.name}
              </div>
              {activeEvent.dates && <div style={{ fontSize: "11px", color: "#555555" }}>{activeEvent.dates}</div>}
              {activeEvent.location && <div style={{ fontSize: "11px", color: "#555555" }}>{activeEvent.location}</div>}
            </div>
            {(() => {
              const d = daysUntilEvent(activeEvent.dates);
              return d !== null && d >= 0 ? (
                <div style={{ textAlign: "center", flexShrink: 0, marginLeft: 16 }}>
                  {d === 0 ? (
                    <div style={{ fontSize: "18px", fontWeight: 900, color: "#FF4D00" }}>It's here!</div>
                  ) : (
                    <>
                      <div style={{ fontSize: "42px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{d}</div>
                      <div style={{ fontSize: "10px", color: "#555555", fontWeight: 700, letterSpacing: "0.06em" }}>{d === 1 ? "DAY" : "DAYS"}</div>
                    </>
                  )}
                </div>
              ) : null;
            })()}
          </div>
          {/* Pills row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, marginBottom: activeEvent.verse_text ? 10 : 0 }}>
            {activeEvent.fee && (
              <span style={{ background: "#FF4D00", color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: "10px", fontWeight: 800 }}>
                Fee: {activeEvent.fee}
              </span>
            )}
            {activeEvent.registration_url && (
              <a
                href={activeEvent.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: "#222222", color: "#FF4D00", borderRadius: 8, padding: "4px 10px", fontSize: "10px", fontWeight: 800, textDecoration: "none" }}
              >
                Register →
              </a>
            )}
          </div>
          {activeEvent.verse_text && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.75rem" }}>
              <div style={{ fontSize: "13px", color: "#FFF5F0", lineHeight: 1.65, fontStyle: "italic", marginBottom: "0.25rem" }}>
                "{activeEvent.verse_text}"
              </div>
              <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.1em", color: "#FF4D00", textTransform: "uppercase" }}>
                {activeEvent.verse}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Upcoming ───────────────────────────────────────────────── */}
      {(nextPrayer || activeEvent?.zoom_training_dates || nextMeeting) && (
        <div style={{ marginBottom: "1rem" }}>
          <SectionLabel>Upcoming</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>

            {/* Prayer countdown */}
            {nextPrayer && (() => {
              const days = daysUntil(nextPrayer);
              const isToday = days === 0;
              return (
                <button
                  onClick={() => onOpenEventPage?.("prayer_chain")}
                  style={{
                    width: "100%", textAlign: "left", cursor: "pointer", fontFamily: SANS,
                    background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
                    padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", color: "#999999", textTransform: "uppercase", fontFamily: SANS, marginBottom: 4 }}>
                      Your Team Prayer Day
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#111111", fontFamily: SANS }}>
                      {fmtDate(nextPrayer)}
                    </div>
                    <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>
                      Team {eventMember?.team_number}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ textAlign: "right" }}>
                      {isToday ? (
                        <div style={{ fontFamily: SANS, fontSize: "18px", fontWeight: 900, color: "#FF4D00" }}>Today!</div>
                      ) : (
                        <>
                          <div style={{ fontFamily: SANS, fontSize: "32px", fontWeight: 900, color: "#111111", lineHeight: 1 }}>{days}</div>
                          <div style={{ fontSize: "10px", color: TSEC, fontWeight: 600, letterSpacing: "0.08em", fontFamily: SANS }}>{days === 1 ? "DAY" : "DAYS"}</div>
                        </>
                      )}
                    </div>
                    <TileChevron />
                  </div>
                </button>
              );
            })()}

            {/* Zoom training */}
            {activeEvent?.zoom_training_dates && (() => {
              const { main, sub } = splitZoomDisplay(activeEvent.zoom_training_dates);
              return (
                <button
                  onClick={() => onOpenEventPage?.(null)}
                  style={{
                    width: "100%", textAlign: "left", cursor: "pointer", fontFamily: SANS,
                    background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
                    padding: "1rem 1.25rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", color: TSEC, textTransform: "uppercase", fontFamily: SANS, marginBottom: 4 }}>
                      Leader Zoom Training
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#111111", fontFamily: SANS, marginBottom: 2 }}>
                      {main}
                    </div>
                    {sub && <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginBottom: 2 }}>{sub}</div>}
                    <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>
                      Mandatory for all team leaders
                    </div>
                  </div>
                  <TileChevron />
                </button>
              );
            })()}

            {/* Standalone meeting */}
            {nextMeeting && (() => {
              const Tag = nextMeeting.zoom_url ? "a" : "button";
              const tagProps = nextMeeting.zoom_url
                ? { href: nextMeeting.zoom_url, target: "_blank", rel: "noopener noreferrer" }
                : { onClick: () => onNavigate?.("event") };
              return (
                <Tag
                  {...tagProps}
                  style={{
                    width: "100%", textAlign: "left", cursor: "pointer", fontFamily: SANS, textDecoration: "none",
                    background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
                    padding: "1rem 1.25rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", color: TSEC, textTransform: "uppercase", fontFamily: SANS, marginBottom: 4 }}>
                      {nextMeeting.type === "zoom_meeting" ? "Zoom Meeting" : "Meeting"}
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#111111", fontFamily: SANS, marginBottom: 2 }}>
                      {nextMeeting.name}
                    </div>
                    {(nextMeeting.dates || nextMeeting.location) && (
                      <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>
                        {[nextMeeting.dates, nextMeeting.location].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    {nextMeeting.zoom_url && (
                      <div style={{ fontSize: "12px", color: "#FF4D00", fontFamily: SANS, fontWeight: 600, marginTop: 4 }}>
                        Join Zoom →
                      </div>
                    )}
                  </div>
                  <TileChevron />
                </Tag>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Coordinator Dashboard ───────────────────────────────────── */}
      {isCoordinator && teamProgress.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <SectionLabel>Coordinator Dashboard</SectionLabel>
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            {teamProgress.map((m, i) => {
              const opened = m.onboarding_visited === true || m.onboarding_completed === true;
              const clItems = m.event_checklist?.[0]?.items || {};
              const checkedCount = CHECKLIST_ITEMS.filter((item) => !!clItems[item.id]).length;
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "0.875rem 1.25rem",
                    borderBottom: i < teamProgress.length - 1 ? `1px solid ${BORDER}` : "none",
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: "#FAFAFA", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${BORDER}`,
                  }}>
                    {m.profiles?.photo_url
                      ? <img src={m.profiles.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontFamily: SANS, fontSize: 14, color: "#999999" }}>{m.profiles?.full_name?.charAt(0)}</span>}
                  </div>

                  {/* Name + team number */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111111", fontFamily: SANS }}>
                      {m.profiles?.full_name}
                    </div>
                    <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginTop: 1 }}>
                      Team {m.team_number}
                    </div>
                  </div>

                  {/* Progress dots + status label on the right */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    {!opened ? (
                      <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS }}>Not started</div>
                    ) : (
                      <>
                        <div style={{ fontSize: "11px", color: checkedCount === CHECKLIST_ITEMS.length ? "#FF4D00" : "#999999", fontFamily: SANS, fontWeight: checkedCount === CHECKLIST_ITEMS.length ? 600 : 400 }}>
                          {checkedCount === CHECKLIST_ITEMS.length ? "Complete ✓" : `${checkedCount} / ${CHECKLIST_ITEMS.length} done`}
                        </div>
                        <div style={{ display: "flex", gap: 5 }}>
                          {CHECKLIST_ITEMS.map((item) => {
                            const checked = !!clItems[item.id];
                            return (
                              <div key={item.id} style={{
                                width: 10, height: 10, borderRadius: "50%",
                                background: checked ? "#FF4D00" : "#E5E5E5", flexShrink: 0,
                              }} />
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Training Materials ─────────────────────────────────────── */}
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
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: "#FAFAFA", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#111111", fontFamily: SANS }}>{mat.title}</div>
                  {mat.body && (
                    <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {mat.body}
                    </div>
                  )}
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

      {/* ── Contact ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setShowContact(true)}
        style={{
          width: "100%", background: "#111111", border: "none",
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
          <div style={{ fontSize: "12px", color: "#999999", marginTop: 2 }}>Send a message to the 412 team</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {showContact && <ContactForm profile={profile} onClose={() => setShowContact(false)} />}
    </Shell>
  );
}

