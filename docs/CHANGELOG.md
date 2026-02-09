# GPA — Changelog

All notable changes to the Goal Pursuit Accelerator are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### Added — Phase 2.2: Neuroscience Protocols
- **Implementation Intentions (If-Then Plans)** — Per-milestone structured plans with Trigger ("When..."), Action ("I will..."), and Fallback ("If too hard...") fields; based on Peter Gollwitzer's research that nearly doubles goal follow-through; inline display on milestone cards + editable in edit mode
- **Mental Contrasting (WOOP Framework)** — Guided 4-step modal workflow per goal: Wish → Outcome → Obstacle → Plan; based on Gabriele Oettingen's research; saved as part of goal data; compact summary visible on goal cards; clickable step navigation with completion tracking
- **Obstacle Pre-Mortem** — Modal to imagine failure 3 months out and flip each scenario into a preventive action; based on Gary Klein's research (30% better failure identification); flag items as "happening" during reviews with visual warnings on goal cards
- **Identity-Based Goal Framing** — Per-goal identity statement ("The person I'm becoming: ___"); based on James Clear's Atomic Habits research; inline compact display on cards, editable with framing tips
- **New type definitions** — `ImplementationIntention`, `WOOPData`, `PreMortemItem`, `PreMortemData` interfaces; `intentions` field on Milestone; `woop`, `preMortem`, `identityStatement` fields on Goal
- **New components** — `ImplementationIntentions.tsx`, `WOOPModal.tsx`, `PreMortemModal.tsx`, `IdentityStatement.tsx` in `components/neuro/`

### Changed — Phase 2.2
- `GoalCard` — now displays neuroscience protocol buttons (WOOP, Pre-Mortem, Identity), WOOP summaries, and pre-mortem flagged warnings
- `MilestoneItem` — now displays and edits Implementation Intentions (If-Then Plans)
- `goalController.ts` — `updateGoal` now supports `woop`, `preMortem`, `identityStatement`
- `milestoneController.ts` — `updateMilestone` now supports `intentions`

