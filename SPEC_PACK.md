# Product Design Spec Pack: StudentFlow Ultimate Pro

**Confidence Level**: High  
**Assumptions Count**: 4 requiring validation  
**Status**: DRAFT

---

## Needed to Confirm (max 5 files)

1. `studentflow_ultimate_pro.html` (lines 5400–8527) — Full JavaScript logic for AI recommendations, Safe Mode scoring, and i18n translation map; file is 8500+ lines and only partially reviewed
2. `www/studentflow_ultimate_pro.html` — Verify if this is a duplicate or divergent copy of the root-level file (8501 vs 8527 lines suggests slight difference)
3. `android/app/src/main/assets/public/` — Confirm if the Android assets are auto-synced via `cap sync` or manually copied
4. `ios/App/` — Confirm iOS build status and whether iOS has ever been successfully deployed
5. `.gitignore` — Verify what build artifacts are excluded; `.apk` and `.aab` files are currently committed to the repository

---

## 1. Product Spec

### 1.1 Vision & Positioning

⚠️ INFERRED from `package.json` description, `manifest.json`, and structured data in `studentflow_ultimate_pro.html`

- **North Star**: Empower every student to achieve academic success while maintaining mental and physical well-being through intelligent planning and proactive wellness monitoring.
- **Value Prop**: Unlike generic to-do apps or calendar tools, StudentFlow combines time management with wellness tracking (stress, sleep, workload) and proactive burnout prevention via a "Safe Mode" system—all offline-first and free.
- **Positioning**: For students who struggle to balance academics with health, StudentFlow is a wellness-aware planning platform that prevents burnout before it happens. Unlike Google Calendar or Notion, we integrate real-time wellbeing scoring and AI-driven schedule recommendations.

### 1.2 Personas & Jobs-to-be-Done

🔴 ASSUMPTION — No user research artifacts found in repository

- **Primary**: University student (18–25) juggling coursework, social life, and self-care
  - JTBD: "When I feel overwhelmed by my workload, I want to see how my schedule affects my well-being, so I can adjust before burning out."
- **Secondary**: High school student (15–18) building study habits
  - JTBD: "When I need to organize my revision schedule, I want an easy drag-and-click planner with motivation features, so I can stay consistent."

### 1.3 Scope Matrix

| Version | In Scope | Explicitly Out (Non-Goals) | Success Metrics |
|---------|----------|---------------------------|-----------------|
| **V1 (Current — v2.0.0)** | Weekly timetable, wellness journal, Pomodoro focus, gamification (levels/streaks), analytics dashboard, Safe Mode burnout detection, ambient sounds, PDF export, PWA offline, Android APK | Cloud sync/backend, user accounts/auth, multi-device sync, social features, real AI/ML models | Daily active users, journal entries/week, Safe Mode trigger rate |
| **V2 (Future)** | Cloud backup, user accounts, cross-device sync, AI-powered schedule suggestions (server-side), collaborative features | Real-time chat, marketplace, third-party integrations | Retention rate (D7/D30), data sync reliability, user growth |

### 1.4 Success Metrics

🔴 ASSUMPTION — No analytics instrumentation found in codebase

- **North Star**: Journal entries logged per active user per week
- **L1 (Health)**:
  - Adoption: PWA install rate, APK downloads
  - Retention: Weekly return rate
  - Engagement: Average sessions per user per week
- **L2 (Feature)**:
  - Timetable: Slots filled per user per week
  - Focus: Pomodoro sessions completed per week
  - Safe Mode: Percentage of users who take action when Safe Mode triggers
- **Guardrails**:
  - Performance: TTI < 3s on 3G, Lighthouse score > 90
  - Error: LocalStorage write failures < 0.1%
  - Bundle: Total page weight stays under current baseline

### 1.5 Product Risks & Decisions

| Risk | P | I | Mitigation | Decision Needed |
|------|---|---|------------|-----------------|
| Data loss (LocalStorage only, no backup) | H | H | Implement JSON export/import, eventual cloud sync | "Prioritize cloud backup for V2?" |
| Large monolithic HTML (8500+ lines) unmaintainable | H | M | Modularize into component files with build step | "Accept build tool complexity or keep single-file?" |
| No test coverage — regressions undetected | H | H | Add unit tests for StateManager and Helpers | "Invest in test infrastructure now?" |
| APK/AAB binaries committed to git (bloats repo) | M | L | Move to release assets, add to `.gitignore` | "Remove binaries from git history?" |
| Privacy: wellness data stored in plain LocalStorage | M | H | Encrypt sensitive fields, add data export/delete | "Implement encryption for V1 patch or V2?" |

