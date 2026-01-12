# Today - Epic Breakdown

**Author:** Vishal
**Date:** 2026-01-05
**Project Level:** MVP
**Target Scale:** Personal productivity app

---

## Overview

This document provides the complete epic and story breakdown for **Today**, decomposing the 30 functional requirements from the PRD into implementable stories organized by user value delivery.

**Context Incorporated:**
- PRD: 30 functional requirements (26 MVP + 4 Growth)
- UX Design: Slate Sophisticated theme, component specs, user journeys
- Architecture: React + Vite + Tailwind + Radix + localStorage

### Epic Summary

| Epic | Title | Stories | FRs Covered | User Value |
|------|-------|---------|-------------|------------|
| 1 | Foundation | 3 | Setup for all FRs | Project ready for development |
| 2 | Today's Tasks | 4 | FR1, FR2, FR3, FR14, FR28-30 | User can manage today's tasks |
| 3 | Deferment System | 5 | FR5-10, FR15-17, FR24-27 | User can defer and categorize tasks |
| 4 | Persistence & Polish | 4 | FR11-13, FR19-21 | Data persists, tasks auto-surface |

**Total:** 4 epics, 16 stories

---

## Functional Requirements Inventory

From PRD:

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

## FR Coverage Map

| FR | Epic | Story | Coverage |
|----|------|-------|----------|
| FR1 | Epic 2 | 2.2 | Add task |
| FR2 | Epic 2 | 2.3 | Complete task |
| FR3 | Epic 2 | 2.4 | Delete task |
| FR4 | - | - | Growth (not in MVP) |
| FR5 | Epic 3 | 3.2 | Defer to tomorrow |
| FR6 | Epic 3 | 3.2 | Defer to date |
| FR7 | Epic 3 | 3.2 | Defer indefinitely |
| FR8 | Epic 3 | 3.3 | Category assignment |
| FR9 | Epic 3 | 3.3 | Category dropdown |
| FR10 | Epic 3 | 3.3 | Create new category |
| FR11 | Epic 4 | 4.2 | Auto-surface today |
| FR12 | Epic 4 | 4.2 | Auto-surface tomorrow |
| FR13 | Epic 4 | 4.2 | Surfacing on load |
| FR14 | Epic 2 | 2.1 | Today view |
| FR15 | Epic 3 | 3.4 | Tomorrow view |
| FR16 | Epic 3 | 3.5 | Deferred view |
| FR17 | Epic 3 | 3.5 | Category sections |
| FR18 | - | - | Growth (not in MVP) |
| FR19 | Epic 4 | 4.1 | localStorage |
| FR20 | Epic 4 | 4.1 | Persistence |
| FR21 | Epic 4 | 4.1 | No auth |
| FR22 | - | - | Growth (not in MVP) |
| FR23 | - | - | Growth (not in MVP) |
| FR24 | Epic 3 | 3.3 | Category labels |
| FR25 | Epic 3 | 3.3 | Category at deferment |
| FR26 | Epic 3 | 3.3 | Category persistence |
| FR27 | Epic 3 | 3.3 | Empty category retention |
| FR28 | Epic 2 | 2.1 | Desktop responsive |
| FR29 | Epic 2 | 2.1 | Tablet responsive |
| FR30 | Epic 2 | 2.1 | Mobile responsive |

**Coverage:** 26/26 MVP FRs covered (4 Growth FRs deferred)

---

## Epic 1: Foundation

**Goal:** Establish the project foundation with all dependencies, design tokens, and core component structure so development can proceed smoothly.

**User Value:** Developers can start building immediately with a working dev environment and consistent styling.

**FRs Covered:** Infrastructure for all FRs

---

### Story 1.1: Project Initialization

As a **developer**,
I want **the project initialized with React, TypeScript, Vite, Tailwind, and Radix**,
So that **I have a working development environment with all dependencies**.

**Acceptance Criteria:**

**Given** a terminal in the project directory
**When** I run `npm run dev`
**Then** a development server starts at localhost:5173