### Added — Phase 2.1: Enhanced Search & Organization
- **Advanced search filters** — filter by status (active/completed/archived), difficulty range (dual slider), timeframe (has/doesn't have), and creation date range; all filters are combinable
- **Smart sort options** — sort goals by: Recently Worked On, Difficulty, Progress %, Creation Date, Alphabetical, Timeframe; each with ascending/descending toggle
- **Saved filter presets** — 3 built-in presets (Needs Attention, Quick Wins, Hard Mode); create/save/delete custom presets; persisted in localStorage
- **Goal Parking Lot (Someday/Maybe)** — separate collapsible section for "parked" goals; quick-add with just a title (no difficulty/milestones required); one-click "Activate" promotion to active goals; timestamp shows when parked
- **`parked` goal status** — new `status: 'parked'` added to the Goal type; relaxed validation for parked goals via `createParkedGoal` service function; parked goals excluded from main filtered list
- **`useGoalFilters` hook** — centralized hook managing search, tags, advanced filters, sort, presets, and derived filtered/parked goal lists
- **`AdvancedFilters.tsx`** — reusable components: `SortControl` dropdown, `AdvancedFilterPanel` with collapsible UI, `FilterPresetsBar` for preset selection/creation/deletion
- **`GoalParkingLot.tsx`** — parking lot component with quick-add input, parked goal list, promote/delete actions, relative "parked X ago" timestamps

### Changed
- `GoalToolbar` now includes sort dropdown, filter presets bar, and advanced filter toggle alongside existing search/tags
- `goalController.ts` — `updateGoal` now supports `status` updates; new `createParkedGoal` export
- Dashboard goal count now excludes parked goals

### Previously Added
- **Goal statistics summary** — 4-card dashboard at the top showing: active goal count, completed goal count, weekly milestone completions, and current streak (consecutive days with activity)
- **Completion celebration modal** — confetti animation, achievement badges (Legendary/Marathon Master/High Achiever/Goal Getter based on difficulty and milestones), shareable completion cards, motivational quote
- **canvas-confetti** package for celebration animations

### Previously Added (2026-02-08 continued)
- **Tag pills on goal cards** — colored tag badges display below goal descriptions in view mode (max 3 visible, "+N more" for overflow); clicking a tag pill instantly filters goals by that tag
- **Goal card hover effects** — subtle lift animation on hover with indigo border glow; quick-action buttons (edit, focus, collapse) appear on hover; "last worked on" date reveals on hover (always visible if stale)
- **Empty state illustrations** — rich illustrated empty states with animated brain icon when no goals exist, plus 3-step onboarding tips; filtered empty state with "Clear all filters" action
- **Loading skeletons** — content-shaped skeleton placeholders replace the spinner while goals load, matching the actual card layout for smoother perceived performance
- **Shared tag color utility** (`utils/tagColors.ts`) — extracted tag color palette and hash logic for consistent tag colors across toolbar and cards

---

## 2026-02-08

### Refactored
- **Decomposed Dashboard component** — broke the monolithic 1,643-line `Dashboard.tsx` into a ~270-line orchestrator plus focused sub-components and custom hooks:
  - `hooks/useZoom.ts` — zoom level state and handlers
  - `hooks/useGoalEditor.ts` — all editing state, AI polish, timeframe estimation, save/delete
  - `hooks/useKeyboardShortcuts.ts` — global keyboard event listener with shortcut logic
  - `components/dashboard/DashboardHeader.tsx` — logo, user info, import/export/logout
  - `components/dashboard/NeuroToolsSidebar.tsx` — neuro-tools panel
  - `components/dashboard/GoalToolbar.tsx` — zoom, shortcuts button, batch actions, view toggle, search, tag filter
  - `components/dashboard/GoalCard.tsx` — single goal card with edit and view modes
  - `components/dashboard/FocusMode.tsx` — full-screen focus mode
  - `components/dashboard/KeyboardShortcutsModal.tsx` — keyboard shortcuts help overlay

### Added
- **GPA Master Plan** (`docs/GPA_MASTER_PLAN.md`) — unified roadmap consolidating the enhancement roadmap, architectural suggestions, and new functionality proposals into a single reference

### Removed
- `ENHANCEMENT_ROADMAP.md` — content merged into `docs/GPA_MASTER_PLAN.md`
- `docs/ENHANCEMENT_SUGGESTIONS.md` — content merged into `docs/GPA_MASTER_PLAN.md`
- `docs/FUNCTIONALITY_SUGGESTIONS.md` — content merged into `docs/GPA_MASTER_PLAN.md`

---

## 2025-12-28

### Added
- **Better date formatting** (`utils/dateFormatting.ts`)
  - Relative timestamps ("2 days ago", "just now", "3 months ago")
  - Deadline-aware formatting ("Due tomorrow", "Overdue by 3 days")
  - Visual calendar emoji indicators based on recency
  - Aging color system (green → yellow → orange → red)
  - "Stale" badge for goals not worked on in 7+ days
- **Keyboard shortcuts system**
  - `C` — scroll to and focus the Create Goal form
  - `F` / `Shift+F` — cycle forward/backward through active goals in focus mode
  - `N` — toggle Neural Assistant
  - `/` — focus the search bar
  - `Esc` — close modals, exit focus mode, cancel editing
  - `E` — edit the focused goal (or first active goal)
  - `?` or `H` — show keyboard shortcuts help modal
  - Floating hint button in bottom-right corner

---

## 2025-12-26

### Added
- **Tags/Categories system** — create, assign, and filter goals by custom tags with color coding
- **Weekly Review Ritual** — guided weekly reflection modal for reviewing progress across all goals
- **AI-powered life-pillar suggestions** in the Neuro-Balance Audit for deficient/excessive areas
- **Editable timeframe with AI estimation** — AI can estimate how long a goal will take; timeframe is editable in both normal and focus modes
- **Focus mode** — full-screen single-goal view with larger fonts and dedicated editing
- **Goal editing in focus mode** — edit title, description, AI assessment, timeframe, and tags while focused
- **Editable starting points** — suggested starting points from AI can be edited, added, and removed

### Improved
- Space-Time Bridge voice quality and debugging

### Documentation
- Added comprehensive enhancement roadmap document

---

## 2025-12-25

### Added
- **User profile system** — editable user profiles with age and preferences
- **Comprehensive README** with project documentation and setup instructions

### Fixed
- Missing script tag to load `index.tsx`; installed dependencies

---

## 2025-12-24

### Added
- **Milestone deadlines and comments** — set due dates on milestones and leave comments
- **AI difficulty assessment** — Gemini analyzes goals and estimates difficulty (1–10 scale)
- **Alternative actions** — AI suggests starting points for each goal

---

## 2025-12-22

### Added
- **Demo login** — quick-start login for trying the app
- **Schedule Generator** — AI-powered schedule creation from goals
- **Goal simplification** in CreateGoalForm — AI helps break down complex goals
- **Goal Audit** — Neuro-Balance Audit analyzing goal distribution across life pillars
- **Layout toggle** — switch between standard list and compact grid views

### Improved
- Milestone input UX

---

## 2025-12-20

### Added
- **Goal Scaling Wizard** — step-by-step wizard for refining goal scope
- **AI expansion suggestions** in goal creation — AI proposes related sub-goals
- **AI content generation** for the Foreshadowing Failure modal

### Improved
- Neural Assistant drawer interaction, styling, and integration
- Refactored Neural Assistant into a persistent singleton

---

## 2025-12-19

### Improved
- Dashboard layout and assistant drawer positioning
- Enforced plain-text output for Neural Assistant (cleaner responses)

---

## 2025-12-18 — Initial Release

### Added
- **Core project structure** — React + TypeScript + Vite
- **Goal CRUD** — create, read, update, delete goals with localStorage persistence
- **Milestone management** — break goals into milestones, track completion
- **AI goal assessment** — Gemini integration for analyzing goals
- **Audio playback** for motivational content
- **Neural Assistant** — AI coaching chatbot for goal creation and editing
- **Amygdala Protocol** — foreshadowing failure visualization for motivation
- **Data export/import** — backup and restore all data as JSON
