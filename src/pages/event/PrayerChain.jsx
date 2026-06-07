import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, SectionLabel, Avatar } from "../../components/ui/index.js";

// Prayer chain: July 10 – Aug 2 (24 days, teams 1–12 each pray twice 12 days apart)
// Aug 3: all teams pray together
const CHAIN_START = new Date("2026-07-10");
const CHAIN_ALL   = new Date("2026-08-03");
const NUM_TEAMS   = 12;

function getPrayerDates(teamNumber) {
  // team 1 → days 0 & 12, team 2 → days 1 & 13, … team 12 → days 11 & 23
  const offset = teamNumber - 1;
  const d1 = new Date(CHAIN_START); d1.setDate(d1.getDate() + offset);
  const d2 = new Date(CHAIN_START); d2.setDate(d2.getDate() + offset + NUM_TEAMS);
  return [d1, d2];
}

function fmtShort(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function todayPrayerFocus(grouped) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const allDay = new Date(CHAIN_ALL); allDay.setHours(0, 0, 0, 0);
  if (today.getTime() === allDay.getTime()) return "all";
  const teamNums = Object.keys(grouped).map(Number).filter(n => n > 0).sort((a, b) => a - b);
  for (const t of teamNums) {
    const [d1, d2] = getPrayerDates(t);
    d1.setHours(0, 0, 0, 0); d2.setHours(0, 0, 0, 0);
    if (today.getTime() === d1.getTime() || today.getTime() === d2.getTime()) return t;
  }
  return null;
}

export default function PrayerChain({ data, onBack }) {
  const { activeEvent } = data;
  const [members, setMembers] = useState(null);
  const [view, setView] = useState("teams"); // "teams" | "schedule"

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

  return (
    <Shell withNav>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: TSEC,
        fontSize: "14px", cursor: "pointer", padding: "0 0 1rem 0",
        fontFamily: SANS, display: "block",
      }}>
        ‹ Back
      </button>

      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.25rem" }}>
          Prayer Chain
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "24px", fontWeight: 600, color: NAVY, lineHeight: 1.2, marginBottom: "0.5rem" }}>
          Pray for one another.
        </div>
      </div>

      {/* Scripture card */}
      <Card style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem", background: NAVY }}>
        <div style={{ fontFamily: SERIF, fontSize: "15px", color: "#FFE066", lineHeight: 1.7, fontStyle: "italic", marginBottom: "0.5rem" }}>
          "Therefore confess your sins to each other and pray for each other so that you may be healed. The prayer of a righteous person is powerful and effective."
        </div>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: GOLD, textTransform: "uppercase", fontFamily: SANS }}>
          James 5:16
        </div>
      </Card>

      {/* Today's focus banner */}
      {focus === "all" && (
        <div style={{ background: "#EEF2FC", border: `1.5px solid #1A4FBF`, borderRadius: 12, padding: "0.75rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: "20px" }}>🙏</div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#1A4FBF", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SANS }}>Today — All Teams</div>
            <div style={{ fontSize: "13px", color: NAVY, fontFamily: SANS, fontWeight: 600 }}>Everyone prays together today!</div>
          </div>
        </div>
      )}
      {typeof focus === "number" && (
        <div style={{ background: "#FFF5EC", border: `1.5px solid ${ORANGE}`, borderRadius: 12, padding: "0.75rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: "20px" }}>🙏</div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SANS }}>Today's prayer focus</div>
            <div style={{ fontSize: "13px", color: NAVY, fontFamily: SANS, fontWeight: 600 }}>Team {focus}</div>
          </div>
        </div>
      )}

      {/* Schedule overview */}
      <Card style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: TSEC, letterSpacing: "0.06em", fontFamily: SANS, marginBottom: "0.75rem" }}>
          PRAYER SCHEDULE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {teams.map((t) => {
            const [d1, d2] = getPrayerDates(t);
            const isToday = focus === t;
            return (
              <div key={t} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 8px", borderRadius: 8,
                background: isToday ? "#FFF5EC" : "transparent",
              }}>
                <div style={{ fontSize: "13px", fontWeight: isToday ? 700 : 500, color: isToday ? ORANGE : NAVY, fontFamily: SANS }}>
                  Team {t}
                  {isToday && <span style={{ marginLeft: 6, fontSize: "10px", background: ORANGE, color: "#fff", borderRadius: 10, padding: "1px 6px" }}>TODAY</span>}
                </div>
                <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>
                  {fmtShort(d1)} · {fmtShort(d2)}
                </div>
              </div>
            );
          })}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "6px 8px", borderRadius: 8,
            background: focus === "all" ? "#EEF2FC" : "transparent",
          }}>
            <div style={{ fontSize: "13px", fontWeight: focus === "all" ? 700 : 500, color: focus === "all" ? "#1A4FBF" : NAVY, fontFamily: SANS }}>
              All Teams
              {focus === "all" && <span style={{ marginLeft: 6, fontSize: "10px", background: "#1A4FBF", color: "#fff", borderRadius: 10, padding: "1px 6px" }}>TODAY</span>}
            </div>
            <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>Aug 3</div>
          </div>
        </div>
      </Card>

      {/* Team member lists */}
      {!members ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: TSEC, fontFamily: SANS, fontSize: "14px" }}>Loading…</div>
      ) : (
        teams.map((teamNum) => {
          const group = grouped[teamNum];
          const isToday = focus === teamNum;
          const [d1, d2] = getPrayerDates(teamNum);
          return (
            <div key={teamNum} style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <SectionLabel>Team {teamNum}</SectionLabel>
                <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginBottom: 6 }}>
                  {fmtShort(d1)} · {fmtShort(d2)}
                  {isToday && <span style={{ marginLeft: 6, color: ORANGE, fontWeight: 700 }}>TODAY</span>}
                </div>
              </div>
              <Card style={{ padding: 0, overflow: "hidden", border: isToday ? `1.5px solid ${ORANGE}` : undefined }}>
                {group.map((m, i) => {
                  const name = m.profiles?.full_name || "";
                  const photoUrl = m.profiles?.photo_url || null;
                  const roleLabel = m.event_role === "coordinator" ? "Coordinator" : m.ministry || null;
                  return (
                    <div key={m.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "0.875rem 1.25rem",
                      borderBottom: i < group.length - 1 ? `1px solid ${BORDER}` : "none",
                    }}>
                      <Avatar url={photoUrl} name={name} size={38} />
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 500, color: NAVY, fontFamily: SANS }}>{name}</div>
                        {roleLabel && <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginTop: 1 }}>{roleLabel}</div>}
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          );
        })
      )}
      <div style={{ height: "1rem" }} />
    </Shell>
  );
}
