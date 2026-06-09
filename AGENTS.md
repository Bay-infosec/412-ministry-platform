# 412 Ministry Platform — AGENTS.md

Shared brain for both Codex accounts. Read this fully before starting any session. Update **Current State** and **Next Up** after each session, then commit and push.

---

## How to Run

```bash
cd ~/Projects/412-ministry-platform
npm install
npm run dev
```

`.env` is at project root (gitignored). Contains Supabase and EmailJS client configuration.

---

## Collaboration Rules (non-negotiable)

1. **Commit and push before handing off** — working tree must be clean and pushed. End with "floor is yours."
2. **Never leave a half-built component** — finish it or park it with an explicit note in this file.
3. **Test as a real user** — use actual coordinator/member accounts. Only mark bugs fixed after manual verification.
4. **Rotate exposed credentials immediately** — never defer security issues.
5. **One clean handoff entry** — what's done, what's verified, what's still open, build status. Not six incremental notes.
6. **Keep this file accurate, not aspirational** — if something is built, mark it built. If it's broken, mark it broken.

---

## Project Overview

Mobile-first PWA for 412 Ministry — a Mongolian-American Christian youth/leadership ministry.

**Vision:** Permanent platform where events come and go, but people stay forever.

**Stack:** React 18 + Vite · Supabase (auth + DB + storage + realtime) · Vercel (hosting) · EmailJS (Welcome + Announcement templates) · No UI library (inline styles only) · No router (state-based navigation)

**Active event:** Set Apart 2026 — August 5–9, Rhodes Grove Camp, PA. ~24 team leaders.

---

## Credentials & Services

| Service    | Detail |
|------------|--------|
| GitHub     | `Bay-infosec/412-ministry-platform` (private) |
| Supabase   | Project `hoxjardsthjuhbxivken` (us-east-1) |
| Vercel     | Project `412-ministry-platform`, team `bayinfosec-6329s-projects` |
| Local      | `~/Projects/412-ministry-platform` |
| Field Guide | `https://drive.google.com/file/d/1VVARCRm2Rl9NkH7i0wzDot5KwJbN-dF7/preview` |

**⚠️ Security — action required:**
- Rotate Supabase API keys — service_role key was exposed in a shared Codex.pdf. Do this in Supabase Dashboard → Settings → API.

---

## Design Tokens — Bold Light (current system)

File: `src/lib/constants.js`

```js
export const C = {
  orange:      "#FF4D00",   // primary accent, CTAs
  dark:        "#111111",   // primary text, dark cards
  dark2:       "#222222",   // dark card secondary elements
  white:       "#FFFFFF",
  bg:          "#FAFAFA",   // page background
  border:      "#E5E5E5",   // all borders/dividers
  text:        "#111111",   // body text
  muted:       "#999999",   // secondary text
  faint:       "#CCCCCC",   // timestamps, disabled
  verseBg:     "#FFF5F0",   // verse card background
  verseBorder: "#FFD5C0",   // verse card border
  success:     "#27AE60",   // success states
  barBg:       "#F0F0F0",   // progress bar track
};

// Legacy aliases — still used in files not yet migrated
export const NAVY   = C.dark;
export const ORANGE = C.orange;
export const GOLD   = C.orange;
export const TSEC   = C.muted;
export const BORDER = C.border;
export const BG     = C.bg;
export const SANS   = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif";
export const SERIF  = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif";
```

Font: system-ui only (no Google Fonts). Remove `useFonts()` / any Google Fonts link in App.jsx when migrating.

---

## Current State (as of 2026-06-08)

### Branch: `design-polish`
The user merged `design-polish` into `main` on 2026-06-08, then continued work on `design-polish`.
Latest implementation standardizes the displayed brand as `412 MINISTRY` and requires an explicit Save button before platform-role changes are written.
Verification: 34/34 tests pass and the production build passes.
Manual browser verification was unavailable in the 2026-06-08 session because the in-app browser connection was not available.

### What's Built ✅

