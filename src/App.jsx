import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase.js";
import { matchesAudience } from "./lib/utils.js";
import { Login, ChangePassword } from "./pages/auth/index.js";
import { Home } from "./pages/home/index.js";
import { Updates } from "./pages/updates/index.js";
import { Profile } from "./pages/profile/index.js";
import { BottomNav } from "./components/layout/index.js";
import { Shell } from "./components/layout/index.js";
import { SANS, TSEC, ORANGE } from "./lib/constants.js";
import { EventHome, MyTeam, PrayerChain, TheFour, FieldGuide, CoordinatorView, MyChecklist, Attendance } from "./pages/event/index.js";
import { OnboardingFlow } from "./pages/event/onboarding/index.js";
import { AdminShell } from "./pages/admin/index.js";
import { Chat } from "./pages/chat/index.js";


function LoadingScreen() {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#FAFAFA",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 20,
    }}>
      {/* Logo + spinning ring */}
      <div style={{ position: "relative", width: 72, height: 72 }}>
        <div style={{
          position: "absolute",
          inset: -10,
          borderRadius: "50%",
          border: "2.5px solid #E5E5E5",
          borderTopColor: ORANGE,
          animation: "spin412 1s linear infinite",
        }} />
        <img
          src="/logo.png"
          alt="412 Ministry"
          style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", display: "block" }}
        />
      </div>
      <div style={{ fontSize: "12px", fontWeight: 600, color: TSEC, fontFamily: SANS, letterSpacing: "0.04em" }}>
        Loading…
      </div>
      <style>{`@keyframes spin412 { to { transform: rotate(360deg); } }`}</style>
    </div>
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
              borderRadius: 12,
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
  const [phase, setPhase] = useState("loading");
  const [tab, setTab] = useState("home");
  const [page, setPage] = useState(null);
  const [data, setData] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const [readIds, setReadIds] = useState([]);
  const [chatUnread, setChatUnread] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [profileReturnTo, setProfileReturnTo] = useState(null);

  const lastRefreshRef = useRef(0);

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
      let coLeaderChecklist = null;
      let coLeaderVisited = false;

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

          // Co-leader's checklist + onboarding status (for MyTeam progress view)
          if (eventMember.co_leader_id) {
            const { data: clEm } = await supabase
              .from("event_members")
              .select("id, onboarding_visited, onboarding_completed")
              .eq("profile_id", eventMember.co_leader_id)
              .eq("event_id", activeEvent.id)
              .maybeSingle();
            if (clEm) {
              coLeaderVisited = clEm.onboarding_visited === true || clEm.onboarding_completed === true;
              const { data: clCl } = await supabase
                .from("event_checklist")
                .select("items")
                .eq("event_member_id", clEm.id)
                .maybeSingle();
              coLeaderChecklist = clCl || null;
            }
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

      // Public events — visible to all logged-in users for the events browser
      const { data: publicEventsRaw } = await supabase
        .from("events")
        .select("id, name, type, description, dates, location, fee, registration_url, visible_to_public, allow_join_requests, status, start_date, end_date")
        .eq("visible_to_public", true)
        .order("start_date", { ascending: true });
      const publicEvents = publicEventsRaw || [];

      let allProfiles = null;
      let allEvents = null;
      let allEventMembers = null;
      let allAnnouncements = null;
      let pendingAnnouncements = null;
      let joinRequests = null;
      let assignedEventIds = null; // null = admin (all), array = moderator's events

      if (isModerator) {
        const { data: ap } = await supabase
          .from("profiles")
          .select("*, churches(name)")
          .order("full_name");
        allProfiles = ap || [];

        if (isAdmin) {
          // Admin sees all events, all members, all announcements
          const { data: ae } = await supabase
            .from("events")
            .select("*")
            .order("created_at", { ascending: false });
          allEvents = ae || [];

          const { data: aem } = await supabase
            .from("event_members")
            .select("*, profiles!event_members_profile_id_fkey(full_name, photo_url, email)")
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
        } else {
          // Moderator: scope to assigned events only
          const { data: assignments } = await supabase
            .from("moderator_assignments")
            .select("event_id")
            .eq("moderator_id", user.id);
          assignedEventIds = (assignments || []).map((a) => a.event_id);

          if (assignedEventIds.length > 0) {
            const { data: ae } = await supabase
              .from("events")
              .select("*")
              .in("id", assignedEventIds)
              .order("created_at", { ascending: false });
            allEvents = ae || [];

            const { data: aem } = await supabase
              .from("event_members")
              .select("*, profiles!event_members_profile_id_fkey(full_name, photo_url, email)")
              .in("event_id", assignedEventIds)
              .order("team_number");
            allEventMembers = aem || [];

            const { data: aa } = await supabase
              .from("announcements")
              .select("*")
              .or(`event_id.in.(${assignedEventIds.join(",")}),event_id.is.null`)
              .order("created_at", { ascending: false });
            allAnnouncements = aa || [];

            const { data: pa } = await supabase
              .from("announcements")
              .select("*")
              .eq("status", "pending_approval")
              .or(`event_id.in.(${assignedEventIds.join(",")}),event_id.is.null`)
              .order("created_at", { ascending: false });
            pendingAnnouncements = pa || [];

            const { data: jr } = await supabase
              .from("event_join_requests")
              .select("*, profiles(full_name, photo_url), events(name)")
              .in("event_id", assignedEventIds)
              .eq("status", "pending")
              .order("created_at", { ascending: false });
            joinRequests = jr || [];
          } else {
            allEvents = [];
            allEventMembers = [];
            allAnnouncements = [];
            pendingAnnouncements = [];
            joinRequests = [];
          }
        }
      }

      setData({
        profile,
        churches,
        activeEvent,
        eventMember,
        eventChecklist,
        coLeader,
        coLeaderChecklist,
        coLeaderVisited,
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
        assignedEventIds,
        publicEvents,
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

  // Realtime announcements — push new published announcements to all active users
  useEffect(() => {
    if (!data?.profile) return;
    const ch = supabase
      .channel("app-announcements")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements", filter: "status=eq.published" }, () => {
        loadData();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "announcements" }, (payload) => {
        if (payload.new?.status === "published") loadData();
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [data?.profile?.id]);

  // Chat unread badge — listen for new DMs addressed to me
  useEffect(() => {
    if (!data?.profile) return;
    const profileId = data.profile.id;

    supabase
      .from("dm_messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", profileId)
      .is("read_at", null)
      .then(({ count }) => { if (count > 0) setChatUnread(true); });

    const ch = supabase
      .channel("app-dm-unreads")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages", filter: `receiver_id=eq.${profileId}` }, () => {
        setChatUnread(true);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [data?.profile?.id]);

  const openChat = () => {
    setChatUnread(false);
    setProfileReturnTo(null);
    setPage("chat");
  };

  useEffect(() => {
    const timer = setTimeout(
      () => setPhase((p) => (p === "loading" ? "login" : p)),
      8000
    );
    loadData().finally(() => clearTimeout(timer));

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRefreshRef.current < 30000) return;
      lastRefreshRef.current = now;
      loadData();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setData(null);
        setPhase("login");
      }
    });

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
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
            onOpenChat={openChat}
            onOpenOnboarding={() => { setTab("event"); setPage("onboarding"); }}
            onOpenMyTeam={() => { setTab("event"); setPage("myteam"); }}
            onOpenUpdates={() => navigate("updates")}
            onOpenEventPage={(p) => { setTab("event"); setPage(p); }}
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
        {tab === "event" && page === "attendance" && <Attendance data={data} onBack={() => setPage(null)} />}

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
            onBack={profileReturnTo === "chat" ? () => { setProfileReturnTo(null); openChat(); } : null}
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
          <Chat
            data={data}
            onClose={() => setPage(null)}
            onlineUsers={onlineUsers}
            onOpenProfile={() => { setProfileReturnTo("chat"); setPage(null); setTab("profile"); }}
          />
        )}
      </>
    );
  }

  return <ErrorScreen message="" onReset={hardReset} />;
}
