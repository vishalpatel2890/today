# Today - Product Requirements Document

**Author:** Vishal
**Date:** 2026-01-05
**Version:** 1.0

---

## Executive Summary

**Today** is a minimalist to-do app built on a simple philosophy: *you can only do what you can do today*. Rather than overwhelming users with endless task lists, Today surfaces only what matters right now - today's tasks - with everything else consciously deferred to tomorrow, a future date, or a categorized "someday" bucket.

The app embraces a local-first architecture, storing all data in a JSON file on the user's device. No accounts, no sync complexity, no privacy concerns - just a focused tool for managing daily intentions.

### What Makes This Special

**Intentional Deferment as a Core Workflow.** Unlike traditional to-do apps where categorization happens at task creation, Today flips this: categorization happens at *deferment*. When you decide something doesn't belong in your today, you consciously push it forward and decide what bucket it belongs to. This creates a natural review moment and keeps your deferred list organized without upfront overhead.

**Today-First Visibility.** The main screen shows only today. Tomorrow and Deferred are accessible but discreet - reducing cognitive load and the anxiety of seeing everything you've ever added.

---

## Project Classification

**Technical Type:** Web App
**Domain:** General Productivity
**Complexity:** Low

This is a single-page web application (SPA) focused on personal productivity. No complex regulatory requirements, no multi-user collaboration, no backend infrastructure. The simplicity is intentional - the product's value comes from constraints, not features.

---

## Success Criteria

Success for **Today** is measured by whether it delivers on its core promise: *reducing the mental burden of task management*.

**Primary Success Indicators:**

1. **Daily Return** - Users open the app each morning as part of their routine, not out of guilt but because it genuinely helps them focus
2. **Deferment Workflow Adoption** - Users actively use the defer mechanism rather than just deleting or ignoring tasks; the categorized Deferred tab becomes a trusted "parking lot"
3. **Completion Confidence** - Users end their day having completed most/all of their Today list, feeling a sense of closure rather than perpetual incompleteness
4. **Minimal Friction** - Adding a task takes <5 seconds; deferring takes <3 seconds; the app never gets in the way

