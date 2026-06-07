import { useState } from "react";
import { TSEC, BORDER, SANS } from "../../lib/constants.js";
import { Toast } from "../../components/ui/index.js";
import PeopleList from "./people/PeopleList.jsx";
import PersonDetail from "./people/PersonDetail.jsx";
import InviteFlow from "./people/InviteFlow.jsx";
import EventList from "./events/EventList.jsx";
import EventDetail from "./events/EventDetail.jsx";
import EventEditor from "./events/EventEditor.jsx";
import CoLeaderPairing from "./events/CoLeaderPairing.jsx";
import { AnnouncementList, AnnouncementEditor } from "./announcements/index.js";
import { ChurchList, TrainingMaterials } from "./settings/index.js";
import SystemGroups from "./groups/SystemGroups.jsx";
import { ModeratorAssignments } from "./moderators/index.js";
import { AuditLog } from "./audit/index.js";

export default function AdminShell({ data, onClose, onRefresh, isAdmin = false }) {
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

  const [editingAnn, setEditingAnn] = useState(null); // null = list, {} = new, {id,...} = edit

  const titles = {
    home: "Admin",
    "people.list": "People",
    "people.detail": selectedProfile?.full_name || "Person",
    "people.invite": "Invite New Leader",
    "events.list": "Events",
    "events.new": "New Event",
    "events.detail": selectedEvent?.name || "Event",
    "events.pairing": "Co-leader Pairing",
    "announcements": editingAnn ? (editingAnn.id ? "Edit Announcement" : "New Announcement") : "Announcements",
    "settings": "Settings",
    "settings.churches": "Church List",
    "settings.materials": "Training Materials",
    "groups": "System Groups",
    "moderators": "Moderator Assignments",
    "audit": "Audit Log",
  };

  const backs = {
    home: null,
    "people.list": "home",
    "people.detail": "people.list",
    "people.invite": "people.list",
    "events.list": "home",
    "events.new": "events.list",
    "events.detail": "events.list",
    "events.pairing": "events.detail",
    "announcements": editingAnn ? null : "home",
    "settings": "home",
    "settings.churches": "settings",
    "settings.materials": "settings",
    "groups": "home",
    "moderators": "home",
    "audit": "home",
  };

  const handleAnnouncementsBack = () => {
    if (editingAnn) { setEditingAnn(null); return; }
    nav("home");
  };

  const backTarget = backs[screen];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#FAFAFA", zIndex: 200,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "0.875rem 1.25rem", borderBottom: `1px solid ${BORDER}`,
        background: "#fff", flexShrink: 0,
      }}>
        <button
          onClick={() => {
            if (screen === "announcements") { handleAnnouncementsBack(); return; }
            backTarget ? nav(backTarget) : onClose();
          }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "4px 6px 4px 0", color: "#111111",
            display: "flex", alignItems: "center",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 900, color: "#111111", flex: 1, letterSpacing: "-0.02em" }}>
          {titles[screen] || "Admin"}
        </div>
        {screen === "people.list" && isAdmin && (
          <button
            onClick={() => nav("people.invite")}
            style={{
              background: "#FF4D00", color: "#fff", border: "none", borderRadius: 8,
              padding: "7px 14px", fontSize: "13px", fontWeight: 600,
              fontFamily: SANS, cursor: "pointer",
            }}
          >
            + Invite
          </button>
        )}
        {screen === "events.list" && isAdmin && (
          <button
            onClick={() => nav("events.new")}
            style={{
              background: "#FF4D00", color: "#fff", border: "none", borderRadius: 8,
              padding: "7px 14px", fontSize: "13px", fontWeight: 600,
              fontFamily: SANS, cursor: "pointer",
            }}
          >
            + New
          </button>
        )}
        {screen === "events.detail" && selectedEvent && isAdmin && (
          <button
            onClick={() => nav("events.pairing")}
            style={{
              background: "#111111", color: "#fff", border: "none", borderRadius: 8,
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
            <AdminHome data={data} onNav={nav} isAdmin={isAdmin} />
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
              onToast={showToast}
              onRefresh={onRefresh}
            />
          )}
          {screen === "events.new" && (
            <EventEditor
              onSaved={() => { onRefresh(); nav("events.list"); }}
              onToast={showToast}
            />
          )}
          {screen === "events.detail" && selectedEvent && (
            <EventDetail
              event={selectedEvent}
              data={data}
              onRefresh={onRefresh}
              onToast={showToast}
              onBack={() => nav("events.list")}
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
          {screen === "announcements" && !editingAnn && (
            <AnnouncementList
              data={data}
              isAdmin={isAdmin}
              onNew={() => setEditingAnn({})}
              onEdit={(ann) => setEditingAnn(ann)}
              onToast={showToast}
            />
          )}
          {screen === "announcements" && editingAnn && (
            <AnnouncementEditor
              data={data}
              ann={editingAnn.id ? editingAnn : null}
              isAdmin={isAdmin}
              onSaved={() => { setEditingAnn(null); onRefresh(); }}
              onToast={showToast}
              onCancel={() => setEditingAnn(null)}
            />
          )}
          {screen === "settings" && (
            <SettingsHome onNav={nav} />
          )}
          {screen === "settings.churches" && (
            <ChurchList onToast={showToast} />
          )}
          {screen === "settings.materials" && (
            <TrainingMaterials onToast={showToast} />
          )}
          {screen === "groups" && (
            <SystemGroups data={data} onToast={showToast} />
          )}
          {screen === "moderators" && (
            <ModeratorAssignments data={data} onToast={showToast} />
          )}
          {screen === "audit" && (
            <AuditLog data={data} />
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

function AdminHome({ data, onNav, isAdmin }) {
  const { allProfiles, allEvents, allAnnouncements, pendingAnnouncements } = data;
  const activeEvent = (allEvents || []).find((e) => e.status === "active");
  const pendingCount = (pendingAnnouncements || []).length;

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS, marginBottom: 4 }}>
          412 Ministry
        </div>
        <div style={{ fontFamily: SANS, fontSize: "28px", fontWeight: 900, color: "#111111", lineHeight: 1.2, letterSpacing: "-0.03em" }}>
          {isAdmin ? "Admin Panel" : "Staff Panel"}
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
      <EntryCard
        icon={<AnnIcon />}
        iconBg="#F0FDF4"
        label="Announcements"
        sub={pendingCount > 0 ? `${pendingCount} pending approval` : "Post & manage announcements"}
        count={(allAnnouncements || []).length}
        badge={pendingCount > 0}
        onClick={() => onNav("announcements")}
      />
      {isAdmin && (
        <EntryCard
          icon={<SettingsIcon />}
          iconBg="#F5F3FF"
          label="Settings"
          sub="Churches & training materials"
          onClick={() => onNav("settings")}
        />
      )}
      {isAdmin && (
        <EntryCard
          icon={<GroupsIcon />}
          iconBg="#F0FDF4"
          label="System Groups"
          sub="Provision & sync platform chat groups"
          onClick={() => onNav("groups")}
        />
      )}
      {isAdmin && (
        <EntryCard
          icon={<ModeratorIcon />}
          iconBg="#EEF2FC"
          label="Moderators"
          sub="Assign moderators to events"
          onClick={() => onNav("moderators")}
        />
      )}
      {isAdmin && (
        <EntryCard
          icon={<AuditIcon />}
          iconBg="#F5F3FF"
          label="Audit Log"
          sub="View admin activity history"
          onClick={() => onNav("audit")}
        />
      )}
    </div>
  );
}

function EntryCard({ icon, iconBg, label, sub, count, badge, onClick }) {
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
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#111111", fontFamily: SANS }}>
            {label}
          </div>
          <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>
            {sub}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {badge && (
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff", background: "#E53E3E", borderRadius: 20, padding: "3px 10px", fontFamily: SANS }}>
              {count}
            </span>
          )}
          {!badge && count > 0 && (
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#374151", background: "#F3F4F6", borderRadius: 20, padding: "3px 10px", fontFamily: SANS }}>
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

function AnnIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" />
      <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function GroupsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SettingsHome({ onNav }) {
  return (
    <div>
      <EntryCard
        icon={<ChurchIcon />}
        iconBg="#EEF2FC"
        label="Church List"
        sub="Add, edit & approve church submissions"
        onClick={() => onNav("settings.churches")}
      />
      <EntryCard
        icon={<MaterialIcon />}
        iconBg="#FFF5EC"
        label="Training Materials"
        sub="Add, reorder & publish training content"
        onClick={() => onNav("settings.materials")}
      />
    </div>
  );
}

function ChurchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A4FBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 22H6a2 2 0 0 1-2-2V10l8-7 8 7v10a2 2 0 0 1-2 2z" />
      <path d="M9 22V12h6v10" />
      <line x1="12" y1="3" x2="12" y2="1" />
      <line x1="10" y1="2" x2="14" y2="2" />
    </svg>
  );
}

function MaterialIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8621A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ModeratorIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A4FBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M20 8v6" />
      <path d="M23 11h-6" />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="13" y2="15" />
      <circle cx="17" cy="19" r="3" />
      <line x1="21" y1="21" x2="19.5" y2="20.5" />
    </svg>
  );
}
