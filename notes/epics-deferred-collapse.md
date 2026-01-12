# Today - Epic Breakdown

**Date:** 2026-01-12
**Project Level:** Quick-flow (1 story)

---

## Epic 1: Deferred View Collapse Enhancement

**Slug:** deferred-collapse

### Goal

Improve the Deferred view UX by having all categories collapsed by default and adding a keyboard shortcut to toggle all categories at once.

### Scope

- Change default collapsed state for categories
- Add Cmd+Opt+A / Ctrl+Alt+A hotkey for toggle-all
- Hotkey only active on Deferred tab
- Smart toggle logic

### Success Criteria

- All categories collapsed when Deferred view loads
- Keyboard shortcut toggles all categories expand/collapse
- Hotkey respects active tab and input field focus

### Dependencies

None - self-contained UI enhancement

---

## Story Map - Epic 1

```
Epic: Deferred View Collapse Enhancement
└── Story 1.1: Default Collapse + Toggle All Hotkey
    ├── Task: Remove first-expanded useEffect
    ├── Task: Add toggleAllCategories callback
    ├── Task: Create useDeferredViewHotkeys hook
    ├── Task: Write hook unit tests
    └── Task: Integrate in App.tsx
```

---

## Stories - Epic 1

### Story 1.1: Default Collapse with Toggle-All Hotkey

As a **user viewing deferred tasks**,
I want **all categories collapsed by default and a hotkey to expand/collapse all**,
So that **I can see a clean overview and quickly expand everything when needed**.

**Acceptance Criteria:**

**AC1: Default Collapsed**
- **Given** the app loads with deferred tasks
- **When** I navigate to the Deferred tab
- **Then** all category sections are collapsed (none expanded)

**AC2: Toggle All Hotkey (Mac)**
- **Given** I am on the Deferred tab with categories
- **When** I press Cmd+Opt+A
- **Then** all categories toggle (expand if collapsed, collapse if any expanded)

**AC3: Toggle All Hotkey (Windows)**
- **Given** I am on the Deferred tab with categories
- **When** I press Ctrl+Alt+A
- **Then** all categories toggle (expand if collapsed, collapse if any expanded)

**AC4: Smart Toggle Logic**
- **Given** one or more categories are expanded
- **When** I press the toggle hotkey
- **Then** all categories collapse
- **And** pressing the hotkey again expands all categories

**AC5: Tab Scope**
- **Given** I am on the Today or Tomorrow tab
- **When** I press Cmd+Opt+A
- **Then** nothing happens (hotkey only works on Deferred tab)

**AC6: Input Field Exclusion**
- **Given** I am on the Deferred tab with focus in an input field
- **When** I press Cmd+Opt+A
- **Then** the hotkey is not triggered (allows normal typing)

**Prerequisites:** None

**Technical Notes:** See tech-spec-deferred-collapse.md for full implementation details

---

## Implementation Timeline - Epic 1

**Total Stories:** 1

**Ready for Development:** Yes - tech-spec provides complete context
