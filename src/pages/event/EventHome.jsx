import "./EventHome.css";

export default function EventHome({ data, onOpenPage, onNavigate }) {
  const { activeEvent, eventMember, profile, isAdmin } = data;

  if (!activeEvent) {
    return (
      <div className="eh-empty">
        <p>No active event right now.</p>
      </div>
    );
  }

  const isCoordinator =
    eventMember?.event_role === "coordinator" || isAdmin;

  const sections = [
    {
      id: "myteam",
      label: "My Team",
      icon: "◈",
      desc: eventMember?.team_number
        ? `Team ${eventMember.team_number}`
        : "Team assignment",
    },
    {
      id: "prayer_chain",
      label: "Prayer Chain",
      icon: "◇",
      desc: "Pray for one another",
    },
    {
      id: "the_four",
      label: "The Four",
      icon: "▣",
      desc: "Your four essentials",
    },
    {
      id: "field_guide",
      label: "Field Guide",
      icon: "◉",
      desc: "Resources and references",
    },
    {
      id: "chat",
      label: "Chat",
      icon: "◎",
      desc: "Team conversation",
    },
  ];

  if (isCoordinator) {
    sections.push({
      id: "coordinator",
      label: "My Teams",
      icon: "⬡",
      desc: "Overview of teams you oversee",
    });
  }

  return (
    <div className="eh-root">
      {/* Header */}
      <div className="eh-header">
        <div className="eh-header-bg" />
        <div className="eh-header-content">
          <span className="eh-event-tag">Active Event</span>
          <h1 className="eh-event-name">{activeEvent.name}</h1>
          <p className="eh-event-dates">
            {formatDateRange(activeEvent.start_date, activeEvent.end_date)}
          </p>
          {activeEvent.location && (
            <p className="eh-event-location">{activeEvent.location}</p>
          )}
          {activeEvent.verse && (
            <p className="eh-event-verse">"{activeEvent.verse}"</p>
          )}
        </div>
      </div>

      {/* Onboarding banner */}
      {eventMember && !eventMember.onboarding_completed && (
        <button
          className="eh-onboarding-banner"
          onClick={() => onOpenPage("onboarding")}
        >
          <div className="eh-ob-left">
            <span className="eh-ob-icon">✦</span>
            <div>
              <p className="eh-ob-title">Complete your onboarding</p>
              <p className="eh-ob-sub">A few quick steps to get you set up</p>
            </div>
          </div>
          <span className="eh-ob-arrow">›</span>
        </button>
      )}

      {/* Sections */}
      <div className="eh-sections">
        <p className="eh-sections-label">Sections</p>
        <div className="eh-section-list">
          {sections.map((s) => (
            <button
              key={s.id}
              className="eh-section-row"
              onClick={() => onOpenPage(s.id)}
            >
              <span className="eh-section-icon">{s.icon}</span>
              <div className="eh-section-text">
                <span className="eh-section-label">{s.label}</span>
                <span className="eh-section-desc">{s.desc}</span>
              </div>
              <span className="eh-section-arrow">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDateRange(start, end) {
  if (!start) return "";
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const opts = { month: "long", day: "numeric", year: "numeric" };
  if (!e) return s.toLocaleDateString("en-US", opts);
  if (
    s.getMonth() === e.getMonth() &&
    s.getFullYear() === e.getFullYear()
  ) {
    return `${s.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
}