**Auth & shell**
- Login (Enter key submits), ChangePassword (password validation enforced)
- Forgot Password sends a Supabase Auth recovery email; the recovery link now opens a dedicated new-password screen before returning to the app
- App.jsx: state-based navigation, app-wide presence channel, chat unread badge
- Shell, BottomNav (4 tabs: Home · Conference · Updates · Profile), BackBtn
- PWA manifest + full iOS/Android meta tags, favicon set; rendered logo instances use rounded clipping

**Home**
- Dismissible announcement, daily verse, horizontal event/task/coordinator sections
- Enrolled active events are ordered by soonest start date
- Event cards open the exact selected event profile, including the 412 Board Meeting
- The 412 Ministry wordmark gives “Ministry” stronger visual emphasis
- Tools contains only The Four and Field Guide, using matching white cards
- Chat button in header (red unread dot / green online dot)
- Contact 412 Ministry moved to Profile

**Conference (EventHome)**
- Event selector opens the user's soonest enrolled active event
- Bookmark button lets a user choose the event view that opens first
- Orange onboarding progress panel appears immediately below event information
- Past Events only contains events whose status is actually `archived`
- Browse tab = EventsBrowser (public events + join requests)
- Past tab = archived events from user history

**Event features**
- OnboardingFlow: 6 steps, saves to `event_checklist`, Save & exit, team reveal mechanic
- MyTeam, CoordinatorView (filters self out, "Not started" badge)
- PrayerChain: pulls from DB, 2-col grid per team, 12-team schedule Jul 10–Aug 2
- Prayer Chain reminder uses the solid orange current palette
- TheFour, FieldGuide (real Drive URL + offline download), MyChecklist
- Chat: Supabase Realtime, grouped messages, emoji, presence strip, DMs, group threads

**Admin panel (full)**
- AdminShell → Users → PersonDetail (tag chips, event-scoped card) → InviteFlow
- Platform role chips are draft selections; `Save role` performs the database update
- Admin account removal UI uses a protected `delete-user` edge function
- EventList → EventDetail (team setup, coordinator picker) → CoLeaderPairing
- AnnouncementList → AnnouncementEditor (draft → pending_approval → published + email toggle)
- ChurchList, TrainingMaterials
- ModeratorAssignments (event-scoped mods), AuditLog, SystemGroups (4 default group chats)

**Profile**
- Phone formatting, password validation, church Other option
- Tag system (board_member, pastor in DB `tags[]` + role-derived tags), displayed consistently as orange/white chips
- Profile setup after first login (photo upload, nickname)
- Conference history, PWA install instructions card
- Contact 412 Ministry is a prominent orange button

**Infrastructure**
- EmailJS: Welcome template for invitations; Announcement template for announcements and Contact 412 messages
- Supabase Auth handles forgot-password/reset emails independently of EmailJS
- RLS: all recursion bugs fixed via SECURITY DEFINER helper fns (`is_platform_admin()`, `get_my_event_ids()`, `get_my_assigned_event_ids()`, `get_my_conversation_ids()`)
- Admins can read/delete system-group participant rows without joining each group; migration `20260609043000_admin_manage_conversation_participants.sql`
- 15 DB indexes added
- Social preview (og tags + preview.jpg), favicon auto-cropped to content

### Known Issues
- `delete-user` is committed locally but must be deployed after authenticating the Supabase CLI.
- `CLAUDE.md` still documents the older Resend flow; `AGENTS.md` is the current EmailJS handoff.

---

## Next Up

1. Deploy `delete-user`: `npx supabase login`, then `npx supabase functions deploy delete-user --project-ref hoxjardsthjuhbxivken`.
2. **⚠️ Rotate Supabase API keys** — service_role key was in shared PDF.
3. Manually verify Welcome and Announcement delivery from the deployed design preview.
4. Manually verify Home → 412 Board Meeting and the emailed forgot-password recovery link on the deployed preview.
5. Enkhbayar Ulambayar is confirmed in Supabase with `pastor` and `board_member` tags and is already a participant in the Pastors system group.

---

## Bold Light Design Overhaul

**Style:** Exaggerated minimalism — oversized type, heavy weights, system fonts, orange + black + white only.
**Rule:** Do NOT do this piecemeal. Complete it in one session. Build after every 5 files.

