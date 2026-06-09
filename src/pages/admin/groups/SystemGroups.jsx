import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase.js";
import { TSEC, BORDER, SANS } from "../../../lib/constants.js";
import { Avatar } from "../../../components/ui/index.js";

const SYSTEM_GROUPS = [
  {
    key: "board",
    name: "412 Board",
    desc: "Members with the 412 Board tag",
    color: "#1B2A4A",
    textColor: "#FF4D00",
    fetchMembers: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, photo_url, tags").order("full_name");
      return (data || []).filter((p) => (p.tags || []).includes("board_member"));
    },
  },
  {
    key: "pastors",
    name: "Pastors",
    desc: "Members with the Pastor tag",
    color: "#065F46",
    textColor: "#D1FAE5",
    fetchMembers: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, photo_url, tags").order("full_name");
      return (data || []).filter((p) => (p.tags || []).includes("pastor"));
    },
  },
  {
    key: "public",
    name: "Public Chat",
    desc: "Everyone on the platform",
    color: "#059669",
    textColor: "#fff",
    fetchMembers: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, photo_url").order("full_name");
      return data || [];
    },
  },
  {
    key: "staff",
    name: "Admin & Moderators",
    desc: "Platform staff only",
    color: "#1A4FBF",
    textColor: "#fff",
    fetchMembers: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, photo_url").in("platform_role", ["admin", "moderator"]).order("full_name");
      return data || [];
    },
  },
];