---

## 2. UX / Functional Spec

### 2.1 Information Architecture

🟢 CONFIRMED from navigation buttons in `studentflow_ultimate_pro.html` (lines 1280–1320, 1350–1390)

**Current Sitemap (8 tabs)**:
```
StudentFlow App
├── Planning (sched) — Weekly timetable grid [DEFAULT TAB]
├── Dashboard (dash) — Overview with quick stats
├── Analytics (analytics) — Charts: stress, sleep, load trends
├── Focus (focus) — Pomodoro timer with ambient sounds
├── Journal (log) — Daily wellness logging (stress, sleep, mood)
├── Objectives (goals) — Goal setting and tracking
├── Bio-Hack (wellness) — Health reminders, sleep tracking
└── Download (download) — APK download, export/import data
```

**Navigation Model**:
- 🟢 CONFIRMED: Desktop — Fixed left sidebar (80px collapsed / 256px expanded at md breakpoint), single level
- 🟢 CONFIRMED: Mobile — Fixed bottom bar with 5 visible tabs + "More" overflow menu for 3 additional tabs
- 🟢 CONFIRMED: No nested navigation, all tabs are top-level peers

**Proposed (No changes recommended for V1)**: Current IA is flat and appropriate for the feature count.

### 2.2 User Flows

**Flow: Daily Wellness Check-in (Primary Job)**

⚠️ INFERRED from Journal tab and Safe Mode logic in `config.js`

1. User opens app → lands on Planning tab (default)
2. At configurable hour (default 21:00, per `CONFIG.REMINDERS.journalHour`), notification triggers: "Time for your daily check-in"
3. User navigates to Journal tab (via notification or bottom nav)
4. User inputs: stress level (1–10), sleep hours, mood, optional notes
5. Client-side validation: stress and sleep must be numeric within range
6. Entry saved to `StateManager.get('logs')` array with ISO date
7. Gamification: Wisdom points awarded, streak incremented if consecutive day
8. Safe Mode check: System calculates burnout score using weights from `CONFIG.SAFE_MODE.WEIGHTS`
   - If score exceeds critical threshold (80): Safe Mode banner appears with action buttons
   - Actions: "Breathing exercise", "Adjust schedule", "View trends", "Dismiss"
9. Success state: Confetti animation + success sound if milestone reached

- **Edge cases**: Quiet hours (23:00–07:00) suppress notifications; duplicate entries for same day should update not append
- **System triggers**: Background sync tags (`journal-sync`) queue data for when back online

**Flow: Pomodoro Focus Session**

🟢 CONFIRMED from Focus tab and `CONFIG.POMODORO`

1. User navigates to Focus tab
2. Selects ambient sound (Rain/Café/Forest/White noise) — optional
3. Clicks Start → 25-minute countdown begins
4. At completion: notification sound + haptic feedback (if Capacitor)
5. Short break (5 min) starts automatically
6. After 4 sessions: long break (15 min)
7. Session logged to `focusSessions` array
8. Wisdom points awarded

- **Edge cases**: App backgrounded during timer — Service Worker cannot reliably maintain timers; relies on `setTimeout`
- **Edge cases**: User cancels mid-session — partial session should not count toward stats

**Flow: Timetable Slot Management**

🟢 CONFIRMED from Planning tab and `CONFIG.SLOT_TYPES`

1. User views weekly grid (hours 6–22, 7 days)
2. Clicks empty slot → type selector appears (7 types: Cours, Révision, Repos, Sport, Social, Admin, Repas)
3. User selects type → slot fills with gradient color + icon
4. Slot saved to `StateManager.get('timetable')` keyed by `day-hour`
5. Click filled slot → options: change type, clear slot
6. Analytics recalculate: weekly load, rest ratio

- **Edge cases**: Template save/load for recurring schedules; conflict detection not implemented

