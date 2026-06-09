import { useState, useRef } from "react";
import { supabase } from "../../../lib/supabase.js";
import { TSEC, BORDER, SANS } from "../../../lib/constants.js";
import { Modal } from "../../../components/ui/index.js";
import { getTypeConfig } from "../../../lib/eventTypes.js";

const STATUS_COLORS = {
  active:   { bg: "#E6F4EF", color: "#166534", label: "Active" },
  scheduled:{ bg: "#DBEAFE", color: "#1D4ED8", label: "Scheduled" },
  inactive: { bg: "#FEF3C7", color: "#92400E", label: "Inactive" },
  archived: { bg: "#F3F4F6", color: "#6B7280", label: "Archived" },
};

export default function EventList({ data, onSelect, onToast, onRefresh }) {
  const { allEvents } = data;
  const [confirm, setConfirm] = useState(null); // { action, event }
  const [busy, setBusy] = useState(false);

  if (!allEvents || allEvents.length === 0) {
    return (
      <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, textAlign: "center", paddingTop: "3rem" }}>
        No events yet.
      </div>
    );
  }

  const sorted = [...allEvents].sort((a, b) => {
    const statusFor = (event) => isEventScheduled(event) ? "scheduled" : event.status;
    const order = { active: 0, scheduled: 1, inactive: 2, archived: 3 };
    const statusDiff = (order[statusFor(a)] ?? 4) - (order[statusFor(b)] ?? 4);
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.publish_at || a.start_date || 0) - new Date(b.publish_at || b.start_date || 0);
  });

  async function handleConfirm() {
    if (!confirm) return;
    setBusy(true);
    const ev = confirm.event;

    if (confirm.action === "activate") {
      await supabase.from("events").update({
        status: "active",
        publish_at: null,
        published_at: new Date().toISOString(),
      }).eq("id", ev.id);
      onToast?.(`"${ev.name}" is now active.`);
    } else if (confirm.action === "delete") {
      const { data: mRows } = await supabase.from("event_members").select("id").eq("event_id", ev.id);
      if (mRows?.length) {
        await supabase.from("event_checklist").delete().in("event_member_id", mRows.map((m) => m.id));
      }
      await supabase.from("event_members").delete().eq("event_id", ev.id);
      await supabase.from("events").delete().eq("id", ev.id);
      onToast?.(`"${ev.name}" deleted.`, "info");
    }

    setBusy(false);
    setConfirm(null);
    onRefresh?.();
  }

  async function duplicate(ev) {
    const { id, created_at, status, publish_at, published_at, ...fields } = ev;
    await supabase.from("events").insert({ ...fields, status: "inactive", publish_at: null, published_at: null });
    onToast?.(`Duplicated "${ev.name}".`);
    onRefresh?.();
  }

  async function cancelSchedule(ev) {
    await supabase.from("events").update({ publish_at: null }).eq("id", ev.id);
    onToast?.(`Schedule canceled for "${ev.name}".`, "info");
    onRefresh?.();
  }

  function getActions(ev) {
    const actions = [];
    if (isEventScheduled(ev)) {
      actions.push({ key: "cancel", label: "Cancel", bg: "#6B7280", color: "#fff", onPress: () => cancelSchedule(ev) });
    }
    if (ev.status === "inactive" || ev.status === "archived") {
      actions.push({ key: "activate", label: "Activate", bg: "#22C55E", color: "#fff", onPress: () => setConfirm({ action: "activate", event: ev }) });
    }
    if (ev.status === "active" || ev.status === "inactive") {
      actions.push({ key: "duplicate", label: "Duplicate", bg: "#3B82F6", color: "#fff", onPress: () => duplicate(ev) });
    }
    if (ev.status === "inactive") {
      actions.push({ key: "delete", label: "Delete", bg: "#EF4444", color: "#fff", onPress: () => setConfirm({ action: "delete", event: ev }) });
    }
    return actions;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
      {sorted.map((ev) => {
        const actions = getActions(ev);
        return (
          <SwipeCard key={ev.id} actions={actions} onTap={() => onSelect(ev)}>
            <EventCard ev={ev} />
          </SwipeCard>
        );
      })}

      {confirm && (
        <Modal
          title={confirm.action === "activate" ? "Activate Event" : "Delete Event"}
          message={
            confirm.action === "activate"
              ? `Make "${confirm.event.name}" active? Other active events will not be affected.`
              : `Permanently delete "${confirm.event.name}"? All member data for this event will be removed.`
          }
          confirmLabel={confirm.action === "activate" ? "Activate" : "Delete"}
          variant={confirm.action === "delete" ? "danger" : undefined}
          onCancel={() => setConfirm(null)}
          onConfirm={handleConfirm}
          busy={busy}
        />
      )}
    </div>
  );
}

