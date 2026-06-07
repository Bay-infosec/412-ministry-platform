import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, SectionLabel, Avatar } from "../../components/ui/index.js";

export default function PrayerChain({ data, onBack }) {
  const { activeEvent } = data;
  const [members, setMembers] = useState(null);

  useEffect(() => {
    if (!activeEvent?.id) return;
    supabase
      .from("event_members")
      .select("id, team_number, ministry, event_role, profiles(full_name, photo_url)")
      .eq("event_id", activeEvent.id)
      .order("team_number")
      .then(({ data: rows }) => setMembers(rows || []));
  }, [activeEvent?.id]);

  // Group by team_number, sort numerically
  const grouped = {};
  (members || []).forEach((m) => {
    const t = m.team_number ?? 0;
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(m);
  });
  const teams = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));

  // Highlight today's prayer team during the conference
  const todayTeam = (() => {
    if (!activeEvent?.dates || !members?.length) return null;
    const m1 = activeEvent.dates.match(/([A-Za-z]+ \d+)[–\-](\d+),?\s*(\d{4})/);
    if (!m1) return null;
    const start = new Date(`${m1[1]}, ${m1[3]}`);
    const end = new Date(`${m1[1].split(" ")[0]} ${m1[2]}, ${m1[3]}`);
    const today = new Date();
    if (today < start || today > end) return null;
    const dayIndex = Math.floor((today - start) / 86400000);
    const teamKeys = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
    return Number(teamKeys[dayIndex % teamKeys.length]);
  })();

  return (
    <Shell withNav>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: TSEC,
        fontSize: "14px", cursor: "pointer", padding: "0 0 1rem 0",
        fontFamily: SANS, display: "block",
      }}>
        ‹ Back
      </button>

      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.25rem" }}>
          Prayer Chain
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "24px", fontWeight: 600, color: NAVY, lineHeight: 1.2, marginBottom: "0.5rem" }}>
          Pray for one another.
        </div>
        <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>
          Pray for these leaders by name — before the conference, during, and after.
        </div>
      </div>

      <Card style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", background: NAVY }}>
        <div style={{ fontFamily: SERIF, fontSize: "15px", color: "#f0ece4", lineHeight: 1.7, fontStyle: "italic", marginBottom: "0.5rem" }}>
          "Therefore confess your sins to each other and pray for each other so that you may be healed. The prayer of a righteous person is powerful and effective."
        </div>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: GOLD, textTransform: "uppercase", fontFamily: SANS }}>
          James 5:16
        </div>
      </Card>

      {todayTeam && (
        <div style={{
          background: "#FFF5EC", border: `1.5px solid ${ORANGE}`, borderRadius: 12,
          padding: "0.75rem 1.25rem", marginBottom: "1.25rem",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ fontSize: "20px" }}>🙏</div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SANS }}>
              Today's prayer focus
            </div>
            <div style={{ fontSize: "13px", color: NAVY, fontFamily: SANS, fontWeight: 600 }}>
              Team {todayTeam}
            </div>
          </div>
        </div>
      )}

      {!members ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: TSEC, fontFamily: SANS, fontSize: "14px" }}>
          Loading…
        </div>
      ) : (
        teams.map((teamNum) => {
          const group = grouped[teamNum];
          const label = teamNum === "0" ? "Unassigned" : `Team ${teamNum}`;
          const isToday = todayTeam === Number(teamNum);
          return (
            <div key={teamNum} style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SectionLabel>{label}</SectionLabel>
                {isToday && (
                  <div style={{
                    fontSize: "10px", fontWeight: 700, color: ORANGE,
                    background: "#FFF5EC", borderRadius: 20, padding: "2px 8px",
                    fontFamily: SANS, letterSpacing: "0.06em", marginBottom: 6,
                  }}>
                    TODAY
                  </div>
                )}
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
                        <div style={{ fontSize: "14px", fontWeight: 500, color: NAVY, fontFamily: SANS }}>
                          {name}
                        </div>
                        {roleLabel && (
                          <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginTop: 1 }}>
                            {roleLabel}
                          </div>
                        )}
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
