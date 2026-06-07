import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../../lib/supabase.js";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SANS, SERIF } from "../../lib/constants.js";
import { Avatar } from "../../components/ui/index.js";

export default function Chat({ data, onClose, onlineUsers = [] }) {
  const { profile, activeEvent, eventMember } = data;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const profileMap = useMemo(() => {
    const map = {};
    for (const msg of messages) {
      if (msg.profiles) map[msg.profile_id] = msg.profiles;
    }
    return map;
  }, [messages]);

  const onlineIds = useMemo(() => new Set(onlineUsers.map((u) => u.user_id)), [onlineUsers]);

  useEffect(() => {
    if (!activeEvent || !profile) return;

    fetchMessages();

    const channel = supabase.channel(`chat-msgs-${activeEvent.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `event_id=eq.${activeEvent.id}`,
      }, (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeEvent?.id, profile?.id]);

  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [loading]);

  async function fetchMessages() {
    setLoading(true);
    const { data: rows } = await supabase
      .from("chat_messages")
      .select("*, profiles(id, full_name, photo_url)")
      .eq("event_id", activeEvent.id)
      .order("created_at", { ascending: true })
      .limit(200);
    setMessages(rows || []);
    setLoading(false);
  }

  async function send() {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setInput("");
    await supabase.from("chat_messages").insert({
      event_id: activeEvent.id,
      profile_id: profile.id,
      body,
    });
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  if (!activeEvent || !eventMember) {
    return (
      <div style={overlay}>
        <div style={topBar}>
          <button onClick={onClose} style={backBtn}>
            <ChevronLeft />
          </button>
          <div style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 600, color: NAVY, flex: 1 }}>
            Team Chat
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: TSEC, fontSize: "14px", fontFamily: SANS }}>
            You need to be enrolled in an event to access the chat.
          </div>
        </div>
      </div>
    );
  }

  const grouped = groupMessages(messages);
  const othersOnline = onlineUsers.filter((u) => u.user_id !== profile.id);

  return (
    <div style={overlay}>
      {/* Header */}
      <div style={topBar}>
        <button onClick={onClose} style={backBtn}>
          <ChevronLeft />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SERIF, fontSize: "20px", fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
            Team Chat
          </div>
          <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS }}>
            {activeEvent.name}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />
          <span style={{ fontSize: "12px", color: TSEC, fontFamily: SANS }}>
            {onlineUsers.length} online
          </span>
        </div>
      </div>

      {/* Online presence strip */}
      {othersOnline.length > 0 && (
        <div style={{
          background: "#fff", borderBottom: `1px solid ${BORDER}`,
          padding: "0.5rem 1.25rem", display: "flex", alignItems: "center", gap: 8,
          overflowX: "auto", flexShrink: 0,
        }}>
          <span style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, flexShrink: 0 }}>
            Also here:
          </span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {othersOnline.slice(0, 12).map((u) => (
              <OnlineAvatar key={u.user_id} user={u} />
            ))}
            {othersOnline.length > 12 && (
              <span style={{ fontSize: "11px", color: TSEC, fontFamily: SANS }}>
                +{othersOnline.length - 12}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "1rem 1.25rem",
        display: "flex", flexDirection: "column", gap: 0,
      }}>
        {loading ? (
          <div style={{ textAlign: "center", color: TSEC, fontSize: "13px", fontFamily: SANS, paddingTop: "3rem" }}>
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: "3rem" }}>
            <div style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 600, color: NAVY, marginBottom: 8 }}>
              Start the conversation.
            </div>
            <div style={{ fontSize: "13px", color: TSEC, fontFamily: SANS }}>
              Say hello to your team.
            </div>
          </div>
        ) : (
          grouped.map((group, gi) => {
            const isOwn = group.profile_id === profile.id;
            const sender = profileMap[group.profile_id];
            const firstName = sender?.full_name?.split(" ")[0] || "Someone";
            const isOnline = onlineIds.has(group.profile_id);

            return (
              <div key={gi} style={{ marginBottom: "1rem" }}>
                {!isOwn && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    marginBottom: "0.375rem", marginLeft: 44,
                  }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: NAVY, fontFamily: SANS }}>
                      {firstName}
                    </span>
                    <span style={{ fontSize: "11px", color: TSEC, fontFamily: SANS }}>
                      {fmtTime(group.messages[0].created_at)}
                    </span>
                  </div>
                )}
                <div style={{
                  display: "flex", alignItems: "flex-end", gap: 8,
                  flexDirection: isOwn ? "row-reverse" : "row",
                }}>
                  {!isOwn && (
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <Avatar url={sender?.photo_url} name={sender?.full_name} size={32} />
                      {isOnline && (
                        <div style={{
                          position: "absolute", bottom: 0, right: 0,
                          width: 9, height: 9, borderRadius: "50%",
                          background: "#22C55E", border: "2px solid #fff",
                        }} />
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: "75%", alignItems: isOwn ? "flex-end" : "flex-start" }}>
                    {group.messages.map((msg) => (
                      <div key={msg.id} style={{
                        background: isOwn ? NAVY : "#fff",
                        color: isOwn ? "#fff" : NAVY,
                        borderRadius: isOwn
                          ? "18px 18px 4px 18px"
                          : "18px 18px 18px 4px",
                        padding: "10px 14px",
                        fontSize: "14px",
                        fontFamily: SANS,
                        lineHeight: 1.5,
                        border: isOwn ? "none" : `1px solid ${BORDER}`,
                        wordBreak: "break-word",
                        boxShadow: "0 1px 2px rgba(22,32,56,0.06)",
                      }}>
                        {msg.body}
                      </div>
                    ))}
                    {isOwn && (
                      <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginRight: 4 }}>
                        {fmtTime(group.messages[group.messages.length - 1].created_at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: `1px solid ${BORDER}`, background: "#fff",
        padding: "0.75rem 1rem",
        display: "flex", alignItems: "flex-end", gap: 8,
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message your team…"
          rows={1}
          style={{
            flex: 1, border: `1px solid ${BORDER}`, borderRadius: 22,
            padding: "10px 16px", fontSize: "15px", fontFamily: SANS, color: NAVY,
            resize: "none", outline: "none", background: BG,
            lineHeight: 1.4, maxHeight: 120, overflowY: "auto",
          }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: input.trim() ? NAVY : BORDER,
            border: "none", cursor: input.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "background 0.15s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function OnlineAvatar({ user }) {
  const firstName = user.full_name?.split(" ")[0] || "?";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
      <div style={{ position: "relative" }}>
        <Avatar url={user.photo_url} name={user.full_name} size={30} />
        <div style={{
          position: "absolute", bottom: 0, right: 0,
          width: 8, height: 8, borderRadius: "50%",
          background: "#22C55E", border: "2px solid #fff",
        }} />
      </div>
      <span style={{
        fontSize: "10px", color: "#374151", fontFamily: SANS, fontWeight: 500,
        maxWidth: 42, textAlign: "center",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {firstName}
      </span>
    </div>
  );
}

function groupMessages(messages) {
  const groups = [];
  let current = null;
  for (const msg of messages) {
    if (!current || current.profile_id !== msg.profile_id) {
      current = { profile_id: msg.profile_id, messages: [msg] };
      groups.push(current);
    } else {
      current.messages.push(msg);
    }
  }
  return groups;
}

function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function ChevronLeft() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: BG, zIndex: 200,
  display: "flex", flexDirection: "column",
};

const topBar = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "0.875rem 1.25rem", borderBottom: `1px solid ${BORDER}`,
  background: "#fff", flexShrink: 0,
};

const backBtn = {
  background: "none", border: "none", cursor: "pointer",
  padding: "4px 6px 4px 0", color: NAVY,
  display: "flex", alignItems: "center",
};