export default function SystemGroups({ data, onToast }) {
  const { activeEvent, profile: myProfile, allEventMembers } = data;
  const myId = myProfile.id;

  const [groups, setGroups] = useState({});
  const [syncing, setSyncing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedKey, setExpandedKey] = useState(null);
  const [memberLists, setMemberLists] = useState({});
  const [loadingMembers, setLoadingMembers] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const keys = SYSTEM_GROUPS.map((g) => g.key);
    if (activeEvent) keys.push(`event_${activeEvent.id}`);

    const { data: rows } = await supabase
      .from("conversations")
      .select("id, system_key, group_name, last_message_at")
      .in("system_key", keys);

    const ids = (rows || []).map((r) => r.id);
    let countMap = {};
    if (ids.length) {
      const { data: cpRows } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .in("conversation_id", ids);
      for (const r of cpRows || []) {
        countMap[r.conversation_id] = (countMap[r.conversation_id] || 0) + 1;
      }
    }

    const byKey = Object.fromEntries(
      (rows || []).map((r) => [r.system_key, { ...r, memberCount: countMap[r.id] || 0 }])
    );
    setGroups(byKey);
    setLoading(false);
  }

  async function loadMemberList(convId, key) {
    setLoadingMembers(key);
    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("profile_id")
      .eq("conversation_id", convId);
    const ids = (parts || []).map((p) => p.profile_id);
    if (!ids.length) {
      setMemberLists((prev) => ({ ...prev, [key]: [] }));
      setLoadingMembers(null);
      return;
    }
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, photo_url")
      .in("id", ids)
      .order("full_name");
    setMemberLists((prev) => ({ ...prev, [key]: profiles || [] }));
    setLoadingMembers(null);
  }

  function toggleExpand(key, convId) {
    if (expandedKey === key) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(key);
    if (convId && !memberLists[key]) loadMemberList(convId, key);
  }

  async function syncGroup(cfg) {
    setSyncing(cfg.key);
    try {
      const members = await cfg.fetchMembers();

      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("system_key", cfg.key)
        .maybeSingle();

      let convId = existing?.id;
      if (!convId) {
        const { data: created } = await supabase
          .from("conversations")
          .insert({
            is_group: true,
            group_name: cfg.name,
            created_by: myId,
            participant_a: myId,
            participant_b: myId,
            system_key: cfg.key,
          })
          .select("id")
          .single();
        convId = created?.id;
      }
      if (!convId) { onToast(`Failed to create ${cfg.name}`, "error"); setSyncing(null); return; }

      const rows = members.map((p) => ({ conversation_id: convId, profile_id: p.id }));
      if (rows.length) {
        await supabase.from("conversation_participants").upsert(rows, { onConflict: "conversation_id,profile_id" });
      }

      // Refresh member list if expanded
      setMemberLists((prev) => ({ ...prev, [cfg.key]: undefined }));
      if (expandedKey === cfg.key) loadMemberList(convId, cfg.key);

      onToast(`${cfg.name} synced — ${members.length} members.`);
    } catch {
      onToast(`Sync failed for ${cfg.name}`, "error");
    }
    setSyncing(null);
    await load();
  }

  async function syncEventGroup() {
    if (!activeEvent) return;
    const key = `event_${activeEvent.id}`;
    setSyncing(key);
    try {
      const name = `${activeEvent.name} Group`;

      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("system_key", key)
        .maybeSingle();

      let convId = existing?.id;
      if (!convId) {
        const { data: created } = await supabase
          .from("conversations")
          .insert({
            is_group: true,
            group_name: name,
            created_by: myId,
            participant_a: myId,
            participant_b: myId,
            system_key: key,
          })
          .select("id")
          .single();
        convId = created?.id;
      }
      if (!convId) { onToast("Failed to create event group", "error"); setSyncing(null); return; }

      const eventParticipants = (allEventMembers || [])
        .filter((m) => m.event_id === activeEvent.id)
        .map((m) => ({ conversation_id: convId, profile_id: m.profile_id }));

      if (eventParticipants.length) {
        await supabase.from("conversation_participants").upsert(eventParticipants, { onConflict: "conversation_id,profile_id" });
      }

      setMemberLists((prev) => ({ ...prev, [key]: undefined }));
      if (expandedKey === key) loadMemberList(convId, key);

      onToast(`${name} synced — ${eventParticipants.length} members.`);
    } catch {
      onToast("Sync failed for event group", "error");
    }
    setSyncing(null);
    await load();
  }

  const allCfgs = [
    ...SYSTEM_GROUPS,
    ...(activeEvent ? [{
      key: `event_${activeEvent.id}`,
      name: `${activeEvent.name} Group`,
      desc: "All event members",
      color: "#FF4D00",
      textColor: "#fff",
      isEvent: true,
    }] : []),
  ];

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontFamily: SANS, fontSize: "22px", fontWeight: 900, color: "#1B2A4A", marginBottom: 4, letterSpacing: "-0.02em" }}>
          System Groups
        </div>
        <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>
          Permanent groups managed by the platform. Sync pulls fresh data from the database every time.
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: TSEC, fontFamily: SANS, fontSize: "14px" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {allCfgs.map((cfg) => {
            const existing = groups[cfg.key];
            const isSyncing = syncing === cfg.key;
            const isExpanded = expandedKey === cfg.key;
            const memberCount = existing?.memberCount ?? "—";
            const memberList = memberLists[cfg.key];

            return (
              <div key={cfg.key} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
                {/* Header row */}
                <button
                  onClick={() => toggleExpand(cfg.key, existing?.id)}
                  style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "1rem 1.25rem", textAlign: "left" }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%", background: cfg.color, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "13px", fontWeight: 700, color: cfg.textColor, fontFamily: SANS,
                  }}>
                    {cfg.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#1B2A4A", fontFamily: SANS }}>{cfg.name}</div>
                    <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>{cfg.desc}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginRight: 4 }}>
                    <div style={{ fontFamily: SANS, fontSize: "22px", fontWeight: 900, color: "#1B2A4A" }}>{memberCount}</div>
                    <div style={{ fontSize: "10px", color: TSEC, fontFamily: SANS }}>members</div>
                  </div>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke={TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Expanded member list */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${BORDER}`, padding: "0.75rem 1.25rem" }}>
                    {!existing ? (
                      <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, fontStyle: "italic" }}>
                        Group not created yet. Sync to create it.
                      </div>
                    ) : loadingMembers === cfg.key ? (
                      <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>Loading members…</div>
                    ) : !memberList || memberList.length === 0 ? (
                      <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, fontStyle: "italic" }}>
                        No members yet. Sync to add members.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {memberList.map((m) => (
                          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FAFAFA", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "4px 10px 4px 4px" }}>
                            <Avatar url={m.photo_url} name={m.full_name} size={22} />
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#1B2A4A", fontFamily: SANS }}>
                              {m.full_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer: status + sync button */}
                <div style={{ borderTop: `1px solid ${BORDER}`, padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FAFAFA" }}>
                  <span style={{ fontSize: "12px", color: existing ? "#059669" : TSEC, fontFamily: SANS, fontWeight: existing ? 700 : 400 }}>
                    {existing ? "Group exists" : "Not created yet"}
                  </span>
                  <button
                    onClick={() => cfg.isEvent ? syncEventGroup() : syncGroup(cfg)}
                    disabled={isSyncing}
                    style={{
                      background: isSyncing ? "#CCCCCC" : "#FF4D00", color: "#fff", border: "none", borderRadius: 8,
                      padding: "7px 16px", fontSize: "12px", fontWeight: 700,
                      fontFamily: SANS, cursor: isSyncing ? "default" : "pointer",
                    }}
                  >
                    {isSyncing ? "Syncing…" : existing ? "Sync members" : "Create & sync"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ background: "#111", borderRadius: 12, padding: "0.875rem 1.25rem", marginTop: "1.25rem" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#FF4D00", fontFamily: SANS, marginBottom: 4 }}>After syncing</div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontFamily: SANS, lineHeight: 1.6 }}>
          Members will see these groups in their messenger automatically. Re-sync any time tags or roles change — sync always reads fresh data from the database.
        </div>
      </div>
    </div>
  );
}