### 2.3 Screen Specifications (ASCII Wireframes)

**Screen: Planning (Default Tab)**
```
+--------------------------------------------------+
|  [Sidebar/Nav]  |  📅 PLANNING                    |
|                 |  [< Week] Sem du 17 Fév [Week >]|
|  [Planning ●]   |  +-L--M--M--J--V--S--D--------+|
|  [Dashboard]    |  | 6h [__][__][__][__][__][__][__]|
|  [Analytics]    |  | 7h [📚][__][__][📚][__][__][__]|
|  [Focus]        |  | 8h [📚][✏️][__][📚][✏️][__][__]|
|  [Journal]      |  | ...                          |
|  [Objectives]   |  | 22h[__][__][__][__][__][__][__]|
|  [Bio-Hack]     |  +------------------------------+|
|  [Download]     |  [Template ▼] [Clear All] [AI ✨]|
+--------------------------------------------------+
```

**Screen: Journal Entry**
```
+------------------------------------------+
|  ❤️ JOURNAL BIEN-ÊTRE                     |
+------------------------------------------+
|  Date: [2026-02-18]                       |
|                                           |
|  Stress (1-10):  [====●=====] 5           |
|  Sommeil (hrs):  [======●===] 7.5         |
|  Humeur:         [😊 😐 😔 😡 😰]         |
|                                           |
|  Notes: [________________________]        |
|         [________________________]        |
|                                           |
|  [💾 Enregistrer]                          |
+------------------------------------------+
|  📊 Historique récent                      |
|  - 17 Fév: Stress 4 | Sleep 8h | 😊      |
|  - 16 Fév: Stress 6 | Sleep 6h | 😐      |
|  - Empty: "Commencez votre journal"  [+]  |
+------------------------------------------+
```

**Screen: Safe Mode Banner (Overlay)**
```
+------------------------------------------+
| 🚨 SAFE MODE ACTIVÉ          Score: [85] |
| Reasons: Stress élevé, Sommeil insuffisant|
| [🫁 Respiration] [📅 Ajuster] [📊 Trends]|
| [✖ Dismiss]                               |
+------------------------------------------+
```

**States Matrix** (per screen/component):

| State | Visual | Copy | Interaction | Data State |
|-------|--------|------|-------------|------------|
| **Empty** (Journal) | Gray icon | "Commencez votre premier journal" | CTA "+" visible | `logs: []` |
| **Loading** | N/A (all client-side, instant) | N/A | N/A | Sync from LocalStorage |
| **Error** (Storage full) | Red toast | "⚠️ Erreur de sauvegarde" | Retry via re-save | `catch(e)` in `StateManager.save()` |
| **Success** (Entry saved) | Green toast + confetti | "✅ Enregistré!" | Auto-dismiss 3s | Entity appended to `logs[]` |
| **Safe Mode** (Critical) | Red banner, pulsing | "🚨 SAFE MODE ACTIVÉ" | 4 action buttons | `safeMode.active: true, score: >80` |
| **Offline** | Service Worker serves cached | "Mode hors-ligne" | Full functionality | LocalStorage available |

### 2.4 Content & Copy

🟢 CONFIRMED — App is primarily French with i18n support for EN/AR

- **Voice/Tone**: Friendly, encouraging, student-casual. Uses emojis extensively. French-first.
- **Key Strings**:
  - CTA: "Enregistrer" (not "Soumettre")
  - Empty Journal: "Commencez votre premier journal"
  - Safe Mode: "🚨 SAFE MODE ACTIVÉ" (urgent but not blaming)
  - Errors: "⚠️ Erreur de sauvegarde" (system-focused, not user-blaming)
  - Success: "✅ Enregistré!" with confetti
  - Gamification: "🔥 Streak: Xj", "Niveau X", "Sagesse: X"

### 2.5 Accessibility (a11y)

🔴 ASSUMPTION — No explicit a11y implementation observed; recommendations for improvement

- **Keyboard**: Tab order follows DOM order (sidebar → content); no visible focus indicators observed; no focus trap in modals
- **Screen Readers**: `data-i18n` attributes on nav buttons provide translatable labels; no `aria-live` regions for dynamic content (toasts, Safe Mode banner, timer updates)
- **Visual**: Dark theme default with light mode toggle; contrast ratios not verified against WCAG AA (4.5:1)
- **Motion**: Confetti and animations present; no `prefers-reduced-motion` media query detected