### What NOT to touch
- Any Supabase queries (`.from()` calls)
- State management logic in App.jsx
- RLS policies / edge functions / auth flow
- `matchesAudience` utility
- Any file in `src/lib/` except `constants.js` (already done)

### Files to update (in order)

```
1.  src/lib/constants.js              ✅ already done
2.  src/App.jsx                       — remove Google Fonts link, wire Chat as a tab (tab="chat"), update LoadingScreen
3.  src/components/layout/Shell.jsx   — bg #FAFAFA, maxWidth 460px, padding 0 16px
4.  src/components/layout/BottomNav.jsx — 5 tabs: Home · Conference · Chat · Updates · Profile
5.  src/components/ui/Card.jsx        — bg #FFFFFF, border 1px #E5E5E5, radius 14px
6.  src/components/ui/Avatar.jsx      — bg #FF4D00, initials 18px 900 #FFFFFF
7.  src/components/ui/Button.jsx      — bg #FF4D00, white text, radius 12px, 14px 700
8.  src/components/ui/SectionLabel.jsx — 10px 800 uppercase #999999 letter-spacing 0.14em
9.  src/pages/auth/Login.jsx
10. src/pages/auth/ChangePassword.jsx
--- BUILD ---
11. src/pages/home/Home.jsx
12. src/pages/event/EventHome.jsx
13. src/pages/chat/Chat.jsx           — also convert page="chat" overlay → tab="chat" route
14. src/pages/updates/Updates.jsx
15. src/pages/profile/Profile.jsx
--- BUILD ---
16. src/pages/event/onboarding/OnboardingFlow.jsx
17. src/pages/event/MyTeam.jsx
18. src/pages/event/PrayerChain.jsx
19. src/pages/event/MyChecklist.jsx
20. src/pages/event/CoordinatorView.jsx
--- BUILD ---
21. src/pages/event/FieldGuide.jsx
22. src/pages/event/TheFour.jsx
23. src/pages/event/Attendance.jsx
24. src/pages/events/EventsBrowser.jsx
25. All admin pages (AdminShell → PeopleList → PersonDetail → EventList → EventDetail → CoLeaderPairing → AnnouncementList → AnnouncementEditor → ChurchList → TrainingMaterials → ModeratorAssignments → AuditLog → SystemGroups)
--- BUILD ---
```

### Component specs

**BottomNav (5 tabs)**
```
Tabs: Home · Conference · Chat · Updates · Profile
Active: #FF4D00 | Inactive: #CCCCCC
Background: #FAFAFA, border-top: 1px solid #E5E5E5
Label: 8-9px 800 uppercase
```
Chat is now a permanent primary tab. Change `page === "chat"` overlay in App.jsx to `tab === "chat"` — same pattern as the other tabs.

**Home screen**
```
Top bar: bg #FAFAFA, border-bottom 1px #E5E5E5, padding 14px 16px 11px
  Left: "412 Ministry" — 13px 900, "Ministry" in #FF4D00
  Right: bell — 32px circle, white bg, 1px #E5E5E5

Greeting:
  Eyebrow: "GOOD MORNING" — 10px 800 uppercase letter-spacing 0.14em #999999
  Name: 36-38px 900 letter-spacing -0.04em #111111

Verse card: bg #FFF5F0, border 1px #FFD5C0, radius 14px, padding 12px
  Tag: "TODAY'S VERSE" — 9px 800 uppercase #FF4D00
  Text: 12px italic #111 line-height 1.65
  Ref: 9px 800 uppercase #FF4D00

Event hero card (dark):
  bg #111111, radius 16px, padding 14px
  Tag: 9px 800 uppercase #FF4D00 — "YOUR EVENT · ACTIVE"
  Title: 19-20px 900 #FFFFFF letter-spacing -0.03em
  Sub: 11px #555555
  Pills: radius 8px, padding 4px 10px, 10px 800
    Primary: bg #FF4D00, color #FFFFFF
    Secondary: bg #222222, color #FF4D00

Quick tiles (2-col grid, gap 8px):
  Default: bg #FFFFFF, border 1px #E5E5E5, radius 13px, padding 13px 10px
    Icon: 20px #FF4D00 | Label: 10px 800 uppercase #111111
  Chat tile: bg #FF4D00, icon + label #FFFFFF

Stat cards (2-col grid, gap 8px):
  bg #FFFFFF, border 1px #E5E5E5, radius 13px, padding 12px
  Number: 22px 900 #FF4D00 | Label: 9px 800 uppercase #999999
```