**Anti-Success Patterns (what we're avoiding):**

- Users feeling guilty when opening the app (too much visible)
- Deferred tab becoming a graveyard of forgotten tasks
- Users abandoning the app for something "simpler"
- Feature requests for complexity (reminders, subtasks, integrations) - if users ask for these, we've attracted the wrong audience

---

## Product Scope

### MVP - Minimum Viable Product

The MVP must deliver the core "today-first" experience with functional deferment.

**Core Views:**
- **Today** (main screen) - Shows only tasks dated today; clean, minimal interface
- **Tomorrow** (discreet tab) - Shows tasks dated tomorrow
- **Deferred** (discreet tab) - Shows all other tasks, organized by category

**Task Management:**
- Add a task (quick text entry, defaults to Today)
- Complete a task (mark done, visual feedback, remove from view)
- Delete a task (permanent removal)
- Defer a task from any view:
  - Defer to tomorrow
  - Defer to specific date (date picker)
  - Defer indefinitely (no date → goes to Deferred tab)
- Category assignment at deferment (dropdown of existing + "add new" option)

**Auto-Surfacing:**
- Tasks automatically appear in Today view when their deferred date matches today
- Tasks automatically appear in Tomorrow view when their date is tomorrow

**Data Persistence:**
- All data stored locally in JSON format
- Data survives browser refresh and close
- No user accounts, no server

### Growth Features (Post-MVP)

- **PWA Support** - Installable on desktop/mobile, works offline
- **Keyboard Shortcuts** - Power users can fly (n: new, d: defer, Enter: complete)
- **Dark Mode** - Respect system preference or manual toggle
- **Data Export/Import** - JSON backup and restore
- **Edit Task** - Modify task text after creation
- **Reorder Tasks** - Drag to prioritize within Today view

### Vision (Future)

- **Native Mobile Apps** - iOS/Android for true mobile experience
- **Optional Cloud Sync** - Opt-in only, local-first remains default
- **Gentle Nudges** - Surface tasks that have been deferred repeatedly ("This has been deferred 5 times...")
- **Daily Review Prompt** - Optional evening check-in to prep tomorrow

---

## Web App Specific Requirements

### Browser Support

| Browser | Minimum Version | Priority |
|---------|----------------|----------|
| Chrome | Latest 2 versions | Primary |
| Firefox | Latest 2 versions | Primary |
| Safari | Latest 2 versions | Primary |
| Edge | Latest 2 versions | Primary |

No support required for Internet Explorer or legacy browsers.

### Responsive Design

The app must be fully functional across device sizes:

- **Desktop** (1024px+) - Full experience, comfortable task management
- **Tablet** (768px - 1023px) - Adapted layout, touch-friendly
- **Mobile** (< 768px) - Optimized for thumb-friendly interaction, simplified navigation

The Today view should feel native on mobile - quick add, easy defer, minimal scrolling for typical daily task counts.

### Performance Targets

- **Initial Load** - < 2 seconds on 3G connection
- **Interaction Response** - < 100ms for all user actions
- **Storage** - Efficient JSON structure, minimal footprint

---

## User Experience Principles

**Visual Philosophy: Minimal Paper**

Today adopts the "Slate Sophisticated" design language - clean, paper-like surfaces on a subtle gray background. The aesthetic is refined and calming, reducing visual noise to let tasks breathe.

**Design Tokens (Reference):**
- **Background:** `#f8fafc` (light slate gray)
- **Surface/Cards:** `#ffffff` (white paper)
- **Borders:** `#e2e8f0` (subtle slate)
- **Text:** `#0f172a` (dark slate)
- **Muted text:** `#64748b` (medium slate)

**Typography:**
- **Display:** Playfair Display (serif) - section headers, app title
- **Body:** DM Sans (clean sans-serif) - task text, UI elements
- **Mono:** JetBrains Mono - counts, dates

**UX Principles:**

1. **Calm over busy** - No competing colors, no visual noise. The focus is the task text.
2. **Paper metaphor** - White cards on light gray, subtle shadows, like sticky notes on a desk
3. **Generous spacing** - Tasks have room to breathe; never cramped
4. **Subtle interactions** - Hover states are gentle (slight lift, border change), not flashy
5. **Typography hierarchy** - Playfair for headings adds warmth without being playful

### Key Interactions

| Action | Interaction | Feedback |
|--------|-------------|----------|
| Complete task | Click/tap checkbox | Gentle fade out (300ms), satisfying but not celebratory |
| Add task | Type + Enter | Task appears at bottom of Today list, subtle slide-in |
| Defer task | Click defer button → modal | Modal with date picker + category dropdown |
| Switch tabs | Click tab | Instant content swap, no animation |
| Delete task | Swipe or click delete | Confirm prompt, then immediate removal |

---

## Functional Requirements

### Task Management

- **FR1:** Users can add a new task by entering text; new tasks default to the Today view
- **FR2:** Users can mark a task as complete; completed tasks are removed from view
- **FR3:** Users can delete a task permanently
- **FR4:** Users can edit task text after creation (Growth)

### Deferment System

- **FR5:** Users can defer any task to tomorrow (moves to Tomorrow view)
- **FR6:** Users can defer any task to a specific future date via date picker
- **FR7:** Users can defer any task indefinitely (no date; moves to Deferred view)
- **FR8:** When deferring, users must assign a category from existing categories or create a new one
- **FR9:** Category selection presents a dropdown of existing categories plus an "Add new" option
- **FR10:** New categories created during deferment are immediately available for future use

### Auto-Surfacing

- **FR11:** Tasks with a deferred date matching today automatically appear in the Today view
- **FR12:** Tasks with a deferred date matching tomorrow automatically appear in the Tomorrow view
- **FR13:** Date-based surfacing occurs on app load and at midnight (if app is open)

### Views & Navigation

- **FR14:** The Today view is the default/main screen showing only tasks dated today
- **FR15:** The Tomorrow view is accessible via a discreet tab, showing only tasks dated tomorrow
- **FR16:** The Deferred view is accessible via a discreet tab, showing all tasks without a date or with future dates beyond tomorrow
- **FR17:** The Deferred view organizes tasks by category with collapsible sections
- **FR18:** Users can reorder tasks within the Today view via drag-and-drop (Growth)

### Data & Persistence

- **FR19:** All task data is stored locally in JSON format on the user's device
- **FR20:** Task data persists across browser sessions (survives refresh, close, reopen)
- **FR21:** No user accounts or authentication are required
- **FR22:** Users can export all data as a JSON file (Growth)
- **FR23:** Users can import previously exported JSON data (Growth)

### Categories

- **FR24:** Categories are user-defined text labels
- **FR25:** Categories are created at the moment of deferment (not at task creation)
- **FR26:** The system maintains a list of all categories ever created for reuse
- **FR27:** Empty categories (no tasks) remain available for future use

### Responsive Experience

- **FR28:** The app is fully functional on desktop browsers (1024px+)
- **FR29:** The app is fully functional on tablet browsers (768px - 1023px)
- **FR30:** The app is fully functional on mobile browsers (< 768px) with touch-optimized interactions

---

## Non-Functional Requirements

### Performance

| Metric | Target | Rationale |
|--------|--------|-----------|
| Initial load | < 2s on 3G | App should feel instant on any connection |
| Interaction response | < 100ms | Task actions must feel immediate |
| Time to interactive | < 1.5s | User can start adding tasks quickly |
| Storage efficiency | < 1KB per 100 tasks | JSON should be compact |

### Data Integrity

- **NFR1:** Task data must never be lost due to app crashes or unexpected closures
- **NFR2:** Data writes must be atomic - no partial saves that corrupt state
- **NFR3:** Date calculations must correctly handle timezone and daylight saving transitions

### Privacy

- **NFR4:** All data remains on user's device; no telemetry or analytics sent externally
- **NFR5:** No third-party scripts or tracking pixels
- **NFR6:** App functions fully offline after initial load (Growth: PWA)

---

## PRD Summary

| Attribute | Value |
|-----------|-------|
| **Functional Requirements** | 30 (26 MVP + 4 Growth) |
| **Non-Functional Requirements** | 6 |
| **Project Type** | Web App (SPA) |
| **Domain** | General Productivity |
| **Complexity** | Low |
| **Data Strategy** | Local-first (JSON) |

---

_This PRD captures the essence of **Today** - a minimalist to-do app that reduces cognitive load by showing only what matters right now, with an intentional deferment workflow that organizes your "someday" without upfront overhead._

_Created through collaborative discovery between Vishal and AI facilitator._
