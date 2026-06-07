import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, SectionLabel, Avatar } from "../../components/ui/index.js";

// All 24 leaders — prayer chain list
// Grouped by team for easy navigation
const LEADERS = [
  { team: 1, names: ["Michelle Ganbat", "Nick Tulga"] },
  { team: 2, names: ["James Erdenebaatar", "Rachel Nuudel"] },
  { team: 3, names: ["Harry Liu", "Crystal Li"] },
  { team: 4, names: ["Bayarjargal Bayarsaikhan", "Yanjinlkham Batsaikhan"] },
  { team: 5, names: ["Tuguldur Zorigtbaatar", "Undraa Bayarmagnai"] },
  { team: 6, names: ["Ayushjav Usukhbayar", "Tsatsral Tsendsuren"] },
  { team: 7, names: ["Urtnasan Enkhbat", "Erkhembayar Zolzaya"] },
  { team: 8, names: ["Tugsbeleg Tuguldur", "Misheel Batzorig"] },
  { team: 9, names: ["Munkhzaya Batmunkh", "Michael Munkhbaatar"] },
  { team: 10, names: ["Tsenguunbayar Batsaikhan", "Zolzaya Tsogtbaatar"] },
  { team: 11, names: ["Baterdene Boldmaa", "Nandin-Erdene Chinbaatar"] },
  { team: 12, names: ["Bolderdene Enkhbat", "Ikhbuyan Gankhuyag"] },
];

export default function PrayerChain({ data, onBack }) {
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
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.25rem" }}>
          Prayer Chain
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "24px", fontWeight: 600, color: NAVY, lineHeight: 1.2, marginBottom: "0.5rem" }}>
          Pray for one another.
        </div>
        <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>
          These are the team leaders serving at Set Apart 2026. Pray for them by name — before the conference, during, and after.
        </div>
      </div>

      {/* Verse */}
      <Card style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", background: NAVY }}>
        <div style={{ fontFamily: SERIF, fontSize: "15px", color: "#f0ece4", lineHeight: 1.7, fontStyle: "italic", marginBottom: "0.5rem" }}>
          "Therefore confess your sins to each other and pray for each other so that you may be healed. The prayer of a righteous person is powerful and effective."
        </div>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: GOLD, textTransform: "uppercase", fontFamily: SANS }}>
          James 5:16
        </div>
      </Card>

      {/* Teams */}
      {LEADERS.map((group) => (
        <div key={group.team} style={{ marginBottom: "0.75rem" }}>
          <SectionLabel>Team {group.team}</SectionLabel>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {group.names.map((name, i) => (
              <div key={name} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "0.875rem 1.25rem",
                borderBottom: i < group.names.length - 1 ? `1px solid ${BORDER}` : "none",
              }}>
                <Avatar name={name} size={36} />
                <span style={{ fontSize: "14px", fontWeight: 500, color: NAVY, fontFamily: SANS }}>
                  {name}
                </span>
              </div>
            ))}
          </Card>
        </div>
      ))}

      <div style={{ height: "1rem" }} />
    </Shell>
  );
}
