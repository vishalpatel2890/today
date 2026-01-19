# Today - Time Tracking Feature PRD

**Author:** Vishal
**Date:** 2026-01-10
**Version:** 1.0
**Feature Type:** Hidden Power-User Feature

---

## Executive Summary

Time Tracking is a hidden power-user feature that enables productivity enthusiasts and freelancers to track time spent on tasks with minimal friction. Activated via keyboard shortcuts, it provides a distraction-free way to log billable hours and discover patterns in how time is spent—all while preserving the app's minimalist aesthetic.

### What Makes This Special

**The Easter Egg Philosophy**: This feature rewards curious, keyboard-savvy users with powerful functionality they'll feel they "discovered." It's not buried in menus or announced with fanfare—it's a delightful secret that transforms Today from a simple task manager into a personal productivity intelligence tool.

**Dual Value Proposition**:
1. **For Freelancers**: Finally, a frictionless way to track billable time without context-switching to separate time-tracking apps
2. **For Optimizers**: Data-driven insights that reveal patterns invisible to conscious perception—where does time actually go?

---

## Project Classification

**Technical Type:** Web App (PWA Feature Addition)
**Domain:** General (Productivity)
**Complexity:** Low

This is a feature addition to an existing PWA task management application. No regulatory compliance, sensitive data handling, or complex integrations required. The feature operates entirely within the existing task data model with local-first storage.

---

## Success Criteria

### User Success
- **Discovery Delight**: Users who find the feature feel rewarded, not frustrated by hidden functionality
- **Zero Friction**: Starting/stopping tracking takes < 2 seconds via keyboard
- **Actionable Insights**: Users identify at least one time-usage pattern they weren't aware of within the first week
- **Billable Confidence**: Freelancers can generate accurate time reports for client billing

### Product Success
- **Retention Signal**: Users who discover time tracking show higher engagement with the app overall
- **Power User Graduation**: Feature acts as gateway to deeper product investment
- **No UI Clutter**: Feature existence is invisible to users who don't use it

### Anti-Goals (What We're NOT Optimizing For)
- Mass adoption - this is intentionally for power users
- Feature discoverability - hidden by design
- Complex project/client management - keep it simple

---

## Product Scope

### MVP - Minimum Viable Product

**Core Tracking Flow:**
- `Cmd+Shift+T` opens compact tracking modal
- Modal displays dropdown of today's tasks (from existing task data)
- User selects task and clicks "Track" to start timer
- Modal closes, tracking runs in background
- `Cmd+Shift+T` again shows current tracking status with elapsed time
- "Stop" button ends tracking session and saves time entry
- Modal resets to initial state after stopping

**Basic Insights View:**
- `Cmd+Shift+T T` (double-tap T while holding modifiers) opens insights modal
- Shows time tracked today with breakdown by task
- Shows time tracked this week with daily totals
- Simple list view of recent time entries

**Insights Filtering (MVP):**
- Quick date filters: Today, Yesterday, This Week, This Month, Custom date range
- Task filter: Filter insights to specific tasks via dropdown
- Category filter: Filter by task category (leverages existing categories)
- Active filters shown as removable chips
- All summary metrics and lists update based on active filters