function EventCard({ ev }) {
  const scheduled = isEventScheduled(ev);
  const s = STATUS_COLORS[scheduled ? "scheduled" : ev.status] || STATUS_COLORS.archived;
  const tc = getTypeConfig(ev.type);
  return (
    <div style={{
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
      padding: "1rem 1.25rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontFamily: SANS, fontSize: "18px", fontWeight: 800, color: "#1B2A4A", lineHeight: 1.2, flex: 1, marginRight: 8 }}>
          {ev.name}
        </div>
        <span style={{
          fontSize: "10px", fontWeight: 700, padding: "3px 9px",
          borderRadius: 20, background: s.bg, color: s.color,
          fontFamily: SANS, flexShrink: 0,
        }}>
          {s.label}
        </span>
      </div>
      {ev.dates && (
        <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginBottom: 2 }}>{ev.dates}</div>
      )}
      {ev.location && (
        <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginBottom: 6 }}>{ev.location}</div>
      )}
      {scheduled && (
        <div style={{ fontSize: "11px", color: "#1D4ED8", fontWeight: 700, fontFamily: SANS, marginBottom: 6 }}>
          Publishes {formatScheduleDate(ev.publish_at)}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
        <span style={{
          fontSize: "10px", fontWeight: 700, background: tc.bg, color: tc.color,
          borderRadius: 20, padding: "2px 9px", fontFamily: SANS,
        }}>
          {tc.label}
        </span>
        {ev.team_count > 0 && (
          <span style={{ fontSize: "11px", color: TSEC, fontFamily: SANS }}>· {ev.team_count} teams</span>
        )}
      </div>
    </div>
  );
}

function isEventScheduled(event) {
  return event.status === "inactive" && Boolean(event.publish_at);
}

function formatScheduleDate(value) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SwipeCard({ children, actions, onTap }) {
  const ACTION_W = actions.length * 76;
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef(null);
  const isHoriz = useRef(null);
  const revealed = x < -ACTION_W * 0.5;

  function onTouchStart(e) {
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, baseX: x };
    isHoriz.current = null;
    setDragging(true);
  }

  function onTouchMove(e) {
    if (!start.current) return;
    const dx = e.touches[0].clientX - start.current.x;
    const dy = e.touches[0].clientY - start.current.y;
    if (isHoriz.current === null) {
      if (Math.abs(dy) > Math.abs(dx) + 4) { isHoriz.current = false; return; }
      if (Math.abs(dx) > 8) isHoriz.current = true;
      return;
    }
    if (!isHoriz.current) return;
    e.preventDefault();
    const newX = Math.max(-ACTION_W, Math.min(0, start.current.baseX + dx));
    setX(newX);
  }

  function onTouchEnd() {
    setDragging(false);
    if (!start.current || isHoriz.current !== true) { start.current = null; return; }
    const moved = Math.abs(x - start.current.baseX);
    if (moved < 4) { onTap(); setX(0); }
    else if (x < -ACTION_W * 0.4) setX(-ACTION_W);
    else setX(0);
    start.current = null;
  }

  function onClick() {
    if (x !== 0) { setX(0); return; }
    onTap();
  }

  if (actions.length === 0) {
    return <div onClick={onTap} style={{ cursor: "pointer" }}>{children}</div>;
  }

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 14 }}>
      {/* Action buttons */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: ACTION_W, display: "flex" }}>
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={(e) => { e.stopPropagation(); setX(0); a.onPress(); }}
            style={{
              flex: 1, border: "none", background: a.bg, color: a.color,
              fontSize: "11px", fontWeight: 700, fontFamily: SANS, cursor: "pointer",
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
      {/* Sliding card */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onClick}
        style={{
          transform: `translateX(${x}px)`,
          transition: dragging ? "none" : "transform 0.22s ease",
          cursor: "pointer",
          position: "relative",
          userSelect: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
