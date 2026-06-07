import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, SectionLabel, Avatar } from "../../components/ui/index.js";

export default function MyTeam({ data, onBack }) {
  const { eventMember, coLeader, coordinator, eventChecklist, profile } = data;

  if (!eventMember) {
    return (
      <Shell>
        <BackBtn onBack={onBack} />
        <div style={{ textAlign: "center", marginTop: "4rem", color: TSEC, fontFamily: SANS, fontSize: "14px" }}>
          No team assignment yet.
        </div>
      </Shell>
    );
  }

  const checklist = [
    { id: "field_guide", label: "Read the Field Guide" },
    { id: "prayer_chain", label: "Review the Prayer Chain" },
    { id: "contact_coleader", label: "Connect with your co-leader" },
    { id: "confirm_attendance", label: "Confirm your attendance" },
  ];

  const completedCount = checklist.filter(i => eventChecklist?.[i.id]).length;

  return (
    <Shell withNav>
      <BackBtn onBack={onBack} />

      {/* Team header */}
      <div style={{ background: NAVY, borderRadius: 16, padding: "1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", color: GOLD, textTransform: "uppercase", marginBottom: "0.25rem", fontFamily: SANS }}>
          Your Team
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "52px", fontWeight: 600, color: GOLD, lineHeight: 1, marginBottom: "0.5rem" }}>
          {eventMember.team_number || "—"}
        </div>
        {eventMember.ministry && (
          <div style={{ fontSize: "13px", color: "#B8C0D0", fontFamily: SANS, letterSpacing: "0.06em" }}>
            {eventMember.ministry}
          </div>
        )}
      </div>

      {/* Co-leader */}
      <SectionLabel>Co-Leader</SectionLabel>
      {coLeader ? (
        <Card style={{ padding: "1rem 1.25rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: coLeader.phone ? "0.75rem" : 0 }}>
            <Avatar url={coLeader.photo_url} name={coLeader.full_name} size={48} />
            <div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>{coLeader.full_name}</div>
              {coLeader.church_id && (
                <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>
                  {coLeader.church_id}
                </div>
              )}
            </div>
          </div>
          {coLeader.phone && (
            <a
              href={`tel:${coLeader.phone}`}
              style={{
                display: "block", width: "100%", padding: "10px", textAlign: "center",
                background: ORANGE, color: "#fff", borderRadius: 8, textDecoration: "none",
                fontSize: "14px", fontWeight: 600, fontFamily: SANS,
              }}
            >
              Call {coLeader.full_name?.split(" ")[0]}
            </a>
          )}
        </Card>
      ) : (
        <Card style={{ padding: "1rem 1.25rem", marginBottom: "1rem", textAlign: "center" }}>
          <span style={{ fontSize: "13px", color: TSEC, fontFamily: SANS }}>Co-leader assignment coming soon.</span>
        </Card>
      )}

      {/* Coordinator */}
      <SectionLabel>Your Coordinator</SectionLabel>
      {coordinator ? (
        <Card style={{ padding: "1rem 1.25rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "0.75rem" }}>
            <Avatar url={coordinator.photo_url} name={coordinator.full_name} size={48} />
            <div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>{coordinator.full_name}</div>
              <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>Team Coordinator</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {coordinator.phone && (
              <a href={`tel:${coordinator.phone}`} style={contactBtnStyle(NAVY)}>Call</a>
            )}
            {coordinator.email && (
              <a href={`mailto:${coordinator.email}`} style={contactBtnStyle("transparent", NAVY, BORDER)}>Email</a>
            )}
          </div>
        </Card>
      ) : (
        <Card style={{ padding: "1rem 1.25rem", marginBottom: "1rem", textAlign: "center" }}>
          <span style={{ fontSize: "13px", color: TSEC, fontFamily: SANS }}>Coordinator info coming soon.</span>
        </Card>
      )}

      {/* Checklist */}
      <SectionLabel>Pre-Conference Checklist ({completedCount}/{checklist.length})</SectionLabel>
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: "1rem" }}>
        {checklist.map((item, i) => {
          const done = !!eventChecklist?.[item.id];
          return (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "1rem 1.25rem",
              borderBottom: i < checklist.length - 1 ? `1px solid ${BORDER}` : "none",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${done ? ORANGE : BORDER}`,
                background: done ? ORANGE : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {done && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
              </div>
              <span style={{
                fontSize: "14px", fontFamily: SANS,
                color: done ? TSEC : NAVY,
                textDecoration: done ? "line-through" : "none",
              }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </Card>
    </Shell>
  );
}

function BackBtn({ onBack }) {
  return (
    <button onClick={onBack} style={{
      background: "none", border: "none", color: TSEC,
      fontSize: "14px", cursor: "pointer", padding: "0 0 1rem 0",
      fontFamily: SANS, display: "block",
    }}>
      ‹ Back
    </button>
  );
}

function contactBtnStyle(bg, color = "#fff", border = "transparent") {
  return {
    flex: 1, padding: "10px", textAlign: "center",
    background: bg, color, border: `1px solid ${border}`,
    borderRadius: 8, textDecoration: "none",
    fontSize: "14px", fontWeight: 600, fontFamily: SANS,
  };
}