**Recommendations**:
- Add `aria-live="polite"` to toast container and Safe Mode banner
- Add visible focus indicators (`:focus-visible` ring)
- Add `prefers-reduced-motion` check before confetti/animations
- Add `role="timer"` and `aria-live` to Pomodoro countdown

### 2.6 Internationalization (i18n) & RTL

🟢 CONFIRMED — `data-i18n` attributes on nav items; `manifest.json` lang is `fr-FR`; structured data mentions FR/EN/AR support

- **Current Languages**: French (primary), English, Arabic
- **Text Expansion**: French strings are already the base; German/Finnish expansion (150%) not currently needed but should be considered if adding more languages
- **RTL**: Arabic support declared but RTL CSS rules not confirmed in the viewed CSS sections; likely needs `dir="rtl"` conditional and mirrored layouts
- **Formatting**: Dates use `toISOString().slice(0,10)` (ISO format); locale-aware formatting not observed — should use `Intl.DateTimeFormat` for display

---

## 3. Technical Design Doc

### 3.1 Architecture Analysis

**Current (As-Is)**:

🟢 CONFIRMED from codebase analysis

- **Pattern**: Monolithic single-page application — all HTML, CSS, and JavaScript in one 8500-line file (`studentflow_ultimate_pro.html`) with 3 extracted JS modules (`config.js`, `storage.js`, `audio.js`)
- **Stack**:
  - Vanilla JavaScript (no framework)
  - Tailwind CSS (CDN/bundled minified)
  - Chart.js (bundled minified)
  - Lucide Icons (bundled minified)
  - jsPDF (bundled minified)
  - Confetti.js (bundled minified)
  - Capacitor v5.5.1 (native bridge for Android/iOS)
- **Storage**: Browser LocalStorage only — no backend, no database, no API
- **Build**: No build step — files served directly; Capacitor `sync` copies `www/` to native platforms
- **Pain Points**:
  - 8500-line monolithic HTML file is difficult to maintain, review, and test
  - No test coverage at all
  - Binary artifacts (`.apk`, `.aab`) committed to git repository
  - Duplicated files at root and `www/` levels
  - No linting or formatting tools configured
  - Service Worker cache version (`v5.0.0`) manually maintained

**Target (To-Be)** — ⚠️ INFERRED recommendations:

- **Pattern**: Modular vanilla JS with a build step (e.g., Vite) for bundling, or gradual migration to a lightweight framework
- **Rationale**: Enable code splitting, tree-shaking, proper module imports, and test infrastructure without a full framework rewrite
- **Migration**: Strangler fig — extract functions from monolith into ES modules incrementally; add Vite as dev server and bundler

### 3.2 Data Architecture

**Current Schema** 🟢 CONFIRMED from `storage.js` lines 32–52

```typescript
interface StudentFlowState {
  schemaVersion: number;        // Currently 1
  createdAt: string;            // ISO 8601
  lastModified: string;         // ISO 8601
  appVersion: number;           // Currently 2

  timetable: Record<string, TimetableSlot>;  // Key: "day-hour"
  logs: JournalEntry[];
  gamification: {
    level: number;
    wisdom: number;
    streak: number;
    lastEntry: string | null;   // ISO date
  };
  focusSessions: FocusSession[];
  goals: Goal[];
  notes: Note[];
  templates: Record<string, unknown>;
  settings: {
    sound: boolean;
    theme: 'dark' | 'light';
    notifications: boolean;
    quietHours: boolean;
    slotDuration: number;       // Minutes (default 60)
  };
  safeMode: {
    active: boolean;
    score: number;
    dismissedAt: string | null;
    reasons: string[];
  };
}

interface TimetableSlot {
  id: string;
  type: 'cours' | 'revisions' | 'repos' | 'sport' | 'social' | 'admin' | 'repas';
  createdAt: string;
}

interface JournalEntry {
  date: string;         // ISO date
  stress: number;       // 1-10
  sleep: number;        // hours
  mood?: string;
  notes?: string;
}
```

