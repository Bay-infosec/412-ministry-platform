import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, SectionLabel, Avatar } from "../../components/ui/index.js";

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

function fmtShort(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtFull(date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
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

function todayPrayerFocus(grouped) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const allDay = new Date(CHAIN_ALL); allDay.setHours(0, 0, 0, 0);
  if (today.getTime() === allDay.getTime()) return "all";
  for (const t of Object.keys(grouped).map(Number).filter(n => n > 0)) {
    const [d1, d2] = getPrayerDates(t);
    d1.setHours(0, 0, 0, 0); d2.setHours(0, 0, 0, 0);
    if (today.getTime() === d1.getTime() || today.getTime() === d2.getTime()) return t;
  }
  return null;
}

export default function PrayerChain({ data, onBack }) {
  const { activeEvent, eventMember } = data;
  const myTeam = eventMember?.team_number;

  const [members, setMembers] = useState(null);
  const [openTeams, setOpenTeams] = useState(new Set(myTeam ? [myTeam] : []));
  const [topicsOpen, setTopicsOpen] = useState(false);

  useEffect(() => {
    if (!activeEvent?.id) return;
    supabase
      .from("event_members")
      .select("id, team_number, ministry, event_role, profiles(full_name, photo_url)")
      .eq("event_id", activeEvent.id)
      .order("team_number")
      .then(({ data: rows }) => setMembers(rows || []));
  }, [activeEvent?.id]);

  const grouped = {};
  (members || []).forEach((m) => {
    const t = m.team_number ?? 0;
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(m);
  });
  const teams = Object.keys(grouped).map(Number).filter(n => n > 0).sort((a, b) => a - b);
  const focus = members ? todayPrayerFocus(grouped) : null;

  const toggleTeam = (t) => setOpenTeams((prev) => {
    const next = new Set(prev);
    next.has(t) ? next.delete(t) : next.add(t);
    return next;
  });

  // My next prayer date countdown
  const nextPrayer = getNextPrayerDate(myTeam);
  const daysLeft = nextPrayer ? daysUntil(nextPrayer) : null;

  return (
    <Shell withNav>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: TSEC,
        fontSize: "14px", cursor: "pointer", padding: "0 0 1rem 0",
        fontFamily: SANS, display: "block",
      }}>
        ‹ Back
      </button>

      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.25rem" }}>
          Prayer Chain
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "24px", fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
          Pray for one another.
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

      {/* Everyone-can-pray note */}
      <div style={{
        background: "#FFF5EC", border: `1px solid ${ORANGE}22`, borderRadius: 12,
        padding: "0.875rem 1.25rem", marginBottom: "1.25rem",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <span style={{ fontSize: "16px", flexShrink: 0 }}>🙏</span>
        <div style={{ fontSize: "13px", color: NAVY, fontFamily: SANS, lineHeight: 1.6 }}>
          <strong>Everyone is encouraged to pray every day.</strong> The schedule below assigns each team a specific day to pray — but these are focused days, not limits. Pray for every team, every day.
        </div>
      </div>

      {/* My prayer countdown (if in a team) */}
      {myTeam && nextPrayer && (
        <div style={{ background: NAVY, borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            {daysLeft === 0 ? (
              <div style={{ fontFamily: SERIF, fontSize: "18px", color: ORANGE, fontWeight: 600 }}>Today!</div>
            ) : (
              <>
                <div style={{ fontFamily: SERIF, fontSize: "40px", color: "#fff", fontWeight: 600, lineHeight: 1 }}>{daysLeft}</div>
                <div style={{ fontSize: "10px", color: "#B8C0D0", fontWeight: 700, letterSpacing: "0.06em" }}>{daysLeft === 1 ? "DAY" : "DAYS"}</div>
              </>
            )}
          </div>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: GOLD, textTransform: "uppercase", fontFamily: SANS, marginBottom: 2 }}>
              Team {myTeam} — Your Prayer Day
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", fontFamily: SANS }}>
              {fmtFull(nextPrayer)}
            </div>
            {(() => {
              const [d1, d2] = getPrayerDates(myTeam);
              const both = `${fmtShort(d1)} and ${fmtShort(d2)}`;
              return <div style={{ fontSize: "11px", color: "#B8C0D0", fontFamily: SANS, marginTop: 2 }}>Both dates: {both}</div>;
            })()}
          </div>
        </div>
      )}

      {/* Today's focus banner */}
      {focus === "all" && (
        <div style={{ background: "#EEF2FC", border: `1.5px solid #1A4FBF`, borderRadius: 12, padding: "0.75rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "20px" }}>🙏</span>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#1A4FBF", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SANS }}>Today — All Teams</div>
            <div style={{ fontSize: "13px", color: NAVY, fontFamily: SANS, fontWeight: 600 }}>Everyone prays together today!</div>
          </div>
        </div>
      )}
      {typeof focus === "number" && focus !== myTeam && (
        <div style={{ background: "#FFF5EC", border: `1.5px solid ${ORANGE}`, borderRadius: 12, padding: "0.75rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "20px" }}>🙏</span>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SANS }}>Today's focus</div>
            <div style={{ fontSize: "13px", color: NAVY, fontFamily: SANS, fontWeight: 600 }}>Pray for Team {focus}</div>
          </div>
        </div>
      )}

      {/* Prayer topics — collapsible */}
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: topicsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
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

      {/* Team list — collapsible accordion */}
      <SectionLabel>Prayer Schedule</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        {teams.map((teamNum) => {
          const group = grouped[teamNum];
          const isToday = focus === teamNum;
          const isMyTeam = teamNum === myTeam;
          const isOpen = openTeams.has(teamNum);
          const [d1, d2] = getPrayerDates(teamNum);
          const nextDate = getNextPrayerDate(teamNum);
          const days = nextDate ? daysUntil(nextDate) : null;

          return (
            <div key={teamNum}>
              <button
                onClick={() => toggleTeam(teamNum)}
                style={{
                  width: "100%", textAlign: "left", background: isMyTeam ? NAVY : "#fff",
                  border: `1px solid ${isToday ? ORANGE : isMyTeam ? NAVY : BORDER}`,
                  borderRadius: isOpen ? "14px 14px 0 0" : 14,
                  padding: "0.875rem 1.25rem", cursor: "pointer", fontFamily: SANS,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: isMyTeam ? GOLD : isToday ? ORANGE : NAVY, fontFamily: SANS }}>
                    Team {teamNum}
                    {isMyTeam && <span style={{ marginLeft: 6, fontSize: "10px", background: GOLD, color: NAVY, borderRadius: 10, padding: "1px 7px", fontWeight: 700 }}>YOU</span>}
                    {isToday && <span style={{ marginLeft: 6, fontSize: "10px", background: ORANGE, color: "#fff", borderRadius: 10, padding: "1px 7px", fontWeight: 700 }}>TODAY</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", color: isMyTeam ? "#B8C0D0" : TSEC, fontFamily: SANS }}>
                      {fmtShort(d1)} · {fmtShort(d2)}
                    </div>
                    {days !== null && days >= 0 && (
                      <div style={{ fontSize: "11px", color: isMyTeam ? GOLD : ORANGE, fontFamily: SANS, fontWeight: 600 }}>
                        {days === 0 ? "Today" : `in ${days} day${days === 1 ? "" : "s"}`}
                      </div>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={isMyTeam ? "#B8C0D0" : TSEC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div style={{ border: `1px solid ${isMyTeam ? NAVY : BORDER}`, borderTop: "none", borderRadius: "0 0 14px 14px", overflow: "hidden" }}>
                  {group.map((m, i) => {
                    const name = m.profiles?.full_name || "";
                    const photoUrl = m.profiles?.photo_url || null;
                    const roleLabel = m.event_role === "coordinator" ? "Coordinator" : m.ministry || null;
                    return (
                      <div key={m.id} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "0.875rem 1.25rem", background: "#fff",
                        borderBottom: i < group.length - 1 ? `1px solid ${BORDER}` : "none",
                      }}>
                        <Avatar url={photoUrl} name={name} size={36} />
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 500, color: NAVY, fontFamily: SANS }}>{name}</div>
                          {roleLabel && <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginTop: 1 }}>{roleLabel}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* All Teams — Aug 3 */}
        <div style={{
          background: focus === "all" ? "#EEF2FC" : "#fff",
          border: `1px solid ${focus === "all" ? "#1A4FBF" : BORDER}`,
          borderRadius: 14, padding: "0.875rem 1.25rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: focus === "all" ? "#1A4FBF" : NAVY, fontFamily: SANS }}>
            All Teams
            {focus === "all" && <span style={{ marginLeft: 6, fontSize: "10px", background: "#1A4FBF", color: "#fff", borderRadius: 10, padding: "1px 7px" }}>TODAY</span>}
          </div>
          <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>Aug 3</div>
        </div>
      </div>

      <div style={{ height: "1rem" }} />
    </Shell>
  );
}
