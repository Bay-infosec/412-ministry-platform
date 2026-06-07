import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase.js";
import { matchesAudience } from "./lib/utils.js";
import { Login, ChangePassword } from "./pages/auth/index.js";
import { Home } from "./pages/home/index.js";
import { Updates } from "./pages/updates/index.js";
import { Profile } from "./pages/profile/index.js";
import { BottomNav } from "./components/layout/index.js";
import { Shell } from "./components/layout/index.js";
import { SANS, TSEC, ORANGE } from "./lib/constants.js";
import { EventHome, MyTeam, PrayerChain, TheFour, FieldGuide, CoordinatorView, MyChecklist } from "./pages/event/index.js";
import { OnboardingFlow } from "./pages/event/onboarding/index.js";
import { AdminShell } from "./pages/admin/index.js";
import { Chat } from "./pages/chat/index.js";


function useFonts() {
  useEffect(() => {
    if (document.getElementById("app-fonts")) return;
    const link = document.createElement("link");
    link.id = "app-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap";
    document.head.appendChild(link);
  }, []);
}

function LoadingScreen() {
  return (
    <Shell>
      <div
        style={{
          textAlign: "center",
          marginTop: "6rem",
          color: TSEC,
          fontSize: "14px",
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: ORANGE,
            textTransform: "uppercase",
            marginBottom: "1rem",
            fontFamily: SANS,
          }}
        >
          412 Ministry
        </div>
        Loading…
      </div>
    </Shell>
  );
}

