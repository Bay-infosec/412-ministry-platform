import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase.js";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, SERIF, SANS } from "../../../lib/constants.js";
import { Avatar, SectionLabel } from "../../../components/ui/index.js";

const SYSTEM_GROUPS = [
  {
    key: "board",
    name: "412 Board",
    desc: "Members with the 412 Board tag",
    color: "#162038",
    textColor: "#EFAB25",
    getMembers: (allProfiles) =>
      allProfiles.filter((p) => (p.tags || []).includes("board_member")),
  },
  {
    key: "public",
    name: "Public Chat",
    desc: "Everyone on the platform",
    color: "#059669",
    textColor: "#fff",
    getMembers: (allProfiles) => allProfiles,
  },
  {
    key: "staff",
    name: "Admin & Moderators",
    desc: "Platform staff only",
    color: "#1A4FBF",
    textColor: "#fff",
    getMembers: (allProfiles) =>
      allProfiles.filter((p) => p.platform_role === "admin" || p.platform_role === "moderator"),
  },
];

export default function SystemGroups({ data, onToast }) {
  const { allProfiles, activeEvent, profile: myProfile, allEventMembers } = data;
  const myId = myProfile.id;

  const [groups, setGroups] = useState([]);
  const [syncing, setSyncing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const keys = SYSTEM_GROUPS.map((g) => g.key);
    if (activeEvent) keys.push(`event_${activeEvent.id}`);

    const { data: rows } = await supabase
      .from("conversations")
      .select("id, system_key, group_name, last_message_at")
      .in("system_key", keys);

    // Count members per group
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

    const byKey = Object.fromEntries((rows || []).map((r) => [r.system_key, { ...r, memberCount: countMap[r.id] || 0 }]));
    setGroups(byKey);
    setLoading(false);
  }

  async function syncGroup(cfg, members) {
    setSyncing(cfg.key);
    try {
      // Upsert conversation
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

      // Upsert all members
      const rows = members.map((p) => ({ conversation_id: convId, profile_id: p.id }));
      if (rows.length) {
        await supabase.from("conversation_participants").upsert(rows, { onConflict: "conversation_id,profile_id" });
      }
      onToast(`${cfg.name} synced — ${members.length} members.`);
    } catch (e) {
      onToast(`Sync failed for ${cfg.name}`, "error");
    }
    setSyncing(null);
    await load();
  }

  async function syncEventGroup() {
    if (!activeEvent) return;
    setSyncing(`event_${activeEvent.id}`);
    try {
      const key = `event_${activeEvent.id}`;
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

      // Add all event members
      const eventIds = (allEventMembers || [])
        .filter((m) => m.event_id === activeEvent.id)
        .map((m) => ({ conversation_id: convId, profile_id: m.profile_id }));

      if (eventIds.length) {
        await supabase.from("conversation_participants").upsert(eventIds, { onConflict: "conversation_id,profile_id" });
      }
      onToast(`${name} synced — ${eventIds.length} members.`);
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
      desc: "All event members (admin adds moderators manually)",
      color: "#E8621A",
      textColor: "#fff",
      isEvent: true,
    }] : []),
  ];

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 600, color: NAVY, marginBottom: 4 }}>
          System Groups
        </div>
        <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>
          These groups are permanent and managed by the platform. Sync updates membership based on current tags and roles.
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: TSEC, fontFamily: SANS, fontSize: "14px" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {allCfgs.map((cfg) => {
            const existing = groups[cfg.key];
            const isSyncing = syncing === cfg.key;
            const members = cfg.isEvent ? null : cfg.getMembers(allProfiles || []);
            const memberCount = existing?.memberCount ?? (members?.length ?? "—");

            return (
              <div key={cfg.key} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "1rem 1.25rem" }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%", background: cfg.color, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "13px", fontWeight: 700, color: cfg.textColor, fontFamily: SANS,
                  }}>
                    {cfg.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: NAVY, fontFamily: SANS }}>{cfg.name}</div>
                    <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 2 }}>{cfg.desc}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 600, color: NAVY }}>{memberCount}</div>
                    <div style={{ fontSize: "10px", color: TSEC, fontFamily: SANS }}>members</div>
                  </div>
                </div>
                <div style={{ borderTop: `1px solid ${BORDER}`, padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FAFAF9" }}>
                  <span style={{ fontSize: "12px", color: existing ? "#059669" : TSEC, fontFamily: SANS, fontWeight: existing ? 700 : 400 }}>
                    {existing ? "Group exists" : "Not created yet"}
                  </span>
                  <button
                    onClick={() => cfg.isEvent ? syncEventGroup() : syncGroup(cfg, members)}
                    disabled={isSyncing}
                    style={{
                      background: NAVY, color: "#fff", border: "none", borderRadius: 8,
                      padding: "7px 16px", fontSize: "12px", fontWeight: 700,
                      fontFamily: SANS, cursor: isSyncing ? "default" : "pointer",
                      opacity: isSyncing ? 0.6 : 1,
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

      <div style={{ background: "#FFF5EC", border: `1px solid ${ORANGE}44`, borderRadius: 12, padding: "0.875rem 1.25rem", marginTop: "1.25rem" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: ORANGE, fontFamily: SANS, marginBottom: 4 }}>After syncing</div>
        <div style={{ fontSize: "12px", color: NAVY, fontFamily: SANS, lineHeight: 1.6 }}>
          Members will see these groups in their messenger automatically. Re-sync any time to add new members.
          To add specific moderators to the Event Group, sync first, then use the messenger to add individuals.
        </div>
      </div>
    </div>
  );
}