- **Storage Strategy**: LocalStorage (synchronous, 5–10 MB limit depending on browser)
- **Migration Plan**: Schema version tracked in state; `_migrateIfNeeded()` handles version 0→1 migration with field backfills
- **Backup/DR**: Manual — `_backup()` creates timestamped copies in LocalStorage; no cloud backup; JSON export available in Download tab

### 3.3 API Contracts

🟢 CONFIRMED — No backend API exists. All data operations are client-side.

**Current**: No HTTP endpoints. State managed entirely via `StateManager` (pub/sub pattern over LocalStorage).

**Service Worker Messages** (internal IPC, not REST):
```
Client → SW:
  { type: 'OFFLINE_ANALYTICS', payload: AnalyticsEvent }
  { type: 'UPDATE_CACHE', url: string }
  'skipWaiting'

SW → Client:
  { type: 'SYNC_JOURNAL', timestamp: number }
  { type: 'SYNC_ANALYTICS', timestamp: number }
  { type: 'SYNC_GOALS', timestamp: number }
  { type: 'CREATE_BACKUP', timestamp: number }
  { type: 'STORE_OFFLINE_ANALYTICS', payload: AnalyticsEvent }
```

**State Management**:
- Server: N/A (no server)
- Client: Custom `StateManager` singleton with pub/sub (`subscribe`/`_notify`), path-based getter/setter, automatic LocalStorage persistence on every write

### 3.4 Performance Strategy

⚠️ INFERRED from current architecture

**Current Budgets** (estimated):
- Bundle: ~8500 lines HTML + ~400 lines JS modules + bundled libs (Tailwind, Chart.js, etc.) — total estimated 2–3 MB uncompressed
- TTI: Fast on modern devices (no framework overhead, no network dependency after first load)
- Lighthouse: Unknown — no audit results in repo

**Current Optimizations**:
- 🟢 CONFIRMED: Offline-first via Service Worker with cache-first strategy (`sw.js`)
- 🟢 CONFIRMED: All libraries bundled locally (no CDN dependency)
- 🟢 CONFIRMED: Minified vendor files (tailwind.min.js, chart.min.js, etc.)

**Recommended Optimizations**:
- Code splitting: Not possible without a build tool; recommend adding Vite
- Lazy loading: Charts and jsPDF could be lazy-loaded since they are only needed on specific tabs
- Caching: Service Worker pre-caches all assets at install; background updates on fetch
- Database: Consider IndexedDB for larger datasets (LocalStorage has 5–10 MB limit)

### 3.5 Infrastructure & Config Changes (High-level only)

🟢 CONFIRMED configurations:

- **CI/CD (Codemagic)**: Android APK build pipeline — installs Java 17, Android SDK API 34, runs Gradle `assembleRelease`
- **Hosting (Netlify)**: Static site deployment from root directory with security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy)
- **Build**: No build step — `npm run build` simply echoes "Files already in www folder"
- **Mobile (Capacitor)**: `npm run sync` copies www/ to native platforms; separate Android/iOS projects

**Recommended Changes**:
- Add a linting step (ESLint) to catch errors before deployment
- Add a GitHub Actions workflow for automated testing (once tests exist)
- Move `.apk` and `.aab` binary artifacts to GitHub Releases instead of committing to the repository
- Add `.apk` and `.aab` patterns to `.gitignore`
- Consider adding a lightweight build step (Vite) for module bundling and minification

### 3.6 Security & Privacy

⚠️ INFERRED from codebase analysis

- **Authentication**: None — no user accounts, no auth system
- **Authorization**: N/A — single-user local app
- **Privacy**:
  - All data stored in browser LocalStorage (plaintext)
  - Wellness data (stress levels, sleep, mood) is sensitive PII
  - No data transmitted to any server (fully offline)
  - No analytics tracking instrumentation found
  - GDPR: Data is device-local; user can clear via browser settings or app's export/clear functions
- **Input Validation**:
  - `Helpers.escapeHtml()` uses `textContent`/`innerHTML` pattern for XSS prevention (🟢 CONFIRMED in `storage.js` line 166–169)
  - No SQL (no database)
  - Service Worker validates `request.method === 'GET'` before caching
