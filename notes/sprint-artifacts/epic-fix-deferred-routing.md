# Epic: Fix Deferred Task Routing

**Epic Slug:** fix-deferred-routing
**Type:** Bug Fix
**Priority:** High
**Stories:** 1

---

## Goal

Fix the task routing logic so that tasks with future dates (beyond tomorrow) or no dates correctly appear in the Deferred view, regardless of whether they have a category assigned.

## Problem

Currently, tasks are incorrectly routed to the Today view when they:
1. Have a future date but no category
2. Have no date and no category
3. Have an invalid date and no category

The category field should not affect which view a task appears in - only the date should determine routing.

## Success Criteria

1. Tasks with future dates (beyond tomorrow) appear in Deferred view
2. Tasks with no date appear in Deferred view
3. Tasks with invalid dates appear in Deferred view
4. Today/Tomorrow/Overdue routing remains unchanged
5. Category has no effect on view routing

## Scope

**In Scope:**
- Fix `useAutoSurface.ts` hook logic
- Unit tests for the hook

**Out of Scope:**
- UI changes
- Backend changes
- New features

## Tech-Spec Reference

📄 [notes/tech-spec.md](../tech-spec.md)

---

## Story Map

```
Epic: Fix Deferred Task Routing
└── Story 1: Simplify Task Routing Logic (fix-deferred-routing-1)
    ├── Task 1: Update useAutoSurface.ts conditional logic
    ├── Task 2: Update inline comments
    └── Task 3: Add unit tests
```

---

## Implementation Sequence

| # | Story | Dependencies | Deliverable |
|---|-------|--------------|-------------|
| 1 | Simplify Task Routing Logic | None | Fixed routing, unit tests |

---

*Single-story epic - minimal structure*
