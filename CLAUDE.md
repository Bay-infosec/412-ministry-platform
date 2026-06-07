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
│   │   └── Chat ❌ (not built)
│   ├── updates/               — Updates ✅
│   ├── profile/               — Profile ✅ (phone formatting, password validation, church Other option, history shows "Team leader")
│   └── admin/                 ✅ BUILT
│       ├── AdminShell ✅       — People, Events, Announcements, Settings entry points
│       ├── people/            — PeopleList ✅, PersonDetail ✅, InviteFlow ✅
│       ├── events/            — EventList ✅, EventDetail ✅, CoLeaderPairing ✅
│       ├── announcements/     — AnnouncementList ✅, AnnouncementEditor ✅ (draft/pending/published flow)
│       └── settings/          — ChurchList 🔨 (in progress), TrainingMaterials 🔨 (in progress)
```

---

## Known Bugs

- [x] Fixed: `EventHome` imported twice in `App.jsx`
- [x] Fixed: `OnboardingFlow` now writes to `event_checklist` table
- [x] Fixed: `PrayerChain` now pulls from DB (event_members + profiles)
- [x] Fixed: `FieldGuide` real URL set
- [x] Fixed: HTTP 500 on events/announcements/event_members — recursive RLS policy replaced with `auth.uid() IS NOT NULL`
- [x] Fixed: Khaliunaa's stale event_members coordinator record removed
- [ ] Coordinator sees themselves in their own coordinator team view

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
| Chat | 🟢 LOW (table ready) |
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

---

## Next Up

1. **Admin: Settings** — ChurchList (view/add/edit churches + approve pending church_name_custom submissions), TrainingMaterials (add/edit/reorder/publish) — **IN PROGRESS**
2. **Onboarding personal messages** — admin writes per-person welcome message stored in event_members
3. **Chat** — Supabase Realtime, per-event room

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
