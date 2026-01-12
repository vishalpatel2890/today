# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-12
**Project Level:** Quick Flow (Single Story)
**Change Type:** UI Enhancement
**Development Context:** Brownfield (existing React/TypeScript PWA)

---

## Context

### Available Documents

- No product brief or research documents required for this change
- Existing codebase analyzed for patterns and conventions

### Project Stack

| Component | Version | Notes |
|-----------|---------|-------|
| Runtime | Node.js 20.x | Via Vite dev server |
| Framework | React 19.2.0 | Latest React with concurrent features |
| Language | TypeScript 5.9.3 | Strict mode enabled |
| Styling | Tailwind CSS 4.1.18 | Utility-first CSS |
| UI Components | Radix UI | Dialog, Popover, Select primitives |
| Testing | Vitest 3.2.4 | With Testing Library |
| Build | Vite 7.2.4 | Electron + PWA dual-target |

### Existing Codebase Structure

**Directory Organization:**
- `today-app/src/components/time-tracking/` - Time tracking UI components
- `today-app/src/hooks/` - Custom React hooks including `useTimeInsights`
- `today-app/src/types/` - TypeScript type definitions
- `today-app/src/lib/` - Utility functions and formatters

**Key Files for This Change:**
- `TimeInsightsModal.tsx` - Main modal component (line 298: current 420px width)
- `InsightCard.tsx` - Reusable metric card component
- `useTimeInsights.ts` - Hook providing `totalToday`, `totalWeek`, `avgPerDay`

**Current Modal Layout:**
- Width: 420px on desktop (`md:max-w-[420px]`)
- 2-column card grid: "Today" and "Avg/Day" cards
- Mobile: full-width bottom sheet

---

## The Change

### Problem Statement

The Time Insights modal is currently 420px wide on desktop, which feels cramped given the amount of information displayed (filters, summary cards, breakdown, recent entries). Additionally, users lack visibility into their total weekly time at a glance - they can only see "Today" and "Avg/Day" metrics.

### Proposed Solution

1. **Increase modal width** from 420px to 550px (~30% wider) on desktop for better content spacing
2. **Add a "Total" card** showing total time tracked this week, displayed inline with existing cards in a 3-column layout

### Scope

**In Scope:**
- Increase desktop modal width from 420px to 550px
- Add third InsightCard showing "Total" time (totalWeek)
- Update card grid from 2-column to 3-column layout
- Maintain responsive behavior (mobile stays full-width bottom sheet)

**Out of Scope:**
- Changes to mobile layout behavior
- New data calculations (totalWeek already exists in hook)
- Changes to other sections (filters, breakdown, recent entries)
- Changes to InsightCard component styling

---

## Implementation Details

### Source Tree Changes

| File | Action | Changes |
|------|--------|---------|
| `today-app/src/components/time-tracking/TimeInsightsModal.tsx` | MODIFY | Update max-width from 420px to 550px; Add "Total" InsightCard; Change grid from `grid-cols-2` to `grid-cols-3` |
| `today-app/src/components/time-tracking/TimeInsightsModal.test.tsx` | MODIFY | Add test for "Total" card rendering |

### Technical Approach

**Width Change (Line 298):**
```tsx
// Before
md:max-w-[420px]

// After
md:max-w-[550px]
```

**Card Grid Change (Lines 399-414):**
```tsx
// Before
<div className="grid grid-cols-2 gap-4">

// After
<div className="grid grid-cols-3 gap-3">
```
Note: Reduce gap from 4 to 3 to accommodate third card comfortably.

**Add Total Card (Insert before Today card):**
```tsx
{/* TOTAL card - new */}
<InsightCard
  label="Total"
  value={isLoading ? '--' : formatDisplay(insights?.totalWeek ?? 0)}
  sublabel="this week"
  isLoading={isLoading}
/>
```

### Existing Patterns to Follow

