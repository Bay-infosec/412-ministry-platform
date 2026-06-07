import { useState } from "react";
import { NAVY, ORANGE, TSEC, BORDER, BG, SANS, SERIF } from "../../lib/constants.js";
import { Toast } from "../../components/ui/index.js";
import PeopleList from "./people/PeopleList.jsx";
import PersonDetail from "./people/PersonDetail.jsx";
import InviteFlow from "./people/InviteFlow.jsx";
import EventList from "./events/EventList.jsx";
import EventDetail from "./events/EventDetail.jsx";
import CoLeaderPairing from "./events/CoLeaderPairing.jsx";

export default function AdminShell({ data, onClose, onRefresh }) {
  const [screen, setScreen] = useState("home");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [toastData, setToastData] = useState({ msg: "", type: "success" });

  function showToast(msg, type = "success") {
    setToastData({ msg, type });
  }

  function nav(s, params = {}) {
    setScreen(s);
    if (params.profile !== undefined) setSelectedProfile(params.profile);
    if (params.event !== undefined) setSelectedEvent(params.event);
  }

  const titles = {
    home: "Admin",
    "people.list": "People",
    "people.detail": selectedProfile?.full_name || "Person",
    "people.invite": "Invite New Leader",
    "events.list": "Events",
    "events.detail": selectedEvent?.name || "Event",
    "events.pairing": "Co-leader Pairing",
  };

  const backs = {
    home: null,
    "people.list": "home",
    "people.detail": "people.list",
    "people.invite": "people.list",
    "events.list": "home",
    "events.detail": "events.list",
    "events.pairing": "events.detail",
  };

  const backTarget = backs[screen];

  return (
    <div style={{
      position: "fixed", inset: 0, background: BG, zIndex: 200,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "0.875rem 1.25rem", borderBottom: `1px solid ${BORDER}`,
        background: "#fff", flexShrink: 0,
      }}>
        <button
          onClick={() => backTarget ? nav(backTarget) : onClose()}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "4px 6px 4px 0", color: NAVY,
            display: "flex", alignItems: "center",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 600, color: NAVY, flex: 1 }}>
          {titles[screen] || "Admin"}
        </div>
        {screen === "people.list" && (
          <button
            onClick={() => nav("people.invite")}
            style={{
              background: ORANGE, color: "#fff", border: "none", borderRadius: 8,
              padding: "7px 14px", fontSize: "13px", fontWeight: 600,
              fontFamily: SANS, cursor: "pointer",
            }}
          >
            + Invite
          </button>
        )}
        {screen === "events.detail" && selectedEvent && (
          <button
            onClick={() => nav("events.pairing")}
            style={{
              background: NAVY, color: "#fff", border: "none", borderRadius: 8,
              padding: "7px 14px", fontSize: "13px", fontWeight: 600,
              fontFamily: SANS, cursor: "pointer",
            }}
          >
            Pairing
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "1.25rem", maxWidth: 600, margin: "0 auto" }}>
          {screen === "home" && (
            <AdminHome data={data} onNav={nav} />
          )}
          {screen === "people.list" && (
            <PeopleList
              data={data}
              onSelect={(p) => nav("people.detail", { profile: p })}
            />
          )}
          {screen === "people.detail" && selectedProfile && (
            <PersonDetail
              profile={selectedProfile}
              data={data}
              onRefresh={onRefresh}
              onToast={showToast}
              onDone={() => nav("people.list")}
            />
          )}
          {screen === "people.invite" && (
            <InviteFlow
              data={data}
              onSuccess={(msg) => { showToast(msg); onRefresh(); nav("people.list"); }}
              onToast={showToast}
            />
          )}
          {screen === "events.list" && (
            <EventList
              data={data}
              onSelect={(e) => nav("events.detail", { event: e })}
            />
          )}
          {screen === "events.detail" && selectedEvent && (
            <EventDetail
              event={selectedEvent}
              data={data}
              onRefresh={onRefresh}
              onToast={showToast}
            />
          )}
          {screen === "events.pairing" && selectedEvent && (
            <CoLeaderPairing
              event={selectedEvent}
              data={data}
              onRefresh={onRefresh}
              onToast={showToast}
            />
          )}
        </div>
      </div>

      <Toast
        message={toastData.msg}
        type={toastData.type}
        onDone={() => setToastData({ msg: "", type: "success" })}
      />
    </div>
  );
}

function AdminHome({ data, onNav }) {
  const { allProfiles, allEvents, pendingAnnouncements } = data;
  const activeEvent = (allEvents || []).find((e) => e.status === "active");
  const pendingCount = (pendingAnnouncements || []).length;

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{
          fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em",
          color: ORANGE, textTransform: "uppercase", fontFamily: SANS, marginBottom: 4,
        }}>
          412 Ministry
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "28px", fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
          Admin Panel
        </div>
        <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, marginTop: 4 }}>
          Manage your team and events.
        </div>
      </div>

      <EntryCard
        icon={<PeopleIcon />}
        iconBg="#EEF2FC"
        label="People"
        sub="Invite, manage & view all members"
        count={(allProfiles || []).length}
        onClick={() => onNav("people.list")}
      />
      <EntryCard
        icon={<EventIcon />}
        iconBg="#FFF7ED"
        label="Events"
        sub={activeEvent ? `Active: ${activeEvent.name}` : "Manage events & teams"}
        count={(allEvents || []).length}
        onClick={() => onNav("events.list")}
      />

      {pendingCount > 0 && (
        <div style={{
          background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 14,
          padding: "1rem 1.25rem", marginTop: "0.25rem",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ fontSize: "22px" }}>⏳</div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>
              {pendingCount} announcement{pendingCount > 1 ? "s" : ""} pending approval
            </div>
            <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>
              Open the Updates tab to review.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EntryCard({ icon, iconBg, label, sub, count, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", background: "#fff", border: `1px solid ${BORDER}`,
        borderRadius: 16, padding: "1.125rem 1.25rem", cursor: "pointer",
        marginBottom: "0.75rem", textAlign: "left",
        boxShadow: "0 1px 3px rgba(22,32,56,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "16px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>
            {label}
          </div>
          <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>
            {sub}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {count > 0 && (
            <span style={{
              fontSize: "12px", fontWeight: 700, color: "#374151",
              background: "#F3F4F6", borderRadius: 20,
              padding: "3px 10px", fontFamily: SANS,
            }}>
              {count}
            </span>
          )}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </button>
  );
}

function PeopleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A4FBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function EventIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
