# 412 Ministry Platform — CLAUDE.md

This file is the shared brain between two Claude Code sessions and accounts.
Read it fully before starting work. Update **Progress Log** and **Next Up** after each session, then push to GitHub.

---

## Project Overview

A mobile-first PWA for 412 Ministry — a Mongolian-American Christian youth/leadership ministry.
**Vision:** A permanent general-purpose ministry platform where events (conferences, open mics, missions) come and go, but people stay forever.

**Stack:** React 18 + Vite, Supabase (auth + DB + storage + realtime), Vercel (hosting), EmailJS (email), no UI library (inline styles only), no router (state-based navigation).

**Active event:** Set Apart 2026 — August 5–9, Rhodes Grove Camp, PA. ~24 team leaders.

---

## Connections & Credentials

| Service   | Detail |
|-----------|--------|
| GitHub    | `Bay-infosec/412-ministry-platform` (private) |
| Supabase  | Project `hoxjardsthjuhbxivken` (us-east-1) — `412-ministry-platform` |
| Vercel    | Project `412-ministry-platform`, team `bayinfosec-6329s-projects` |
| Local     | `~/Projects/412-ministry-platform` |
| EmailJS   | service_7njy4no, invite: template_6d9u7bp, announcement: template_ecf57nm, public key: FP0ZiFckHYBqYpN6s |
| Field Guide | `https://drive.google.com/file/d/1VVARCRm2Rl9NkH7i0wzDot5KwJbN-dF7/preview` |

---

## Design Tokens (`src/lib/constants.js`)

| Name    | Value       | Use              |
|---------|-------------|------------------|
| NAVY    | `#162038`   | Primary text/bg  |
| ORANGE  | `#E8621A`   | Accent/CTA       |
| GOLD    | `#EFAB25`   | Event highlights |
| TSEC    | `#8A8498`   | Secondary text   |
| BORDER  | `#E2DDD6`   | Dividers         |
| BG      | `#F7F4EF`   | Page background  |
| SANS    | DM Sans     | UI font          |
| SERIF   | Cormorant Garamond | Headings  |

---

## Platform Architecture (agreed design)

### Two-layer model
- **Layer 1 — Person (permanent):** Profile, photo, church, ministry role, event history. Never deleted.
- **Layer 2 — Event (temporary):** Conference/openmic/mission. Person gets an event role. Archived when done.

### Role system
- **Platform roles:** `admin` | `moderator` | `member`
- **Event roles:** `leader` | `coordinator` | `participant` | `volunteer`
- Coordinator is an event role, not a platform role. Coordinators are also team leaders this year.
- **Moderators (Khaliunaa, Bilgee, Enkhbayar):** platform_role = "moderator", NOT in event_members. They access the admin panel with limited permissions.

### Home screen content tiers
- **Tier 1 — Always visible:** Daily verse (api.bible), training materials, contact button
- **Tier 2 — Public events:** Anyone can see and request to join
- **Tier 3 — Event-specific:** Only visible to accepted participants

### Admin panel design (two entry points only)
- **People** — Search/find any person, open their profile, see everything, do everything from one screen. Bulk actions with checkboxes.
- **Events** — Open any event, manage everything inside it (members, pairing, announcements, content, progress, chat).

### Admin permission boundaries
| Action | Admin | Moderator | Coordinator |
|--------|-------|-----------|-------------|
| Create events | ✅ | ❌ | ❌ |
| Create accounts + invite | ✅ | ❌ | ❌ |
| Assign platform roles | ✅ | ❌ | ❌ |
| Write personal messages | ✅ | ❌ | ❌ |
| Pair co-leaders | ✅ | ❌ | ❌ |
| Assign coordinators to teams | ✅ | ❌ | ❌ |
| Post announcements | ✅ | ✅ (needs admin approval) | ❌ |
| Approve join requests | ✅ | ✅ | ❌ |
| See all member profiles | ✅ | ✅ | own teams only |
| Reset passwords | ✅ | ❌ | ❌ |
| Manage church list | ✅ | ❌ | ❌ |
| Manage training materials | ✅ | ❌ | ❌ |

### Confirmation tiers (professional UX)
- **Tier 1 (reversible):** Single confirm modal — reset password, change role, remove from event
- **Tier 2 (destructive/bulk):** Double confirm + type a word — archive event, bulk actions on 10+ people
- **Tier 3 (safe):** No confirm needed — drafting, editing, searching
- All actions show a **Toast** with exactly what happened and who was affected

### Password flow
- Admin creates account → system generates random temp password (e.g. `Grace742!`)
- Password goes to person's email only (via EmailJS invite template) — never shown on screen
- Person logs in → forced to change immediately
- **Password reset:** Admin resets → new temp password shown ONCE in a modal on screen → admin copies and sends manually (no reset email since only 2 EmailJS templates allowed)

### Co-leader pairing
- Dedicated pairing screen inside an event
- Shows all unpaired leaders
- Select two → system validates (same event, same team number, neither already paired)
- Preview: "You are pairing X and Y as co-leaders on Team 3, EM Ministry"
- Confirm → both records update simultaneously → clear success toast
- Unpairing is a separate action with confirmation