Follow patterns established in `TimeInsightsModal.tsx`:
- Use `InsightCard` component for all metric cards (consistent with Today/Avg cards)
- Use `formatDisplay()` helper for duration formatting
- Use `insights?.totalWeek ?? 0` for null-safe access
- Use `isLoading` state for skeleton display
- Tailwind utility classes for layout (no custom CSS)

### Integration Points

- **useTimeInsights hook:** Already provides `totalWeek` - no changes needed
- **InsightCard component:** Reuse as-is - no changes needed
- **formatDisplay function:** Already handles all duration formatting

---

## Development Context

### Relevant Existing Code

**TimeInsightsModal.tsx lines 399-414** - Current card grid:
```tsx
<div className="grid grid-cols-2 gap-4">
  <InsightCard
    label="Today"
    value={isLoading ? '--' : formatDisplay(insights?.totalToday ?? 0)}
    sublabel="tracked"
    isLoading={isLoading}
  />
  <InsightCard
    label="Avg / Day"
    value={isLoading ? '--' : formatDisplay(insights?.avgPerDay ?? 0)}
    sublabel="this week"
    isLoading={isLoading}
  />
</div>
```

**useTimeInsights.ts line 225** - totalWeek calculation:
```tsx
const totalWeek = weekEntries.reduce((sum, e) => sum + e.duration, 0)
```

### Dependencies

**Framework/Libraries:**
- React 19.2.0 (component framework)
- Radix UI Dialog 1.1.15 (modal primitive)
- Tailwind CSS 4.1.18 (styling)

**Internal Modules:**
- `@/components/time-tracking/InsightCard` - Card component
- `@/hooks/useTimeInsights` - Data hook (provides totalWeek)
- `@/lib/timeFormatters` - formatDurationSummary function

### Configuration Changes

None required.

### Existing Conventions (Brownfield)

**Code Style:**
- No semicolons
- Single quotes for strings
- 2-space indentation
- Tailwind classes in className strings

**Component Patterns:**
- Functional components with TypeScript
- Props destructured in function signature
- JSDoc comments for component documentation

**Test Patterns:**
- Test files: `*.test.tsx` alongside source files
- Vitest + Testing Library
- Screen queries for assertions

### Test Framework & Standards

- **Framework:** Vitest 3.2.4
- **Assertion Library:** @testing-library/jest-dom
- **Component Testing:** @testing-library/react
- **File Pattern:** `ComponentName.test.tsx`
- **Location:** Same directory as source file

---

## Implementation Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Node.js | 20.x |
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS | 4.1.18 |
| UI Primitives | Radix UI | 1.1.15 |
| Testing | Vitest | 3.2.4 |
| Testing Utils | Testing Library | 16.3.1 |

---

## Technical Details

**Width Calculation:**
- Current: 420px
- Target: 550px (30.95% increase, meets "at least 30% wider" requirement)
- Mobile: Unchanged (full-width with padding)

**Card Layout Math:**
- 550px modal width - 48px padding (24px each side) = 502px content width
- 3 cards with gap-3 (12px gaps) = 502px - 24px (2 gaps) = 478px for cards
- Each card: ~159px width (auto-distributed by grid)

**Data Flow:**
- `useTimeInsights` hook returns `insights.totalWeek` (already calculated)
- `formatDisplay()` converts milliseconds to "Xh Ym" format
- No new calculations or data fetching required

---

## Development Setup

```bash
# Navigate to app directory
cd today-app

# Install dependencies (if not already)
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run specific test file
npm test TimeInsightsModal
```

---

## Implementation Guide

### Setup Steps

1. Ensure dev server is running (`npm run dev`)
2. Open Time Insights modal (Cmd+Shift+T T) to see current state
3. Have `TimeInsightsModal.tsx` open in editor

### Implementation Steps

1. **Update modal width** (line 298):
   - Change `md:max-w-[420px]` to `md:max-w-[550px]`

