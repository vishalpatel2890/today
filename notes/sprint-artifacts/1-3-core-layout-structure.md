# Story 1.3: Core Layout Structure

Status: done

## Story

As a **user**,
I want **to see the app shell with header and tab bar**,
so that **I understand the app's basic navigation structure**.

## Acceptance Criteria

1. **AC-1.3.1**: Header displays "Today" in Playfair Display font (24px, weight 500) on the left
2. **AC-1.3.2**: Header displays current date (e.g., "January 5") on the right
3. **AC-1.3.3**: Tab bar shows three tabs: Today, Tomorrow, Deferred
4. **AC-1.3.4**: Today tab is selected by default (visually indicated with white background and shadow)
5. **AC-1.3.5**: Clicking a tab changes the visual selection to that tab
6. **AC-1.3.6**: Content container is centered with max-width 600px on desktop
7. **AC-1.3.7**: On mobile (< 768px), layout is full-width with appropriate padding
8. **AC-1.3.8**: Empty content area shows below tabs (placeholder for views)

## Frontend Test Gate

**Gate ID**: 1-3-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Browser with DevTools available
- [ ] Starting state: Design tokens configured from Story 1.2

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open localhost:5173 | Browser address bar | Page loads with header, tab bar, and content area visible |
| 2 | Inspect "Today" heading | Header (top left) | Text "Today" in Playfair Display, 24px, weight 500 |
| 3 | Look at current date | Header (top right) | Today's date displayed (e.g., "January 6") |
| 4 | View tab bar | Below header | Three tabs: Today, Tomorrow, Deferred |
| 5 | Observe Today tab | Tab bar | Today tab has white background, subtle shadow (selected state) |
| 6 | Click "Tomorrow" tab | Tab bar | Tomorrow tab becomes selected, Today deselected |
| 7 | Click "Deferred" tab | Tab bar | Deferred tab becomes selected, Tomorrow deselected |
| 8 | Resize browser to < 768px | Browser window | Layout adapts: full-width, appropriate padding |
| 9 | Resize browser to > 1024px | Browser window | Content centered, max-width 600px |
| 10 | Observe content area | Below tab bar | Empty placeholder visible for current tab |

### Success Criteria (What User Sees)
- [ ] "Today" heading displays in elegant serif font (Playfair Display)
- [ ] Current date visible on the right side of header
- [ ] Three tabs clearly visible and distinguishable
- [ ] Active tab has distinct visual state (white bg, shadow)
- [ ] Tab clicks respond immediately with visual feedback
- [ ] Layout is centered on desktop (600px max-width)
- [ ] Layout is full-width on mobile with proper padding
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you identify which tab is currently selected at a glance?
2. Does the header feel balanced with title on left and date on right?
3. Is the tab switching responsive (<100ms feedback)?
4. Does the mobile layout feel appropriately adapted?

## Tasks / Subtasks

- [x] **Task 1: Create Header Component** (AC: 1, 2)
  - [x] Create `today-app/src/components/Header.tsx` component
  - [x] Display "Today" title using `font-display` (Playfair Display), text-2xl, font-medium
  - [x] Display current date using `date-fns` format: "MMMM d" (e.g., "January 6")
  - [x] Use flexbox with justify-between for left/right alignment
  - [x] Apply design tokens: text-foreground for title, text-muted-foreground for date
  - [x] Use named export pattern: `export const Header = () => { ... }`

- [x] **Task 2: Create TabBar Component** (AC: 3, 4, 5)
  - [x] Create `today-app/src/components/TabBar.tsx` component
  - [x] Define TabId type: `'today' | 'tomorrow' | 'deferred'`
  - [x] Accept props: `activeTab: TabId`, `onTabChange: (tab: TabId) => void`
  - [x] Render three tab buttons: Today, Tomorrow, Deferred
  - [x] Active tab styling: bg-surface (white), shadow-sm, text-foreground
  - [x] Inactive tab styling: bg-transparent, text-muted-foreground
  - [x] Apply hover state for inactive tabs: slight background highlight
  - [x] Use DM Sans font (font-body), 14px, font-medium for tab labels

- [x] **Task 3: Implement Tab State in App** (AC: 4, 5)
  - [x] Add useState hook: `const [activeTab, setActiveTab] = useState<TabId>('today')`
  - [x] Pass activeTab and setActiveTab (as onTabChange) to TabBar
  - [x] Verify Today is selected by default on page load

- [x] **Task 4: Create Responsive Layout Container** (AC: 6, 7, 8)
  - [x] Update App.tsx with main layout structure
  - [x] Create container div with: `max-w-[600px] mx-auto px-4`
  - [x] Add responsive padding: `px-4` on mobile, appropriate on desktop
  - [x] Create content area below TabBar for view placeholders
  - [x] Add placeholder text for each tab view: "Today View", "Tomorrow View", "Deferred View"
  - [x] Apply bg-background to overall page background

