import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { SectionLabel } from "../../components/ui/index.js";

const PRAYER_TOPICS = [
  "Pray for the young people you have not met yet. Ask God to prepare their hearts before you even arrive.",
  "Pray for your co-leader. Ask God for unity, wisdom, and the ability to cover for each other.",
  "Pray for the conference. Ask that what happens in those days would stay with people for years.",
  "Pray for your fellow leaders. Ask that each one feels supported and not alone in this.",
  "Pray for the organizing team. Ask that every detail they carry is done in His strength.",
  "Pray that God would show you what He already sees in each person on your team.",
  "Pray for yourself. Ask that you lead from the Spirit and not just your own effort.",
];

const CHAIN_START = new Date("2026-07-10");
const CHAIN_ALL   = new Date("2026-08-03");
const NUM_TEAMS   = 12;

function getPrayerDates(teamNumber) {
  const offset = teamNumber - 1;
  const d1 = new Date(CHAIN_START); d1.setDate(d1.getDate() + offset);
  const d2 = new Date(CHAIN_START); d2.setDate(d2.getDate() + offset + NUM_TEAMS);
  return [d1, d2];
}

function getFullSchedule() {
  const days = [];
  for (let i = 0; i < NUM_TEAMS * 2; i++) {
    const date = new Date(CHAIN_START);
    date.setDate(date.getDate() + i);
    days.push({ date, teamNum: (i % NUM_TEAMS) + 1 });
  }
  days.push({ date: CHAIN_ALL, teamNum: "all" });
  return days;
}