**Data Persistence:**
- Time entries stored locally (IndexedDB, consistent with app's local-first architecture)
- Each entry: task_id, start_time, end_time, duration, date

### Growth Features (Post-MVP)

**Enhanced Insights:**
- Category/tag-based time aggregation (leverage existing task categories)
- Weekly/monthly trend charts
- "Peak productivity hours" analysis
- Task completion vs. time correlation

**Freelancer Features:**
- Mark time entries as "billable" vs "non-billable"
- Export time report (CSV/PDF) for client billing
- Hourly rate setting for automatic invoice calculations
- Client/project tagging for time entries

**Tracking Enhancements:**
- Manual time entry editing (adjust start/end times)
- Split time entries across multiple tasks
- Pomodoro-style timer option
- Break time tracking

### Vision (Future)

**Intelligence Layer:**
- AI-powered insights: "You're most productive on Tuesdays between 9-11am"
- Anomaly detection: "You spent 3x longer on admin tasks this week"
- Predictive estimates: "Based on patterns, this task type typically takes you 45 minutes"
- Smart suggestions: "Consider batching similar tasks - you context-switch 23 times daily"

**Integration Possibilities:**
- Calendar sync for automatic time blocking
- Invoice generation integration
- Team time tracking (if Today ever expands to teams)

---

## User Experience Principles

### Design Philosophy
- **Invisible Until Needed**: No UI hints, menu items, or settings visible to non-users
- **Keyboard-Native**: Every action achievable without mouse
- **Contextually Minimal**: Show only relevant information at each moment
- **Non-Intrusive Tracking**: No persistent timers or status bars cluttering the main UI

### Visual Personality
- Match existing Today aesthetic: clean, minimal, focused
- Modals should feel like natural extensions, not bolted-on features
- Use subtle animations for state transitions (tracking start/stop)
- Dark mode compatible

### Key Interactions

**Tracking Modal States:**
1. **Idle State**: Task dropdown + "Track" button
2. **Active State**: Current task name + elapsed time + "Stop" button
3. **Transition**: Brief success feedback on stop, then reset to idle

**Insights Modal:**
- Single scrollable view (not tabbed complexity)
- Scannable at a glance - key numbers prominent
- Drill-down available but not required

### Hotkey Design
| Action | Shortcut | Rationale |
|--------|----------|-----------|
| Open/Toggle Tracking Modal | `Cmd+Shift+T` | T for Track/Time, Shift modifier avoids conflicts |
| Open Insights | `Cmd+Shift+T T` | Double-tap pattern for "deeper" action |

**Implementation Note:** Double-tap detection requires tracking keypress timing. If implementation proves unreliable, fallback to `Cmd+Shift+I` (I for Insights).

---

## Functional Requirements

### Time Tracking Core

- **FR1**: Users can open the tracking modal via `Cmd+Shift+T` keyboard shortcut
- **FR2**: Users can see a dropdown list of today's tasks in the tracking modal
- **FR3**: Users can select a task from the dropdown and start tracking time
- **FR4**: System tracks elapsed time in the background after modal closes
- **FR5**: Users can reopen the tracking modal to see current tracking status and elapsed time
- **FR6**: Users can stop active time tracking via the modal
- **FR7**: System saves completed time entries with task association, start time, end time, and duration
- **FR8**: Tracking modal resets to idle state after stopping a session

### Time Entry Management

- **FR9**: System persists all time entries locally using IndexedDB
- **FR10**: Time entries maintain referential integrity with associated tasks
- **FR11**: System handles edge case of tracked task being deleted (preserve time entry with task name snapshot)
- **FR12**: Users can track time for the same task multiple times (creates separate entries)

### Insights View

- **FR13**: Users can open the insights view via `Cmd+Shift+T T` keyboard shortcut
- **FR14**: Users can view total time tracked today
- **FR15**: Users can view time breakdown by individual tasks for today
- **FR16**: Users can view total time tracked for the current week
- **FR17**: Users can view daily totals for the current week
- **FR18**: Users can view a chronological list of recent time entries
- **FR19**: Users can close insights modal and return to main app

### Insights Filtering (MVP)

- **FR20**: Users can filter insights by quick date presets (Today, Yesterday, This Week, This Month)
- **FR21**: Users can select a custom date range for filtering insights
- **FR22**: Users can filter insights to show only specific tasks via dropdown
- **FR23**: Users can filter insights by task category via dropdown
- **FR24**: System displays active filters as removable chips below filter controls
- **FR25**: Users can remove individual filters by clicking the × on filter chips
- **FR26**: All summary metrics (totals, averages) recalculate based on active filters
- **FR27**: Task breakdown list updates to show only filtered results
- **FR28**: Recent entries list updates to show only filtered results
- **FR29**: Filter state persists within the modal session (resets on close)

### Productivity Insights (Growth)

- **FR30**: Users can view time aggregated by task category/tag
- **FR31**: Users can view weekly and monthly trend visualizations
- **FR32**: Users can identify their peak productivity hours based on tracking patterns
- **FR33**: Users can see correlation between time tracked and task completion rates
- **FR34**: System calculates and displays average time per task category

### Freelancer Features (Growth)

- **FR35**: Users can mark individual time entries as billable or non-billable
- **FR36**: Users can set an hourly rate for billable calculations
- **FR37**: Users can export time data as CSV for a selected date range
- **FR38**: Users can export a formatted time report as PDF
- **FR39**: Users can tag time entries with client/project identifiers
- **FR40**: Users can filter insights by client/project

### Tracking Enhancements (Growth)

- **FR41**: Users can manually edit time entry start and end times
- **FR42**: Users can delete erroneous time entries
- **FR43**: Users can add notes/descriptions to time entries

### Data & State

- **FR44**: Time tracking state persists across browser refresh (active timer continues)
- **FR45**: System syncs time entries via existing sync mechanism (if sync is enabled)
- **FR46**: Users can access time tracking functionality offline
- **FR47**: Time entry data participates in app's export/backup functionality

---

## Non-Functional Requirements

### Performance

- **NFR1**: Tracking modal opens within 100ms of keyboard shortcut
- **NFR2**: Active timer updates display every second without UI jank
- **NFR3**: Insights calculations complete within 500ms for up to 1 year of data
- **NFR4**: Background time tracking has negligible battery/CPU impact

### Security

- **NFR5**: Time data stored locally follows same security model as task data
- **NFR6**: Exported reports contain no sensitive metadata beyond user's own time data

### Reliability

- **NFR7**: Active tracking persists through app backgrounding/foregrounding
- **NFR8**: No time data loss on unexpected app termination (periodic checkpoint saves)
- **NFR9**: Timer accuracy within ±1 second over extended tracking sessions

### Accessibility

- **NFR10**: All modal interactions accessible via keyboard
- **NFR11**: Screen reader announces tracking state changes
- **NFR12**: Sufficient color contrast in time displays

---

## Productivity Insights - Detailed Brainstorm

This section explores insights that can genuinely help users work smarter.

### Tier 1: Foundational Insights (MVP-adjacent)

| Insight | What It Shows | Why It Helps |
|---------|---------------|--------------|
| **Daily Time Summary** | Total tracked time today vs. target | Reality check on actual productive hours |
| **Task Time Breakdown** | Time per task as list/simple chart | See where attention actually went |
| **Weekly Overview** | Day-by-day totals for the week | Spot inconsistency patterns |
| **Recent Entries Log** | Chronological time entry list | Audit trail for billing |

### Tier 2: Pattern Recognition (Growth)

| Insight | What It Shows | Why It Helps |
|---------|---------------|--------------|
| **Peak Hours Heatmap** | Which hours you track most time | Schedule important work during peak focus |
| **Day-of-Week Patterns** | Average productivity by weekday | Plan your week around natural rhythms |
| **Category Distribution** | Time % across task categories | Balance deep work vs. admin vs. meetings |
| **Session Duration Trends** | Average session length over time | Detect focus span changes |
| **Time-to-Completion** | Avg time spent on completed vs. incomplete tasks | Identify tasks that stall |

### Tier 3: Actionable Intelligence (Vision)

| Insight | What It Shows | Why It Helps |
|---------|---------------|--------------|
| **Context Switch Score** | How often you switch between task types | Reduce costly mental gear-shifting |
| **Estimation Accuracy** | Compare estimated vs. actual time (if estimates exist) | Improve future planning |
| **Streak Tracker** | Consecutive days with tracked time | Gamify consistency |
| **Focus Blocks** | Identify uninterrupted work periods | Protect and replicate them |
| **Diminishing Returns Alert** | Flag sessions exceeding optimal duration | Know when to take breaks |
| **Similar Task Comparison** | Time patterns for same-category tasks | Set realistic expectations |

### Tier 4: Freelancer-Specific Insights

| Insight | What It Shows | Why It Helps |
|---------|---------------|--------------|
| **Billable Ratio** | Billable vs. non-billable time % | Maximize revenue-generating hours |
| **Client Time Distribution** | Time breakdown by client/project | Identify over/under-serviced clients |
| **Effective Hourly Rate** | Total earnings ÷ total time (including non-billable) | True profitability picture |
| **Invoice Preview** | Billable hours ready for invoicing | One-click billing prep |
| **Utilization Rate** | Tracked time vs. available hours | Measure capacity usage |

### Insight Presentation Principles

1. **Lead with the Number**: Show the key metric prominently, explanation secondary
2. **Comparative Context**: "3.5 hours today" is less useful than "3.5 hours (↑ 20% vs. your average)"
3. **Actionable Framing**: Not just "you work most at 10am" but "Consider scheduling deep work between 9-11am"
4. **Progressive Disclosure**: Summary first, details on demand
5. **Avoid Data Overload**: Curate insights, don't dump all metrics

---

## Summary

| Metric | Count |
|--------|-------|
| **Functional Requirements** | 47 |
| **Non-Functional Requirements** | 12 |
| **MVP Features** | Core tracking + Basic insights + Filtering |
| **Growth Features** | Enhanced insights + Freelancer tools |

### Product Value Summary

Time Tracking transforms Today from a task list into a personal productivity intelligence system. By keeping it hidden, we preserve the minimalist experience for casual users while rewarding power users with genuinely useful functionality. The dual focus on pattern optimization and billable tracking serves both productivity enthusiasts and freelancers—two audiences that often overlap.

---

_This PRD captures the essence of Today's Time Tracking feature - a delightful hidden tool that helps users understand and optimize how they spend their time._

_Created through collaborative discovery between Vishal and AI facilitator._
