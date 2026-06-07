import { useState } from "react";
import { NAVY, ORANGE, GOLD, TSEC, BORDER, BG, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, Avatar, SectionLabel } from "../../components/ui/index.js";
import { DailyVerse, ContactForm } from "../../components/shared/index.js";

function daysUntil(dateStr) {
  if (!dateStr) return null;
  // Parse "August 5-9, 2026" → "August 5, 2026"  or  "August 5, 2026"
  const m1 = dateStr.match(/([A-Za-z]+ \d+)[–\-]\d+,?\s*(\d{4})/);
  const m2 = dateStr.match(/([A-Za-z]+ \d+,\s*\d{4})/);
  const parsed = m1 ? new Date(`${m1[1]}, ${m1[2]}`) : m2 ? new Date(m2[1]) : null;
  if (!parsed || isNaN(parsed)) return null;
  const diff = Math.ceil((parsed - new Date()) / 86400000);
  return diff;
}

export default function Home({ data, onNavigate, onOpenPage, onOpenChat, onOpenOnboarding }) {
  const { profile, eventMember, announcements, unreadCount, activeEvent, trainingMaterials } = data;
  const [showContact, setShowContact] = useState(false);
  const displayName = profile.nickname || (profile.full_name || "").split(" ")[0];
  const latestAnn = (announcements || []).find(() => true);
  const days = daysUntil(activeEvent?.dates);

  return (
    <Shell withNav>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
        <div>
          <div style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.16em", color:ORANGE, textTransform:"uppercase", fontFamily:SANS, marginBottom:4 }}>412 Ministry</div>
          <div style={{ fontFamily:SERIF, fontSize:"26px", fontWeight:600, color:NAVY, lineHeight:1.2 }}>
            Hi <span style={{ color:ORANGE }}>{displayName}</span>.
          </div>
        </div>
        <button
          onClick={onOpenChat}
          style={{ background:"none", border:"none", cursor:"pointer", padding:6, color:NAVY, display:"flex", alignItems:"center" }}
          title="Team Chat"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>

      {eventMember && !eventMember.onboarding_completed && (
        <button
          onClick={onOpenOnboarding}
          style={{
            width:"100%", textAlign:"left", background:ORANGE, borderRadius:14,
            padding:"1rem 1.25rem", marginBottom:"1.25rem", border:"none",
            cursor:"pointer", fontFamily:SANS,
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}
        >
          <div>
            <div style={{ fontSize:"10px", fontWeight:700, letterSpacing:"0.1em", color:"rgba(255,255,255,0.8)", marginBottom:3, textTransform:"uppercase" }}>
              Action required
            </div>
            <div style={{ fontSize:"15px", fontWeight:700, color:"#fff", marginBottom:2 }}>
              Complete your onboarding
            </div>
            <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.85)" }}>
              A few steps to get you set up for {activeEvent?.name || "the conference"}
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6"/>
          </svg>
        </button>
      )}

      <DailyVerse/>

      {activeEvent && days !== null && days >= 0 && (
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          background:"#fff", border:`1px solid ${BORDER}`, borderRadius:14,
          padding:"1rem 1.25rem", marginBottom:"1rem", fontFamily:SANS,
        }}>
          <div>
            <div style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.1em", color:ORANGE, textTransform:"uppercase", marginBottom:3 }}>
              {days === 0 ? "Today!" : "Countdown"}
            </div>
            <div style={{ fontSize:"14px", fontWeight:600, color:NAVY }}>{activeEvent.name}</div>
            <div style={{ fontSize:"12px", color:TSEC, marginTop:2 }}>{activeEvent.dates}</div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            {days === 0 ? (
              <div style={{ fontFamily:SERIF, fontSize:"22px", fontWeight:600, color:ORANGE }}>It's here!</div>
            ) : (
              <>
                <div style={{ fontFamily:SERIF, fontSize:"44px", fontWeight:600, color:NAVY, lineHeight:1 }}>{days}</div>
                <div style={{ fontSize:"11px", color:TSEC, fontWeight:600, letterSpacing:"0.04em" }}>{days === 1 ? "day" : "days"}</div>
              </>
            )}
          </div>
        </div>
      )}

      {latestAnn&&(
        <button onClick={()=>onNavigate("updates")} style={{ width:"100%", textAlign:"left", background:"#EEF2FC", borderRadius:14, padding:"1rem 1.25rem", marginBottom:"1rem", border:"none", cursor:"pointer", fontFamily:SANS }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
            <div style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.06em", color:"#1A4FBF" }}>ANNOUNCEMENT</div>
            {unreadCount>0&&<div style={{ background:"#E53E3E", color:"#fff", fontSize:"10px", fontWeight:700, borderRadius:99, padding:"2px 7px" }}>{unreadCount} new</div>}
          </div>
          <div style={{ fontSize:"14px", fontWeight:600, color:"#1A3080", marginBottom:2 }}>{latestAnn.title}</div>
          <div style={{ fontSize:"13px", color:"#1A3080", lineHeight:1.5, opacity:0.85, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{latestAnn.body}</div>
        </button>
      )}

      {activeEvent&&(
        <button onClick={()=>onNavigate("event")} style={{ width:"100%", textAlign:"left", background:NAVY, borderRadius:16, padding:"1.5rem", marginBottom:"1rem", border:"none", cursor:"pointer", fontFamily:SANS }}>
          <div style={{ fontSize:"11px", fontWeight:700, letterSpacing:"0.14em", color:GOLD, textTransform:"uppercase", marginBottom:"0.25rem" }}>{eventMember?"Your Event":"Upcoming Event"}</div>
          <div style={{ fontFamily:SERIF, fontSize:"22px", fontWeight:600, color:"#fff", lineHeight:1.2, marginBottom:"0.5rem" }}>{activeEvent.name}</div>
          <div style={{ fontSize:"13px", color:"#B8C0D0" }}>{activeEvent.dates}</div>
          {activeEvent.location&&<div style={{ fontSize:"13px", color:"#B8C0D0" }}>{activeEvent.location}</div>}
          {eventMember?.onboarding_completed && (
            <div style={{ marginTop:"0.75rem", background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 12px", display:"inline-block", fontSize:"12px", fontWeight:600, color:"rgba(255,255,255,0.85)" }}>
              Review onboarding →
            </div>
          )}
        </button>
      )}

      {trainingMaterials&&trainingMaterials.length>0&&(
        <div style={{ marginBottom:"1rem" }}>
          <SectionLabel>Training</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {trainingMaterials.map(m=>(
              <Card key={m.id} style={{ padding:"1rem 1.25rem" }}>
                <div style={{ fontSize:"14px", fontWeight:600, color:NAVY, marginBottom:4 }}>{m.title}</div>
                {m.body&&<div style={{ fontSize:"13px", color:TSEC, lineHeight:1.5 }}>{m.body}</div>}
                {m.external_url&&(
                  <div style={{ marginTop:6 }}>
                    <a href={m.external_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:"12px", color:ORANGE, fontWeight:600, textDecoration:"none" }}>Open</a>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      <button onClick={()=>setShowContact(true)} style={{ width:"100%", background:"#fff", border:`1px solid ${BORDER}`, borderRadius:14, padding:"1rem 1.25rem", cursor:"pointer", fontFamily:SANS, display:"flex", alignItems:"center", gap:12, marginBottom:"0.5rem" }}>
        <div style={{ width:38, height:38, borderRadius:10, background:BG, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        </div>
        <div style={{ flex:1, textAlign:"left" }}>
          <div style={{ fontSize:"14px", fontWeight:600, color:NAVY }}>Contact Us</div>
          <div style={{ fontSize:"12px", color:TSEC, marginTop:1 }}>Send a message to the 412 team</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
      </button>

      {showContact&&<ContactForm profile={profile} onClose={()=>setShowContact(false)}/>}
    </Shell>
  );
}