**Chat screen**
```
Other bubble: bg #FFFFFF, border 1px #E5E5E5, radius 14px 14px 14px 4px, padding 9px 12px
  Name: 9px 800 #999 uppercase | Text: 12px 500 #111 | Time: 9px #CCCCCC
Mine bubble: bg #FF4D00, radius 14px 14px 4px 14px
  Text: 12px 500 #FFFFFF | Time: 9px #FFB896
Active strip: pill bg #111111, color #FFFFFF, initials #FF4D00
Input bar: bg #FFFFFF, border 1px #E5E5E5, radius 12px, padding 9px 12px
  Send: 28px sq, bg #FF4D00, radius 8px
```

**Updates / Announcements**
```
Card: bg #FFFFFF, border 1px #E5E5E5, border-left 3px solid #FF4D00, radius 14px, padding 13px
  Tag: 9px 800 uppercase #FF4D00
  Title: 13px 900 #111111
  Body: 11px #888888 line-height 1.55
  Date: 10px #CCCCCC 600
Chip — event: bg #FF4D00, white text, radius 20px, 9px 800 uppercase
Chip — platform: bg #111111, white text
```

**Profile screen**
```
Avatar: 56px circle, bg #FF4D00, initials 18px 900 #FFFFFF

Info rows card: bg #FFFFFF, border 1px #E5E5E5, radius 14px, padding 2px 13px
  Row: flex space-between, padding 9px 0, border-bottom 1px #F0F0F0
  Key: 11px #999999 600 | Value: 12px 800 #111111

History card: bg #111111, radius 14px, padding 13px
  Label: 9px 800 #FF4D00 uppercase
  Row: flex space-between, padding 6px 0, border-bottom 1px #222222
  Year: 12px 800 #FFFFFF | Event: 11px #555555
  Active badge: bg #FF4D00, radius 6px, 9px 800 #FFFFFF
  Past badge: 10px 700 #555555

Sign out: bg #FFFFFF, border 1px #E5E5E5, radius 12px, padding 13px, 13px 800 #FF4D00
```

**Checklist**
```
Header: title 11px 800 uppercase #111 letter-spacing 0.08em | pct 12px 900 #FF4D00
Bar: track bg #F0F0F0 radius 4px h 4px | fill bg #FF4D00
Row (done): 16px circle bg #FF4D00, checkmark white; text 12px #CCCCCC line-through
Row (pending): 16px circle border 1.5px #E5E5E5; text 12px #111111
```

**Prayer chain card**
```
bg #FFF5F0, border 1px #FFD5C0, radius 14px, padding 12px, flex gap 12px
Date block: bg #FF4D00, radius 10px, 44x44px
  Month: 8px 800 #FFFFFF uppercase | Day: 18px 900 #FFFFFF
Label: 9px 800 uppercase #FF4D00 | Title: 13px 800 #111 | Sub: 11px #999999
```

**Onboarding flow**
```
Full screen, no bottom nav
Progress bar: 4px, #FF4D00 fill, #E5E5E5 track, top of screen
Step counter: "Step X of 6" — 10px 800 uppercase #FF4D00
Step title: 24px 900 #111 letter-spacing -0.03em
Body: 15-16px #111 line-height 1.8
CTA: full width, 15px 700, bg #FF4D00, white text, radius 12px, padding 14-16px
Inner cards: bg #FFFFFF, border 1px #E5E5E5, radius 12px, padding 1.5rem
Co-leader reveal (before): 80px circle bg #E5E5E5, "?" 28px 900 #999
```

**Admin panel**
Same component patterns as above. Dark headers use `#111111` not `#162038`. Focus on card/button/text-weight consistency — the panel is dense.

---

## Architecture Reference

### Two-layer model
- **Person (permanent):** Profile, photo, church, role history. Never deleted.
- **Event (temporary):** Archived when done. Person gets an event role.

