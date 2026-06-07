import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase.js";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SANS, SERIF } from "../../lib/constants.js";
import { Avatar } from "../../components/ui/index.js";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtFull(ts) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function convId(myId, theirId) {
  return [myId, theirId].sort().join("-");
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function Chat({ data, onClose, onOpenProfile, onlineUsers = [] }) {
  const { profile, activeEvent } = data;
  const myId = profile.id;

  // view: "home" | "thread" | "newchat"
  const [view, setView] = useState("home");
  const [activePerson, setActivePerson] = useState(null); // { id, full_name, photo_url }

  const openThread = (person) => { setActivePerson(person); setView("thread"); };
  const backHome   = () => { setActivePerson(null); setView("home"); };

  if (view === "thread" && activePerson) {
    return <ThreadView myId={myId} other={activePerson} onBack={backHome} onlineUsers={onlineUsers} />;
  }
  if (view === "newchat") {
    return <NewChatView myId={myId} activeEvent={activeEvent} onSelect={openThread} onBack={backHome} onlineUsers={onlineUsers} />;
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

  useEffect(() => {
    loadConversations();
    loadMembers();
  }, []);

  async function loadConversations() {
    const { data: rows } = await supabase
      .from("conversations")
      .select(`
        id, last_message_at, participant_a, participant_b,
        messages(body, created_at, profile_id, read_at)
      `)
      .or(`participant_a.eq.${myId},participant_b.eq.${myId}`)
      .order("last_message_at", { ascending: false });

    if (!rows) { setConversations([]); return; }

    // Get all other participant IDs
    const otherIds = rows.map((c) => c.participant_a === myId ? c.participant_b : c.participant_a);
    const uniqueIds = [...new Set(otherIds)];

    const { data: profiles } = uniqueIds.length
      ? await supabase.from("profiles").select("id, full_name, photo_url, nickname").in("id", uniqueIds)
      : { data: [] };

    const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

    const enriched = rows.map((c) => {
      const otherId = c.participant_a === myId ? c.participant_b : c.participant_a;
      const lastMsg = (c.messages || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      const unread = (c.messages || []).filter((m) => m.profile_id !== myId && !m.read_at).length;
      return { ...c, other: profileMap[otherId], lastMsg, unread };
    });

    setConversations(enriched);
  }

  async function loadMembers() {
    if (!activeEvent?.id) return;
    const { data: rows } = await supabase
      .from("event_members")
      .select("profile_id, profiles!event_members_profile_id_fkey(id, full_name, photo_url, nickname)")
      .eq("event_id", activeEvent.id)
      .neq("profile_id", myId);
    setAllMembers((rows || []).map((r) => r.profiles).filter(Boolean));
  }

  const onlineIds = new Set(onlineUsers.map((u) => u.user_id));
  const onlinePeople = onlineUsers.filter((u) => u.user_id !== myId);

  const filtered = search.trim()
    ? allMembers.filter((m) => (m.full_name || "").toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: BG, display: "flex", flexDirection: "column", zIndex: 200, maxWidth: 460, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <button onClick={onClose} style={iconBtn()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 600, color: NAVY }}>Messages</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onOpenProfile} style={iconBtn()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" />
            </svg>
          </button>
          <button onClick={onNewChat} style={iconBtn(NAVY)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              <line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Active people — horizontal scroll */}
        {onlinePeople.length > 0 && (
          <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0.875rem 0" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: TSEC, textTransform: "uppercase", fontFamily: SANS, padding: "0 1.25rem", marginBottom: "0.625rem" }}>
              Active now
            </div>
            <div style={{ display: "flex", gap: 16, overflowX: "auto", padding: "0 1.25rem", scrollbarWidth: "none" }}>
              {onlinePeople.map((u) => (
                <button
                  key={u.user_id}
                  onClick={() => onOpenThread({ id: u.user_id, full_name: u.name, photo_url: u.photo_url })}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, padding: 0 }}
                >
                  <div style={{ position: "relative" }}>
                    <Avatar url={u.photo_url} name={u.name} size={52} />
                    <div style={{ position: "absolute", bottom: 1, right: 1, width: 13, height: 13, borderRadius: "50%", background: "#22C55E", border: "2.5px solid #fff" }} />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: NAVY, fontFamily: SANS, maxWidth: 56, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {(u.name || "").split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ padding: "0.75rem 1.25rem", background: "#fff", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ background: BG, borderRadius: 12, padding: "0.625rem 1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people"
              style={{ flex: 1, border: "none", background: "none", outline: "none", fontFamily: SANS, fontSize: "14px", color: NAVY }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: TSEC, fontSize: 16, lineHeight: 1 }}>×</button>
            )}
          </div>
        </div>

        {/* Search results */}
        {filtered && (
          <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}` }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "13px", color: TSEC, fontFamily: SANS }}>No results</div>
            ) : (
              filtered.map((p) => (
                <PersonRow
                  key={p.id}
                  person={p}
                  isOnline={onlineIds.has(p.id)}
                  onPress={() => onOpenThread(p)}
                />
              ))
            )}
          </div>
        )}

        {/* Conversation list */}
        {!filtered && (
          <>
            {conversations === null ? (
              <div style={{ padding: "3rem 0", textAlign: "center", fontSize: "13px", color: TSEC, fontFamily: SANS }}>Loading…</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
                <div style={{ fontFamily: SERIF, fontSize: "20px", color: NAVY, marginBottom: 8 }}>No messages yet</div>
                <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS, lineHeight: 1.6 }}>Tap the chat icon above or an active person to start a conversation.</div>
              </div>
            ) : (
              <div style={{ background: "#fff" }}>
                {conversations.map((c, i) => {
                  if (!c.other) return null;
                  return (
                    <button
                      key={c.id}
                      onClick={() => onOpenThread(c.other)}
                      style={{
                        width: "100%", background: "none", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "0.875rem 1.25rem",
                        borderBottom: i < conversations.length - 1 ? `1px solid ${BORDER}` : "none",
                      }}
                    >
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <Avatar url={c.other.photo_url} name={c.other.full_name} size={48} />
                        {onlineIds.has(c.other.id) && (
                          <div style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: "#22C55E", border: "2px solid #fff" }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                          <span style={{ fontSize: "14px", fontWeight: c.unread > 0 ? 700 : 600, color: NAVY, fontFamily: SANS }}>
                            {c.other.full_name}
                          </span>
                          {c.lastMsg && (
                            <span style={{ fontSize: "11px", color: c.unread > 0 ? ORANGE : TSEC, fontFamily: SANS, fontWeight: c.unread > 0 ? 700 : 400, flexShrink: 0, marginLeft: 8 }}>
                              {fmtTime(c.lastMsg.created_at)}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{
                            fontSize: "12px", color: c.unread > 0 ? NAVY : TSEC, fontFamily: SANS,
                            fontWeight: c.unread > 0 ? 600 : 400,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                          }}>
                            {c.lastMsg ? (c.lastMsg.profile_id === myId ? "You: " : "") + c.lastMsg.body : "Start a conversation"}
                          </span>
                          {c.unread > 0 && (
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 8 }}>
                              <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", fontFamily: SANS }}>{c.unread}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Thread view ───────────────────────────────────────────────────────────────

function ThreadView({ myId, other, onBack, onlineUsers }) {
  const [messages, setMessages] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [convId_state, setConvId_state] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const isOnline = onlineUsers.some((u) => u.user_id === other.id);

  useEffect(() => {
    initConversation();
  }, [other.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function initConversation() {
    // Find or create conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant_a.eq.${myId},participant_b.eq.${other.id}),and(participant_a.eq.${other.id},participant_b.eq.${myId})`
      )
      .maybeSingle();

    let cid = existing?.id;

    if (!cid) {
      const { data: created } = await supabase
        .from("conversations")
        .insert({ participant_a: myId, participant_b: other.id })
        .select("id")
        .single();
      cid = created?.id;
    }

    if (!cid) return;
    setConvId_state(cid);
    await loadMessages(cid);
    await markRead(cid);

    // Realtime subscription
    const channel = supabase
      .channel(`conv-${cid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${cid}` }, (payload) => {
        setMessages((prev) => [...(prev || []), payload.new]);
        if (payload.new.profile_id !== myId) markRead(cid);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  async function loadMessages(cid) {
    const { data: rows } = await supabase
      .from("messages")
      .select("id, body, profile_id, created_at, read_at")
      .eq("conversation_id", cid)
      .order("created_at");
    setMessages(rows || []);
  }

  async function markRead(cid) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", cid)
      .eq("receiver_id", myId)
      .is("read_at", null);
  }

  async function send() {
    const body = input.trim();
    if (!body || !convId_state || sending) return;
    setSending(true);
    setInput("");
    await supabase.from("messages").insert({
      conversation_id: convId_state,
      profile_id: myId,
      receiver_id: other.id,
      body,
    });
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", convId_state);
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // Group messages by date
  const grouped = [];
  let lastDate = null;
  for (const m of messages || []) {
    const d = new Date(m.created_at).toDateString();
    if (d !== lastDate) { grouped.push({ type: "date", label: new Date(m.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) }); lastDate = d; }
    grouped.push({ type: "msg", msg: m });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: BG, display: "flex", flexDirection: "column", zIndex: 200, maxWidth: 460, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: 12, paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <button onClick={onBack} style={iconBtn()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={{ position: "relative" }}>
          <Avatar url={other.photo_url} name={other.full_name} size={38} />
          {isOnline && <div style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", background: "#22C55E", border: "2px solid #fff" }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: NAVY, fontFamily: SANS }}>{other.full_name}</div>
          <div style={{ fontSize: "11px", color: isOnline ? "#22C55E" : TSEC, fontFamily: SANS, fontWeight: isOnline ? 600 : 400 }}>
            {isOnline ? "Active now" : "Offline"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: 4 }}>
        {messages === null ? (
          <div style={{ margin: "auto", fontSize: "13px", color: TSEC, fontFamily: SANS }}>Loading…</div>
        ) : messages.length === 0 ? (
          <div style={{ margin: "auto", textAlign: "center", padding: "2rem 0" }}>
            <div style={{ marginBottom: 12 }}><Avatar url={other.photo_url} name={other.full_name} size={56} /></div>
            <div style={{ fontFamily: SERIF, fontSize: "18px", color: NAVY, marginBottom: 6 }}>{other.full_name}</div>
            <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>Send a message to start the conversation.</div>
          </div>
        ) : (
          grouped.map((item, i) => {
            if (item.type === "date") return (
              <div key={`d-${i}`} style={{ textAlign: "center", margin: "8px 0" }}>
                <span style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, background: BG, padding: "2px 10px", borderRadius: 99 }}>{item.label}</span>
              </div>
            );
            const { msg } = item;
            const isMe = msg.profile_id === myId;
            const prevItem = grouped[i - 1];
            const prevMsg = prevItem?.type === "msg" ? prevItem.msg : null;
            const tail = !prevMsg || prevMsg.profile_id !== msg.profile_id;
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginTop: tail ? 8 : 2 }}>
                <div style={{
                  maxWidth: "72%", padding: "9px 13px", borderRadius: isMe
                    ? (tail ? "18px 18px 4px 18px" : "18px 4px 4px 18px")
                    : (tail ? "18px 18px 18px 4px" : "4px 18px 18px 4px"),
                  background: isMe ? NAVY : "#fff",
                  border: isMe ? "none" : `1px solid ${BORDER}`,
                  boxShadow: isMe ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ fontSize: "14px", color: isMe ? "#fff" : NAVY, fontFamily: SANS, lineHeight: 1.5, wordBreak: "break-word" }}>
                    {msg.body}
                  </div>
                  <div style={{ fontSize: "10px", color: isMe ? "rgba(255,255,255,0.55)" : TSEC, fontFamily: SANS, marginTop: 3, textAlign: isMe ? "right" : "left" }}>
                    {fmtFull(msg.created_at)}
                    {isMe && msg.read_at && <span style={{ marginLeft: 4 }}>✓</span>}
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
          placeholder={`Message ${other.full_name?.split(" ")[0]}…`}
          style={{
            flex: 1, border: `1px solid ${BORDER}`, borderRadius: 20,
            padding: "10px 16px", fontFamily: SANS, fontSize: "14px",
            color: NAVY, outline: "none", resize: "none", background: BG,
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          style={{
            width: 40, height: 40, borderRadius: "50%", border: "none", cursor: "pointer",
            background: input.trim() ? NAVY : BORDER, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── New chat (people picker) ───────────────────────────────────────────────────

function NewChatView({ myId, activeEvent, onSelect, onBack, onlineUsers }) {
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!activeEvent?.id) return;
    supabase
      .from("event_members")
      .select("profile_id, profiles!event_members_profile_id_fkey(id, full_name, photo_url, nickname)")
      .eq("event_id", activeEvent.id)
      .neq("profile_id", myId)
      .then(({ data: rows }) => setPeople((rows || []).map((r) => r.profiles).filter(Boolean)));
  }, [activeEvent?.id]);

  const onlineIds = new Set(onlineUsers.map((u) => u.user_id));
  const filtered = search.trim()
    ? people.filter((p) => (p.full_name || "").toLowerCase().includes(search.toLowerCase()))
    : people;

  // Online first
  const sorted = [...filtered].sort((a, b) => (onlineIds.has(b.id) ? 1 : 0) - (onlineIds.has(a.id) ? 1 : 0));

  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", display: "flex", flexDirection: "column", zIndex: 200, maxWidth: 460, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: 12, paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <button onClick={onBack} style={iconBtn()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 600, color: NAVY }}>New Message</div>
      </div>

      {/* Search */}
      <div style={{ padding: "0.75rem 1.25rem", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ background: BG, borderRadius: 12, padding: "0.625rem 1rem", display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            style={{ flex: 1, border: "none", background: "none", outline: "none", fontFamily: SANS, fontSize: "14px", color: NAVY }}
          />
        </div>
      </div>

      {/* People list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {sorted.map((p) => (
          <PersonRow key={p.id} person={p} isOnline={onlineIds.has(p.id)} onPress={() => onSelect(p)} />
        ))}
        {sorted.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", fontSize: "13px", color: TSEC, fontFamily: SANS }}>No people found</div>
        )}
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function PersonRow({ person, isOnline, onPress }) {
  return (
    <button
      onClick={onPress}
      style={{
        width: "100%", background: "none", border: "none", borderBottom: `1px solid ${BORDER}`,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
        padding: "0.875rem 1.25rem",
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <Avatar url={person.photo_url} name={person.full_name} size={44} />
        {isOnline && <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: "#22C55E", border: "2px solid #fff" }} />}
      </div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>{person.full_name}</div>
        {isOnline && <div style={{ fontSize: "11px", color: "#22C55E", fontFamily: SANS, fontWeight: 600, marginTop: 1 }}>Active now</div>}
      </div>
    </button>
  );
}

function iconBtn(bg) {
  return {
    width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
    background: bg || BG, display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, padding: 0,
  };
}
