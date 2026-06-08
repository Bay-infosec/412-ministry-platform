import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase.js";
import { TSEC, BORDER, SANS } from "../../../lib/constants.js";
import { Avatar, Modal } from "../../../components/ui/index.js";

export default function CoLeaderPairing({ event, data, onRefresh, onToast }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [pendingA, setPendingA] = useState(null);
  const [pendingB, setPendingB] = useState(null);
  const [pendingUnpair, setPendingUnpair] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchLeaders();
  }, [event.id]);

  async function fetchLeaders() {
    setLoading(true);
    const { data: rows } = await supabase
      .from("event_members")
      .select("*, profiles!event_members_profile_id_fkey(id, full_name, photo_url, ministry_role)")
      .eq("event_id", event.id)
      .eq("event_role", "leader")
      .order("team_number");
    setLeaders(rows || []);
    setLoading(false);
  }

  function handleSelect(leader) {
    if (leader.co_leader_id) return;
    if (selectedId === leader.profile_id) {
      setSelectedId(null);
      return;
    }
    if (!selectedId) {
      setSelectedId(leader.profile_id);
      return;
    }
    const a = leaders.find((l) => l.profile_id === selectedId);
    const b = leader;
    setPendingA(a);
    setPendingB(b);
    setModal("pair");
  }

  async function confirmPair() {
    if (!pendingA || !pendingB) return;
    setBusy(true);
    await Promise.all([
      supabase.from("event_members").update({ co_leader_id: pendingB.profile_id }).eq("id", pendingA.id),
      supabase.from("event_members").update({ co_leader_id: pendingA.profile_id }).eq("id", pendingB.id),
    ]);
    setBusy(false);
    setModal(null);
    setSelectedId(null);
    setPendingA(null);
    setPendingB(null);
    onToast(`${pendingA.profiles?.full_name} & ${pendingB.profiles?.full_name} paired.`);
    await fetchLeaders();
    onRefresh();
  }

  async function confirmUnpair() {
    if (!pendingUnpair) return;
    setBusy(true);
    const partner = leaders.find((l) => l.profile_id === pendingUnpair.co_leader_id);
    const ops = [
      supabase.from("event_members").update({ co_leader_id: null }).eq("id", pendingUnpair.id),
    ];
    if (partner) {
      ops.push(supabase.from("event_members").update({ co_leader_id: null }).eq("id", partner.id));
    }
    await Promise.all(ops);
    setBusy(false);
    setModal(null);
    setPendingUnpair(null);
    onToast("Co-leaders unpaired.", "info");
    await fetchLeaders();
    onRefresh();
  }

  if (loading) {
    return (
      <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, textAlign: "center", paddingTop: "3rem" }}>
        Loading leaders…
      </div>
    );
  }

  // Build paired pairs (deduplicated)
  const paired = [];
  const seenIds = new Set();
  for (const l of leaders) {
    if (l.co_leader_id && !seenIds.has(l.profile_id)) {
      const partner = leaders.find((x) => x.profile_id === l.co_leader_id);
      if (partner) {
        paired.push({ a: l, b: partner });
        seenIds.add(l.profile_id);
        seenIds.add(partner.profile_id);
      }
    }
  }
  const unpaired = leaders.filter((l) => !l.co_leader_id);

  const selectedLeader = leaders.find((l) => l.profile_id === selectedId);

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>
          {unpaired.length === 0
            ? "All leaders are paired."
            : `Tap two unpaired leaders to pair them. ${unpaired.length} unpaired.`}
        </div>
      </div>

      {/* Selected indicator */}
      {selectedLeader && (
        <div style={{
          background: "#EEF2FC", border: "1.5px solid #93C5FD", borderRadius: 12,
          padding: "0.75rem 1.25rem", marginBottom: "1rem",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Avatar url={selectedLeader.profiles?.photo_url} name={selectedLeader.profiles?.full_name} size={32} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#111111", fontFamily: SANS }}>
              {selectedLeader.profiles?.full_name} selected
            </div>
            <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>
              Now tap their co-leader to pair them.
            </div>
          </div>
          <button onClick={() => setSelectedId(null)} style={{
            background: "none", border: "none", color: TSEC,
            fontSize: "13px", cursor: "pointer", fontFamily: SANS,
          }}>
            Cancel
          </button>
        </div>
      )}

      {/* Unpaired leaders */}
      {unpaired.length > 0 && (
        <>
          <div style={{
            fontSize: "11px", fontWeight: 700, color: TSEC,
            letterSpacing: "0.1em", fontFamily: SANS, textTransform: "uppercase",
            marginBottom: "0.5rem",
          }}>
            Unpaired ({unpaired.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
            {unpaired.map((l) => {
              const isSelected = selectedId === l.profile_id;
              return (
                <button
                  key={l.id}
                  onClick={() => handleSelect(l)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                    background: isSelected ? "#EEF2FC" : "#fff",
                    border: `1.5px solid ${isSelected ? "#93C5FD" : BORDER}`,
                    borderRadius: 14, padding: "0.875rem 1rem",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <Avatar url={l.profiles?.photo_url} name={l.profiles?.full_name} size={42} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#111111", fontFamily: SANS }}>
                      {l.profiles?.full_name}
                    </div>
                    <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>
                      Team {l.team_number || "—"} · {l.ministry || "No ministry"}
                    </div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    border: `2px solid ${isSelected ? "#3B82F6" : BORDER}`,
                    background: isSelected ? "#3B82F6" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Paired pairs */}
      {paired.length > 0 && (
        <>
          <div style={{
            fontSize: "11px", fontWeight: 700, color: TSEC,
            letterSpacing: "0.1em", fontFamily: SANS, textTransform: "uppercase",
            marginBottom: "0.5rem",
          }}>
            Paired ({paired.length * 2} leaders)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {paired.map(({ a, b }) => (
              <div key={a.id} style={{
                background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
                padding: "0.875rem 1rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <LeaderChip leader={a} />
                  <div style={{ fontSize: "18px", color: TSEC }}>+</div>
                  <LeaderChip leader={b} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>
                    Team {a.team_number || "—"} · {a.ministry || "No ministry"}
                  </div>
                  <button
                    onClick={() => { setPendingUnpair(a); setModal("unpair"); }}
                    style={{
                      background: "none", border: "none", color: "#DC2626",
                      fontSize: "12px", cursor: "pointer", fontFamily: SANS,
                      fontWeight: 600,
                    }}
                  >
                    Unpair
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pair confirm */}
      {modal === "pair" && pendingA && pendingB && (
        <div style={overlay}>
          <div style={sheet}>
            <div style={{ fontFamily: SANS, fontSize: "22px", fontWeight: 600, color: "#111111", marginBottom: "1rem" }}>
              Confirm Pairing
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.25rem" }}>
              <LeaderCard leader={pendingA} />
              <div style={{ fontSize: "20px", color: TSEC, flexShrink: 0 }}>+</div>
              <LeaderCard leader={pendingB} />
            </div>
            <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.6, marginBottom: "1.25rem" }}>
              They will be set as co-leaders for Team {pendingA.team_number || "—"} · {pendingA.ministry || "no ministry"}.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setModal(null); setPendingA(null); setPendingB(null); setSelectedId(null); }} style={{
                flex: 1, background: "none", border: `1px solid ${BORDER}`, borderRadius: 10,
                padding: "12px", fontSize: "14px", fontWeight: 600, color: "#111111",
                cursor: "pointer", fontFamily: SANS,
              }}>Cancel</button>
              <button onClick={confirmPair} disabled={busy} style={{
                flex: 1, background: busy ? "#CCCCCC" : "#FF4D00", border: "none", borderRadius: 10,
                padding: "12px", fontSize: "14px", fontWeight: 600, color: "#fff",
                cursor: busy ? "default" : "pointer", fontFamily: SANS,
              }}>
                {busy ? "Pairing…" : "Confirm Pair"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpair confirm */}
      {modal === "unpair" && pendingUnpair && (
        <Modal
          title="Unpair Co-leaders"
          message={`Remove the co-leader pairing for ${pendingUnpair.profiles?.full_name}? Both leaders will become unpaired.`}
          confirmLabel="Unpair"
          variant="danger"
          onCancel={() => { setModal(null); setPendingUnpair(null); }}
          onConfirm={confirmUnpair}
          busy={busy}
        />
      )}
    </div>
  );
}

function LeaderChip({ leader }) {
  const p = leader.profiles || {};
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
      <Avatar url={p.photo_url} name={p.full_name} size={32} />
      <div style={{
        fontSize: "13px", fontWeight: 600, color: "#111111", fontFamily: SANS,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {p.full_name?.split(" ")[0]}
      </div>
    </div>
  );
}

function LeaderCard({ leader }) {
  const p = leader.profiles || {};
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <Avatar url={p.photo_url} name={p.full_name} size={48} />
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#111111", fontFamily: SANS, marginTop: 4 }}>
        {p.full_name?.split(" ")[0]}
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(22,32,56,0.6)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 500, padding: "1.5rem",
};

const sheet = {
  background: "#fff", borderRadius: 20, padding: "1.75rem",
  maxWidth: 360, width: "100%",
};
