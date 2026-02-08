# GPA Master Enhancement Plan

> The single source of truth for the evolution of the Goal Pursuit Accelerator — from foundation improvements to advanced features.
>
> **Last Updated:** February 8, 2026

---

## Table of Contents

- [Current Status](#current-status)
- [Part I — Foundation](#part-i--foundation)
  - [Architecture & Code Quality](#11-architecture--code-quality)
  - [Security](#12-security)
  - [Performance](#13-performance)
  - [Data & Storage](#14-data--storage)
  - [Accessibility](#15-accessibility)
  - [Testing & Developer Experience](#16-testing--developer-experience)
- [Part II — Feature Roadmap](#part-ii--feature-roadmap)
  - [Phase 1: Quick Wins & Polish (1-2 weeks)](#phase-1-quick-wins--polish-1-2-weeks)
  - [Phase 2: Core Features & Neuroscience Tools (2-6 weeks)](#phase-2-core-features--neuroscience-tools-2-6-weeks)
  - [Phase 3: Advanced Intelligence & Data (6-10 weeks)](#phase-3-advanced-intelligence--data-6-10-weeks)
  - [Phase 4: Platform & Integration (10-16 weeks)](#phase-4-platform--integration-10-16-weeks)
  - [Phase 5: Advanced Features & Personalization (16-24 weeks)](#phase-5-advanced-features--personalization-16-24-weeks)
  - [Phase 6: Enterprise & Scale (24+ weeks)](#phase-6-enterprise--scale-24-weeks)
- [Part III — Reference](#part-iii--reference)
  - [Quick Wins Table](#quick-wins-table)
  - [Master Priority Matrix](#master-priority-matrix)
  - [Design Principles](#design-principles)
  - [Implementation Strategy](#implementation-strategy)

---

## Current Status

### Completed
- [x] Better date formatting — relative dates ("2 days ago", "Due tomorrow"), visual calendar indicators, aging colors
- [x] Keyboard shortcuts — `C` create, `F`/`Shift+F` cycle focus, `N` assistant, `/` search, `Esc` close, `E` edit, `?` help
- [x] Core goal management with AI difficulty assessment
- [x] Milestone system with GO/NO-GO actions
- [x] Reward Prediction Error (RPE) — variable rewards on milestone completion
- [x] Goldilocks Rule enforcement (difficulty 6-8)
- [x] Foreshadowing Failure protocol (Amygdala activation)
- [x] Space-Time Bridging meditation tool
- [x] Neural Assistant (AI chat coach)
- [x] Goal audit & life balance analysis
- [x] Weekly schedule generator
- [x] Weekly review ritual
- [x] Tags system with filtering
- [x] User profile for AI personalization
- [x] Export/import data backup
- [x] Demo mode with pre-populated data
- [x] Grid/list view toggle with zoom controls
- [x] Search & tag filtering

---

# Part I — Foundation

*Strengthening the technical foundation so every future feature is easier to build and more reliable to ship.*

---

## 1.1 Architecture & Code Quality

### Break Up the Dashboard Component

**Problem:** `Dashboard.tsx` is over 1,600 lines — it manages goals, editing, modals, zoom, search, tags, keyboard shortcuts, imports, exports, AI polish, and more.

**Suggestion:** Extract focused sub-components and custom hooks:

```
components/
├── dashboard/
│   ├── Dashboard.tsx            # Thin orchestrator (~200 lines)
│   ├── DashboardHeader.tsx      # Logo, user info, backup buttons
│   ├── GoalCard.tsx             # Single goal card (view + edit modes)
│   ├── GoalGrid.tsx             # Goal list/grid rendering + filtering
│   ├── GoalToolbar.tsx          # Search, zoom, view toggle, shortcuts button
│   ├── NeuroToolsSidebar.tsx    # Space-Time, Amygdala, Audit, etc.
│   └── KeyboardShortcutsModal.tsx
├── hooks/
│   ├── useGoals.ts              # Goal CRUD, loading state, filtering
│   ├── useKeyboardShortcuts.ts  # Keyboard event listeners
│   ├── useZoom.ts               # Zoom level management
│   └── useGoalEditor.ts         # Edit state, save, cancel, AI polish
```

### Introduce a State Management Pattern

**Problem:** 25+ `useState` calls at the top level of Dashboard make related updates easy to desync.

**Options:**
- **React Context + useReducer** — Good for medium complexity. Consolidate edit state into a single reducer.
- **Zustand** — Lightweight external store with minimal boilerplate. Great for this project's scale.
- **Jotai** — Atomic state management; fine-grained reactivity without re-rendering everything.

### Establish Consistent Error Handling

1. Create a reusable `ErrorBoundary` component for rendering errors.
2. Create a `useAsyncAction` hook that standardizes loading/error/success states.
3. Replace all `alert()` calls with toast notifications.
4. Add retry logic for AI calls — Gemini API calls can fail transiently.

### Type Safety Improvements

- Add **Zod** schemas for validating data loaded from localStorage.
- Use discriminated unions for goal status transitions.
- Enable `strict: true` in `tsconfig.json`.

---

## 1.2 Security

### Password Hashing (Critical)

Passwords are stored as plain text in localStorage. Use the Web Crypto API (zero dependencies):

```typescript
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
```

For production, consider **bcrypt** (via a backend) or **PBKDF2** with salting.

### Protect the API Key

The Gemini API key is exposed in client-side code.

- **Short-term:** Rotate the key regularly, restrict by HTTP referrer.
- **Medium-term:** Create a lightweight backend proxy (Cloudflare Worker, Vercel Edge Function, or Express server).
- **Long-term:** Use Google Cloud IAM with restricted permissions.

### Input Sanitization

Establish a sanitization utility for any content that might be rendered as HTML. Libraries like `DOMPurify` (3KB gzipped) provide robust protection.

---

## 1.3 Performance

### Code Splitting & Lazy Loading

Use `React.lazy()` for modals and heavy components:

```typescript
const SpaceTimePlayer = React.lazy(() => import('./SpaceTimePlayer'));
const GoalAuditModal = React.lazy(() => import('./GoalAuditModal'));
const WeeklyReviewModal = React.lazy(() => import('./WeeklyReviewModal'));
const NeuralAssistant = React.lazy(() => import('./NeuralAssistant'));
```

Can reduce initial load by 30-50%.

### Memoize Expensive Computations

Use `useMemo` for filtered goals, tag lists, and progress calculations. Use `React.memo` on `MilestoneItem` and future `GoalCard` components.

### Debounce Search Input

Debounce the search query with a ~200ms delay to prevent per-keystroke re-filtering.

### Install Tailwind Locally

Tailwind CSS is loaded from a CDN (development-only, no tree-shaking, network-dependent). Install as a proper PostCSS plugin:

```bash
npm install -D tailwindcss @tailwindcss/vite
```

Reduces stylesheet from ~3MB to ~10KB, enables custom configuration, and supports offline development.

---

## 1.4 Data & Storage

### Data Migration System

Implement versioned migrations so old localStorage data doesn't break the app as the schema evolves:

```typescript
const DATA_VERSION = 2;
const migrations: Record<number, (data: any) => any> = {
    1: (data) => { /* v1 → v2: Add comments to milestones */ },
    2: (data) => { /* v2 → v3: Add createdAt to goals */ },
};

function loadAndMigrate(): AppData {
    let data = JSON.parse(localStorage.getItem(key));
    while (data.version < DATA_VERSION) {
        data = migrations[data.version](data);
        data.version++;
    }
    localStorage.setItem(key, JSON.stringify(data));
    return data;
}
```

### Auto-Backup Prompts

- Prompt users to export a backup every 7 days (dismissable).
- Show "Last backed up: 3 days ago" in the sidebar.
- Consider IndexedDB for larger storage limits and structured data.

### Cloud Storage Option

Add optional cloud sync. Lowest-friction options:

| Option | Effort | Cost | Notes |
|--------|--------|------|-------|
| Firebase Firestore | Medium | Free tier generous | Real-time sync, auth built-in |
| Supabase | Medium | Free tier generous | PostgreSQL, open-source |
| GitHub Gist | Low | Free | Simple, good for single-user |
| Cloudflare KV | Low-Med | Free tier | Fast edge reads |

Keep localStorage as default; offer cloud sync as an optional upgrade.

---

## 1.5 Accessibility

### Semantic HTML & ARIA Labels

- Add `aria-label` to icon-only buttons (edit, delete, zoom, etc.).
- Use semantic elements: `<nav>`, `<main>`, `<aside>`, `<article>`.
- Add `role="dialog"` and `aria-modal="true"` to modals.
- Ensure focus trapping in modals.
- Add `aria-live="polite"` regions for dynamic content.

### Color Contrast

Audit all text/background combinations for WCAG AA compliance (4.5:1 ratio). Don't rely solely on color to convey meaning — add icons or text alongside color indicators.

### Keyboard Focus Indicators

Add visible `focus:ring-2 focus:ring-indigo-500` to all interactive elements. Ensure focus order follows visual order.

---

## 1.6 Testing & Developer Experience

### Testing

Add **Vitest** (compatible with Vite) and test the service layer first:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Priority test targets:**
1. `completeMilestone()` — RPE reward logic (15% jackpot chance)
2. `createGoal()` — Goldilocks Rule enforcement
3. `createMilestone()` — GO/NO-GO action requirement
4. `dateFormatting.ts` — Relative date edge cases
5. `auth.ts` — Login, register, session management

**Component tests:** Goal creation, milestone completion, keyboard shortcuts, search filtering, export/import.

**Visual regression:** Playwright or Cypress screenshots of key states.

### ESLint + Prettier

```bash
npm install -D eslint @eslint/js typescript-eslint prettier eslint-config-prettier
```

Key rules: `no-unused-vars`, `react-hooks/exhaustive-deps`, `no-console` (warn).

### Git Hooks with Husky

```bash
npm install -D husky lint-staged
```

Pre-commit: ESLint + Prettier on staged files. Pre-push: Type-check + tests.

### Environment Variable Validation

Validate required env vars at startup. Gracefully degrade AI features when the key is missing rather than crashing.

---

# Part II — Feature Roadmap

---

## Phase 1: Quick Wins & Polish (1-2 weeks)

### 1.1 Visual Enhancements
**Effort:** Low | **Impact:** Medium

- [ ] **Display tags on goal cards** (currently only in edit mode)
  - Show as colored pills below goal description
  - Max 3 tags visible, "+2 more" for additional
  - Click tag on card to filter instantly

- [ ] **Goal card hover effects**
  - Subtle lift animation on hover
  - Show "last worked on" date on hover
  - Quick action buttons appear (edit, focus, archive)

- [ ] **Empty state illustrations**
  - Add friendly illustrations when no goals
  - Onboarding tips for first-time users
  - Animated SVG for better UX

- [ ] **Loading skeletons**
  - Replace spinners with content skeletons
  - Smoother perceived performance

### 1.2 Data Display Improvements
**Effort:** Low | **Impact:** High

- [ ] **Goal statistics summary**
  - Total active/completed goals counter
  - This week's milestone completions
  - Current streak counter
  - Display at top of dashboard

- [ ] **"Last worked on" timestamps**
  - Show on each goal card
  - Highlight stale goals (>7 days)
  - Visual aging indicator (color shift)

- [ ] **Completion celebration**
  - Confetti animation on goal completion
  - Achievement badge system
  - Share-worthy completion cards

### 1.3 UX Improvements
**Effort:** Low | **Impact:** High

- [ ] **Toast notification system**
  - Replace all `alert()` calls with non-blocking toasts
  - Success (green, 3s), Error (red, persist), Info (blue, 5s), Reward (gold, animated)
  - Stack non-intrusively in a corner

- [ ] **Autosave drafts**
  - Save goal creation in progress
  - Recover if browser closes
  - Local storage backup

- [ ] **Undo for destructive actions**
  - Soft-delete with "Undo" toast (5-second countdown)
  - Restore on undo click, purge after timeout
  - Gmail/Slack pattern — feels safe

- [ ] **Bulk actions**
  - Select multiple goals
  - Bulk tag application
  - Bulk archive/delete
  - Export selected goals

- [ ] **Drag-and-drop goal reordering**
  - Use `framer-motion`'s `Reorder` component (already a dependency)
  - Persist order in localStorage

- [ ] **Onboarding flow for new users**
  - Welcome screen explaining neuroscience approach
  - Feature highlight tooltip tour
  - "Create your first goal" guided prompt
  - Store `hasOnboarded` in localStorage; show once

---

## Phase 2: Core Features & Neuroscience Tools (2-6 weeks)

### 2.1 Enhanced Search & Organization
**Effort:** Medium | **Impact:** High

- [ ] **Advanced search filters**
  - Filter by difficulty range, timeframe, status, creation date
  - Combine multiple filters

- [ ] **Smart sort options**
  - Recently worked on, by difficulty, by progress %, by timeframe, by creation date, alphabetical

- [ ] **Saved filter presets**
  - "My Career Goals", "Quick Wins", "Needs Attention", custom filters

- [ ] **Collections/Folders**
  - Group related goals, nested organization, drag & drop, color-coded

- [ ] **Goal Parking Lot (Someday/Maybe list)**
  - Separate section for goals that aren't active but shouldn't be forgotten
  - Quick-add with just a title — no difficulty rating or milestones required
  - Periodic nudge: "You parked 'Learn Japanese' 2 months ago — still interested?"
  - One-click promotion to active goal
  - AI suggests activation: "You just completed a goal. Ready to activate something from your parking lot?"
  - *Implementation:* Add `status: 'parked'` to Goal type, relaxed validation until activation

### 2.2 Neuroscience Protocols
**Effort:** Medium | **Impact:** Very High

- [ ] **Implementation Intentions ("If-Then Plans")**
  - *Research:* Peter Gollwitzer — nearly doubles goal follow-through rates
  - Add structured fields to milestones: **Trigger** ("When I sit at my desk after lunch"), **Action** ("I will practice piano for 20 min"), **Fallback** ("If too tired, just 5 min of scales")
  - Pairs with existing GO/NO-GO actions — intentions are the "when", GO/NO-GO is the "what"
  - AI suggests intentions based on goal type and user profile

- [ ] **Mental Contrasting (WOOP Framework)**
  - *Research:* Gabriele Oettingen — one of the most validated goal-achievement frameworks
  - Guided 4-step workflow per goal: **W**ish → **O**utcome → **O**bstacle → **P**lan
  - Pairs with existing Amygdala Protocol (both activate realistic threat assessment)
  - AI-guided: "Let me walk you through a mental contrasting exercise for this goal"
  - Store as part of goal data; resurface during weekly reviews

- [ ] **Obstacle Pre-Mortem**
  - *Research:* Gary Klein — prospective hindsight increases failure identification by 30%
  - Prompt: "Imagine you've failed at this goal in 3 months. What went wrong?"
  - Flip each failure into a preventive action
  - Optional step during goal creation (after AI assessment)
  - Revisit during weekly reviews: "Has any predicted failure started happening?"

- [ ] **Identity-Based Goal Framing**
  - *Research:* James Clear (Atomic Habits) — "I am a writer" > "I want to write"
  - Add identity statement field: "The person I'm becoming: ___"
  - AI helps reframe: "I want to lose weight" → "I'm someone who takes care of their body"
  - Track identity consistency: "You've acted as a 'runner' 4 out of 7 days this week"

### 2.3 Habit Tracking Integration
**Effort:** Medium | **Impact:** Very High

- [ ] **Daily habits linked to goals**
  ```typescript
  interface Habit {
    id: string;
    name: string;
    goalId: string;
    frequency: 'daily' | 'weekly' | 'custom';
    targetDays: number[];
    completionLog: { date: string; completed: boolean }[];
  }
  ```

- [ ] **Habit calendar view**
  - GitHub-style contribution graph
  - Color intensity = consistency
  - Streak tracking

- [ ] **Habit suggestions from AI**
  - "To achieve [goal], try [habit]"
  - Research-backed suggestions with time estimates

- [ ] **Habit impact analytics**
  - Correlation with goal progress
  - Best performing habits
  - Suggested habit stacks

### 2.4 Time Management & Deep Work
**Effort:** Medium | **Impact:** High

- [ ] **Deep Work Mode**
  - Full-screen, distraction-free environment for a single goal
  - Shows only the focused goal, milestones, and a timer
  - Ambient background sounds (rain, brown noise, lo-fi — Web Audio API)
  - Session log: "What did you accomplish?" prompt on exit
  - Auto-updates `lastWorkedOn` timestamp
  - Optional Space-Time Bridge warm-up ritual before starting
  - Keyboard shortcut: `D`
  - Store sessions: `{ goalId, startTime, endTime, notes, milestonesCompleted }[]`

- [ ] **Built-in Pomodoro timer**
  - 25/5 or custom intervals
  - Track time per goal
  - Break reminders, session history

- [ ] **Time tracking dashboard**
  - Total hours per goal
  - Weekly time breakdown
  - Pie chart by life pillar

- [ ] **Daily/Weekly time goals**
  - Set time commitment per goal
  - Visual progress toward commitment

### 2.5 Progress Visualization
**Effort:** Medium | **Impact:** High

- [ ] **Progress charts**
  - Line graph: completion rate over time
  - Bar chart: milestones per week
  - Trend indicators (↑↓)

- [ ] **Milestone timeline**
  - Gantt chart view
  - Dependencies visualization

- [ ] **Goal health score**
  - Based on: progress rate, staleness, difficulty
  - Color-coded health indicators
  - AI recommendations for unhealthy goals

- [ ] **Victory timeline**
  - Chronological list of wins
  - Shareable achievements

- [ ] **Motivational Fuel Gauge**
  - Quick weekly check per goal: "How motivated are you?" (1-5 flames)
  - Track motivation alongside progress over time
  - AI pattern detection: "Motivation drops after 2 weeks without milestone completions"
  - Interventions: reconnect with the *why*, adjust difficulty, suggest variety or rest

### 2.6 Daily Rituals
**Effort:** Medium | **Impact:** Medium-High

- [ ] **Morning Intention (2 min)**
  - "What's your #1 priority today?"
  - "What might get in the way?"
  - "Energy level? (1-5)"

- [ ] **Evening Reflection (2 min)**
  - "What went well today?"
  - "What would you do differently?"
  - "Rate your day: 1-5"

- [ ] **Pattern analysis over time**
  - AI weekly summary: "You rate days highest when you start with creative goals"
  - Feed into Circadian Energy Mapping (see Phase 3)

---

## Phase 3: Advanced Intelligence & Data (6-10 weeks)

### 3.1 AI-Powered Insights
**Effort:** High | **Impact:** Very High

- [ ] **Weekly AI Coach Report**
  - Progress analysis, pattern recognition, blocker identification
  - Goal adjustments suggested, personalized strategies

- [ ] **Predictive analytics**
  - Goal completion date prediction
  - Success probability scoring
  - Difficulty recalibration suggestions

- [ ] **Smart context-aware reminders**
  - Behavioral: "You usually work on this goal on Tuesdays — it's Tuesday"
  - Near-completion: "This milestone is 80% done — 15 minutes could finish it"
  - Stale: "You haven't touched this in 10 days. What's blocking you?"
  - Energy-based: "It's 10am and your energy is usually high now"
  - Post-ritual: "You just did a Space-Time Bridge — want to open a goal?"
  - Show as dismissable card at top of dashboard; maximum 1 at a time

- [ ] **AI goal suggestions**
  - Based on completed goals, life balance audit, user profile

- [ ] **AI Goal Decomposition Engine**
  - AI analyzes a goal: "This has 4 phases. Want me to break it down?"
  - Generates milestone tree with logical ordering and timeframe estimates
  - Identifies "keystone milestones" — the ones that unlock the most progress
  - User can accept, modify, or reject each suggestion
  - Pre-fills GO/NO-GO actions per milestone

- [ ] **Friction Audit**
  - AI examines stuck goals and asks probing questions
  - Diagnoses friction type: too big, too vague, external blocker, motivation gap, skill gap
  - Suggests specific next action + optionally creates micro-milestone
  - Triggered when milestone stale 12+ days or user clicks "Stuck?"
  - Could be a mode within existing Neural Assistant

- [ ] **Smarter Difficulty Calibration**
  - Prompt for re-evaluation after 30+ days active
  - Use milestone completion rate as signal: "Completing faster than expected — has this gotten easier?"
  - AI suggests recalibration

- [ ] **Streaming AI Responses**
  - Display Gemini responses token-by-token using streaming API
  - Feels more responsive even when total time is the same

- [ ] **Cache AI Responses**
  - Hash inputs; return cached response for identical inputs
  - "Regenerate" button to explicitly bypass cache
  - Reduces API costs and latency

### 3.2 Neuroscience Data Layer
**Effort:** High | **Impact:** High

- [ ] **Circadian Energy Mapping**
  - *Research:* Huberman — peak cognitive performance follows predictable daily cycles
  - Log energy levels (1-5) at app open throughout the day
  - After 1 week: show personal energy heatmap (hour × day)
  - Cross-reference with milestone completion timestamps
  - AI recommends scheduling hard goals during peak windows

- [ ] **Dopamine Scheduling & Rest Protocols**
  - *Research:* Huberman — sustained motivation requires cycling between effort and rest
  - Track completion velocity (milestones/week)
  - Warn on burst completions (dopamine crash risk)
  - Suggest rest days and cooldown periods
  - "Recovery Mode" toggle that dims dashboard and shows reflection prompts

- [ ] **Goal Retrospectives**
  - Triggered on goal completion or archival
  - Template: What worked? What didn't? What surprised you? Actual vs. estimated difficulty and time?
  - AI synthesizes patterns across retrospectives: "You succeed most with weekly deadlines"
  - Builds a personal "playbook" of what works
  - Optional but nudged: "Completing a retrospective doubles success on future goals"

- [ ] **Commitment Escalation Warnings**
  - AI monitors for sunk cost fallacy signals: high time invested + low progress, declining completion rate
  - Gentle intervention with options: Reframe, Pivot, Park, or Retire
  - Never auto-archive — user always decides
  - Triggered during weekly review or after 30-day milestones

- [ ] **Personal Goal DNA Analysis**
  - Requires 3+ completed goals
  - Analyzes: completion rates by tag, difficulty, timeframe, milestone count, frequency
  - Insights: "Successful goals tend to be difficulty 7, health-related, with 4-6 milestones"
  - Feeds into AI suggestions: "Based on your DNA, break this into weekly milestones"
  - Display in profile or audit modal

### 3.3 Goal Dependencies & Planning
**Effort:** High | **Impact:** High

- [ ] **Goal dependency graph**
  ```typescript
  interface GoalDependency {
    goalId: string;
    dependsOn: string[];
    blockedBy: string[];
    enables: string[];
  }
  ```

- [ ] **Visual dependency map**
  - Interactive node graph
  - Blocked goals in red, ready goals in green

- [ ] **Critical path analysis**
  - Longest path to major goals
  - Bottleneck identification, priority recommendations

- [ ] **What-if scenarios**
  - "If I pause this goal, what's affected?"
  - Timeline impact simulation

- [ ] **Goal Impact Mapping**
  - Each goal can link to what it "contributes to" (other goals or life outcomes)
  - Visualize as a node graph: small goals feed into big outcomes
  - "Impact Score" = number of downstream goals affected
  - AI suggests connections: "Meditation contributes to focus, which helps 3 other goals"

### 3.4 Social & Accountability
**Effort:** High | **Impact:** Medium-High

- [ ] **Accountability partners**
  - Invite partner via email
  - Share specific goals (not all)
  - Weekly check-in reminders
  - Partner can comment & encourage

- [ ] **Commitment Contracts**
  - *Research:* Public commitments increase follow-through by 65%
  - "I commit to completing [milestone] by [date]. If I fail, I will [consequence]."
  - Consequences: social (tell a friend), financial (donate), public (post), personal (reflection)
  - Optional referee who verifies completion

- [ ] **Mentor Mode**
  - Share read-only view of a specific goal via unique link
  - Mentor sees progress, milestones, timeline
  - Mentor can leave comments — no account required
  - 80% of accountability benefit with 20% of full social implementation

- [ ] **Goal templates marketplace**
  - Share successful goal templates
  - Browse, clone, rate & review
  - AI-recommended templates

- [ ] **Experiment Mode**
  - A/B test strategies: "daily 15-min vs. weekly 2-hour sessions"
  - Track progress, completion rate, satisfaction for each approach
  - AI summarizes: "Daily sessions produced 40% more progress"
  - Build a personal "what works for me" playbook

---

## Phase 4: Platform & Integration (10-16 weeks)

### 4.1 Mobile & Cross-Platform
**Effort:** Very High | **Impact:** Very High

- [ ] **Progressive Web App (PWA)**
  - Installable on mobile, offline mode with sync
  - Push notifications, home screen icon

- [ ] **Mobile-optimized UI**
  - Sidebar → collapsible drawer or bottom sheet
  - Bottom navigation bar
  - Touch targets ≥ 44x44px
  - Swipe gestures (archive, complete)
  - Test 375px (iPhone SE) through 428px (iPhone 14 Pro Max)

- [ ] **Cross-device sync**
  - Real-time sync via Firebase/Supabase
  - Conflict resolution, sync status indicator, offline queue

- [ ] **Native mobile apps (optional)**
  - React Native, iOS & Android
  - Biometric authentication

### 4.2 Third-Party Integrations
**Effort:** High | **Impact:** High

- [ ] **Calendar integration** — Google Calendar sync, block time for goal work, deadline reminders
- [ ] **Task manager integration** — Todoist, Notion, Trello, Asana (bi-directional)
- [ ] **Fitness tracking** — Apple Health, Google Fit, Strava
- [ ] **GitHub integration** — Track coding goals, link repos, auto-complete milestones
- [ ] **Productivity tools** — RescueTime, Toggl, focus app integration

### 4.3 Data & Export
**Effort:** Medium | **Impact:** Medium

- [ ] **Advanced export** — PDF reports with charts, Excel/CSV, Markdown, scheduled auto-exports
- [ ] **Import from other tools** — Todoist, Notion, CSV bulk import, migration wizards
- [ ] **Public API** — RESTful + GraphQL, webhook support, rate limiting, documentation
- [ ] **Zapier/Make integration** — Trigger on completion, create from email, custom workflows

---

## Phase 5: Advanced Features & Personalization (16-24 weeks)

### 5.1 Gamification & Motivation
**Effort:** Medium-High | **Impact:** High

- [ ] **Achievement system**
  - "First Goal", "Week Warrior" (7-day streak), "Marathon Runner" (30 days)
  - "Perfectionist" (100% completion), "Balanced Life" (all pillars active)
  - 50+ achievements

- [ ] **XP & Levels**
  - Earn XP for actions, level up rewards
  - Unlock features at levels

- [ ] **Daily/Weekly challenges**
  - "Complete 3 milestones this week", "Do your weekly review"
  - Bonus XP, streak bonuses

- [ ] **Progress Evidence Vault**
  - Attach photos, links, text snapshots to milestones as proof of progress
  - Visual timeline per goal: scroll through all evidence chronologically
  - Combats "I'm not making progress" feelings — the evidence says otherwise
  - AI can reference evidence: "Look how far you've come since [first entry]"

### 5.2 AI Voice & Interaction
**Effort:** Very High | **Impact:** Medium

- [ ] **Voice input** — "Create goal: Learn Spanish", voice notes, voice search
- [ ] **AI voice coach** — Daily motivational messages, personalized TTS, multiple personalities
- [ ] **Conversational AI assistant** — "What should I work on today?", natural language commands

### 5.3 Advanced Analytics
**Effort:** High | **Impact:** Medium

- [ ] **Predictive dashboard** — ML-based completion predictions, burnout risk detection, performance patterns
- [ ] **Comparative analytics** — Compare to past weeks, best/worst goals, ROI analysis
- [ ] **Custom reports** — Build your own, save templates, schedule & email reports
- [ ] **Data science insights** — Correlation analysis, time-of-day performance, seasonal patterns

### 5.4 Personalization
**Effort:** Medium-High | **Impact:** Medium

- [ ] **Dark/Light theme toggle**
  - CSS custom properties for colors, `data-theme` attribute toggle
  - Respect `prefers-color-scheme` media query
  - Store preference in localStorage
  - Easier to implement once Tailwind is installed locally with `darkMode: 'class'`

- [ ] **Workflow customization**
  - Customize dashboard layout, create custom views
  - Custom fields on goals, custom goal types

- [ ] **AI personality tuning**
  - Coaching style (gentle/tough), formality, humor, cultural adaptation

---

## Phase 6: Enterprise & Scale (24+ weeks)

### 6.1 Team Features
**Effort:** Very High | **Impact:** High (for teams)

- [ ] **Team workspaces** — Personal/team goals, collaborative milestones, team dashboard, role-based permissions
- [ ] **Team analytics** — Progress dashboard, contributions, bottleneck identification
- [ ] **Admin features** — User management, template creation, team challenges, audit logs

### 6.2 Monetization (Optional)
**Effort:** Very High | **Impact:** Variable

- [ ] **Freemium model**
  ```
  Free:       5 active goals, basic features
  Pro:        Unlimited goals, advanced AI
  Team:       Collaboration features
  Enterprise: Custom deployment
  ```

- [ ] **Premium features** — Advanced AI coaching, priority support, custom integrations, API access
- [ ] **Subscription management** — Stripe integration, plans, trials, billing portal

### 6.3 Backend Infrastructure
**Effort:** Very High | **Impact:** High (for scale)

- [ ] **Cloud backend** — Firebase/Supabase, real-time sync, database optimization, CDN
- [ ] **Security & Privacy** — End-to-end encryption, GDPR compliance, data portability, right to deletion
- [ ] **Performance** — Code splitting, lazy loading, image optimization, caching, service workers
- [ ] **Monitoring** — Error tracking (Sentry), usage analytics, performance monitoring, A/B testing

---

# Part III — Reference

---

## Quick Wins Table

Implementable in under an hour each:

| # | Enhancement | Impact | Effort |
|---|-------------|--------|--------|
| 1 | Add `<title>` with goal count ("GPA (3 active)") | Low | 5 min |
| 2 | Add favicon with brain/target icon | Low | 10 min |
| 3 | Show total completion percentage in header | Medium | 15 min |
| 4 | Confirm before logout if unsaved edits | Medium | 15 min |
| 5 | Persist grid/list view in localStorage | Low | 10 min |
| 6 | Persist collapsed goal state across reloads | Medium | 15 min |
| 7 | "No results found" state for search with clear button | Low | 15 min |
| 8 | Truncate long goal titles with tooltip | Low | 10 min |
| 9 | Word count on description textarea | Low | 5 min |
| 10 | Show "Created X days ago" on goal cards | Low | 10 min |
| 11 | Loading states on all AI-powered buttons | Medium | 20 min |
| 12 | Disable AI buttons when API key missing (with tooltip) | Medium | 15 min |

---

## Master Priority Matrix

### Immediate (Next 2 weeks)
| Priority | Item | Source |
|----------|------|--------|
| 1 | Quick wins table (above) | Foundation |
| 2 | Display tags on goal cards | Phase 1 |
| 3 | Goal statistics summary | Phase 1 |
| 4 | Toast notification system | Phase 1 |
| 5 | Completion celebrations | Phase 1 |
| 6 | Hash passwords | Foundation |
| 7 | Install Tailwind locally | Foundation |

### Short-term (Next 1-2 months)
| Priority | Item | Source |
|----------|------|--------|
| 1 | Implementation Intentions | Phase 2 |
| 2 | Goal Parking Lot | Phase 2 |
| 3 | Identity-Based Goal Framing | Phase 2 |
| 4 | Deep Work Mode | Phase 2 |
| 5 | Habit tracking system | Phase 2 |
| 6 | Pomodoro timer | Phase 2 |
| 7 | Break up Dashboard component | Foundation |
| 8 | Add Vitest + test services | Foundation |
| 9 | Code splitting with React.lazy | Foundation |
| 10 | Data migration system | Foundation |

### Medium-term (Next 3-6 months)
| Priority | Item | Source |
|----------|------|--------|
| 1 | Goal Retrospectives | Phase 3 |
| 2 | AI Goal Decomposition | Phase 3 |
| 3 | Friction Audit | Phase 3 |
| 4 | Progress charts & visualization | Phase 2 |
| 5 | Advanced search filters | Phase 2 |
| 6 | AI weekly coach reports | Phase 3 |
| 7 | WOOP Framework | Phase 2 |
| 8 | Obstacle Pre-Mortem | Phase 2 |
| 9 | Commitment Escalation Warnings | Phase 3 |
| 10 | Personal Goal DNA Analysis | Phase 3 |

### Long-term (Next 6-12 months)
| Priority | Item | Source |
|----------|------|--------|
| 1 | PWA with offline mode | Phase 4 |
| 2 | Cloud storage / cross-device sync | Phase 4 |
| 3 | Calendar integration | Phase 4 |
| 4 | Mobile optimization | Phase 4 |
| 5 | Circadian Energy Mapping | Phase 3 |
| 6 | Goal dependencies & impact mapping | Phase 3 |
| 7 | Accountability partners & mentor mode | Phase 3 |
| 8 | Achievement system | Phase 5 |
| 9 | Dark/light theme | Phase 5 |
| 10 | Third-party integrations | Phase 4 |

### Horizon (12+ months)
| Priority | Item | Source |
|----------|------|--------|
| 1 | Native mobile apps | Phase 4 |
| 2 | Team features | Phase 6 |
| 3 | Advanced AI coaching & voice | Phase 5 |
| 4 | Marketplace & templates | Phase 3 |
| 5 | Enterprise features | Phase 6 |

---

## Design Principles

Throughout all phases, maintain:

1. **Neuroscience-first** — Every feature should have a research basis. If it doesn't support the science of goal achievement, reconsider it.
2. **Optional, not forced** — Power features should be available but never required. Simple goal tracking should never feel overwhelming.
3. **Data compounds** — The best features get more valuable over time as data accumulates (Goal DNA, retrospectives, energy mapping).
4. **Gentle interventions** — AI should suggest, not dictate. Give users information and options, then let them decide.
5. **2-minute rule** — Any daily ritual or check-in should take less than 2 minutes.
6. **Show, don't tell** — Visualizations and evidence are more motivating than text.
7. **Speed** — Fast interactions, no lag. Perceived performance matters.
8. **Beautiful** — Maintain aesthetic excellence across every feature.
9. **Accessible** — Works for everyone regardless of ability.
10. **Privacy** — User data is sacred.
11. **Offline-first** — Work anywhere, sync when connected.
12. **Progressive enhancement** — Basic functionality for all, enhanced for capable devices.

---

## Implementation Strategy

### For Each Feature
1. **Spike** (2-4 hours) — Research & prototype
2. **Design** (4-8 hours) — UI/UX mockups
3. **Implement** (varies) — Code & test
4. **Polish** (20% of impl time) — Refine UX
5. **Document** — Update this file
6. **Ship** — Deploy & monitor

### Success Metrics
- User engagement (daily active users)
- Goal completion rate
- Feature adoption rate
- Performance metrics (load time, bundle size)
- User satisfaction (NPS score)

---

## Notes

- This plan is flexible — prioritize based on user feedback
- Some features may be combined or split
- Effort estimates are rough guidelines
- Regularly review and update this document
- When in doubt, ask: *"Does this support the neuroscience of goal achievement?"*

---

**The best feature is the one that helps users achieve their goals.**