- **Secrets Management**: No secrets in codebase; `capacitor.config.json` contains app IDs but no sensitive keys
- **Netlify Security Headers**: 🟢 CONFIRMED — X-Frame-Options DENY, X-Content-Type-Options nosniff, strict Referrer-Policy

**Concerns**:
- LocalStorage data is accessible to any JavaScript on the same origin — vulnerable to XSS
- `webContentsDebuggingEnabled: false` is correctly set for production Android builds
- `allowMixedContent: true` in Android config could allow HTTP content — should be reviewed

### 3.7 Testing Strategy

🟢 CONFIRMED — No tests exist currently

**Current State**: Zero test coverage. No testing framework configured.

**Recommended Distribution**: Unit 70% | Integration 20% | E2E 10%

**Recommended Tools**:
- Unit: Vitest (fast, Vite-compatible, modern)
- Integration: Vitest + jsdom for DOM-dependent StateManager tests
- E2E: Playwright (cross-browser, mobile viewport testing)

**Priority Test Targets**:
1. `StateManager` — init, get/set, save/load, migration, backup
2. `Helpers` — escapeHtml, getWeeklyLoad, getRestRatio, getRecentStats, isQuietHours
3. `CONFIG.SAFE_MODE` — threshold calculations, weight-based scoring
4. Service Worker — cache strategies, sync handlers

**Data**: Factory functions for generating test state objects based on `_getDefaultState()`

**Mocks**: LocalStorage mock (jsdom provides this), AudioContext mock for audio.js tests

---

## 4. Execution Plan

### 4.1 Work Breakdown

**Epic 1: Foundation & Code Quality**
- Story 1.1: As a developer, I want ESLint configured so that code quality issues are caught early → Tasks: Add ESLint config, fix existing violations | Est: 2 SP
- Story 1.2: As a developer, I want binary artifacts removed from git so the repo is lightweight → Tasks: Add to `.gitignore`, move to GitHub Releases | Est: 1 SP
- Story 1.3: As a developer, I want the duplicate root-level files resolved so there is a single source of truth → Tasks: Audit root vs `www/` files, consolidate | Est: 2 SP

**Epic 2: Test Infrastructure**
- Story 2.1: As a developer, I want unit tests for StateManager so that data persistence is reliable → Tasks: Add Vitest, write StateManager tests | Est: 3 SP
- Story 2.2: As a developer, I want unit tests for Helpers so that utility functions are verified → Tasks: Write Helpers tests | Est: 2 SP
- Story 2.3: As a developer, I want Safe Mode threshold logic tested so that burnout detection is accurate → Tasks: Write Safe Mode calculation tests | Est: 2 SP

**Epic 3: Accessibility & i18n**
- Story 3.1: As a user with disabilities, I want keyboard navigation to work properly so I can use the app without a mouse → Tasks: Add focus indicators, fix tab order | Est: 3 SP
- Story 3.2: As a screen reader user, I want dynamic content announced so I know when state changes → Tasks: Add aria-live regions to toasts and Safe Mode banner | Est: 2 SP
- Story 3.3: As an Arabic-speaking user, I want the layout properly mirrored so the app is usable in RTL → Tasks: Add RTL CSS rules, test with `dir="rtl"` | Est: 3 SP

**Epic 4: Data Safety**
- Story 4.1: As a user, I want my data exported as JSON so I have a backup → Tasks: Verify existing export, add import validation | Est: 2 SP
- Story 4.2: As a user, I want to clear all my data easily so I maintain privacy → Tasks: Add "Delete All Data" with confirmation flow | Est: 1 SP

### 4.2 Prioritization Matrix

| Epic | RICE Score | MoSCoW | Effort | Phase | Files Affected |
|------|------------|--------|--------|-------|----------------|
| 1: Foundation | R:8 I:9 C:95% E:2 → 34 | Must | 5 SP | Sprint 0 | `.gitignore`, `package.json`, root files |
| 2: Test Infra | R:7 I:8 C:90% E:3 → 17 | Must | 7 SP | Sprint 1 | New `tests/` directory, `package.json` |
| 3: Accessibility | R:6 I:7 C:85% E:3 → 12 | Should | 8 SP | Sprint 2 | `studentflow_ultimate_pro.html`, CSS sections |
| 4: Data Safety | R:8 I:9 C:90% E:1 → 65 | Must | 3 SP | Sprint 1 | `storage.js`, `studentflow_ultimate_pro.html` |

