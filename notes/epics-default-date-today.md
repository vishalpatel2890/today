# Epic: Default Date Today

**Epic ID:** default-date-today
**Type:** Bug Fix / UX Improvement
**Priority:** High
**Stories:** 1

---

## Overview

Fix the default date behavior when creating new tasks so they appear in the Today view instead of being routed to the Deferred view.

## Problem

When users add a new task via the quick-add input, the task is created with `deferredTo: null`. The auto-surface routing logic interprets null dates as "no date set" and routes these tasks to the Deferred view. This is counterintuitive since users expect new tasks to appear in the Today view where they created them.

## Solution

Set the default `deferredTo` value to today's date when creating new tasks. This ensures new tasks:
1. Immediately appear in the Today view
2. Match user expectations
3. Require no additional user action

## Stories

| ID | Title | Status |
|----|-------|--------|
| 1.1 | Set default task date to today | Draft |

## Technical Context

- **Tech Spec:** `notes/tech-spec-default-date-today.md`
- **Primary File:** `src/hooks/useTasks.ts`
- **Test File:** `src/hooks/useTasks.test.ts` (to create)

## Acceptance Criteria (Epic Level)

1. New tasks appear in Today view immediately after creation
2. New tasks remain in Today view after page refresh
3. No impact on existing tasks with null dates
4. All existing tests continue to pass
