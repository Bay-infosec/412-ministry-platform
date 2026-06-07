import { ORANGE, TSEC, BORDER, SANS } from "../../lib/constants.js";

const ICONS = {
  home: "M3 12l9-9 9 9M5 10v10h14V10",
  event: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  events: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  updates: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  profile: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1",
};

export default function BottomNav({
  active,
  onNavigate,
  hasEvent,
  unreadCount,
  profilePhotoUrl,
  hasPublicEvents,
}) {
  const items = [
    { key: "home", label: "Home" },
    ...(hasEvent ? [{ key: "event", label: "Event" }] : []),
    ...(hasPublicEvents ? [{ key: "events", label: "Events" }] : []),
    { key: "updates", label: "Updates", badge: unreadCount > 0 },
    { key: "profile", label: "Profile" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#fff",
          borderTop: `1px solid ${BORDER}`,
          display: "flex",
          padding: "0.4rem 0 0.6rem",
        }}
      >
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onNavigate(it.key)}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.4rem 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              position: "relative",
            }}
          >
            <div style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {it.key === "profile" && profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt="Profile"
                  style={{
                    width: 30, height: 30, borderRadius: "50%", objectFit: "cover",
                    border: `2.5px solid ${active === "profile" ? ORANGE : "transparent"}`,
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={active === it.key ? ORANGE : TSEC}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={ICONS[it.key]} />
                </svg>
              )}
            </div>
            {it.badge && (
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  right: "50%",
                  marginRight: -18,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#E53E3E",
                }}
              />
            )}
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: active === it.key ? ORANGE : TSEC,
                fontFamily: SANS,
              }}
            >
              {it.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
