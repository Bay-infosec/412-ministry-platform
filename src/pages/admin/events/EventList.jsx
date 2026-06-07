import { NAVY, ORANGE, GOLD, TSEC, BORDER, SANS, SERIF } from "../../../lib/constants.js";

const STATUS_COLORS = {
  active: { bg: "#E6F4EF", color: "#166534", label: "Active" },
  upcoming: { bg: "#EEF2FC", color: "#1A4FBF", label: "Upcoming" },
  archived: { bg: "#F3F4F6", color: "#6B7280", label: "Archived" },
};

export default function EventList({ data, onSelect }) {
  const { allEvents } = data;

  if (!allEvents || allEvents.length === 0) {
    return (
      <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, textAlign: "center", paddingTop: "3rem" }}>
        No events found.
      </div>
    );
  }

  const sorted = [...allEvents].sort((a, b) => {
    const order = { active: 0, upcoming: 1, archived: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
      {sorted.map((ev) => {
        const s = STATUS_COLORS[ev.status] || STATUS_COLORS.archived;
        return (
          <button
            key={ev.id}
            onClick={() => onSelect(ev)}
            style={{
              background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
              padding: "1.125rem 1.25rem", cursor: "pointer", textAlign: "left", width: "100%",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ fontFamily: SERIF, fontSize: "19px", fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
                {ev.name}
              </div>
              <span style={{
                fontSize: "11px", fontWeight: 700, padding: "3px 10px",
                borderRadius: 20, background: s.bg, color: s.color,
                fontFamily: SANS, flexShrink: 0, marginLeft: 8,
              }}>
                {s.label}
              </span>
            </div>
            {ev.dates && (
              <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS }}>{ev.dates}</div>
            )}
            {ev.location && (
              <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>{ev.location}</div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
              <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>
                {ev.type || "Conference"}
              </span>
              {ev.team_count && (
                <>
                  <span style={{ fontSize: "12px", color: TSEC }}>·</span>
                  <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>{ev.team_count} teams</span>
                </>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