function fmtShort(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtWeekday(date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function daysUntil(date) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((date - today) / 86400000);
}

function getNextPrayerDate(teamNumber) {
  if (!teamNumber) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [d1, d2] = getPrayerDates(teamNumber);
  if (d1 >= today) return d1;
  if (d2 >= today) return d2;
  return null;
}

function ChevronIcon({ open, color = TSEC }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function PrayerChain({ data, onBack }) {
  const { activeEvent, eventMember } = data;
  const myTeam = eventMember?.team_number;

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);

  const myDates = myTeam ? getPrayerDates(myTeam) : null;
  const schedule = getFullSchedule();

  // Today's team(s)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayEntry = schedule.find((s) => { const d = new Date(s.date); d.setHours(0,0,0,0); return d.getTime() === today.getTime(); });

  return (
    <Shell withNav>
      <button onClick={onBack} style={{ background: "none", border: "none", color: TSEC, fontSize: "14px", cursor: "pointer", padding: "0 0 1rem 0", fontFamily: SANS, display: "block" }}>
        ‹ Back
      </button>

      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.25rem" }}>
          Prayer Chain
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "24px", fontWeight: 600, color: NAVY, lineHeight: 1.2, marginBottom: "0.5rem" }}>
          Pray for one another.
        </div>
        <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>
          Starting July 10, teams take turns covering the whole group in prayer — two days each — until we all come together on August 3.
        </div>
      </div>

      {/* Scripture */}
      <div style={{ background: NAVY, borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontFamily: SERIF, fontSize: "15px", color: "#FFE066", lineHeight: 1.7, fontStyle: "italic", marginBottom: "0.5rem" }}>
          "The prayer of a righteous person is powerful and effective."
        </div>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: GOLD, textTransform: "uppercase", fontFamily: SANS }}>
          James 5:16
        </div>
      </div>

      {/* ── MY PRAYER DAYS ─────────────────────────────────────────────────── */}
      {myTeam && myDates && (
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", color: TSEC, textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.625rem" }}>
            Team {myTeam} — Your Prayer Days
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {myDates.map((date, idx) => {
              const du = daysUntil(date);
              const isPast = du < 0;
              const isToday = du === 0;
              return (
                <div key={idx} style={{
                  flex: 1, background: isToday ? ORANGE : NAVY, borderRadius: 14,
                  padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: isToday ? "#fff" : GOLD, textTransform: "uppercase", fontFamily: SANS }}>
                    {fmtWeekday(date)}
                  </div>
                  <div style={{ fontFamily: SERIF, fontSize: "28px", fontWeight: 600, color: "#fff", lineHeight: 1 }}>
                    {fmtShort(date).split(" ")[1]}
                  </div>
                  <div style={{ fontSize: "12px", color: isToday ? "#fff" : "#B8C0D0", fontFamily: SANS }}>
                    {fmtShort(date).split(" ")[0]}
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: isToday ? "#fff" : GOLD, fontFamily: SANS, marginTop: 4 }}>
                    {isToday ? "Today!" : isPast ? "Done" : `${du} day${du === 1 ? "" : "s"} away`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AUG 3 — ALL TOGETHER ───────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", color: TSEC, textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.625rem" }}>
          All Teams Together
        </div>
        <div style={{
          background: todayEntry?.teamNum === "all" ? "#EEF2FC" : "#fff",
          border: `1.5px solid ${todayEntry?.teamNum === "all" ? "#1A4FBF" : BORDER}`,
          borderRadius: 14, padding: "1rem 1.25rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 600, color: todayEntry?.teamNum === "all" ? "#1A4FBF" : NAVY }}>
              August 3
              {todayEntry?.teamNum === "all" && <span style={{ marginLeft: 8, fontSize: "10px", background: "#1A4FBF", color: "#fff", borderRadius: 10, padding: "2px 8px", fontFamily: SANS, fontWeight: 700 }}>TODAY</span>}
            </div>
            <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 3 }}>
              Every team prays together — one week before the conference
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 600, color: NAVY }}>
              {daysUntil(CHAIN_ALL) > 0 ? daysUntil(CHAIN_ALL) : "—"}
            </div>
            {daysUntil(CHAIN_ALL) > 0 && <div style={{ fontSize: "10px", color: TSEC, fontFamily: SANS }}>days</div>}
          </div>
        </div>
      </div>

      {/* ── FULL SCHEDULE — collapsible ────────────────────────────────────── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <button
          onClick={() => setScheduleOpen(o => !o)}
          style={{
            width: "100%", background: "#fff", border: `1px solid ${BORDER}`,
            borderRadius: scheduleOpen ? "14px 14px 0 0" : 14,
            padding: "0.875rem 1.25rem", cursor: "pointer", fontFamily: SANS,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 700, color: NAVY }}>Full Prayer Schedule</span>
          <ChevronIcon open={scheduleOpen} />
        </button>
        {scheduleOpen && (
          <div style={{
            border: `1px solid ${BORDER}`, borderTop: "none", borderRadius: "0 0 14px 14px",
            padding: "0.875rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem",
          }}>
            {Array.from({ length: NUM_TEAMS }, (_, i) => i + 1).map((teamNum) => {
              const [d1, d2] = getPrayerDates(teamNum);
              const isMine = myTeam === teamNum;
              const isTodayTeam = [d1, d2].some((d) => {
                const dd = new Date(d); dd.setHours(0, 0, 0, 0);
                return dd.getTime() === today.getTime();
              });
              return (
                <div key={teamNum} style={{
                  background: isMine ? "#FFF5EC" : "#fff",
                  border: `1.5px solid ${isMine ? ORANGE : BORDER}`,
                  borderRadius: 12, padding: "0.625rem 0.75rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: isMine ? ORANGE : NAVY, fontFamily: SANS }}>
                      Team {teamNum}
                    </div>
                    {isTodayTeam && (
                      <span style={{ fontSize: "9px", background: ORANGE, color: "#fff", borderRadius: 8, padding: "1px 6px", fontWeight: 700, fontFamily: SANS }}>
                        TODAY
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "11px", color: isMine ? NAVY : TSEC, fontFamily: SANS, lineHeight: 1.5 }}>
                    {fmtShort(d1)} · {fmtShort(d2)}
                  </div>
                </div>
              );
            })}
            <div style={{
              gridColumn: "1 / -1", background: todayEntry?.teamNum === "all" ? "#F0F4FF" : "#fff",
              border: `1.5px solid ${todayEntry?.teamNum === "all" ? "#1A4FBF" : BORDER}`,
              borderRadius: 12, padding: "0.625rem 0.75rem",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: todayEntry?.teamNum === "all" ? "#1A4FBF" : NAVY, fontFamily: SANS }}>
                All Teams Together
              </div>
              <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS }}>{fmtShort(CHAIN_ALL)}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── WHAT TO PRAY FOR — collapsible ────────────────────────────────── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <button
          onClick={() => setTopicsOpen(o => !o)}
          style={{
            width: "100%", background: "#fff", border: `1px solid ${BORDER}`,
            borderRadius: topicsOpen ? "14px 14px 0 0" : 14,
            padding: "0.875rem 1.25rem", cursor: "pointer", fontFamily: SANS,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 700, color: NAVY }}>What to pray for</span>
          <ChevronIcon open={topicsOpen} />
        </button>
        {topicsOpen && (
          <div style={{ border: `1px solid ${BORDER}`, borderTop: "none", borderRadius: "0 0 14px 14px", overflow: "hidden" }}>
            {PRAYER_TOPICS.map((topic, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "0.875rem 1.25rem",
                borderBottom: i < PRAYER_TOPICS.length - 1 ? `1px solid ${BORDER}` : "none",
                background: "#fff",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", background: "#FFF5EC",
                  border: `1.5px solid ${ORANGE}`, display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0, marginTop: 1,
                  fontSize: "11px", fontWeight: 700, color: ORANGE, fontFamily: SANS,
                }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: "13px", color: NAVY, fontFamily: SANS, lineHeight: 1.6 }}>
                  {topic}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reminder */}
      <div style={{ background: "#FFF5EC", border: `1.5px solid ${ORANGE}44`, borderRadius: 12, padding: "0.875rem 1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: ORANGE, fontFamily: SANS, marginBottom: 4 }}>A reminder</div>
        <div style={{ fontSize: "13px", color: NAVY, fontFamily: SANS, lineHeight: 1.6 }}>
          Assigned days are focused days, not limits. Pray for every team, every day. The chain only works when everyone stays in it.
        </div>
      </div>

      <div style={{ height: "1rem" }} />
    </Shell>
  );
}