- [x] **Task 5: Style Tab Bar Container** (AC: 3, 6, 7)
  - [x] Tab bar container: bg-surface-muted (#f1f5f9), rounded corners
  - [x] Ensure tab bar spans full width of content container
  - [x] Add appropriate padding inside tab bar: p-1 or similar
  - [x] Tabs should have equal width or be evenly distributed

- [x] **Task 6: Remove TokenShowcase (Cleanup)** (AC: all)
  - [x] Remove TokenShowcase component import and usage from App.tsx
  - [x] Optionally delete TokenShowcase.tsx file (or keep for reference)
  - [x] Ensure clean app shell displays without test content

- [x] **Task 7: Visual Testing and Responsive Verification** (AC: 6, 7, 8)
  - [x] Test at mobile viewport (375px width)
  - [x] Test at tablet viewport (768px width)
  - [x] Test at desktop viewport (1280px width)
  - [x] Verify max-width constraint at 600px on large screens
  - [x] Verify full-width behavior on mobile
  - [x] Run `npm run build` to ensure no TypeScript errors

## Dev Notes

### Architecture Alignment

Per architecture.md, this story creates the core UI shell components:
- **Header.tsx**: Static component displaying app title and current date
- **TabBar.tsx**: Controlled component receiving activeTab and onTabChange props
- **App.tsx**: Root component managing tab state with useState

Component patterns required (from architecture.md):
- All components MUST be functional components with TypeScript
- Use arrow function syntax
- Use named exports (not default): `export const Header = () => { ... }`
- Destructure props in function signature

### Date Formatting

Use `date-fns` for date formatting (per architecture.md):
```typescript
import { format } from 'date-fns';
const formattedDate = format(new Date(), 'MMMM d'); // "January 6"
```

### Tab State Pattern

Per architecture.md ADR-004 (No Router):
```typescript
type TabId = 'today' | 'tomorrow' | 'deferred';
const [activeTab, setActiveTab] = useState<TabId>('today');
```

This keeps navigation simple without URL routing complexity.

### Responsive Design

Per UX specification Section 8.1:
| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Full-width cards, larger touch targets |
| Tablet | 768px - 1023px | Centered column (500px) |
| Desktop | 1024px+ | Centered column (600px) |

Tailwind classes for responsive container:
```typescript
className="max-w-[600px] mx-auto px-4 sm:px-6"
```

### Tab Styling Per UX Spec

From ux-design-specification.md Section 6.1 (Tab Bar):
- Active tab: Bold text, white background, subtle shadow
- Inactive tab: Normal weight, muted color
- Tab bar background: surface-muted (#f1f5f9)

### Project Structure Notes

Per architecture.md, files created in this story:
```
today-app/src/
├── App.tsx            # Modified: layout, tab state, removed TokenShowcase
└── components/
    ├── Header.tsx     # NEW: app title + date
    └── TabBar.tsx     # NEW: tab navigation
```

TokenShowcase.tsx may be removed or kept as reference (not displayed in app).

### Learnings from Previous Story

**From Story 1-2-design-tokens-and-base-styling (Status: done)**

- **Tailwind v4 Configuration**: Project uses Tailwind v4 with CSS-first configuration via `@theme` directive in index.css - no tailwind.config.js needed
- **Design Tokens Available**: All 15 color tokens defined and working: bg-background, bg-surface, bg-surface-muted, text-foreground, text-muted-foreground, border-border, etc.
- **Font Classes Available**: font-display (Playfair Display), font-body (DM Sans), font-mono (JetBrains Mono) all configured and loading from Google Fonts
- **TokenShowcase Component**: Created at `today-app/src/components/TokenShowcase.tsx` for token verification - should be removed from App.tsx in this story
- **App.tsx Pattern**: Currently uses `export const App` named export pattern, bg-background class applied
- **Build Size**: Bundle at 201KB JS (60KB gzipped), 12KB CSS - well under targets
- **React 19 + TypeScript 5.9**: Using latest versions (not React 18 as originally spec'd)

**Key Files to Reference:**
- `today-app/src/index.css` - Design tokens with @theme directive
- `today-app/src/App.tsx` - Current minimal implementation
- `today-app/index.html` - Google Fonts links

[Source: notes/sprint-artifacts/1-2-design-tokens-and-base-styling.md#Dev-Agent-Record]

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#Story-1.3] - Acceptance criteria AC-1.3.1 through AC-1.3.8
- [Source: notes/epics.md#Story-1.3] - Story definition and prerequisites
- [Source: notes/architecture.md#Project-Structure] - Component file locations
- [Source: notes/architecture.md#Component-Patterns] - Named exports, arrow functions, TypeScript
- [Source: notes/architecture.md#ADR-004] - No router, tab-based navigation
- [Source: notes/ux-design-specification.md#4.2-Screen-Layout-Structure] - Header and tab bar layout
- [Source: notes/ux-design-specification.md#6.1-Component-Strategy] - Tab Bar component specs
- [Source: notes/ux-design-specification.md#8.1-Responsive-Strategy] - Breakpoints and mobile adaptations
- [Source: notes/sprint-artifacts/1-2-design-tokens-and-base-styling.md#Dev-Agent-Record] - Previous story learnings

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/1-3-core-layout-structure.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Plan: Create Header, TabBar components, integrate in App.tsx with tab state, remove TokenShowcase
- Build verified: TypeScript compilation successful, bundle 214KB JS (66KB gzip), 13KB CSS
- Browser testing: All three tabs functional, visual states correct, responsive layout working

### Completion Notes List

- Created Header component displaying "Today" in Playfair Display font with current date using date-fns
- Created TabBar component with TabId type, active/inactive styling, and hover states
- Integrated tab state management in App.tsx using useState hook
- Applied responsive layout with max-w-[600px] and appropriate padding
- Tab bar styled with bg-surface-muted, rounded corners, equal-width tabs
- Removed TokenShowcase import/usage from App.tsx (file kept for reference)
- All acceptance criteria verified in browser
- ✅ Test Gate PASSED by Vishal (2026-01-06)

### File List

**Created:**
- `today-app/src/components/Header.tsx` - App title and date display
- `today-app/src/components/TabBar.tsx` - Tab navigation with TabId type

**Modified:**
- `today-app/src/App.tsx` - Added Header, TabBar, tab state, responsive container, removed TokenShowcase

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted from sprint-status backlog | SM Agent |
| 2026-01-06 | Implementation complete - all tasks done, awaiting test gate | Dev Agent |
| 2026-01-06 | Test Gate PASSED, story marked done | Dev Agent |