### 4.3 Release Roadmap

**Sprint 0** (Foundation): Repository cleanup, `.gitignore` fixes, ESLint setup, file consolidation  
**Sprint 1** (Quality & Safety): Test infrastructure, StateManager tests, data export/import hardening  
**Sprint 2** (Accessibility): Keyboard navigation, ARIA labels, RTL support, contrast audit  
**Sprint 3** (Polish): Performance audit (Lighthouse), Service Worker improvements, documentation  
**Release**: Feature-flag gated; no breaking changes to existing users since all data is local

### 4.4 Definition of Done

- [ ] Unit tests >80% coverage for StateManager and Helpers (future implementation phase)
- [ ] A11y: Keyboard navigation + screen reader pass
- [ ] i18n: Strings extracted via `data-i18n`, RTL layout verified for Arabic
- [ ] Performance budget met (Lighthouse > 90, TTI < 3s on 3G)
- [ ] Security: Input validation (escapeHtml), no secrets in code
- [ ] QA checklist executed (see below)

**QA Checklist**:
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge (latest 2 versions)
- [ ] Mobile: iOS Safari, Android Chrome, Capacitor native apps
- [ ] Error states: LocalStorage full, offline mode, invalid journal input
- [ ] A11y: axe-core passes, logical tab order, screen reader walkthrough
- [ ] i18n: French, English, Arabic — text expansion and RTL verified
- [ ] Data: Export/import round-trip, migration from schema v0 to v1

---

## 5. Alignment Questions

1. **Scope Validation**: "The monolithic HTML file (8500+ lines) contains all UI, styles, and logic. Recommend extracting into modules with a build step (Vite). Confirm acceptable or maintain single-file architecture?" → **Recommended**: Accept build step for long-term maintainability.

2. **Technical Constraints**: "Capacitor is at v5.5.1; latest is v6.x. Can we upgrade Capacitor, or must we maintain backward compatibility with v5?" → **Recommended**: Upgrade to Capacitor 6 in Sprint 0 for latest security patches and plugin compatibility.

3. **Binary Artifacts**: "Three APK/AAB files (64 MB+) are committed to git. Move to GitHub Releases and add to `.gitignore`, or keep in repo for direct download?" → **Recommended**: Move to GitHub Releases; reduces clone size dramatically.

4. **UX Trade-off**: "Safe Mode currently shows a persistent top banner. Should this be a modal dialog for stronger intervention, or keep as dismissible banner?" → **Recommended**: Keep as banner for non-blocking UX; add optional escalation to modal if dismissed repeatedly.

5. **Privacy Stance**: "Wellness data (stress, sleep, mood) is stored in plaintext LocalStorage. Implement client-side encryption, or accept current state since data never leaves the device?" → **Recommended**: Accept for V1 since data is device-local; add optional encryption in V2 when cloud sync is introduced.

6. **Risk Appetite**: "If Epic 2 (Test Infrastructure) runs over, cut scope on test coverage targets or extend timeline?" → **Recommended**: Reduce coverage target to 60% for initial sprint; expand in subsequent sprints.

---

## 6. Risk Register

| # | Risk | Probability | Impact | Mitigation | Owner |
|---|------|-------------|--------|------------|-------|
| 1 | **Data loss from LocalStorage clearing** — Users lose all wellness data, journal entries, and timetable if browser data is cleared | High | High | Implement reliable JSON export with periodic auto-export reminders; add "Last backup" indicator in UI; eventual cloud sync in V2 | Product |
| 2 | **Monolith unmaintainability** — 8500-line single file makes collaboration, code review, and debugging increasingly difficult as features grow | High | Medium | Strangler fig migration: extract modules incrementally behind a build tool (Vite); maintain backward compatibility during transition | Engineering |
| 3 | **Zero test coverage leads to regressions** — Any code change risks breaking StateManager persistence, Safe Mode calculations, or gamification logic without detection | High | High | Prioritize unit tests for core modules (StateManager, Helpers, Safe Mode scoring) in Sprint 1; add CI gate requiring tests to pass | Engineering |