### Roles
- **Platform:** `admin` | `moderator` | `member`
- **Event:** `leader` | `coordinator` | `participant` | `volunteer`
- Coordinators are team leaders — event role, NOT platform role
- Moderators (Khaliunaa, Bilgee, Enkhbayar): `platform_role = "moderator"`, NOT in `event_members`

### Admin permissions
| Action | Admin | Moderator | Coordinator |
|--------|-------|-----------|-------------|
| Create events / accounts | ✅ | ❌ | ❌ |
| Assign platform roles | ✅ | ❌ | ❌ |
| Pair co-leaders | ✅ | ❌ | ❌ |
| Post announcements | ✅ | ✅ (needs approval) | ❌ |
| Approve join requests | ✅ | ✅ | ❌ |
| See all profiles | ✅ | ✅ | own teams only |
| Reset passwords | ✅ | ❌ | ❌ |

### Confirmation tiers
- **Tier 1 (reversible):** Single confirm modal
- **Tier 2 (destructive/bulk):** Double confirm + type a word
- **Tier 3 (safe):** No confirm needed
- All actions show a Toast stating exactly what happened

### Password flow
- Admin creates account → temp password emailed via Resend (never shown on screen)
- First login → forced to change immediately
- Admin reset → new temp password shown ONCE on screen → admin copies + sends manually

### Database (Supabase `hoxjardsthjuhbxivken`)

| Table | Notes |
|-------|-------|
| `profiles` | 28 rows. `platform_role`: admin/moderator/member. `tags text[]` (board_member, pastor). `church_name_custom` for pending submissions. |
| `churches` | 17 rows |
| `events` | 1 active: Set Apart 2026. `status`: upcoming→active→archived. `visible_to_public`, `allow_join_requests` toggles. |
| `event_members` | 24 rows. `co_leader_id` + `coordinator_id` store **profile_id** (not event_members.id). All 12 teams paired + coordinator-assigned. |
| `event_checklist` | 24 rows. JSONB `items` field. |
| `announcements` | `status`: draft → pending_approval → published. Audience targeting: all/ministry/team/role/person. |
| `dm_messages` | All DMs. Do NOT use `messages` table — it has broken NOT NULL constraints. |
| `moderator_assignments` | Scopes moderator access to specific events. |
| `audit_log` | actor, action, target, details, created_at |
| `event_attendance` | Daily check-in: event_id + profile_id + date |
| `conversations` / `conversation_participants` | Group + DM threads. 4 default system groups seeded. |

Storage buckets: `avatars` (public), `attachments` (public). Profile trigger auto-creates profile row on auth user creation.

**Important:** `profiles.tags` is `text[]` — use `'value' = any(p.tags)`, NOT `p.tags @> '[...]'::jsonb`.

### RLS (post-v2 — do not break these)
All recursion-safe via SECURITY DEFINER helper functions:
- `is_platform_admin()` — used in profiles policy
- `get_my_event_ids()` — used in events/event_members policy
- `get_my_assigned_event_ids()` — used for moderator-scoped access
- `get_my_conversation_ids()` — used in conversation_participants policy

| Table | Access rule |
|-------|-------------|
| profiles | own row + admin-all |
| events | public OR event_member OR admin OR assigned_moderator |
| event_members | same-event members + admin + assigned_moderator |
| announcements | published + event_member OR admin/moderator-for-event |
| dm_messages | sender + receiver + group participants |

### Edge functions (Supabase)
- `create-user` — creates auth user, generates temp password, sends invite via Resend
- `reset-password` — generates new temp password
- `send-email` — calls Resend API. Needs `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `PLATFORM_URL` secrets set.

### Key gotchas
- FK joins: always use explicit key (`profiles!event_members_profile_id_fkey`) to avoid PostgREST ambiguity errors
- Moderator data loading: if `platform_role === "moderator"`, fetch assigned event IDs first, then scope all queries to those IDs
- `onboarding_visited` flag (not `onboarding_step`) is the correct "not started" check — step defaults to 1
- Chat unread: tracked via localStorage, reset when chat is opened
- App-wide presence channel lives in App.jsx (not Chat.jsx) — do not add a second one in Chat