function ErrorScreen({ message, onReset }) {
  return (
    <Shell>
      <div
        style={{
          textAlign: "center",
          marginTop: "5rem",
          color: TSEC,
          fontSize: "14px",
          lineHeight: 1.6,
          fontFamily: SANS,
        }}
      >
        {message || "Something went wrong loading your data."}
        <div style={{ marginTop: "1.5rem" }}>
          <button
            onClick={onReset}
            style={{
              background: ORANGE,
              color: "#fff",
              border: "none",
              padding: "11px 22px",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Sign out and try again
          </button>
        </div>
      </div>
    </Shell>
  );
}

export default function App() {
  useFonts();

  const [phase, setPhase] = useState("loading");
  const [tab, setTab] = useState("home");
  const [page, setPage] = useState(null);
  const [data, setData] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const [readIds, setReadIds] = useState([]);
  const [chatUnread, setChatUnread] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const hardReset = async () => {
    try { await supabase.auth.signOut(); } catch {}
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("sb-") || k.includes("supabase"))
          localStorage.removeItem(k);
      });
    } catch {}
    setData(null);
    setErrMsg("");
    setTab("home");
    setPage(null);
    setPhase("login");
  };

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setPhase("login"); return; }
      const user = session.user;

      // Load profile
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (pErr || !profile) {
        setErrMsg("We could not find your profile. Please contact your coordinator.");
        setPhase("error");
        return;
      }

      if (profile.password_changed === false) {
        setData({ profile });
        setPhase("changepw");
        return;
      }

      // Load churches
      const { data: churches } = await supabase
        .from("churches")
        .select("*")
        .order("name");

      // Load active event
      const { data: activeEvent } = await supabase
        .from("events")
        .select("*")
        .eq("status", "active")
        .single();

      // Load event membership
      let eventMember = null;
      let eventChecklist = {};
      let coLeader = null;
      let coordinator = null;

      if (activeEvent) {
        const { data: em } = await supabase
          .from("event_members")
          .select("*")
          .eq("profile_id", user.id)
          .eq("event_id", activeEvent.id)
          .single();

        eventMember = em || null;

        if (eventMember) {
          const { data: cl } = await supabase
            .from("event_checklist")
            .select("*")
            .eq("event_member_id", eventMember.id)
            .single();
          eventChecklist = cl || {};

          if (eventMember.co_leader_id) {
            const { data: cl2 } = await supabase
              .from("profiles")
              .select("full_name, phone, email, photo_url, ministry_role, churches(name)")
              .eq("id", eventMember.co_leader_id)
              .single();
            coLeader = cl2 || null;
          }

          if (eventMember.coordinator_id && profile.platform_role !== "admin") {
            const { data: coord } = await supabase
              .from("profiles")
              .select("full_name, church_id, phone, email, photo_url")
              .eq("id", eventMember.coordinator_id)
              .single();
            coordinator = coord || null;
          }
        }
      }

      // Load announcements
      const { data: annsRaw } = await supabase
        .from("announcements")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      const audienceCtx = {
        id: profile.id,
        ministry: eventMember?.ministry,
        team_number: eventMember?.team_number,
        event_role: eventMember?.event_role,
        platform_role: profile.platform_role,
      };

      const announcements = (annsRaw || []).filter((a) =>
        matchesAudience(a.audience, audienceCtx)
      );

      // Load read announcements
      const { data: reads } = await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("profile_id", user.id);

      const dIds = (reads || []).map((r) => r.announcement_id);
      setReadIds(dIds);

      const unreadCount = announcements.filter(
        (a) => !dIds.includes(a.id)
      ).length;

      // Load event history
      const { data: histRows } = await supabase
        .from("event_members")
        .select("*, events(name, status, dates, type)")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false });

      const history = histRows || [];

      // Load training materials
      const { data: training } = await supabase
        .from("training_materials")
        .select("*")
        .eq("published", true)
        .order("display_order");

      // Admin/moderator data
      const isAdmin = profile.platform_role === "admin";
      const isModerator = profile.platform_role === "moderator" || isAdmin;

      let allProfiles = null;
      let allEvents = null;
      let allEventMembers = null;
      let allAnnouncements = null;
      let pendingAnnouncements = null;
      let joinRequests = null;

      if (isModerator) {
        const { data: ap } = await supabase
          .from("profiles")
          .select("*, churches(name)")
          .order("full_name");
        allProfiles = ap || [];

        const { data: ae } = await supabase
          .from("events")
          .select("*")
          .order("created_at", { ascending: false });
        allEvents = ae || [];

        const { data: aem } = await supabase
          .from("event_members")
          .select("*, profiles(full_name, photo_url, email)")
          .order("team_number");
        allEventMembers = aem || [];

        const { data: aa } = await supabase
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false });
        allAnnouncements = aa || [];

        const { data: pa } = await supabase
          .from("announcements")
          .select("*")
          .eq("status", "pending_approval")
          .order("created_at", { ascending: false });
        pendingAnnouncements = pa || [];

        const { data: jr } = await supabase
          .from("event_join_requests")
          .select("*, profiles(full_name, photo_url), events(name)")
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        joinRequests = jr || [];
      }

      setData({
        profile,
        churches,
        activeEvent,
        eventMember,
        eventChecklist,
        coLeader,
        coordinator,
        announcements,
        unreadCount,
        history,
        trainingMaterials: training || [],
        isAdmin,
        isModerator,
        allProfiles,
        allEvents,
        allEventMembers,
        allAnnouncements,
        pendingAnnouncements,
        joinRequests,
      });

      setPhase("app");
    } catch (e) {
      console.error(e);
      setErrMsg("Could not connect. Please sign out and try again.");
      setPhase("error");
    }
  };

  const markRead = (annId) => {
    setReadIds((prev) => [...prev, annId]);
    setData((d) => ({
      ...d,
      unreadCount: Math.max(0, (d.unreadCount || 1) - 1),
    }));
  };

  // App-wide presence — tracks current user as online whenever platform is open
  useEffect(() => {
    if (!data?.profile || !data?.activeEvent) return;
    const ch = supabase.channel(`presence-${data.activeEvent.id}`, {
      config: { presence: { key: data.profile.id } },
    });
    ch
      .on("presence", { event: "sync" }, () => {
        setOnlineUsers(Object.values(ch.presenceState()).flat());
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await ch.track({
            user_id: data.profile.id,
            full_name: data.profile.full_name,
            photo_url: data.profile.photo_url || null,
          });
        }
      });
    return () => { ch.untrack(); supabase.removeChannel(ch); };
  }, [data?.profile?.id, data?.activeEvent?.id]);

  // Chat unread badge — check on load + subscribe for new messages
  useEffect(() => {
    if (!data?.activeEvent || !data?.profile) return;
    const eventId = data.activeEvent.id;
    const profileId = data.profile.id;
    const lastRead = localStorage.getItem(`chat_last_read_${eventId}`);

    let q = supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .neq("profile_id", profileId);
    if (lastRead) q = q.gt("created_at", lastRead);
    q.then(({ count }) => { if (count > 0) setChatUnread(true); });

    const ch = supabase
      .channel(`app-unreads-${eventId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "chat_messages",
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        if (payload.new.profile_id !== profileId) setChatUnread(true);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [data?.activeEvent?.id, data?.profile?.id]);

  const openChat = () => {
    if (data?.activeEvent) {
      localStorage.setItem(`chat_last_read_${data.activeEvent.id}`, new Date().toISOString());
    }
    setChatUnread(false);
    setPage("chat");
  };

  useEffect(() => {
    const timer = setTimeout(
      () => setPhase((p) => (p === "loading" ? "login" : p)),
      8000
    );
    loadData().finally(() => clearTimeout(timer));

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setData(null);
        setPhase("login");
      }
    });

    return () => {
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  if (phase === "loading") return <LoadingScreen />;
  if (phase === "login") return <Login onLoggedIn={loadData} />;
  if (phase === "changepw") return <ChangePassword onDone={loadData} />;
  if (phase === "error") return <ErrorScreen message={errMsg} onReset={hardReset} />;

  if (phase === "app" && data) {
    const hasEvent = !!(data.eventMember || data.isModerator);
    const navigate = (t) => { setTab(t); setPage(null); };

    return (
      <>
        {tab === "home" && (
          <Home
            data={data}
            onNavigate={navigate}
            onOpenPage={setPage}
            onOpenChat={openChat}
            onOpenOnboarding={() => { setTab("event"); setPage("onboarding"); }}
            chatUnread={chatUnread}
            onlineUsers={onlineUsers}
          />
        )}
        {tab === "event" && !page && (
          <EventHome
            data={data}
            onOpenPage={setPage}
            onNavigate={navigate}
          />
        )}
        {tab === "event" && page === "onboarding" && (
          <OnboardingFlow
            data={data}
            onDone={() => { loadData(); setPage(null); }}
            onExit={() => { loadData(); setPage(null); }}
          />
        )}
        {tab === "event" && page === "myteam" && <MyTeam data={data} onBack={() => setPage(null)} />}
        {tab === "event" && page === "prayer_chain" && <PrayerChain data={data} onBack={() => setPage(null)} />}
        {tab === "event" && page === "the_four" && <TheFour data={data} onBack={() => setPage(null)} />}
        {tab === "event" && page === "field_guide" && <FieldGuide data={data} onBack={() => setPage(null)} />}
        {tab === "event" && page === "coordinator" && <CoordinatorView data={data} onBack={() => setPage(null)} />}
        {tab === "event" && page === "checklist" && <MyChecklist data={data} onBack={() => setPage(null)} />}

        {tab === "updates" && (
          <Updates
            data={data}
            readIds={readIds}
            onMarkRead={markRead}
          />
        )}
        {tab === "profile" && (
          <Profile
            data={data}
            onSaved={loadData}
            onSignOut={hardReset}
            onOpenAdmin={() => setPage("admin")}
          />
        )}
        <BottomNav
          active={tab}
          onNavigate={navigate}
          hasEvent={hasEvent}
          unreadCount={data.unreadCount}
          profilePhotoUrl={data.profile.photo_url}
        />
        {page === "admin" && data.isModerator && (
          <AdminShell
            data={data}
            onClose={() => setPage(null)}
            onRefresh={loadData}
            isAdmin={data.isAdmin}
          />
        )}
        {page === "chat" && (
          <Chat data={data} onClose={() => setPage(null)} onlineUsers={onlineUsers} />
        )}
      </>
    );
  }

  return <ErrorScreen message="" onReset={hardReset} />;
}
