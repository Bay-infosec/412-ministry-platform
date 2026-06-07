import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SERIF, SANS } from "../../lib/constants.js";
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
  const diff = Math.ceil((d - today) / 86400000);
  return diff;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Home({
  data, onNavigate, onOpenChat, onOpenOnboarding, onOpenMyTeam, onOpenUpdates, chatUnread, onlineUsers,
}) {
  const { profile, eventMember, eventChecklist, announcements, unreadCount, activeEvent } = data;

  const othersOnline = (onlineUsers || []).filter((u) => u.user_id !== profile.id);
  const displayName = profile.nickname || (profile.full_name || "").split(" ")[0];

  // Dismissals (session-only)
  const [annDismissed, setAnnDismissed] = useState(false);
  const [showContact, setShowContact] = useState(false);

  // Upcoming zoom/board meetings
  const [meetings, setMeetings] = useState([]);
  useEffect(() => {
    supabase
      .from("events")
      .select("id, name, type, dates, location, audience")
      .in("type", ["zoom_meeting", "board_meeting"])
      .neq("status", "archived")
      .order("created_at", { ascending: true })
      .then(({ data: rows }) => setMeetings(rows || []));
  }, []);

  // Coordinator: fetch team leaders' onboarding progress
  const isCoordinator = eventMember?.event_role === "coordinator";
  const [teamProgress, setTeamProgress] = useState([]);
  useEffect(() => {
    if (!isCoordinator || !activeEvent || !profile?.id) return;
    supabase
      .from("event_members")
      .select("id, team_number, onboarding_completed, event_role, profiles!event_members_profile_id_fkey(full_name, photo_url)")
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: 4 }}>
            412 Ministry
          </div>
          <div style={{ fontFamily: SERIF, fontSize: "26px", fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
            Hi <span style={{ color: ORANGE }}>{displayName}</span>.
          </div>
        </div>
        {/* Chat button */}
        <button
          onClick={onOpenChat}
          style={{ background: NAVY, border: "none", borderRadius: 20, cursor: "pointer", padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff", fontFamily: SANS }}>Chat</span>
          {chatUnread ? (
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#E53E3E" }} />
          ) : othersOnline.length > 0 ? (
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />
          ) : null}
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
          background: NAVY, borderRadius: 16, padding: "1.25rem 1.5rem",
          marginBottom: "1rem",
        }}>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", color: GOLD, textTransform: "uppercase", fontFamily: SANS, marginBottom: 6 }}>
            {onboardingComplete ? "Pre-Conference" : "Onboarding Invitation"}
          </div>

          {/* Onboarding step progress */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff", fontFamily: SANS }}>
                Onboarding
              </span>
              <span style={{ fontSize: "11px", color: "#B8C0D0", fontFamily: SANS }}>
                {onboardingComplete ? "Complete" : `Step ${Math.min(onboardingStep + 1, TOTAL_STEPS)} of ${TOTAL_STEPS}`}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: onboardingComplete ? "#22C55E" : ORANGE,
                width: onboardingComplete ? "100%" : `${Math.round((onboardingStep / TOTAL_STEPS) * 100)}%`,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>

          {/* Checklist progress */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff", fontFamily: SANS }}>
                Pre-Conference Checklist
              </span>
              <span style={{ fontSize: "11px", color: "#B8C0D0", fontFamily: SANS }}>
                {checklistDone} / {CHECKLIST_ITEMS.length}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: checklistDone === CHECKLIST_ITEMS.length ? "#22C55E" : GOLD,
                width: `${Math.round((checklistDone / CHECKLIST_ITEMS.length) * 100)}%`,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {!onboardingComplete && (
              <button
                onClick={onOpenOnboarding}
                style={{
                  flex: 1, background: ORANGE, color: "#fff", border: "none",
                  borderRadius: 10, padding: "11px", fontSize: "13px", fontWeight: 700,
                  fontFamily: SANS, cursor: "pointer",
                }}
              >
                {onboardingStep === 0 ? "Start Onboarding →" : "Continue →"}
              </button>
            )}
            <button
              onClick={onOpenMyTeam}
              style={{
                flex: 1, background: "rgba(255,255,255,0.12)", color: "#fff", border: "none",
                borderRadius: 10, padding: "11px", fontSize: "13px", fontWeight: 600,
                fontFamily: SANS, cursor: "pointer",
              }}
            >
              View Checklist
            </button>
          </div>
        </div>
      )}

      {/* ── Event & upcoming info ───────────────────────────────────── */}
      {(activeEvent || nextPrayer || nextMeeting) && (
        <div style={{ marginBottom: "1rem" }}>
          <SectionLabel>Upcoming</SectionLabel>
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>

            {/* Active event */}
            {activeEvent && (
              <InfoRow
                icon="📅"
                label={activeEvent.name}
                value={activeEvent.dates || "Dates TBD"}
                accent={ORANGE}
              />
            )}

            {/* Registration fee */}
            {activeEvent?.fee && (
              <InfoRow
                icon="💰"
                label="Registration Fee"
                value={activeEvent.fee}
              />
            )}

            {/* Next prayer date */}
            {nextPrayer && (
              <InfoRow
                icon="🙏"
                label="Your Team Prays"
                value={fmtDate(nextPrayer)}
                sub={`Team ${eventMember?.team_number} · ${daysUntil(nextPrayer) === 0 ? "Today!" : `in ${daysUntil(nextPrayer)} day${daysUntil(nextPrayer) === 1 ? "" : "s"}`}`}
                accent={NAVY}
              />
            )}

            {/* Next zoom/board meeting */}
            {nextMeeting && (
              <InfoRow
                icon={nextMeeting.type === "zoom_meeting" ? "💻" : "🏢"}
                label={nextMeeting.name}
                value={nextMeeting.dates || "Date TBD"}
                sub={nextMeeting.location || undefined}
                last
              />
            )}
          </div>

          {/* Register button if event has registration URL */}
          {activeEvent?.registration_url && (
            <a
              href={activeEvent.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", marginTop: "0.625rem", background: ORANGE, color: "#fff",
                borderRadius: 10, padding: "11px 0", textAlign: "center",
                fontSize: "14px", fontWeight: 700, fontFamily: SANS, textDecoration: "none",
              }}
            >
              Register now →
            </a>
          )}
        </div>
      )}

      {/* ── Coordinator: team leaders' progress ────────────────────── */}
      {isCoordinator && teamProgress.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <SectionLabel>Your Leaders' Progress</SectionLabel>
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            {teamProgress.map((m, i) => {
              const done = m.onboarding_completed;
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "0.875rem 1.25rem",
                    borderBottom: i < teamProgress.length - 1 ? `1px solid ${BORDER}` : "none",
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: m.profiles?.photo_url ? "transparent" : BG,
                    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${BORDER}`,
                  }}>
                    {m.profiles?.photo_url
                      ? <img src={m.profiles.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontFamily: SERIF, fontSize: 14, color: TSEC }}>{m.profiles?.full_name?.charAt(0)}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>
                      {m.profiles?.full_name}
                    </div>
                    <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS }}>
                      Team {m.team_number}
                    </div>
                  </div>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, fontFamily: SANS,
                    color: done ? "#059669" : ORANGE,
                    background: done ? "#DCFCE7" : "#FFF7ED",
                    borderRadius: 20, padding: "3px 10px", flexShrink: 0,
                  }}>
                    {done ? "Done ✓" : "In progress"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Contact ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setShowContact(true)}
        style={{
          width: "100%", background: "#fff", border: `1px solid ${BORDER}`,
          borderRadius: 14, padding: "1rem 1.25rem", cursor: "pointer",
          fontFamily: SANS, display: "flex", alignItems: "center", gap: 12,
          marginBottom: "0.5rem",
        }}
      >
        <div style={{ width: 38, height: 38, borderRadius: 10, background: BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: NAVY }}>Contact Us</div>
          <div style={{ fontSize: "12px", color: TSEC, marginTop: 1 }}>Send a message to the 412 team</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {showContact && <ContactForm profile={profile} onClose={() => setShowContact(false)} />}
    </Shell>
  );
}

// ── Shared row component ──────────────────────────────────────────────────────

function InfoRow({ icon, label, value, sub, accent, last }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "0.875rem 1.25rem",
      borderBottom: last ? "none" : `1px solid ${BORDER}`,
    }}>
      <span style={{ fontSize: "18px", flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: accent || NAVY, fontFamily: SANS }}>{value}</div>
        {sub && <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}