**And** the page displays "Today" as the app title
**And** TypeScript compilation works without errors
**And** Tailwind utilities are applied correctly
**And** Hot module replacement (HMR) works on file save

**Prerequisites:** None (first story)

**Technical Notes:**
- Run: `npm create vite@latest today-app -- --template react-ts`
- Install: tailwindcss, postcss, autoprefixer, @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-popover, lucide-react, date-fns
- Configure tailwind.config.js with design tokens from UX spec
- Set up project structure per architecture.md

**Frontend Test Hint:** Open localhost:5173, see "Today" heading, verify page loads without console errors.

---

### Story 1.2: Design Tokens & Base Styling

As a **developer**,
I want **the Slate Sophisticated design tokens configured in Tailwind**,
So that **all components use consistent colors, typography, and spacing**.

**Acceptance Criteria:**

**Given** the Tailwind config is set up
**When** I use utility classes like `bg-surface`, `text-foreground`, `font-display`
**Then** they apply the correct values from the UX spec

**And** colors match: background (#f8fafc), surface (#ffffff), border (#e2e8f0)
**And** fonts load: Playfair Display, DM Sans, JetBrains Mono
**And** spacing scale uses 8px base unit

**Prerequisites:** Story 1.1

**Technical Notes:**
- Extend Tailwind theme in tailwind.config.js
- Add Google Fonts imports in index.html
- Create CSS variables in index.css for runtime access
- Test with a sample component showing all tokens

**Frontend Test Hint:** Create a test page showing color swatches, typography samples, and spacing examples.

---

### Story 1.3: Core Layout Structure

As a **user**,
I want **to see the app shell with header and tab bar**,
So that **I understand the app's basic navigation structure**.

**Acceptance Criteria:**

**Given** I open the app
**When** the page loads
**Then** I see:
  - App title "Today" in Playfair Display font (top left)
  - Current date (top right)
  - Tab bar with Today, Tomorrow, Deferred tabs
  - Today tab is selected by default
  - Empty content area below tabs

**And** clicking tabs switches the active tab visually
**And** the layout is centered with max-width 600px
**And** responsive: full-width on mobile, centered on desktop

**Prerequisites:** Story 1.2

**Technical Notes:**
- Create Header.tsx, TabBar.tsx components
- Use useState in App.tsx for active tab
- Tab styling per UX spec: active has white background, shadow-sm
- Mobile: tabs stretch full width

**Frontend Test Hint:** Open app, click each tab, verify visual state changes. Test on mobile viewport.

---

## Epic 2: Today's Tasks

**Goal:** Enable users to manage their today's tasks - the core value proposition of the app.

**User Value:** Users can add tasks, complete them, and delete them - the essential to-do functionality.

**FRs Covered:** FR1, FR2, FR3, FR14, FR28-30

---

### Story 2.1: Today View with Task List

As a **user**,
I want **to see my today's tasks in a clean list**,
So that **I know exactly what I need to focus on today**.

**Acceptance Criteria:**

**Given** I am on the Today tab
**When** I have tasks for today
**Then** I see each task as a white card with:
  - Circle checkbox on the left
  - Task text in DM Sans 16px
  - Subtle border (#e2e8f0)
  - 12px gap between cards

**And** when I have no tasks, I see:
  - "Nothing for today." message
  - "Add a task to get started." subtitle
  - Add task input below

**And** the view is responsive (full-width cards on mobile)

**Prerequisites:** Story 1.3

**Technical Notes:**
- Create TaskList.tsx and TaskCard.tsx components
- Create TodayView.tsx as container
- Use mock data initially: `[{id: '1', text: 'Sample task', ...}]`
- TaskCard shows checkbox + text + actions area (hidden for now)

**Frontend Test Hint:** Open app, verify task cards display. Clear mock data, verify empty state shows.

---

### Story 2.2: Add Task

As a **user**,
I want **to quickly add a new task by typing and pressing Enter**,
So that **I can capture tasks with minimal friction (<5 seconds)**.

**Acceptance Criteria:**

**Given** I am on the Today tab
**When** I focus on the "Add a task..." input
**Then** the dashed border becomes solid

**When** I type text and press Enter
**Then** a new task appears at the bottom of the list
**And** the input clears
**And** the new task has a subtle slide-in animation

**When** I press Enter with empty input
**Then** nothing happens (no error, no empty task)

**Prerequisites:** Story 2.1

**Technical Notes:**
- Create AddTaskInput.tsx component
- Use useTasks hook with ADD_TASK action
- Generate ID with crypto.randomUUID()
- Set createdAt to new Date().toISOString()
- New tasks: deferredTo = null, category = null

**Frontend Test Hint:** Type "Buy milk", press Enter, verify task appears. Try empty submit - nothing should happen.

---

### Story 2.3: Complete Task

As a **user**,
I want **to mark a task as done and see it disappear with satisfaction**,
So that **I feel progress and closure when completing tasks**.

**Acceptance Criteria:**

**Given** I see a task in the Today list
**When** I click the circle checkbox
**Then** it immediately fills with a green checkmark (#22c55e)
**And** after 300ms, the task gently fades out and slides left
**And** the task is removed from the list
**And** the task is saved with completedAt timestamp

**And** the completion feels calm, not celebratory (no confetti, no sounds)

**Prerequisites:** Story 2.2

**Technical Notes:**
- Add COMPLETE_TASK action to useTasks reducer
- Use CSS transition for fade-out (opacity: 0, transform: translateX(-20px))
- Set completedAt to new Date().toISOString()
- Completed tasks are excluded from all views (filtered out)

**Frontend Test Hint:** Click checkbox, watch animation, verify task disappears. Check console for state update.

---

### Story 2.4: Delete Task

As a **user**,
I want **to permanently delete a task I no longer need**,
So that **I can clean up tasks that are no longer relevant**.

**Acceptance Criteria:**

**Given** I hover over a task card
**When** I see the actions menu
**Then** a trash icon appears (only on hover, after the defer icon)

**When** I click the trash icon
**Then** a confirmation prompt appears: "Delete this task?"
**And** if I confirm, the task is immediately removed
**And** if I cancel, nothing happens

**And** on mobile, the delete icon is always visible (no hover)

**Prerequisites:** Story 2.3

**Technical Notes:**
- Add DELETE_TASK action to useTasks reducer
- Use window.confirm() for MVP (can upgrade to modal later)
- Task actions appear in task-actions div on hover
- Mobile: use media query to always show actions

**Frontend Test Hint:** Hover over task, click trash, confirm deletion. Verify task is gone.

---

## Epic 3: Deferment System

**Goal:** Enable the unique "defer-and-categorize" workflow that differentiates Today from other to-do apps.

**User Value:** Users can consciously push tasks to later with organized categorization, creating the intentional deferment experience.

**FRs Covered:** FR5-10, FR15-17, FR24-27

---

### Story 3.1: Defer Button on Task Cards

As a **user**,
I want **to see a defer button on each task**,
So that **I can initiate the deferment workflow**.

**Acceptance Criteria:**

**Given** I hover over a task card
**When** the actions area appears
**Then** I see a clock icon (defer button) before the trash icon

**When** I click the defer button
**Then** a modal opens (placeholder for now, shows "Defer Modal Coming Soon")

**And** on mobile, the defer button is always visible

**Prerequisites:** Story 2.4

**Technical Notes:**
- Add clock icon from Lucide (Clock)
- Create placeholder DeferModal.tsx with Radix Dialog
- Wire up button click to open modal
- Modal shows centered on desktop, bottom sheet on mobile

**Frontend Test Hint:** Hover task, click clock icon, verify modal opens. Test on mobile viewport.

---

### Story 3.2: Defer Modal - Date Selection

As a **user**,
I want **to choose when to defer a task (tomorrow, specific date, or no date)**,
So that **I can decide when to revisit the task**.

**Acceptance Criteria:**

**Given** the defer modal is open
**When** I see the "When?" section
**Then** I see three options: "Tomorrow", "Pick date", "No date"

**When** I click "Tomorrow"
**Then** that button becomes selected (dark background)

**When** I click "Pick date"
**Then** a calendar appears inline below the buttons
**And** I can select any future date

**When** I click "No date"
**Then** that option is selected (task will go to Deferred with no date)

**Prerequisites:** Story 3.1

**Technical Notes:**
- Create date selection UI in DeferModal
- Use Radix Popover for date picker
- Use date-fns for date formatting and comparison
- Store selected date in modal state

**Frontend Test Hint:** Open defer modal, click each date option, verify selection state. Pick a date from calendar.

---

### Story 3.3: Defer Modal - Category Selection & Creation

As a **user**,
I want **to assign a category when deferring a task**,
So that **my deferred tasks are organized and easy to find later**.

**Acceptance Criteria:**

**Given** the defer modal is open and date is selected
**When** I see the "Category" section
**Then** I see a dropdown with existing categories plus "Create new..."

**When** I click the dropdown
**Then** I see all previously created categories
**And** "Create new..." option at the bottom

**When** I select an existing category
**Then** that category is selected for the task

**When** I select "Create new..."
**Then** an input field appears
**And** I can type a new category name
**And** pressing Enter creates the category and selects it

**And** the "Defer" button is enabled only when date AND category are selected

**Prerequisites:** Story 3.2

**Technical Notes:**
- Use Radix Select for dropdown
- Categories stored in AppState.categories array
- New categories immediately added to array
- Validate: category name not empty, not duplicate

**Frontend Test Hint:** Open dropdown, verify existing categories show. Create new category, verify it appears in dropdown.

---

### Story 3.4: Defer Action & Tomorrow View

As a **user**,
I want **to confirm deferment and see the task move to the appropriate view**,
So that **I know my deferment was successful**.

**Acceptance Criteria:**

**Given** I have selected a date and category in the defer modal
**When** I click "Defer"
**Then** the modal closes
**And** the task slides out of the current view
**And** a toast appears: "Deferred to [Tomorrow/Jan 15/Someday] / [Category]"
**And** the toast auto-dismisses after 3 seconds

**When** I navigate to the Tomorrow tab
**Then** I see tasks deferred to tomorrow
**And** each task shows normally (same as Today view)

**Prerequisites:** Story 3.3

**Technical Notes:**
- Add DEFER_TASK action: set deferredTo, category
- Create Toast.tsx component (fixed bottom-center)
- Create TomorrowView.tsx (filter tasks where deferredTo === tomorrow)
- Tomorrow = add 1 day to today, use date-fns isTomorrow()

**Frontend Test Hint:** Defer a task to tomorrow, verify toast shows. Click Tomorrow tab, verify task appears there.

---

### Story 3.5: Deferred View with Categories

As a **user**,
I want **to see all my deferred tasks organized by category**,
So that **I can review what I've pushed back and find tasks easily**.

**Acceptance Criteria:**

**Given** I click the "Deferred" tab
**When** the view loads
**Then** I see tasks grouped under category headers

**And** each category header shows:
  - Chevron icon (down when expanded, right when collapsed)
  - Category name
  - Task count in parentheses

**When** I click a category header
**Then** it toggles expand/collapse
**And** first category is expanded by default

**And** tasks within each category show their deferred date (or "Someday")
**And** categories are sorted alphabetically

**Prerequisites:** Story 3.4

**Technical Notes:**
- Create DeferredView.tsx and CategorySection.tsx
- Group tasks by category
- Store expanded state locally (useState)
- Tasks without date show "Someday"
- Tasks with future dates show "Jan 15" format

**Frontend Test Hint:** Defer multiple tasks to different categories. Open Deferred tab, verify grouping and collapse/expand.

---

## Epic 4: Persistence & Polish

**Goal:** Ensure data persists across sessions and tasks automatically surface when their date arrives.

**User Value:** Users never lose their tasks, and deferred tasks magically appear in Today when ready.

**FRs Covered:** FR11-13, FR19-21

---

### Story 4.1: localStorage Persistence

As a **user**,
I want **my tasks to be saved automatically and persist across browser sessions**,
So that **I never lose my data**.

**Acceptance Criteria:**

**Given** I add, complete, defer, or delete tasks
**When** any change occurs
**Then** the entire state is saved to localStorage immediately

**When** I close the browser and reopen the app
**Then** all my tasks and categories are restored exactly as I left them

**And** data is stored under key 'today-app-state'
**And** if localStorage is full, a toast warns: "Storage full. Some data may not save."

**Prerequisites:** Story 3.5

**Technical Notes:**
- Create useLocalStorage hook
- Wrap useTasks to auto-persist on every dispatch
- On app load, read from localStorage and hydrate state
- Handle quota exceeded error gracefully

**Frontend Test Hint:** Add tasks, refresh page, verify tasks persist. Check localStorage in DevTools.

---

### Story 4.2: Auto-Surfacing

As a **user**,
I want **deferred tasks to automatically appear in Today when their date arrives**,
So that **I don't have to manually move them**.

**Acceptance Criteria:**

**Given** I have tasks deferred to a specific date
**When** I open the app on that date
**Then** those tasks appear in the Today view (not Deferred)

**And** tasks for tomorrow appear in Tomorrow view
**And** tasks for other future dates stay in Deferred view
**And** surfacing happens on initial app load

**Prerequisites:** Story 4.1

**Technical Notes:**
- Create useAutoSurface hook
- On mount, run SURFACE_TASKS action
- Compare task.deferredTo to current date using date-fns isToday(), isTomorrow()
- Update task dates are NOT changed - just filtered by views

**Frontend Test Hint:** Manually edit localStorage to set a task's deferredTo to today. Refresh, verify it shows in Today.

---

### Story 4.3: Toast Notifications

As a **user**,
I want **subtle feedback when actions complete**,
So that **I know my actions were successful without being interrupted**.

**Acceptance Criteria:**

**Given** I complete an action (defer, delete)
**When** the action succeeds
**Then** a toast appears at the bottom-center of the screen

**And** the toast shows a relevant message:
  - Defer: "Deferred to [date/category]"
  - Delete: "Task deleted"

**And** the toast auto-dismisses after 3 seconds
**And** the toast slides in from below, slides out to below
**And** multiple toasts stack (rare but handled)

**Prerequisites:** Story 4.2

**Technical Notes:**
- Enhance Toast.tsx with animation
- Use CSS transitions for slide in/out
- Create toast queue state for stacking
- Toast z-index above modal overlay

**Frontend Test Hint:** Defer a task, verify toast appears and auto-dismisses. Quickly defer two tasks, verify stacking.

---

### Story 4.4: Empty States Polish

As a **user**,
I want **friendly empty state messages throughout the app**,
So that **I know what to do when views are empty**.

**Acceptance Criteria:**

**Given** I am on the Today tab with no tasks
**When** I see the empty state
**Then** it shows:
  - "Nothing for today."
  - "Add a task to get started."
  - Add input is visible below

**Given** I am on the Tomorrow tab with no tasks
**Then** it shows: "Nothing planned for tomorrow."

**Given** I am on the Deferred tab with no tasks
**Then** it shows: "No deferred tasks. Everything is in Today or Tomorrow!"

**And** all empty state text uses muted-foreground color (#64748b)
**And** text is centered in the content area

**Prerequisites:** Story 4.3

**Technical Notes:**
- Add empty state components to each view
- Style with text-center, text-muted-foreground
- Empty states only show when view has 0 tasks

**Frontend Test Hint:** Complete/delete all tasks from each view, verify appropriate empty state shows.

---

## FR Coverage Matrix

| FR | Description | Epic | Story | Status |
|----|-------------|------|-------|--------|
| FR1 | Add task | 2 | 2.2 | MVP |
| FR2 | Complete task | 2 | 2.3 | MVP |
| FR3 | Delete task | 2 | 2.4 | MVP |
| FR4 | Edit task | - | - | Growth |
| FR5 | Defer to tomorrow | 3 | 3.4 | MVP |
| FR6 | Defer to date | 3 | 3.2 | MVP |
| FR7 | Defer indefinitely | 3 | 3.2 | MVP |
| FR8 | Category assignment | 3 | 3.3 | MVP |
| FR9 | Category dropdown | 3 | 3.3 | MVP |
| FR10 | Create new category | 3 | 3.3 | MVP |
| FR11 | Auto-surface today | 4 | 4.2 | MVP |
| FR12 | Auto-surface tomorrow | 4 | 4.2 | MVP |
| FR13 | Surfacing on load | 4 | 4.2 | MVP |
| FR14 | Today view | 2 | 2.1 | MVP |
| FR15 | Tomorrow view | 3 | 3.4 | MVP |
| FR16 | Deferred view | 3 | 3.5 | MVP |
| FR17 | Category sections | 3 | 3.5 | MVP |
| FR18 | Reorder tasks | - | - | Growth |
| FR19 | localStorage | 4 | 4.1 | MVP |
| FR20 | Persistence | 4 | 4.1 | MVP |
| FR21 | No auth | 4 | 4.1 | MVP |
| FR22 | Export data | - | - | Growth |
| FR23 | Import data | - | - | Growth |
| FR24 | Category labels | 3 | 3.3 | MVP |
| FR25 | Category at deferment | 3 | 3.3 | MVP |
| FR26 | Category persistence | 3 | 3.3 | MVP |
| FR27 | Empty category retention | 3 | 3.3 | MVP |
| FR28 | Desktop responsive | 2 | 2.1 | MVP |
| FR29 | Tablet responsive | 2 | 2.1 | MVP |
| FR30 | Mobile responsive | 2 | 2.1 | MVP |

**Coverage:** 26/26 MVP FRs covered | 4 Growth FRs deferred

---

## Summary

### Epic Breakdown

- **Epic 1: Foundation** (3 stories) - Project setup and design system
- **Epic 2: Today's Tasks** (4 stories) - Core task management
- **Epic 3: Deferment System** (5 stories) - Unique defer-and-categorize workflow
- **Epic 4: Persistence & Polish** (4 stories) - Data persistence and UX polish

### Total Stories: 16

### Context Incorporated

- PRD: All 26 MVP functional requirements mapped to stories
- UX Design: Slate Sophisticated theme, component specs, interaction patterns
- Architecture: React + Vite + Tailwind + Radix + localStorage tech stack

### Story Sizing

All stories are designed for single-session completion by one developer. Each story is:
- Vertically sliced (delivers complete functionality)
- Frontend-testable (human can verify in browser)
- Sequentially ordered (no forward dependencies)

---

_For implementation: Use the `/bmad:bmm:workflows:dev-story` workflow to generate individual story implementation plans from this epic breakdown._

---

## Epic 5: Production Deployment

**Goal:** Deploy the Today app to production at `productivity.pitchsmith.ai` using Cloudflare Pages (free tier).

**User Value:** Users can access the app on the web from any device.

**FRs Covered:** Infrastructure/Deployment (non-functional)

---

### Story 5.1: Initial Cloudflare Pages Deployment

As a **developer**,
I want **the app deployed to Cloudflare Pages**,
So that **it's accessible via a `.pages.dev` URL**.

**Acceptance Criteria:**

**Given** Wrangler CLI is installed and authenticated
**When** I run `npm run build && npx wrangler pages deploy dist`
**Then** the app is deployed to Cloudflare Pages
**And** I receive a `*.pages.dev` URL
**And** the app loads correctly at that URL

**Prerequisites:** Working local build

**Technical Notes:**
- Install: `npm install -g wrangler`
- Auth: `wrangler login`
- Deploy: `npx wrangler pages deploy dist --project-name=today-productivity`

**Full Story:** [story-deploy-1.md](./sprint-artifacts/story-deploy-1.md)

---

### Story 5.2: Configure Custom Domain

As a **product owner**,
I want **the app accessible at productivity.pitchsmith.ai**,
So that **users have a branded, memorable URL**.

**Acceptance Criteria:**

**Given** the app is deployed to Cloudflare Pages
**When** I configure the custom domain in Cloudflare dashboard
**Then** `productivity.pitchsmith.ai` points to the deployment
**And** SSL certificate is automatically provisioned
**And** HTTPS is enforced

**Prerequisites:** Story 5.1

**Technical Notes:**
- Cloudflare Dashboard → Pages → Custom Domains
- DNS is automatic (domain already on Cloudflare)

**Full Story:** [story-deploy-2.md](./sprint-artifacts/story-deploy-2.md)

---

### Story 5.3: Configure Environment Variables

As a **user**,
I want **full app functionality in production**,
So that **I can create and manage my tasks**.

**Acceptance Criteria:**

**Given** environment variables are configured in Cloudflare Pages
**When** I use the app at productivity.pitchsmith.ai
**Then** Supabase connection works
**And** I can create, complete, defer, and delete tasks
**And** data persists across sessions

**Prerequisites:** Story 5.2

**Technical Notes:**
- Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Cloudflare dashboard
- Redeploy after adding variables

**Full Story:** [story-deploy-3.md](./sprint-artifacts/story-deploy-3.md)

---

### Epic 5 Summary

| # | Story | Description | Status |
|---|-------|-------------|--------|
| 5.1 | Initial Deployment | Deploy to Cloudflare Pages | TODO |
| 5.2 | Custom Domain | Configure productivity.pitchsmith.ai | TODO |
| 5.3 | Environment Variables | Configure Supabase credentials | TODO |

**Total Cost:** $0/month (Cloudflare Pages free tier)

---

## Epic 6: Time Insights Modal Enhancement

**Goal:** Improve the Time Insights modal by widening it for better content display and adding a "Total" time card for weekly visibility.

**User Value:** Users can see their total weekly tracked time at a glance alongside existing metrics, with better visual spacing.

**FRs Covered:** UI Enhancement (non-functional improvement)

**Slug:** `insights-modal-update`

---

### Story 6.1: Widen Modal and Add Total Time Card

As a **user**,
I want **the Time Insights modal to be wider with a Total time card**,
So that **I can see my total weekly time alongside daily metrics with better visual spacing**.

**Acceptance Criteria:**

**AC #1:** Modal width is at least 30% wider on desktop (550px vs 420px)
**AC #2:** "Total" card displays as first card in the 3-card row
**AC #3:** "Total" card shows total time tracked this week (totalWeek)
**AC #4:** All 3 cards (Total, Today, Avg/Day) have equal width in grid
**AC #5:** Mobile layout remains unchanged (full-width bottom sheet)
**AC #6:** Loading state shows skeleton for all 3 cards
**AC #7:** Existing tests continue to pass

**Prerequisites:** None (standalone enhancement)

**Technical Notes:**
- Change `md:max-w-[420px]` to `md:max-w-[550px]` (line 298)
- Change `grid-cols-2 gap-4` to `grid-cols-3 gap-3` (line 399)
- Add InsightCard with `totalWeek` from existing `useTimeInsights` hook
- No hook changes needed - `totalWeek` already calculated

**Full Story:** [story-insights-modal-update-1.md](./sprint-artifacts/story-insights-modal-update-1.md)

---

### Epic 6 Summary

| # | Story | Description | Status |
|---|-------|-------------|--------|
| 6.1 | Widen Modal + Total Card | Increase width 30%, add Total time card | TODO |

**Total Stories:** 1
**Estimated Effort:** 1 story point