### Onboarding flow (6 steps, kept as code templates)
1. Welcome + personal message (written by admin per person)
2. Event info (dates, location, fee, verse, team count)
3. Requirements (2 items, acknowledge button, email option)
4. Team reveal (team #, ministry, co-leader reveal mechanic — one time, stays revealed)
5. Pre-conference checklist
6. Exit → home

### Announcements
- Moderator drafts → sits as `pending_approval` → admin approves → published
- Audience targeting: all | by ministry (EM/MM) | by team | by role | by specific person
- Email notification to targeted audience via EmailJS announcement template

### Chat
- Supabase Realtime, per-event room
- Text, emoji, images (Supabase Storage), GIFs (Giphy free API)
- No typing indicators, no reactions, no threads — keep simple

### Bible verse
- api.bible (free) for daily verse on home screen
- Possibly leader-specific verse selection

---

## Database Schema (Supabase `hoxjardsthjuhbxivken`)

All tables created with RLS. Complete SQL already ran successfully.

| Table | Rows | Notes |
|-------|------|-------|
| `profiles` | 28 | Linked to auth.users. platform_role: admin/moderator/member. Has church_name_custom for pending church submissions. |
| `churches` | 17 | columns: id, name, city, state, created_at |
| `events` | 1 | Active: Set Apart 2026 |
| `event_members` | 24 | co_leader_id and coordinator_id store profile_id (NOT event_members.id). All 12 teams fully paired and coordinator-assigned. |
| `event_checklist` | 24 | JSONB items field, flexible per event |
| `event_content` | 0 | Per-event onboarding pages (not yet used) |
| `event_join_requests` | 0 | Approval flow for public events |
| `announcements` | 0 | Audience-filtered, draft/pending_approval/published |
| `announcement_reads` | 0 | Tracks who read what |
| `training_materials` | 0 | columns: id, title, body, type, external_url, display_order, published, created_at |
| `messages` | 0 | Chat (table exists, feature not built) |

Profile trigger auto-creates profile row on auth user creation. ✅
Service role grants added. ✅
Storage buckets: `avatars` (public) + `attachments` (public). ✅

---

## Supabase Edge Functions

`create-user` function designed (creates auth user, generates temp password, sends invite email via EmailJS).
**Status:** May or may not be deployed — verify in Supabase dashboard.

---

## File Structure (designed, partially implemented)

```
src/
├── main.jsx
├── App.jsx                    — routing only
├── lib/
│   ├── supabase.js
│   ├── constants.js           — colors, fonts
│   └── utils.js               — fmtPhone, formatPhoneInput, validatePassword, fmtDate, matchesAudience
├── components/
│   ├── ui/                    — Button, Field, Card, Avatar, Modal, Toast, Chip, TabBar, Badge, SectionLabel
│   ├── layout/                — Shell, BottomNav, BackBtn
│   └── shared/                — ContactForm, DailyVerse
├── pages/
│   ├── auth/                  — Login ✅, ChangePassword ✅ (password validation enforced)
│   ├── home/                  — Home ✅ (dismissible onboarding banner, rich conference card, countdown, fee, verse, register button)
│   ├── event/
│   │   ├── EventHome ✅ (same rich conference card as Home)
│   │   ├── onboarding/        — OnboardingFlow ✅ (saves to event_checklist table ✅)
│   │   ├── MyTeam ✅
│   │   ├── PrayerChain ✅ (pulls from DB, 12-team schedule Jul10–Aug2, Aug3 all pray, 7 prayer topics)
│   │   ├── TheFour ✅
│   │   ├── FieldGuide ✅ (real Google Drive URL)
│   │   └── Chat ✅ (Supabase Realtime, per-event room, emoji, presence strip with names)
│   ├── updates/               — Updates ✅
│   ├── profile/               — Profile ✅ (phone formatting, password validation, church Other option, history shows "Team leader")
│   └── admin/                 ✅ BUILT
│       ├── AdminShell ✅       — People, Events, Announcements, Settings entry points
│       ├── people/            — PeopleList ✅, PersonDetail ✅, InviteFlow ✅
│       ├── events/            — EventList ✅, EventDetail ✅, CoLeaderPairing ✅
│       ├── announcements/     — AnnouncementList ✅, AnnouncementEditor ✅ (draft/pending/published flow)
│       └── settings/          — ChurchList ✅, TrainingMaterials ✅
```

---

## Known Bugs

- [x] Fixed: `EventHome` imported twice in `App.jsx`
- [x] Fixed: `OnboardingFlow` now writes to `event_checklist` table
- [x] Fixed: `PrayerChain` now pulls from DB (event_members + profiles)
- [x] Fixed: `FieldGuide` real URL set
- [x] Fixed: HTTP 500 on events/announcements/event_members — recursive RLS policy replaced with `auth.uid() IS NOT NULL`
- [x] Fixed: Khaliunaa's stale event_members coordinator record removed
- [x] Fixed: Coordinator sees themselves in their own team view — `CoordinatorView.jsx` now filters `.neq("event_role", "coordinator")`

---

## Features Missing vs V2 (LeaderOnboarding)

| Feature | Priority |
|---------|----------|
| Admin panel (full) | 🔴 HIGH — most critical gap |
| Co-leader pairing UI | 🔴 HIGH |
| Countdown timer (days until conference) on Home | 🟡 MEDIUM |
| Prayer countdown (days until team's prayer turn) | 🟡 MEDIUM |
| Prayer chain from DB (not hardcoded) | 🟡 MEDIUM |
| FieldGuide real URL | 🟡 MEDIUM (quick fix) |
| Co-leader reveal saves properly | 🟡 MEDIUM |
| onboarding_visited flag used on Home button | 🟡 MEDIUM |
| Dismissible announcements on Home | 🟡 MEDIUM |
| Zoom training link on Home | 🟡 MEDIUM |
| Team name feature | 🟢 LOW |
| Chat | ✅ DONE |
| Bible verse (api.bible) | 🟢 LOW |
| Email notifications for announcements | 🟢 LOW |

---

## Build Priority Order (agreed)

1. **Fix critical bugs** (OnboardingFlow checklist table, FieldGuide URL)
2. **Admin panel — People** (InviteFlow, PeopleList, PersonDetail with bulk actions)
3. **Admin panel — Events** (EventDetail, MemberAssign, CoLeaderPairing)
4. **Admin panel — Announcements** (editor + approval queue)
5. **Admin panel — Settings** (church list, training materials)
6. **Home improvements** (countdown, prayer countdown, dismissible announcements)
7. **Prayer chain from DB**
8. **Chat**

---

## Progress Log

| Date | Account | What was done |
|------|---------|---------------|
| 2026-06-06 | Account 1 | Set up Claude Code. Cloned repo. Created .env. Connected Supabase + Vercel MCP. Fixed double EventHome import. Created CLAUDE.md. Read full v2 (LeaderOnboarding) codebase. Read Claude.pdf — captured complete architecture decisions. Updated CLAUDE.md. Added EmailJS vars to .env. Fixed FieldGuide URL. Fixed OnboardingFlow checklist table bug. |
| 2026-06-07 | Account 1 | Built complete admin panel: AdminShell, PeopleList, PersonDetail, InviteFlow, EventList, EventDetail, CoLeaderPairing. Fixed Modal.jsx useState bug. Wired AdminShell into App.jsx. Deployed `reset-password` edge function. Build passes clean (118 modules). |
| 2026-06-07 | Account 1 | Phone formatting (formatPhoneInput), password validation (validatePassword), church Other option in Profile. Home redesign: dismissible onboarding banner, rich conference card with countdown/fee/verse/register button. EventHome: same card. PrayerChain: full rewrite from DB, 12-team schedule, 7 prayer topics. Profile history: "Team leader". Admin Announcements: AnnouncementList + AnnouncementEditor with draft/pending/published flow wired into AdminShell. Fixed HTTP 500 recursive RLS policies on events/announcements/event_members. Removed Khaliunaa's stale event_members record. Verified all 12 teams fully paired with co-leaders and coordinators (co_leader_id stores profile_id). |
| 2026-06-07 | Account 1 | Built Chat (Supabase Realtime, grouped messages, emoji, presence strip with names + green dots). Admin EventDetail: personal message editor (per-person speech bubble, textarea + preview, saves to event_members.personal_message), coordinator assignment UI (coordinatorMap, team headers show coord name, Change modal updates all leaders in team). Fixed PostgREST ambiguous FK join bug across EventDetail/CoLeaderPairing/CoordinatorView (profiles!event_members_profile_id_fkey). Fixed RLS blocking admin from inserting event_checklist for new members (checklist_admin_all policy). Fixed co-leader showing raw UUID (added churches join). Fixed call button overflow in MyTeam. Added MyChecklist standalone page. Added Save & exit to OnboardingFlow (saves step to DB). Moved checklist items to shared lib/checklist.js. Added dismissible onboarding banner X button. |
| 2026-06-07 | Account 1 | App-wide presence: moved presence channel from Chat.jsx to App.jsx — users show online anywhere in platform. Chat unread badge: localStorage-based read tracking + realtime new-message subscription sets chatUnread flag. Home chat button redesigned as navy pill with "Chat" label + red dot (unread) / green dot (others online). Chat.jsx now accepts onlineUsers as prop, removed duplicate presence channel. Deployed to Vercel via git push. |
| 2026-06-07 | Account 1 | "Not started" logic for co-leader progress in MyTeam and CoordinatorView (uses onboarding_visited, not onboarding_step which defaults to 1). Profile tagging system: PROFILE_TAGS (board_member, pastor stored in DB tags[]) + ROLE_TAGS (derived from platform_role/event_role) + ProfileTags component. Profile setup step after first password change (photo upload, nickname). Login: Enter key submits form. Chat→Profile back button. PrayerChain full redesign (collapsible schedule, team dates highlighted, prayer topics). Admin SystemGroups: provision 4 system group chats (412 Board, Public, Event Group, Admin+Mods) with sync. EventHome: Team Chat shortcut row. Custom dm_messages table (fixed DMs not sending — internal messages table has NOT NULL constraints). Messenger: nicknames in active strip, conversation list, thread header. CoordinatorView: "Not started" badge. FieldGuide: offline download button. App: visibilitychange auto-refresh (30s debounce). Chat HomeView: Realtime subscription refreshes conversation list on new DMs. Deployed. |
| 2026-06-07 | Account 1 | Platform architecture v2 — full security + multi-event foundation. DB: added moderator_assignments (event-scoped moderators), audit_log, event_attendance, events.allow_join_requests. Fixed critical profiles_admin RLS bug (admin couldn't update other profiles). Replaced blanket open-read policies on events/event_members/conversation_participants with proper membership-scoped policies. Scoped moderator data access to assigned events only. Added 15 DB indexes. App: moderator loadData now fetches only assigned events/members/announcements; realtime announcements subscription; Events Browser page (public events + join requests); BottomNav Events tab. PWA: manifest.json + full iOS/Android meta tags. New admin screens: Moderator Assignments (assign mods to events, writes audit log), Audit Log (action history grouped by date). AnnouncementEditor: EmailJS email-toggle on publish. |
| 2026-06-07 | Account 2 | **Social preview + favicon**: restored Open Graph / Facebook Messenger link-preview meta tags in `index.html` (copied `preview.jpg` from the v1 LeaderOnboarding app into `public/`, og:url now points at `https://412-ministry-platform.vercel.app`). Generated proper favicon set from `logo.png` via `sips` (`favicon-16/32.png`, `apple-touch-icon-180.png`) and wired `<link rel="icon">` + corrected `apple-touch-icon` (was pointing at the full 269KB logo). **Events UX per user direction**: removed the standalone `Events` browser tab entirely — `EventHome.jsx` now has one internal segmented switcher (My Event / Browse / Past): "Browse" embeds the former `EventsBrowser` content (discovery + join requests), "Past" is a new view built from `data.history` showing archived events the user took part in, dimmed for visual distinction. Removed `hasPublicEvents` plumbing from `BottomNav`/`App.jsx`. Removed the "Team Chat" row from `EventHome` (+ `onOpenChat` prop) per user feedback that it didn't belong on the event page. **Resend migration** (executing the guide below): deployed new `send-email` edge function (calls Resend server-side, key never reaches the browser), updated `create-user` edge function to send invite emails via Resend instead of EmailJS, added `src/lib/email.js` (`sendEmail` + `sendAnnouncementEmails`) and rewired `AnnouncementEditor`, `AnnouncementList`, `ContactForm` to use it. Deleted `src/lib/emailjs.js`, removed dead `sendInviteEmail`/`sendAnnouncementEmail` helpers from `lib/utils.js`, and removed unused `EMAILJS_*` exports from `constants.js`. **User still needs to**: add `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (use `onboarding@resend.dev` until their domain is verified later today), and `PLATFORM_URL` as Supabase Edge Function secrets — code side is fully deployed and build passes clean. |
| 2026-06-07 | Account 1 | **Post-v2 bug fixes + audit**: Fixed 3 post-migration RLS recursion bugs (profiles infinite loop → `is_platform_admin()` SECURITY DEFINER fn; events/event_members loop → `get_my_event_ids()` + `get_my_assigned_event_ids()` fns; conversation_participants loop → `get_my_conversation_ids()` fn). Added `checklist_event_member_read` RLS policy (coordinators + co-leaders can now read teammates' checklists). Fixed `home-dm-refresh` Realtime channel (was unscoped — now filtered by `receiver_id` + conversation participant). Added `visible_to_public` + `allow_join_requests` toggles to EventEditor. Removed Events browser as separate tab (folded into EventHome Browse sub-tab per user direction). Removed Team Chat shortcut from EventHome. All changes deployed to Vercel via git push. Working tree clean. |
| 2026-06-07 | Account 2 | **Polish pass on top of yesterday's restructure** (committed/pushed in 4 separate commits — `d511303`, `b340704`, `0281ea2` + the system-groups SQL): (1) **Favicon size**: the source `logo.png` had ~35% whitespace padding on every side, so the 16/32px tab icons rendered as a near-blank square — auto-cropped to content with a Python/PIL script (`bbox` detection on non-white pixels) before regenerating `favicon-16/32.png` and `apple-touch-icon-180.png`, mark fills the frame now. (2) **Profile Tags redesign**: replaced the vertical list of toggle rows (clunky "ON"/"OFF" badges) in `PersonDetail.jsx` with a horizontal multi-select chip grid that live-previews each tag's actual badge color — makes it visually obvious a person can hold any combination simultaneously (e.g. Moderator *and* Pastor *and* 412 Board). Added a "Pastors" entry to `SystemGroups.jsx` `SYSTEM_GROUPS` (filtered on `tags.includes('pastor')`) since the Pastor tag existed in `PROFILE_TAGS` but had no corresponding chat group — mirrors the existing 412 Board pattern. (3) **Seeded the 4 default system group chats** directly via SQL against project `hoxjardsthjuhbxivken` (`conversations`/`conversation_participants` rows, mirroring `syncGroup`/`syncEventGroup` logic exactly): Public Chat (27 members = everyone), 412 Board (0 — populates once the tag is assigned), Admin & Moderators (4), Set Apart 2026 Group (24 = all event_members for `a1b2c3d4-…`). ⚠️ Note: `profiles.tags` is `text[]` not `jsonb` — use `'value' = any(p.tags)`, NOT `p.tags @> '[...]'::jsonb` (the latter throws `operator does not exist: text[] @> jsonb`). (4) **Home "Upcoming" tiles now tap through**: added `onOpenEventPage` prop (`(p) => { setTab("event"); setPage(p); }`) threaded from `App.jsx` → `Home.jsx`. Prayer Day tile → `prayer_chain` page; Zoom Training tile → active event page (`onOpenEventPage(null)`, where the zoom-training accordion lives); standalone Zoom/Board Meeting tile → opens `event.zoom_url` directly in a new tab if set (added `zoom_url` to the home meetings `select()`), else navigates to the event tab. All three got a chevron + hover affordance. (5) **Full Prayer Schedule redesign**: replaced the 25-row chronological day-by-day list (very tall when expanded) with a compact 2-column grid — one card per team (12 total) showing both of its prayer dates side-by-side, plus an "All Teams Together" row at the bottom; cuts expanded height roughly in half, removed now-unused `fmtFull` helper. (6) **Grouped event-scoped person data**: in `PersonDetail.jsx`, "Personal Message", "Team Assignment", and the event role/status `InfoRows` were three separate floating sections that visually looked like permanent profile data — merged into ONE card titled with the active event's name (e.g. "Set Apart 2026") with an explanatory note ("Specific to Set Apart 2026 — separate from [Name]'s permanent profile…"), internal sub-sections for Team & Ministry / Personal Message, new small `InfoRow` helper. The underlying data was already correctly on `event_members` — this was purely a display/grouping fix. All changes build clean and are pushed to `origin/main`. |

---

## Architecture Notes (updated)

### Moderator scoping (NEW)
- Moderators are assigned to specific events via `moderator_assignments` table
- In loadData: if moderator (not admin), fetches assigned event IDs first, then scopes all subsequent queries to those IDs
- Admin: sees all events, all members, all announcements (unchanged)
- RLS enforces this at DB level too — moderators cannot query data outside their assignments

### Event lifecycle
- `events.status`: upcoming → active → archived (also: inactive)
- `events.visible_to_public`: true = appears in Events Browser for all users
- `events.allow_join_requests`: true = users can submit join requests from Events Browser
- Delete: not implemented intentionally — archive instead (preserves history)

### Folder structure
```
src/pages/
├── event/       # Current event participation (singular — what you're in)
├── events/      # Event discovery (plural — what you can join)
│   └── EventsBrowser.jsx
└── admin/
    ├── moderators/  # ModeratorAssignments.jsx
    └── audit/       # AuditLog.jsx
```

### Key tables
| Table | Purpose |
|-------|---------|
| moderator_assignments | moderator_id + event_id — scopes mod access |
| audit_log | actor, action, target, details, created_at |
| event_attendance | event_id + profile_id + date — daily check-in |
| dm_messages | All DMs (NOT the internal messages table — that has broken NOT NULL constraints) |

### RLS summary (post-v2)
- profiles: own row + admin-all (fixed — admins can now update others)
- events: public OR event_member OR admin OR assigned_moderator
- event_members: same-event members + admin + assigned_moderator
- announcements: published + event_member OR admin/moderator-for-event
- dm_messages: sender + receiver + group participants
- conversation_participants: own rows + co-participants (no longer fully open)

---

## Next Up

1. **Set Resend secrets in Supabase** — `send-email` edge fn is deployed and working. User must add 3 secrets in Supabase Dashboard → Settings → Edge Functions → Secrets: `RESEND_API_KEY` (from resend.com dashboard), `RESEND_FROM_EMAIL` (use `onboarding@resend.dev` until domain verified), `PLATFORM_URL` (`https://412-ministry-platform.vercel.app`). Code side is fully done.
2. **Rotate Supabase API keys** — service_role key was exposed in a shared Claude.pdf. Do in Supabase Dashboard → Settings → API.
3. **Design system overhaul** — full spec below. Start a dedicated session for this.
4. **Handoff state as of 2026-06-07**: All known bugs fixed ✅. Settings screens done ✅. Events tab restructured (My Event / Browse / Past) ✅. Resend edge fn deployed ✅ (awaiting secrets). Build clean, tree clean, pushed.

---

## Design System Overhaul — Implementation Guide
### For Account 2 to implement in a dedicated session

The new design is named **Bold Light** (exaggerated minimalism, oversized type, system fonts).
This is a full replacement of all styles across all files. Do NOT do this piecemeal — do it in one session.

---

### Step 0 — Replace constants.js completely

Replace the entire export in `src/lib/constants.js` with:

```js
export const C = {
  orange:      "#FF4D00",
  dark:        "#111111",
  dark2:       "#222222",
  white:       "#FFFFFF",
  bg:          "#FAFAFA",
  border:      "#E5E5E5",
  text:        "#111111",
  muted:       "#999999",
  faint:       "#CCCCCC",
  verseBg:     "#FFF5F0",
  verseBorder: "#FFD5C0",
  success:     "#27AE60",
  barBg:       "#F0F0F0",
};

// Legacy aliases — remove these after all files are updated
export const NAVY   = C.dark;
export const ORANGE = C.orange;
export const GOLD   = C.orange;
export const TSEC   = C.muted;
export const BORDER = C.border;
export const BG     = C.bg;
export const SANS   = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif";
export const SERIF  = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif";
```

Adding legacy aliases means the build won't break immediately — files still using NAVY/ORANGE etc. will get the new colors automatically. Replace them file by file as you go.

**Remove the Google Fonts link from `useFonts()` in App.jsx** — system fonts load instantly, no link needed.

---

### Step 1 — Update shared layout components first

**`src/components/layout/Shell.jsx`**
- background: `#FAFAFA`
- maxWidth: `460px`, margin: `0 auto`
- padding: `0 16px`

**`src/components/layout/BottomNav.jsx`** — 5 tabs, new design:
```
Tabs: Home · Conference · Chat · Updates · Profile
Active: color #FF4D00
Inactive: color #CCCCCC
Background: #FAFAFA, border-top: 1px solid #E5E5E5
Label: 8-9px, font-weight 800, text-transform uppercase
```
Chat tab is now a permanent primary tab (not a floating button). Move the chat open logic from `page === "chat"` overlay to a proper `tab === "chat"` route — same as the others.

**`src/components/ui/Card.jsx`**
- background: `#FFFFFF`
- border: `1px solid #E5E5E5`
- border-radius: `14px`

**`src/components/ui/Avatar.jsx`**
- background: `#FF4D00` (not NAVY)
- initials: `font-size 18px, font-weight 900, color #FFFFFF`

**`src/components/ui/SectionLabel.jsx`**
- `font-size: 10px, font-weight: 800, text-transform: uppercase, letter-spacing: 0.14em, color: #999999`

**`src/components/ui/Button.jsx`** (primary CTA)
- `background: #FF4D00, color: #FFFFFF, border-radius: 12px, padding: 14px, font-size: 14-15px, font-weight: 700`

---

### Step 2 — Home screen

**Top bar (no Shell padding — full-width white bar):**
```
background: #FAFAFA, border-bottom: 1px solid #E5E5E5, padding: 14px 16px 11px
Left: "412 Ministry" — 13px 900, "Ministry" in #FF4D00
Right: bell button — 32px circle, white bg, 1px #E5E5E5 border
```

**Hero greeting:**
```
Eyebrow: "GOOD MORNING" — 10px, 800, uppercase, letter-spacing 0.14em, color #999999
Name:    "{firstName}" — 36-38px, 900, letter-spacing -0.04em, color #111111
```

**Verse card:**
```
background: #FFF5F0, border: 1px solid #FFD5C0, border-radius: 14px, padding: 12-13px
Tag: "TODAY'S VERSE" — 9px 800 uppercase #FF4D00
Text: 12px italic #111 line-height 1.65
Ref:  9px 800 uppercase #FF4D00
```

**Event hero card (dark):**
```
background: #111111, border-radius: 16-18px, padding: 13-14px
Tag: 9px 800 uppercase #FF4D00 — "YOUR EVENT · ACTIVE"
Title: 19-20px 900 #FFFFFF letter-spacing -0.03em
Sub: 11px #555555
Pills: flex gap 6px, margin-top 10-11px
  Primary pill: bg #FF4D00, color #FFFFFF
  Secondary pill: bg #222222, color #FF4D00
  Both: border-radius 8px, padding 4px 10px, 10px 800
```

**Quick access tiles (2-column grid, gap 8px):**
```
Default: bg #FFFFFF, border 1px #E5E5E5, border-radius 13px, padding 13px 10px
  Icon: 20px #FF4D00
  Label: 10px 800 uppercase #111111
Chat tile: bg #FF4D00 (highlighted — it's the key CTA)
  Icon + label: #FFFFFF
```

**Stat cards (2-column grid, gap 8px):**
```
bg #FFFFFF, border 1px #E5E5E5, border-radius 13px, padding 12px
Number: 22px 900 #FF4D00 (or #111 for non-accent stats)
Label: 9px 800 uppercase #999999 letter-spacing 0.1em
```

---

### Step 3 — Conference screen (was EventHome)

Same hero card as Home (dark #111111 background).

The tab in the nav should say "Conference" not "Event".

Zoom training row + section rows → same white card list style, but with heavier typography:
- Row title: `13px 800 #111111`
- Row sub: `11px #999999`

---

### Step 4 — Chat screen

This becomes a **primary nav tab**, not an overlay. The `page === "chat"` pattern in App.jsx should become `tab === "chat"`, identical to how `tab === "updates"` or `tab === "home"` work. The Chat component already accepts `onClose` — replace that with `onNavigate` back to home or previous tab.

Message bubbles:
```
Other: bg #FFFFFF, border 1px #E5E5E5, border-radius 14px 14px 14px 4px, padding 9px 12px
  Name: 9px 800 #999 uppercase, letter-spacing 0.07em
  Text: 12px 500 #111, line-height 1.5
  Time: 9px #CCCCCC

Mine: bg #FF4D00, border-radius 14px 14px 4px 14px
  Text: 12px 500 #FFFFFF
  Time: 9px #FFB896
```

Active people strip: pill style, bg #111111, color #FFFFFF, initials in #FF4D00.

Input bar:
```
bg #FFFFFF, border 1px #E5E5E5, border-radius 12px, padding 9px 12px
Send button: 28px sq, bg #FF4D00, border-radius 8px
```

---

### Step 5 — Updates (Announcements)

Announcement card:
```
bg #FFFFFF, border 1px #E5E5E5, border-left 3px solid #FF4D00, border-radius 14px, padding 13px
Tag: 9px 800 uppercase #FF4D00
Title: 13px 900 #111111
Body: 11px #888888 line-height 1.55
Date: 10px #CCCCCC font-weight 600
```

Chip badges:
```
Event chip: bg #FF4D00, color #FFFFFF, border-radius 20px, padding 3px 9px, 9px 800 uppercase
Platform chip: bg #111111, color #FFFFFF
```

---

### Step 6 — Profile screen

Avatar: 56px circle, bg #FF4D00, initials 18px 900 #FFFFFF.

Info rows:
```
bg #FFFFFF, border 1px #E5E5E5, border-radius 14px, padding 2px 13px
Row: flex space-between, padding 9px 0, border-bottom 1px #F0F0F0
Key: 11px #999999 600
Value: 12px 800 #111111
```

Conference history card:
```
bg #111111, border-radius 14px, padding 13px
Label: 9px 800 #FF4D00 uppercase
Row: flex space-between, padding 6px 0, border-bottom 1px #222222
Year: 12px 800 #FFFFFF
Event: 11px #555555
Active badge: bg #FF4D00, border-radius 6px, 9px 800 #FFFFFF
Past badge: 10px 700 #555555
```

Sign out button: `bg #FFFFFF, border 1px #E5E5E5, border-radius 12px, padding 12-13px, 13px 800 #FF4D00`

---

### Step 7 — Checklist card (MyChecklist, Onboarding step 5)

```
Header: flex space-between
  Title: 11-12px 800 uppercase #111 letter-spacing 0.08em
  Pct: 12px 900 #FF4D00

Progress bar track: bg #F0F0F0, border-radius 4px, height 4px
Progress bar fill: bg #FF4D00, border-radius 4px

Row: flex align-items-center gap 10px, padding 6px 0
  Done: 16px circle bg #FF4D00 (or #27AE60), checkmark white
        text: 12px #CCCCCC line-through
  Pending: 16px circle border 1.5px #E5E5E5
           text: 12px #111111
```

---

### Step 8 — Prayer chain (PrayerChain)

Prayer day card:
```
bg #FFF5F0, border 1px #FFD5C0, border-radius 14px, padding 12-13px, flex align-items-center gap 12px
Date block: bg #FF4D00, border-radius 10px, 44x44px
  Month: 8px 800 #FFFFFF uppercase letter-spacing 0.1em
  Day: 18px 900 #FFFFFF line-height 1
Info:
  Label: 9px 800 uppercase #FF4D00
  Title: 13px 800 #111111
  Sub: 11px #999999
```

---

### Step 9 — Onboarding flow

Full screen, no bottom nav.
```
Progress bar: 4px height, #FF4D00 fill, #E5E5E5 track, top of screen
Step counter: "Step X of 6" — 10px 800 uppercase #FF4D00
Step title: 24px 900 #111 letter-spacing -0.03em
Body text: 15-16px #111 line-height 1.75-1.85
CTA: full width, 14-15px 700, #FF4D00 bg, white text, border-radius 12px, padding 14-16px
Content cards inside: bg #FFFFFF, border 1px #E5E5E5, border-radius 12px, padding 1.25-1.5rem
```

Co-leader reveal:
```
Before: 80px circle, bg #E5E5E5, "?" centered (28px 900 #999)
After: avatar + name + ministry role + church + phone
```

---

### Step 10 — Admin panel

Same component patterns, just with the new color values. The admin panel is dense — focus on getting the cards, buttons, and text weights right. The dark sidebar or header style should use `#111111` not `#162038`.

---

### What NOT to change during the design update

- Supabase queries — don't touch any `.from()` calls
- State management logic in App.jsx
- RLS policies
- Edge functions
- Auth flow logic
- The `matchesAudience` utility
- Any file in `src/lib/` except `constants.js`

---

### Files to update (in order)

1. `src/lib/constants.js` — new C object + legacy aliases
2. `src/App.jsx` — remove Google Fonts link, update LoadingScreen colors, wire Chat as a tab
3. `src/components/layout/Shell.jsx`
4. `src/components/layout/BottomNav.jsx` — 5 tabs, Chat as primary
5. `src/components/ui/Card.jsx`
6. `src/components/ui/Avatar.jsx`
7. `src/components/ui/Button.jsx`
8. `src/components/ui/SectionLabel.jsx`
9. `src/pages/auth/Login.jsx`
10. `src/pages/auth/ChangePassword.jsx`
11. `src/pages/home/Home.jsx`
12. `src/pages/event/EventHome.jsx`
13. `src/pages/chat/Chat.jsx`
14. `src/pages/updates/Updates.jsx`
15. `src/pages/profile/Profile.jsx`
16. `src/pages/event/onboarding/OnboardingFlow.jsx`
17. `src/pages/event/MyTeam.jsx`
18. `src/pages/event/PrayerChain.jsx`
19. `src/pages/event/MyChecklist.jsx`
20. `src/pages/event/CoordinatorView.jsx`
21. `src/pages/event/FieldGuide.jsx`
22. `src/pages/event/TheFour.jsx`
23. `src/pages/event/Attendance.jsx`
24. `src/pages/events/EventsBrowser.jsx`
25. All admin pages (AdminShell → PeopleList → PersonDetail → EventList → EventDetail → etc.)

Build after every 5 files to catch breakage early.

---

## Resend Migration Guide
### When you have the API key + verified domain

Replace EmailJS with Resend for all outbound email. Resend runs server-side only (API key stays secret in Supabase edge function env vars — never in the browser).

**3 email types to migrate:**
1. Invite email (new user created by admin) — currently `create-user` edge function
2. Password reset — currently `reset-password` edge function
3. Announcement email — currently client-side EmailJS call in AnnouncementEditor.jsx

**Steps:**
1. Create account at resend.com, verify your sender domain, get API key
2. Add `RESEND_API_KEY` to Supabase edge function secrets (Dashboard → Edge Functions → Secrets)
3. Add `RESEND_FROM_EMAIL` (e.g. `noreply@yourdomain.com`)
4. Create a new edge function `send-email` that accepts `{ to, subject, html }` and calls Resend API
5. Update `create-user` and `reset-password` functions to call `send-email` instead of EmailJS
6. Remove the client-side EmailJS send from `AnnouncementEditor.jsx` — call the edge function instead
7. Remove `@emailjs/browser` from package.json

**Resend API call (inside edge function):**
```js
const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: Deno.env.get("RESEND_FROM_EMAIL"),
    to: [recipientEmail],
    subject: subject,
    html: htmlBody,
  }),
});
```

---

## Sync Notes (append-only — add dated, attributed entries; never edit or delete prior ones)

This section exists so the two accounts can correct each other's understanding without erasing history. If another section looks stale, don't rewrite it in place — append a dated note here pointing to the current truth, how it was verified, and which section should be treated as canonical going forward.

- **2026-06-06 (Account 2 — verification pass against live source + Supabase):**
  - The **"Features Missing vs V2"** table still lists "Admin panel (full)" and "Co-leader pairing UI" as 🔴 HIGH/missing, but the **File Structure** section (lines ~186-191) shows both ✅ BUILT, and the 2026-06-07 Progress Log entry confirms the build passes clean. **Treat File Structure as the canonical "what's built" source** — the Features Missing table and Build Priority Order steps 1-4 are now superseded by it and shouldn't be trusted at face value.
  - **Confirmed still open — Coordinator "My Teams" view**: `EventHome.jsx:40` registers a `coordinator` section labeled "My Teams" ("Overview of teams you oversee"), but no dedicated coordinator-overview component exists yet (no `*Coordinator*` / `*MyTeams*` file in `src/`). This is the root cause of the original "coordinator sees themselves in their own team" complaint from the design chat — the overview screen meant to filter the coordinator out of their own team list was never built, so coordinators currently fall back to the regular `MyTeam` view where they appear as a member of their own team. **Fix = build that component, excluding `profile_id === coordinator_id` from the rendered member list.**
  - ⚠️ **Security finding**: `~/Desktop/Claude.pdf` (the shared design-chat export) contains the Supabase **`anon` key AND `service_role` key** plus EmailJS service/template/public-key credentials in plaintext, and was distributed via a public `claude.ai/share` link. The `service_role` key bypasses RLS entirely. **Recommend rotating the Supabase API keys and revoking that share link** before relying on this doc/PDF for anything else.

---

## How to Run

```bash
cd ~/Projects/412-ministry-platform
npm install
npm run dev
```

`.env` is at project root (gitignored). Contains Supabase URL/key + EmailJS credentials.
