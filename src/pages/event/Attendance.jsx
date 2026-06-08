import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { TSEC, BORDER, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Avatar, SectionLabel } from "../../components/ui/index.js";

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function fmtDay(d) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getEventDates(activeEvent) {
  if (!activeEvent?.start_date || !activeEvent?.end_date) return [];
  const start = new Date(activeEvent.start_date + "T12:00:00");
  const end = new Date(activeEvent.end_date + "T12:00:00");
  const dates = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    dates.push(new Date(d));
  }
  return dates;
}

export default function Attendance({ data, onBack }) {
  const { activeEvent, profile, eventMember, isAdmin } = data;
  const myId = profile.id;
  const isCoordinator = eventMember?.event_role === "coordinator" || isAdmin;

  const eventDates = getEventDates(activeEvent);
  const todayKey = dateKey(new Date());
  const defaultDate = eventDates.find((d) => dateKey(d) === todayKey) ? todayKey
    : eventDates.length > 0 ? dateKey(eventDates[0]) : todayKey;

  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { loadMembers(); }, []);
  useEffect(() => { if (members.length) loadAttendance(selectedDate); }, [selectedDate, members]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  async function loadMembers() {
    if (!activeEvent?.id) return;
    let query = supabase
      .from("event_members")
      .select("id, profile_id, team_number, ministry, event_role, profiles!event_members_profile_id_fkey(id, full_name, photo_url)")
      .eq("event_id", activeEvent.id)
      .order("team_number");

    if (!isAdmin) {
      // Coordinator: only see team members they coordinate
      query = query.eq("coordinator_id", myId);
    }

    const { data: rows } = await query;
    setMembers((rows || []).filter((r) => r.profiles));
    setLoading(false);
  }

  async function loadAttendance(date) {
    if (!activeEvent?.id || !members.length) return;
    const profileIds = members.map((m) => m.profile_id);
    const { data: rows } = await supabase
      .from("event_attendance")
      .select("*")
      .eq("event_id", activeEvent.id)
      .eq("date", date)
      .in("profile_id", profileIds);

    const map = {};
    for (const r of rows || []) map[r.profile_id] = r;
    setAttendance(map);
  }

  async function toggleAttendance(member) {
    const pid = member.profile_id;
    const existing = attendance[pid];
    setChecking(pid);

    if (existing) {
      // Remove check-in
      await supabase.from("event_attendance").delete().eq("id", existing.id);
      setAttendance((prev) => { const n = { ...prev }; delete n[pid]; return n; });
      showToast(`${member.profiles.full_name} removed`);
    } else {
      // Add check-in
      const { data: row, error } = await supabase
        .from("event_attendance")
        .insert({
          event_id: activeEvent.id,
          profile_id: pid,
          date: selectedDate,
          checked_in_by: myId,
        })
        .select()
        .single();

      if (error) {
        showToast("Could not save — try again", "error");
      } else {
        setAttendance((prev) => ({ ...prev, [pid]: row }));
        showToast(`${member.profiles.full_name} checked in`);
      }
    }
    setChecking(null);
  }

  // Group members by team number
  const byTeam = {};
  for (const m of members) {
    const key = m.team_number || 0;
    if (!byTeam[key]) byTeam[key] = [];
    byTeam[key].push(m);
  }
  const teams = Object.keys(byTeam).sort((a, b) => Number(a) - Number(b));

  const totalMembers = members.length;
  const checkedIn = Object.keys(attendance).length;

  return (
    <Shell withNav>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "error" ? "#DC2626" : "#1B2A4A",
          color: "#fff", borderRadius: 10, padding: "10px 20px",
          fontSize: "13px", fontFamily: SANS, fontWeight: 600, zIndex: 9999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)", whiteSpace: "nowrap",
        }}>
          {toast.msg}
        </div>
      )}

      <button onClick={onBack} style={{ background: "none", border: "none", color: TSEC, fontSize: "14px", cursor: "pointer", padding: "0 0 1rem 0", fontFamily: SANS, display: "block" }}>
        ‹ Back
      </button>

      {/* Header */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.25rem" }}>
          {activeEvent?.name}
        </div>
        <div style={{ fontFamily: SANS, fontSize: "24px", fontWeight: 600, color: "#1B2A4A", lineHeight: 1.2 }}>
          Attendance
        </div>
      </div>

      {/* Summary bar */}
      {!loading && (
        <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
          <div style={{ flex: 1, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "0.75rem 1rem", textAlign: "center" }}>
            <div style={{ fontFamily: SANS, fontSize: "26px", fontWeight: 600, color: "#FF4D00" }}>{checkedIn}</div>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: TSEC, textTransform: "uppercase", fontFamily: SANS }}>Present</div>
          </div>
          <div style={{ flex: 1, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "0.75rem 1rem", textAlign: "center" }}>
            <div style={{ fontFamily: SANS, fontSize: "26px", fontWeight: 600, color: "#1B2A4A" }}>{totalMembers - checkedIn}</div>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: TSEC, textTransform: "uppercase", fontFamily: SANS }}>Absent</div>
          </div>
          <div style={{ flex: 1, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "0.75rem 1rem", textAlign: "center" }}>
            <div style={{ fontFamily: SANS, fontSize: "26px", fontWeight: 600, color: "#1B2A4A" }}>{totalMembers}</div>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: TSEC, textTransform: "uppercase", fontFamily: SANS }}>Total</div>
          </div>
        </div>
      )}

      {/* Date selector */}
      {eventDates.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {eventDates.map((d) => {
              const key = dateKey(d);
              const isSelected = key === selectedDate;
              const isToday = key === todayKey;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  style={{
                    flexShrink: 0,
                    padding: "7px 14px",
                    borderRadius: 20,
                    border: `1.5px solid ${isSelected ? "#1B2A4A" : BORDER}`,
                    background: isSelected ? "#1B2A4A" : "#fff",
                    color: isSelected ? "#fff" : "#1B2A4A",
                    fontFamily: SANS,
                    fontSize: "12px",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isToday ? "Today" : fmtDay(d)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Member list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 0" }}>
          <div style={{ width: 24, height: 24, border: `2px solid ${BORDER}`, borderTopColor: "#1B2A4A", borderRadius: "50%", animation: "spin412 0.7s linear infinite", margin: "0 auto" }} />
          <style>{`@keyframes spin412 { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", fontFamily: SANS, fontSize: "14px", color: TSEC }}>
          No team members to show.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {teams.map((teamKey) => (
            <div key={teamKey}>
              {(isAdmin || teams.length > 1) && (
                <SectionLabel>Team {teamKey}</SectionLabel>
              )}
              <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
                {byTeam[teamKey].map((m, i) => {
                  const isChecked = !!attendance[m.profile_id];
                  const record = attendance[m.profile_id];
                  const isChecking = checking === m.profile_id;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "0.875rem 1.25rem",
                        borderBottom: i < byTeam[teamKey].length - 1 ? `1px solid ${BORDER}` : "none",
                        background: isChecked ? "#F0FDF4" : "#fff",
                      }}
                    >
                      <Avatar url={m.profiles.photo_url} name={m.profiles.full_name} size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1B2A4A", fontFamily: SANS }}>{m.profiles.full_name}</div>
                        {record && (
                          <div style={{ fontSize: "11px", color: "#16A34A", fontFamily: SANS, marginTop: 2 }}>
                            Checked in at {fmtTime(record.checked_in_at)}
                          </div>
                        )}
                        {!record && (
                          <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>
                            {m.ministry ? `${m.ministry} Ministry` : "Not checked in"}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleAttendance(m)}
                        disabled={isChecking}
                        style={{
                          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                          border: isChecked ? "none" : `2px solid ${BORDER}`,
                          background: isChecked ? "#16A34A" : "#fff",
                          cursor: isChecking ? "default" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          opacity: isChecking ? 0.5 : 1,
                          transition: "all 0.15s",
                        }}
                      >
                        {isChecked && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: "1.5rem" }} />
    </Shell>
  );
}