2. **Update card grid** (line 399):
   - Change `grid-cols-2` to `grid-cols-3`
   - Change `gap-4` to `gap-3`

3. **Add Total card** (insert at line 400, before Today card):
   - Add new `InsightCard` with label="Total", value from `insights?.totalWeek`, sublabel="this week"

4. **Update test file** to verify Total card renders

### Testing Strategy

**Unit Tests:**
- Verify "Total" card renders with correct label
- Verify "Total" card displays formatted totalWeek value
- Verify 3-card layout renders correctly

**Manual Testing:**
- Open modal on desktop - verify wider appearance
- Verify all 3 cards display in a row
- Verify Total shows correct weekly total
- Test on mobile - verify responsive behavior unchanged
- Test loading state - verify all 3 cards show skeleton

### Acceptance Criteria

1. Modal is at least 30% wider on desktop (550px vs 420px = 31%)
2. "Total" card displays as first card in the row
3. "Total" card shows total time tracked this week
4. All 3 cards have equal width in the grid
5. Mobile layout remains unchanged (full-width bottom sheet)
6. Loading state shows skeleton for all 3 cards
7. Existing tests continue to pass

---

## Developer Resources

### File Paths Reference

- `/today-app/src/components/time-tracking/TimeInsightsModal.tsx`
- `/today-app/src/components/time-tracking/TimeInsightsModal.test.tsx`
- `/today-app/src/components/time-tracking/InsightCard.tsx`
- `/today-app/src/hooks/useTimeInsights.ts`

### Key Code Locations

- Modal width class: `TimeInsightsModal.tsx:298`
- Card grid container: `TimeInsightsModal.tsx:399`
- Today card: `TimeInsightsModal.tsx:401-406`
- Avg/Day card: `TimeInsightsModal.tsx:408-413`
- totalWeek calculation: `useTimeInsights.ts:225`
- formatDisplay function: `TimeInsightsModal.tsx:224-227`

### Testing Locations

- Component tests: `today-app/src/components/time-tracking/TimeInsightsModal.test.tsx`
- Hook tests: `today-app/src/hooks/useTimeInsights.test.ts`

### Documentation to Update

None required - this is a minor UI enhancement.

---

## UX/UI Considerations

**UI Components Affected:**
- `TimeInsightsModal` - Width and card layout changes

**Visual Changes:**
- Modal 30% wider on desktop (420px -> 550px)
- 3-column card grid instead of 2-column
- New "Total" card showing weekly time total

**Responsive Design:**
- Desktop: 550px max-width with 3-column cards
- Mobile: Full-width bottom sheet (unchanged)

**Accessibility:**
- InsightCard already has `role="region"` and `aria-label`
- New card inherits same accessibility patterns

---

## Testing Approach

**Test Framework:** Vitest 3.2.4 + Testing Library

**Unit Tests to Add:**
```tsx
it('renders Total card with weekly time', () => {
  render(<TimeInsightsModal isOpen={true} onClose={vi.fn()} userId="test" />)
  expect(screen.getByText('Total')).toBeInTheDocument()
  expect(screen.getByText('this week')).toBeInTheDocument()
})
```

**Manual Test Checklist:**
- [ ] Modal opens at 550px width on desktop
- [ ] All 3 cards (Total, Today, Avg/Day) display in single row
- [ ] Total card shows correct weekly time
- [ ] Cards have equal widths
- [ ] Mobile layout unchanged
- [ ] Loading skeletons appear for all 3 cards

---

## Deployment Strategy

### Deployment Steps

1. Merge PR to main branch
2. Automated build via CI
3. Deploy to staging/preview
4. Verify modal changes in staging
5. Deploy to production

### Rollback Plan

1. Revert the commit changing TimeInsightsModal.tsx
2. Redeploy previous version
3. Verify modal returns to 420px with 2 cards

### Monitoring

- No new monitoring needed
- Existing error boundaries handle component failures
