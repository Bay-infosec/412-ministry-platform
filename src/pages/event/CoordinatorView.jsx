import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { NAVY, ORANGE, TSEC, BORDER, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, SectionLabel, Avatar } from "../../components/ui/index.js";

export default function CoordinatorView({ data, onBack }) {
  const { profile, activeEvent } = data;
  const [teams, setTeams] = useState(null);

  useEffect(() => {
    if (!activeEvent?.id || !profile?.id) return;
    supabase
      .from("event_members")
      .select("id, team_number, ministry, event_role, profiles(full_name, photo_url)")
      .eq("event_id", activeEvent.id)
      .eq("coordinator_id", profile.id)
      .order("team_number")
      .then(({ data: rows }) => {
        const grouped = {};
        for (const m of rows || []) {
          const t = m.team_number ?? 0;
          if (!grouped[t]) grouped[t] = [];
          grouped[t].push(m);
        }
        setTeams(grouped);
      });
  }, [activeEvent?.id, profile?.id]);

  const teamNums = teams
    ? Object.keys(teams).map(Number).sort((a, b) => a - b)
    : [];

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
          Coordinator
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "24px", fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
          My Teams
        </div>
        {teamNums.length > 0 && (
          <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, marginTop: 4 }}>
            {teamNums.length} team{teamNums.length !== 1 ? "s" : ""} under your oversight
          </div>
        )}
      </div>

      {!teams ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: TSEC, fontFamily: SANS, fontSize: "14px" }}>
          Loading…
        </div>
      ) : teamNums.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: TSEC, fontFamily: SANS, fontSize: "14px" }}>
          No teams assigned to you yet.
        </div>
      ) : (
        teamNums.map((teamNum) => {
          const members = teams[teamNum];
          const ministry = members[0]?.ministry;
          return (
            <div key={teamNum} style={{ marginBottom: "0.875rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <SectionLabel>Team {teamNum}</SectionLabel>
                {ministry && (
                  <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginBottom: 6 }}>
                    {ministry}
                  </div>
                )}
              </div>
              <Card style={{ padding: 0, overflow: "hidden" }}>
                {members.map((m, i) => {
                  const name = m.profiles?.full_name || "";
                  const photoUrl = m.profiles?.photo_url || null;
                  const roleLabel = m.event_role === "coordinator" ? "Coordinator" : "Team Leader";
                  return (
                    <div key={m.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "0.875rem 1.25rem",
                      borderBottom: i < members.length - 1 ? `1px solid ${BORDER}` : "none",
                    }}>
                      <Avatar url={photoUrl} name={name} size={40} />
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 500, color: NAVY, fontFamily: SANS }}>{name}</div>
                        <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginTop: 1 }}>{roleLabel}</div>
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
