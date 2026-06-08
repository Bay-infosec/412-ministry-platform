import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase.js";
import { TSEC, BORDER, SANS } from "../../lib/constants.js";
import { Avatar } from "../../components/ui/index.js";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtTime(ts) {
  const d = new Date(ts), now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtFull(ts) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function GroupAvatar({ name, size = 48 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: "#111111",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    </div>
  );
}

// ── Main router ───────────────────────────────────────────────────────────────

export default function Chat({ data, onClose, onOpenProfile, onlineUsers = [] }) {
  const { profile, activeEvent } = data;
  const myId = profile.id;
  const canCreateGroup = profile.platform_role === "admin" || profile.platform_role === "moderator";

  const [view, setView] = useState("home");
  const [activeThread, setActiveThread] = useState(null);

  const openThread = (conv) => { setActiveThread(conv); setView("thread"); };
  const backHome = () => { setActiveThread(null); setView("home"); };

  if (view === "thread" && activeThread) {
    return <ThreadView myId={myId} conv={activeThread} onBack={backHome} onlineUsers={onlineUsers} />;
  }
  if (view === "newchat") {
    return (
      <NewChatView
        myId={myId}
        activeEvent={activeEvent}
        canCreateGroup={canCreateGroup}
        onlineUsers={onlineUsers}
        onSelectPerson={(person) => openThread({ type: "dm", other: person })}
        onCreateGroup={() => setView("creategroup")}
        onBack={backHome}
      />
    );
  }
  if (view === "creategroup") {
    return (
      <GroupCreateView
        myId={myId}
        activeEvent={activeEvent}
        onlineUsers={onlineUsers}
        onCreated={(conv) => openThread(conv)}
        onBack={() => setView("newchat")}
      />
    );
  }
  return (
    <HomeView
      myId={myId}
      profile={profile}
      activeEvent={activeEvent}
      onlineUsers={onlineUsers}
      onClose={onClose}
      onOpenProfile={onOpenProfile}
      onNewChat={() => setView("newchat")}
      onOpenThread={openThread}
    />
  );
}

// ── Home view ─────────────────────────────────────────────────────────────────

function HomeView({ myId, profile, activeEvent, onlineUsers, onClose, onOpenProfile, onNewChat, onOpenThread }) {
  const [conversations, setConversations] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => { loadConversations(); loadMembers(); }, []);

  useEffect(() => {
    const ch = supabase
      .channel(`home-convos-${myId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "dm_messages",
        filter: `receiver_id=eq.${myId}`,
      }, loadConversations)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "conversations",
        filter: `participant_a=eq.${myId}`,
      }, loadConversations)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "conversations",
        filter: `participant_b=eq.${myId}`,
      }, loadConversations)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  async function loadConversations() {
    // Fetch DM conversations
    const { data: dmRows } = await supabase
      .from("conversations")
      .select("id, last_message_at, participant_a, participant_b")
      .or(`participant_a.eq.${myId},participant_b.eq.${myId}`)
      .eq("is_group", false)
      .order("last_message_at", { ascending: false });

    // Fetch group conversations I'm in
    const { data: myGroups } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", myId);

    const groupIds = (myGroups || []).map((r) => r.conversation_id);
    let groupRows = [];
    if (groupIds.length > 0) {
      const { data } = await supabase
        .from("conversations")
        .select("id, last_message_at, group_name, created_by")
        .in("id", groupIds)
        .eq("is_group", true)
        .order("last_message_at", { ascending: false });
      groupRows = data || [];
    }

    // Collect all conv IDs
    const allIds = [...(dmRows || []).map((c) => c.id), ...groupRows.map((c) => c.id)];
    if (allIds.length === 0) { setConversations([]); return; }

    // Fetch last messages
    const { data: msgs } = await supabase
      .from("dm_messages")
      .select("conversation_id, body, created_at, profile_id, read_at, receiver_id")
      .in("conversation_id", allIds)
      .order("created_at", { ascending: false })
      .limit(200);

    const lastMsg = {};
    const unreadCount = {};
    for (const m of msgs || []) {
      if (!lastMsg[m.conversation_id]) lastMsg[m.conversation_id] = m;
      if (m.receiver_id === myId && !m.read_at) {
        unreadCount[m.conversation_id] = (unreadCount[m.conversation_id] || 0) + 1;
      }
    }

    // Resolve DM other-person profiles
    const otherIds = (dmRows || []).map((c) => c.participant_a === myId ? c.participant_b : c.participant_a);
    const { data: dmProfiles } = otherIds.length
      ? await supabase.from("profiles").select("id, full_name, nickname, photo_url").in("id", otherIds)
      : { data: [] };
    const profileMap = Object.fromEntries((dmProfiles || []).map((p) => [p.id, p]));

    const dms = (dmRows || []).map((c) => {
      const otherId = c.participant_a === myId ? c.participant_b : c.participant_a;
      return { type: "dm", id: c.id, last_message_at: c.last_message_at, other: profileMap[otherId], lastMsg: lastMsg[c.id], unread: unreadCount[c.id] || 0 };
    });

    const groups = groupRows.map((c) => ({
      type: "group", id: c.id, last_message_at: c.last_message_at,
      group_name: c.group_name, lastMsg: lastMsg[c.id], unread: 0,
    }));

    const all = [...dms, ...groups].sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
    setConversations(all);
  }

  async function loadMembers() {
    if (!activeEvent?.id) return;
    const { data: rows } = await supabase
      .from("event_members")
      .select("profile_id, profiles!event_members_profile_id_fkey(id, full_name, nickname, photo_url)")
      .eq("event_id", activeEvent.id)
      .neq("profile_id", myId);
    setAllMembers((rows || []).map((r) => r.profiles).filter(Boolean));
  }

  const onlineIds = new Set(onlineUsers.map((u) => u.user_id));
  const memberById = Object.fromEntries(allMembers.map((m) => [m.id, m]));
  const activeRow = [
    { user_id: myId, name: profile.full_name, nickname: profile.nickname, photo_url: profile.photo_url, isSelf: true },
    ...onlineUsers.filter((u) => u.user_id !== myId).map((u) => ({
      ...u,
      name: u.full_name || u.name,
      nickname: memberById[u.user_id]?.nickname || null,
    })),
  ];

  const filtered = search.trim()
    ? allMembers.filter((m) => (m.full_name || "").toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#FAFAFA", display: "flex", flexDirection: "column", zIndex: 200, maxWidth: 460, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0.75rem 1.25rem", paddingTop: "max(0.75rem, env(safe-area-inset-top))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onClose} style={iconBtn()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 900, color: "#111111", letterSpacing: "-0.02em" }}>Messages</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onOpenProfile} style={iconBtn()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" />
            </svg>
          </button>
          <button onClick={onNewChat} style={iconBtn("#111111")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              <line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Search */}
        <div style={{ padding: "0.75rem 1.25rem", background: "#fff", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ background: "#FAFAFA", borderRadius: 12, padding: "0.625rem 1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people"
              style={{ flex: 1, border: "none", background: "none", outline: "none", fontFamily: SANS, fontSize: "14px", color: "#111111" }}
            />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: TSEC, fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>}
          </div>
        </div>

        {/* Active now — horizontal scroll */}
        {!search && (
          <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0.875rem 0" }}>
            <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.1em", color: TSEC, textTransform: "uppercase", fontFamily: SANS, padding: "0 1.25rem", marginBottom: "0.625rem" }}>
              Active now
            </div>
            <div style={{ display: "flex", gap: 16, overflowX: "auto", padding: "0 1.25rem 2px", scrollbarWidth: "none" }}>
              {activeRow.map((u) => (
                <button
                  key={u.user_id}
                  onClick={() => onOpenThread({ type: "dm", other: { id: u.user_id, full_name: u.name, photo_url: u.photo_url, isSelf: u.isSelf } })}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0, padding: 0 }}
                >
                  <div style={{ position: "relative" }}>
                    <Avatar url={u.photo_url} name={u.name} size={54} />
                    <div style={{ position: "absolute", bottom: 1, right: 1, width: 14, height: 14, borderRadius: "50%", background: "#22C55E", border: "2.5px solid #fff" }} />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: u.isSelf ? "#FF4D00" : "#111111", fontFamily: SANS, maxWidth: 62, textAlign: "center", lineHeight: 1.3, wordBreak: "break-word" }}>
                    {u.isSelf ? "You" : (u.nickname || (u.name || "").split(" ")[0])}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search results */}
        {filtered && (
          <div style={{ background: "#fff" }}>
            {filtered.length === 0
              ? <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "13px", color: TSEC, fontFamily: SANS }}>No results</div>
              : filtered.map((p) => (
                <PersonRow key={p.id} person={p} isOnline={onlineIds.has(p.id)} onPress={() => onOpenThread({ type: "dm", other: p })} />
              ))
            }
          </div>
        )}

        {/* Conversation list */}
        {!filtered && (
          conversations === null ? (
            <div style={{ padding: "3rem 0", textAlign: "center", fontSize: "13px", color: TSEC, fontFamily: SANS }}>Loading…</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
              <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 900, color: "#111111", marginBottom: 8, letterSpacing: "-0.02em" }}>No messages yet</div>
              <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>Tap the compose icon or an active person to start a conversation.</div>
            </div>
          ) : (
            <div style={{ background: "#fff" }}>
              {conversations.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => onOpenThread(c)}
                  style={{
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "0.875rem 1.25rem",
                    borderBottom: i < conversations.length - 1 ? `1px solid ${BORDER}` : "none",
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {c.type === "group"
                      ? <GroupAvatar name={c.group_name} size={48} />
                      : <Avatar url={c.other?.photo_url} name={c.other?.full_name} size={48} />
                    }
                    {c.type === "dm" && onlineIds.has(c.other?.id) && (
                      <div style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: "#22C55E", border: "2px solid #fff" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: "14px", fontWeight: c.unread > 0 ? 800 : 600, color: "#111111", fontFamily: SANS }}>
                          {c.type === "group" ? c.group_name : c.other?.full_name}
                        </span>
                        {c.type === "dm" && c.other?.nickname && (
                          <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, fontStyle: "italic" }}>"{c.other.nickname}"</span>
                        )}
                      </div>
                      {c.lastMsg && (
                        <span style={{ fontSize: "11px", color: c.unread > 0 ? "#FF4D00" : TSEC, fontFamily: SANS, fontWeight: c.unread > 0 ? 700 : 400, flexShrink: 0, marginLeft: 8 }}>
                          {fmtTime(c.lastMsg.created_at)}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: c.unread > 0 ? "#111111" : TSEC, fontFamily: SANS, fontWeight: c.unread > 0 ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {c.lastMsg ? (c.lastMsg.profile_id === myId ? "You: " : "") + c.lastMsg.body : "Start a conversation"}
                      </span>
                      {c.unread > 0 && (
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#FF4D00", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 8 }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", fontFamily: SANS }}>{c.unread}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── Thread view ───────────────────────────────────────────────────────────────

function ThreadView({ myId, conv, onBack, onlineUsers }) {
  const isGroup = conv.type === "group";
  const [messages, setMessages] = useState(null);
  const [senderMap, setSenderMap] = useState({});
  const [convId, setConvId] = useState(null);
  const [input, setInput] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [groupMembers, setGroupMembers] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const isSelf = !isGroup && conv.other?.id === myId;
  const isOnline = !isGroup && !isSelf && onlineUsers.some((u) => u.user_id === conv.other?.id);
  const title = isGroup ? conv.group_name : isSelf ? "My Notes" : conv.other?.full_name;

  useEffect(() => { init(); setShowMembers(false); setGroupMembers(null); }, [conv.id, conv.other?.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    if (showMembers && convId && !groupMembers && isGroup) loadGroupMembers(convId);
  }, [showMembers, convId]);

  async function loadGroupMembers(cid) {
    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("profile_id")
      .eq("conversation_id", cid);
    const ids = (parts || []).map((p) => p.profile_id);
    if (!ids.length) { setGroupMembers([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, photo_url")
      .in("id", ids)
      .order("full_name");
    setGroupMembers(data || []);
  }

  async function init() {
    let cid = conv.id;

    if (!cid) {
      // DM: find or create conversation
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant_a.eq.${myId},participant_b.eq.${conv.other.id}),and(participant_a.eq.${conv.other.id},participant_b.eq.${myId})`)
        .maybeSingle();

      cid = existing?.id;
      if (!cid) {
        const { data: created } = await supabase
          .from("conversations")
          .insert({ participant_a: myId, participant_b: conv.other.id, is_group: false })
          .select("id").single();
        cid = created?.id;
      }
    }

    if (!cid) return;
    setConvId(cid);
    await loadMessages(cid);
    if (!isGroup) await markRead(cid);

    const channel = supabase
      .channel(`conv-${cid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages", filter: `conversation_id=eq.${cid}` }, async (payload) => {
        const msg = payload.new;
        if (msg.profile_id !== myId) {
          const { data: p } = await supabase.from("profiles").select("id, full_name, photo_url").eq("id", msg.profile_id).single();
          if (p) setSenderMap((prev) => ({ ...prev, [p.id]: p }));
          if (!isGroup) markRead(cid);
        }
        setMessages((prev) => [...(prev || []), msg]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  async function loadMessages(cid) {
    const { data: rows } = await supabase
      .from("dm_messages")
      .select("id, body, profile_id, created_at, read_at")
      .eq("conversation_id", cid)
      .order("created_at");
    setMessages(rows || []);

    if (isGroup && rows?.length > 0) {
      const ids = [...new Set(rows.map((m) => m.profile_id))];
      const { data: ps } = await supabase.from("profiles").select("id, full_name, photo_url").in("id", ids);
      setSenderMap(Object.fromEntries((ps || []).map((p) => [p.id, p])));
    }
  }

  async function markRead(cid) {
    await supabase.from("dm_messages").update({ read_at: new Date().toISOString() })
      .eq("conversation_id", cid).eq("receiver_id", myId).is("read_at", null);
  }

  async function send() {
    const body = input.trim();
    if (!body || !convId || sending) return;
    setSending(true);
    setInput("");
    await supabase.from("dm_messages").insert({
      conversation_id: convId,
      profile_id: myId,
      receiver_id: isGroup ? null : conv.other?.id,
      body,
    });
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", convId);
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // Group messages by date + add date separators
  const grouped = [];
  let lastDate = null;
  for (const m of messages || []) {
    const d = new Date(m.created_at).toDateString();
    if (d !== lastDate) {
      grouped.push({ type: "date", label: new Date(m.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) });
      lastDate = d;
    }
    grouped.push({ type: "msg", msg: m });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#FAFAFA", display: "flex", flexDirection: "column", zIndex: 200, maxWidth: 460, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0.75rem 1.25rem", paddingTop: "max(0.75rem, env(safe-area-inset-top))", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={iconBtn()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={{ position: "relative" }}>
          {isGroup
            ? <GroupAvatar name={title} size={38} />
            : <Avatar url={conv.other?.photo_url} name={conv.other?.full_name} size={38} />
          }
          {!isGroup && isOnline && <div style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", background: "#22C55E", border: "2px solid #fff" }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: "15px", fontWeight: 800, color: "#111111", fontFamily: SANS }}>{title}</span>
            {!isGroup && !isSelf && conv.other?.nickname && (
              <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, fontStyle: "italic" }}>"{conv.other.nickname}"</span>
            )}
          </div>
          <div style={{ fontSize: "11px", fontFamily: SANS, fontWeight: 600, color: isOnline ? "#22C55E" : TSEC }}>
            {isGroup
              ? (groupMembers ? `${groupMembers.length} members` : "Group")
              : isSelf ? "Only visible to you"
              : isOnline ? "Active now" : "Offline"}
          </div>
        </div>
        {isGroup && (
          <button
            onClick={() => setShowMembers((s) => !s)}
            style={{ ...iconBtn(), background: showMembers ? "#F0F0F0" : undefined }}
            title="Members"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </button>
        )}
      </div>

      {/* Group member list (collapsible) */}
      {isGroup && showMembers && (
        <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0.75rem 1.25rem" }}>
          {!groupMembers ? (
            <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>Loading members…</div>
          ) : groupMembers.length === 0 ? (
            <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, fontStyle: "italic" }}>No members yet.</div>
          ) : (
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 2 }}>
              {groupMembers.map((m) => (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <Avatar url={m.photo_url} name={m.full_name} size={32} />
                  <span style={{ fontSize: "9px", fontWeight: 700, color: "#111111", fontFamily: SANS, maxWidth: 48, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>
                    {m.full_name?.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: 4 }}>
        {messages === null ? (
          <div style={{ margin: "auto", fontSize: "13px", color: TSEC, fontFamily: SANS }}>Loading…</div>
        ) : messages.length === 0 ? (
          <div style={{ margin: "auto", textAlign: "center", padding: "2rem 0" }}>
            <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
              {isGroup ? <GroupAvatar size={56} /> : <Avatar url={conv.other?.photo_url} name={conv.other?.full_name} size={56} />}
            </div>
            <div style={{ fontFamily: SANS, fontSize: "18px", fontWeight: 900, color: "#111111", marginBottom: 6, letterSpacing: "-0.02em" }}>{title}</div>
            <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>
              {isGroup ? "Send the first message to the group." : isSelf ? "Jot down notes, links, or reminders — only you can see this." : "Send a message to start the conversation."}
            </div>
          </div>
        ) : (
          grouped.map((item, i) => {
            if (item.type === "date") return (
              <div key={`d-${i}`} style={{ textAlign: "center", margin: "8px 0" }}>
                <span style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, background: "#FAFAFA", padding: "2px 10px", borderRadius: 99 }}>{item.label}</span>
              </div>
            );
            const { msg } = item;
            const isMe = msg.profile_id === myId;
            const prevItem = grouped[i - 1];
            const prevMsg = prevItem?.type === "msg" ? prevItem.msg : null;
            const showSender = isGroup && !isMe && (!prevMsg || prevMsg.profile_id !== msg.profile_id);
            const sender = senderMap[msg.profile_id];
            const tail = !prevMsg || prevMsg.profile_id !== msg.profile_id;

            return (
              <div key={msg.id}>
                {showSender && sender && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, marginBottom: 2 }}>
                    <Avatar url={sender.photo_url} name={sender.full_name} size={18} />
                    <span style={{ fontSize: "9px", fontWeight: 800, color: TSEC, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.07em" }}>{sender.full_name?.split(" ")[0]}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginTop: tail && !showSender ? 8 : 2 }}>
                  <div style={{
                    maxWidth: "72%", padding: "9px 13px",
                    borderRadius: isMe
                      ? (tail ? "14px 14px 4px 14px" : "14px 4px 4px 14px")
                      : (tail ? "14px 14px 14px 4px" : "4px 14px 14px 4px"),
                    background: isMe ? "#FF4D00" : "#fff",
                    border: isMe ? "none" : `1px solid ${BORDER}`,
                  }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: isMe ? "#fff" : "#111111", fontFamily: SANS, lineHeight: 1.5, wordBreak: "break-word" }}>
                      {msg.body}
                    </div>
                    <div style={{ fontSize: "9px", color: isMe ? "#FFB896" : TSEC, fontFamily: SANS, marginTop: 3, textAlign: isMe ? "right" : "left" }}>
                      {fmtFull(msg.created_at)}
                      {isMe && !isGroup && msg.read_at && <span style={{ marginLeft: 4 }}>✓</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: "#fff", borderTop: `1px solid ${BORDER}`, padding: "0.75rem 1.25rem", display: "flex", alignItems: "flex-end", gap: 10, paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={isGroup ? `Message ${title}…` : `Message ${conv.other?.full_name?.split(" ")[0]}…`}
          style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "10px 16px", fontFamily: SANS, fontSize: "14px", color: "#111111", outline: "none", background: "#FAFAFA" }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          style={{ width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer", background: input.trim() ? "#FF4D00" : BORDER, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── New chat (people picker) ──────────────────────────────────────────────────

function NewChatView({ myId, activeEvent, canCreateGroup, onlineUsers, onSelectPerson, onCreateGroup, onBack }) {
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!activeEvent?.id) return;
    supabase
      .from("event_members")
      .select("profile_id, profiles!event_members_profile_id_fkey(id, full_name, photo_url)")
      .eq("event_id", activeEvent.id)
      .neq("profile_id", myId)
      .then(({ data: rows }) => setPeople((rows || []).map((r) => r.profiles).filter(Boolean)));
  }, [activeEvent?.id]);

  const onlineIds = new Set(onlineUsers.map((u) => u.user_id));
  const filtered = search.trim()
    ? people.filter((p) => (p.full_name || "").toLowerCase().includes(search.toLowerCase()))
    : people;
  const sorted = [...filtered].sort((a, b) => (onlineIds.has(b.id) ? 1 : 0) - (onlineIds.has(a.id) ? 1 : 0));

  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", display: "flex", flexDirection: "column", zIndex: 200, maxWidth: 460, margin: "0 auto" }}>
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "0.75rem 1.25rem", paddingTop: "max(0.75rem, env(safe-area-inset-top))", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={iconBtn()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 900, color: "#111111", letterSpacing: "-0.02em" }}>New Message</div>
      </div>

      {canCreateGroup && (
        <button
          onClick={onCreateGroup}
          style={{ width: "100%", background: "none", border: "none", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "0.875rem 1.25rem" }}
        >
          <GroupAvatar size={44} />
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#111111", fontFamily: SANS }}>Create Group Chat</div>
            <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 1 }}>Name it and add members</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}

      <div style={{ padding: "0.75rem 1.25rem", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ background: "#FAFAFA", borderRadius: 12, padding: "0.625rem 1rem", display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name"
            style={{ flex: 1, border: "none", background: "none", outline: "none", fontFamily: SANS, fontSize: "14px", color: "#111111" }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {sorted.map((p) => (
          <PersonRow key={p.id} person={p} isOnline={onlineIds.has(p.id)} onPress={() => onSelectPerson(p)} />
        ))}
        {sorted.length === 0 && <div style={{ padding: "3rem", textAlign: "center", fontSize: "13px", color: TSEC, fontFamily: SANS }}>No people found</div>}
      </div>
    </div>
  );
}

// ── Group create (admin/mod only) ─────────────────────────────────────────────

function GroupCreateView({ myId, activeEvent, onlineUsers, onCreated, onBack }) {
  const [groupName, setGroupName] = useState("");
  const [people, setPeople] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!activeEvent?.id) return;
    supabase
      .from("event_members")
      .select("profile_id, profiles!event_members_profile_id_fkey(id, full_name, photo_url)")
      .eq("event_id", activeEvent.id)
      .neq("profile_id", myId)
      .then(({ data: rows }) => setPeople((rows || []).map((r) => r.profiles).filter(Boolean)));
  }, [activeEvent?.id]);

  const onlineIds = new Set(onlineUsers.map((u) => u.user_id));
  const filtered = search.trim()
    ? people.filter((p) => (p.full_name || "").toLowerCase().includes(search.toLowerCase()))
    : people;

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function create() {
    if (!groupName.trim() || selected.size === 0 || creating) return;
    setCreating(true);
    const { data: conv } = await supabase
      .from("conversations")
      .insert({ is_group: true, group_name: groupName.trim(), created_by: myId, participant_a: myId, participant_b: myId })
      .select("id, group_name").single();

    if (conv?.id) {
      const participants = [myId, ...selected].map((pid) => ({ conversation_id: conv.id, profile_id: pid }));
      await supabase.from("conversation_participants").insert(participants);
      onCreated({ type: "group", id: conv.id, group_name: conv.group_name });
    }
    setCreating(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", display: "flex", flexDirection: "column", zIndex: 200, maxWidth: 460, margin: "0 auto" }}>
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "0.75rem 1.25rem", paddingTop: "max(0.75rem, env(safe-area-inset-top))", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={iconBtn()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={{ fontFamily: SANS, fontSize: "20px", fontWeight: 900, color: "#111111", flex: 1, letterSpacing: "-0.02em" }}>New Group</div>
        <button
          onClick={create}
          disabled={!groupName.trim() || selected.size === 0 || creating}
          style={{
            background: groupName.trim() && selected.size > 0 ? "#FF4D00" : BORDER,
            color: "#fff", border: "none", borderRadius: 20, padding: "8px 18px",
            fontFamily: SANS, fontSize: "13px", fontWeight: 700, cursor: "pointer",
            transition: "background 0.15s",
          }}
        >
          {creating ? "Creating…" : "Create"}
        </button>
      </div>

      {/* Group name input */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: `1px solid ${BORDER}` }}>
        <input
          autoFocus
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name (e.g. Leaders — EM Ministry)"
          maxLength={60}
          style={{ width: "100%", border: "none", borderBottom: `2px solid ${groupName ? "#111111" : BORDER}`, padding: "0.5rem 0", fontFamily: SANS, fontSize: "16px", fontWeight: 700, color: "#111111", outline: "none", background: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
        />
        <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginTop: 6 }}>
          {selected.size === 0 ? "Select people below to add to the group" : `${selected.size} member${selected.size !== 1 ? "s" : ""} selected`}
        </div>
      </div>

      {/* Selected chips */}
      {selected.size > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0.75rem 1.25rem", borderBottom: `1px solid ${BORDER}` }}>
          {[...selected].map((id) => {
            const p = people.find((x) => x.id === id);
            if (!p) return null;
            return (
              <button key={id} onClick={() => toggleSelect(id)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FAFAFA", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "4px 10px 4px 6px", cursor: "pointer", fontFamily: SANS, fontSize: "12px", fontWeight: 600, color: "#111111" }}>
                <Avatar url={p.photo_url} name={p.full_name} size={20} />
                {p.full_name?.split(" ")[0]} ×
              </button>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div style={{ padding: "0.75rem 1.25rem", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ background: "#FAFAFA", borderRadius: 12, padding: "0.625rem 1rem", display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search"
            style={{ flex: 1, border: "none", background: "none", outline: "none", fontFamily: SANS, fontSize: "14px", color: "#111111" }} />
        </div>
      </div>

      {/* People list with checkboxes */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.map((p) => {
          const isSelected = selected.has(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggleSelect(p.id)}
              style={{ width: "100%", background: isSelected ? "#FFF5F0" : "none", border: "none", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "0.875rem 1.25rem" }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Avatar url={p.photo_url} name={p.full_name} size={44} />
                {onlineIds.has(p.id) && <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: "#22C55E", border: "2px solid #fff" }} />}
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#111111", fontFamily: SANS }}>{p.full_name}</div>
                {onlineIds.has(p.id) && <div style={{ fontSize: "11px", color: "#22C55E", fontFamily: SANS, fontWeight: 600, marginTop: 1 }}>Active now</div>}
              </div>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${isSelected ? "#FF4D00" : BORDER}`, background: isSelected ? "#FF4D00" : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────

function PersonRow({ person, isOnline, onPress }) {
  return (
    <button onClick={onPress} style={{ width: "100%", background: "none", border: "none", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "0.875rem 1.25rem" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <Avatar url={person.photo_url} name={person.full_name} size={44} />
        {isOnline && <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: "#22C55E", border: "2px solid #fff" }} />}
      </div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#111111", fontFamily: SANS }}>{person.full_name}</div>
        {isOnline && <div style={{ fontSize: "11px", color: "#22C55E", fontFamily: SANS, fontWeight: 600, marginTop: 1 }}>Active now</div>}
      </div>
    </button>
  );
}

function iconBtn(bg) {
  return { width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer", background: bg || "#FAFAFA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 };
}
