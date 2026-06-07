import { useState } from "react";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, SectionLabel } from "../../components/ui/index.js";
import { DailyVerse, ContactForm } from "../../components/shared/index.js";
import { CHECKLIST_ITEMS } from "../../lib/checklist.js";

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const m1 = dateStr.match(/([A-Za-z]+ \d+)[–\-]\d+,?\s*(\d{4})/);
  const m2 = dateStr.match(/([A-Za-z]+ \d+,\s*\d{4})/);
  const parsed = m1 ? new Date(`${m1[1]}, ${m1[2]}`) : m2 ? new Date(m2[1]) : null;
  if (!parsed || isNaN(parsed)) return null;
  return Math.ceil((parsed - new Date()) / 86400000);
}

export default function Home({ data, onNavigate, onOpenPage, onOpenChat, onOpenOnboarding, chatUnread, onlineUsers }) {
  const { profile, eventMember, eventChecklist, announcements, unreadCount, activeEvent, trainingMaterials } = data;
  const othersOnline = (onlineUsers || []).filter((u) => u.user_id !== profile.id);
  const [showContact, setShowContact] = useState(false);
  const [progressDismissed, setProgressDismissed] = useState(false);
  const [dismissedAnnIds, setDismissedAnnIds] = useState(() => new Set());

  const displayName = profile.nickname || (profile.full_name || "").split(" ")[0];
  const latestAnn = (announcements || []).find(() => true);
  const days = daysUntil(activeEvent?.dates);

  const checklistItems = eventChecklist?.items || {};
  const doneCount = CHECKLIST_ITEMS.filter((i) => checklistItems[i.id]).length;
  const checklistPct = Math.round((doneCount / CHECKLIST_ITEMS.length) * 100);

  const showProgressCard = eventMember && !progressDismissed;

  return (
    <Shell withNav>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: 4 }}>
            412 Ministry
          </div>
          <div style={{ fontFamily: SERIF, fontSize: "26px", fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
            Hi <span style={{ color: ORANGE }}>{displayName}</span>.
          </div>
        </div>
        <button
          onClick={onOpenChat}
          style={{
            background: NAVY, border: "none", borderRadius: 20,
            cursor: "pointer", padding: "8px 14px",
            display: "flex", alignItems: "center", gap: 6,
          }}
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

      {/* Leader progress card — always visible for event members */}
      {showProgressCard && (
        <div style={{
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
          padding: "1rem 1.25rem", marginBottom: "1rem", position: "relative",
        }}>
          {/* Dismiss */}
          <button
            onClick={() => setProgressDismissed(true)}
            style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", color: TSEC, fontSize: "18px", lineHeight: 1, padding: "2px 6px" }}
          >
            ×
          </button>

          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: 8 }}>
            Your Progress
          </div>

          {/* Onboarding row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: eventMember.onboarding_completed ? "#059669" : ORANGE,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {eventMember.onboarding_completed
                  ? <span style={{ color: "#fff", fontSize: 10 }}>✓</span>
                  : <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>!</span>}
              </div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>Onboarding</span>
            </div>
            {eventMember.onboarding_completed ? (
              <span style={{ fontSize: "12px", color: "#059669", fontFamily: SANS, fontWeight: 600 }}>Complete</span>
            ) : (
              <button
                onClick={onOpenOnboarding}
                style={{ background: "none", border: "none", color: ORANGE, fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: SANS, padding: 0 }}
              >
                Continue →
              </button>
            )}
          </div>

          {/* Checklist row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: doneCount === CHECKLIST_ITEMS.length ? "#059669" : BORDER,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {doneCount === CHECKLIST_ITEMS.length
                  ? <span style={{ color: "#fff", fontSize: 10 }}>✓</span>
                  : <span style={{ fontSize: "10px", fontWeight: 700, color: TSEC }}>{doneCount}</span>}
              </div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>Checklist</span>
            </div>
            <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>
              {doneCount} / {CHECKLIST_ITEMS.length}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 5, borderRadius: 3, background: BORDER, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              background: doneCount === CHECKLIST_ITEMS.length ? "#059669" : ORANGE,
              width: `${checklistPct}%`,
              transition: "width 0.4s ease",
            }} />
          </div>

          {/* CTA */}
          <button
            onClick={() => onOpenPage("myteam")}
            style={{
              marginTop: 12, width: "100%", background: NAVY, color: "#fff",
              border: "none", borderRadius: 10, padding: "10px",
              fontSize: "13px", fontWeight: 600, fontFamily: SANS, cursor: "pointer",
            }}
          >
            View checklist in My Team →
          </button>
        </div>
      )}

      {/* Conference info card — primary data block */}
      {activeEvent && (
        <div style={{
          background: NAVY, borderRadius: 16, padding: "1.5rem",
          marginBottom: "1rem", fontFamily: SANS,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", color: GOLD, textTransform: "uppercase", marginBottom: "0.25rem" }}>
                {eventMember ? "Your Event" : "Upcoming Event"}
              </div>
              <div style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 600, color: "#fff", lineHeight: 1.2, marginBottom: "0.25rem" }}>
                {activeEvent.name}
              </div>
              <div style={{ fontSize: "13px", color: "#B8C0D0" }}>{activeEvent.dates}</div>
              {activeEvent.location && (
                <div style={{ fontSize: "13px", color: "#B8C0D0" }}>{activeEvent.location}</div>
              )}
            </div>
            {/* Day countdown */}
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

          {/* Fee */}
          {activeEvent.fee && (
            <div style={{ fontSize: "13px", color: "#B8C0D0", marginBottom: "0.75rem" }}>
              Registration fee: <span style={{ color: GOLD, fontWeight: 600 }}>{activeEvent.fee}</span>
            </div>
          )}

          {/* Verse */}
          {activeEvent.verse_text && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
              <div style={{ fontFamily: SERIF, fontSize: "14px", color: "#FFE066", lineHeight: 1.65, fontStyle: "italic", marginBottom: "0.25rem" }}>
                "{activeEvent.verse_text}"
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: GOLD, textTransform: "uppercase", fontFamily: SANS }}>
                {activeEvent.verse}
              </div>
            </div>
          )}

          {/* Register button */}
          {activeEvent.registration_url ? (
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
          ) : (
            <button
              onClick={() => onNavigate("event")}
              style={{
                marginTop: "1rem", background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)",
                border: "none", borderRadius: 10, padding: "10px 0", width: "100%",
                fontSize: "13px", fontWeight: 600, fontFamily: SANS, cursor: "pointer",
              }}
            >
              View event details →
            </button>
          )}
        </div>
      )}

      {/* Latest announcement */}
      {latestAnn && !dismissedAnnIds.has(latestAnn.id) && (
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <button
            onClick={() => onNavigate("updates")}
            style={{ width: "100%", textAlign: "left", background: "#EEF2FC", borderRadius: 14, padding: "1rem 1.25rem", paddingRight: "2.5rem", border: "none", cursor: "pointer", fontFamily: SANS }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: "#1A4FBF" }}>ANNOUNCEMENT</div>
              {unreadCount > 0 && (
                <div style={{ background: "#E53E3E", color: "#fff", fontSize: "10px", fontWeight: 700, borderRadius: 99, padding: "2px 7px" }}>
                  {unreadCount} new
                </div>
              )}
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1A3080", marginBottom: 2 }}>{latestAnn.title}</div>
            <div style={{ fontSize: "13px", color: "#1A3080", lineHeight: 1.5, opacity: 0.85, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {latestAnn.body}
            </div>
          </button>
          <button
            onClick={() => setDismissedAnnIds((prev) => new Set([...prev, latestAnn.id]))}
            style={{
              position: "absolute", top: 8, right: 10,
              background: "rgba(26,79,191,0.1)", border: "none", borderRadius: "50%",
              width: 22, height: 22, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#1A4FBF", fontSize: "15px", lineHeight: 1, fontFamily: SANS,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Daily verse */}
      <DailyVerse />

      {/* Training materials */}
      {trainingMaterials && trainingMaterials.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <SectionLabel>Training</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {trainingMaterials.map((m) => (
              <Card key={m.id} style={{ padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: NAVY, marginBottom: 4 }}>{m.title}</div>
                {m.body && <div style={{ fontSize: "13px", color: TSEC, lineHeight: 1.5 }}>{m.body}</div>}
                {m.external_url && (
                  <div style={{ marginTop: 6 }}>
                    <a href={m.external_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: ORANGE, fontWeight: 600, textDecoration: "none" }}>Open</a>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      <button
        onClick={() => setShowContact(true)}
        style={{ width: "100%", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1rem 1.25rem", cursor: "pointer", fontFamily: SANS, display: "flex", alignItems: "center", gap: 12, marginBottom: "0.5rem" }}
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
