# Epic Technical Specification: Foundation

Date: 2026-01-05
Author: Vishal
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the foundational infrastructure for **Today**, a minimalist local-first to-do web application. This epic delivers the complete development environment, design system implementation, and core UI shell that all subsequent epics will build upon. The foundation follows a React + TypeScript + Vite architecture with Tailwind CSS for styling and Radix UI primitives for accessible interactive components.

This epic does not implement any functional requirements directly but creates the technical foundation required for all 26 MVP functional requirements defined in the PRD. Without this foundation, no user-facing features can be developed.

## Objectives and Scope

### Objectives

1. **Working Development Environment** - Initialize a React 18 + TypeScript + Vite project with hot module replacement, proper tooling, and zero configuration errors
2. **Design System Implementation** - Configure Tailwind CSS with all Slate Sophisticated design tokens (colors, typography, spacing, shadows, borders) from the UX specification
3. **Core UI Shell** - Build the app layout structure including header, tab navigation, and responsive container that matches the UX spec's "minimal paper" aesthetic
4. **Dependency Installation** - Install and configure all required libraries: Radix UI primitives, Lucide icons, date-fns

### In-Scope

- Project initialization with `npm create vite@latest`
- Tailwind CSS configuration with custom design tokens
- Google Fonts integration (Playfair Display, DM Sans, JetBrains Mono)
- Header component with app title and current date
- Tab bar component with Today/Tomorrow/Deferred tabs
- Tab state management (visual switching)
- Responsive layout (mobile, tablet, desktop breakpoints)
- Empty placeholder views for each tab

### Out-of-Scope

- Task data (no data model implementation - Epic 4)
- Task cards (Epic 2)
- Add task input (Epic 2)
- Defer modal (Epic 3)
- localStorage persistence (Epic 4)
- Any functional requirements (FR1-FR30)

## System Architecture Alignment

### Technology Decisions Followed

| Category | Decision | Source |
|----------|----------|--------|
| Framework | React 18 + TypeScript 5.x | architecture.md - Decision Summary |
| Build Tool | Vite 5.x | architecture.md - ADR-002 |
| Styling | Tailwind CSS 3.x | architecture.md - ADR-003 |
| UI Primitives | Radix UI | architecture.md - ADR-003 |
| Icons | Lucide React | architecture.md - Decision Summary |
| Date Handling | date-fns 3.x | architecture.md - Decision Summary |
| Routing | None (tab-based) | architecture.md - ADR-004 |

### Project Structure Created

Per architecture.md, this epic creates the following structure:

```
today-app/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   └── components/
│       ├── Header.tsx
│       └── TabBar.tsx
```

### Design Token Integration

The Tailwind configuration extends the default theme with design tokens from ux-design-specification.md:

- **Colors**: background (#f8fafc), surface (#ffffff), border (#e2e8f0), foreground (#0f172a), muted-foreground (#64748b)
- **Typography**: font-display (Playfair Display), font-body (DM Sans), font-mono (JetBrains Mono)
- **Spacing**: 8px base unit scale
- **Shadows**: shadow-sm, shadow, shadow-lg per spec

## Detailed Design

### Services and Modules

This epic introduces no services or business logic. It establishes only UI components and configuration.

| Component | Responsibility | Inputs | Outputs |
|-----------|---------------|--------|---------|
| `App.tsx` | Root component, manages active tab state | None | Renders Header, TabBar, content area |
| `Header.tsx` | Displays app title and current date | None | Static JSX |
| `TabBar.tsx` | Tab navigation with visual selection | activeTab, onTabChange | Renders 3 tab buttons |

### Data Models and Contracts

No data models are implemented in this epic. The `types/index.ts` file may be created as a placeholder but will be populated in Epic 4.

**Tab State (local component state):**
```typescript
type TabId = 'today' | 'tomorrow' | 'deferred';
const [activeTab, setActiveTab] = useState<TabId>('today');
```

### APIs and Interfaces

No APIs. This is a client-only application with no backend.

**Component Interfaces:**

```typescript
// Header.tsx
export interface HeaderProps {
  // No props - displays static content
}

// TabBar.tsx
export interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}
```

### Workflows and Sequencing

**App Initialization Flow:**
1. User navigates to app URL
2. `main.tsx` renders `App` component
3. `App` initializes with `activeTab = 'today'`
4. Header renders with "Today" title and formatted date
5. TabBar renders with Today tab selected
6. Empty content area displays placeholder

**Tab Switching Flow:**
1. User clicks a tab (Today/Tomorrow/Deferred)
2. `TabBar` calls `onTabChange` with new tab ID
3. `App` updates `activeTab` state
4. TabBar re-renders with new selection
5. Content area will show corresponding view (placeholder for now)

## Non-Functional Requirements

### Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| Initial Load | < 2s on 3G | Vite production build with tree-shaking, minimal dependencies |
| Time to Interactive | < 1.5s | No async data loading, immediate render |
| Bundle Size | < 100KB gzipped JS | date-fns tree-shakeable, Radix primitives on-demand |

**Foundation Impact:** This epic establishes the performance baseline. Bundle analysis should be performed after Story 1.1 to verify targets.

### Security

| Concern | Mitigation |
|---------|------------|
| XSS | No user-generated content rendered in this epic |
| CSP | Standard Vite CSP, Google Fonts external allowed |
| Dependencies | Use latest stable versions, run `npm audit` |

**Note:** Full security requirements are minimal per architecture.md (no backend, no auth, no user data).

### Reliability/Availability

| Requirement | Implementation |
|-------------|----------------|
| Static Assets | Deployed to CDN (Vercel/Netlify) - 99.9%+ availability |
| Offline Support | Not in MVP scope; basic HTML/CSS/JS will cache naturally |
| Error Boundary | Add React error boundary in App.tsx for graceful failures |

### Observability

| Signal | Implementation |
|--------|----------------|
| Console Logging | Development-only logging via `import.meta.env.DEV` check |
| Error Tracking | No external tracking (privacy-first per PRD) |
| Performance Metrics | Browser DevTools, Lighthouse audits during development |

## Dependencies and Integrations

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.x | UI framework |
| `react-dom` | ^18.x | React DOM renderer |
| `@radix-ui/react-dialog` | latest | Accessible modal primitive |
| `@radix-ui/react-select` | latest | Accessible dropdown primitive |
| `@radix-ui/react-popover` | latest | Date picker primitive |
| `lucide-react` | latest | Icon library |
| `date-fns` | ^3.x | Date utilities |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.x | Type checking |
| `vite` | ^5.x | Build tool |
| `tailwindcss` | ^3.x | CSS framework |
| `postcss` | latest | CSS processing |
| `autoprefixer` | latest | CSS vendor prefixes |
| `@types/react` | latest | React type definitions |
| `@types/react-dom` | latest | React DOM type definitions |

### External Integrations

| Integration | Type | Purpose |
|-------------|------|---------|
| Google Fonts | CDN | Playfair Display, DM Sans, JetBrains Mono |

## Acceptance Criteria (Authoritative)

### Story 1.1: Project Initialization

1. **AC-1.1.1**: Running `npm run dev` starts a development server at localhost:5173 without errors
2. **AC-1.1.2**: The page displays "Today" as the app title
3. **AC-1.1.3**: TypeScript compilation completes without errors
4. **AC-1.1.4**: Tailwind utility classes (e.g., `bg-white`, `text-slate-900`) apply correctly
5. **AC-1.1.5**: Hot module replacement (HMR) updates the page on file save without full reload

### Story 1.2: Design Tokens & Base Styling

6. **AC-1.2.1**: Custom Tailwind classes `bg-background`, `bg-surface`, `text-foreground`, `text-muted-foreground`, `border-border` apply correct colors
7. **AC-1.2.2**: Background color is #f8fafc, surface is #ffffff, border is #e2e8f0
8. **AC-1.2.3**: Font classes `font-display`, `font-body`, `font-mono` apply Playfair Display, DM Sans, JetBrains Mono respectively
9. **AC-1.2.4**: Spacing scale follows 8px base (space-2 = 8px, space-4 = 16px, etc.)
10. **AC-1.2.5**: Google Fonts load correctly (check Network tab for font files)

### Story 1.3: Core Layout Structure

11. **AC-1.3.1**: Header displays "Today" in Playfair Display font (24px, weight 500) on the left
12. **AC-1.3.2**: Header displays current date (e.g., "January 5") on the right
13. **AC-1.3.3**: Tab bar shows three tabs: Today, Tomorrow, Deferred
14. **AC-1.3.4**: Today tab is selected by default (visually indicated with white background and shadow)
15. **AC-1.3.5**: Clicking a tab changes the visual selection to that tab
16. **AC-1.3.6**: Content container is centered with max-width 600px on desktop
17. **AC-1.3.7**: On mobile (< 768px), layout is full-width with appropriate padding
18. **AC-1.3.8**: Empty content area shows below tabs (placeholder for views)

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Approach |
|----|--------------|--------------|---------------|
| AC-1.1.1 | architecture.md (Dev Environment) | package.json, vite.config.ts | Manual: run `npm run dev`, verify server starts |
| AC-1.1.2 | PRD (Executive Summary) | App.tsx, Header.tsx | Visual: see "Today" title on page |
| AC-1.1.3 | architecture.md (Framework) | tsconfig.json | Manual: `npm run build` completes |
| AC-1.1.4 | architecture.md (Styling) | tailwind.config.js | Visual: apply utility class, verify style |
| AC-1.1.5 | architecture.md (Build Tool) | vite.config.ts | Manual: edit file, verify instant update |
| AC-1.2.1 | ux-design-specification.md (3.1) | tailwind.config.js, index.css | Visual: use custom class, verify color |
| AC-1.2.2 | ux-design-specification.md (1.2) | index.css | Visual: inspect computed styles |
| AC-1.2.3 | ux-design-specification.md (1.2) | index.html, index.css | Visual: check font rendering |
| AC-1.2.4 | ux-design-specification.md (1.2) | tailwind.config.js | Visual: apply spacing, measure |
| AC-1.2.5 | ux-design-specification.md (3.2) | index.html | DevTools: verify font files loaded |
| AC-1.3.1 | ux-design-specification.md (3.2) | Header.tsx | Visual: verify title styling |
| AC-1.3.2 | ux-design-specification.md (4.2) | Header.tsx | Visual: verify date displays |
| AC-1.3.3 | ux-design-specification.md (4.2) | TabBar.tsx | Visual: three tabs visible |
| AC-1.3.4 | ux-design-specification.md (6.1) | TabBar.tsx, App.tsx | Visual: Today tab styled active |
| AC-1.3.5 | ux-design-specification.md (6.1) | TabBar.tsx, App.tsx | Manual: click tabs, verify selection |
| AC-1.3.6 | ux-design-specification.md (4.1) | App.tsx | DevTools: verify max-width 600px |
| AC-1.3.7 | ux-design-specification.md (8.1) | App.tsx | DevTools: resize to mobile, verify layout |
| AC-1.3.8 | ux-design-specification.md (4.2) | App.tsx | Visual: empty area below tabs |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **R1**: Google Fonts CDN unavailable | Low: degraded typography | Use system font fallbacks in font-family declarations |
| **R2**: Vite version incompatibility | Medium: build failures | Pin Vite to specific version, test before upgrade |
| **R3**: Tailwind JIT issues | Low: styling bugs | Use stable Tailwind version, avoid experimental features |

### Assumptions

| Assumption | Rationale |
|------------|-----------|
| **A1**: Node.js 18+ available | Architecture specifies LTS requirement |
| **A2**: Developer uses VS Code or compatible editor | Recommended in architecture.md |
| **A3**: No CI/CD setup in this epic | Infrastructure is out of scope for MVP foundation |

### Open Questions

None for Epic 1 - the technical decisions are fully specified in architecture.md.

## Test Strategy Summary

### Test Levels

| Level | Coverage | Framework |
|-------|----------|-----------|
| Manual Visual | 100% of ACs | Human verification in browser |
| Component Tests | Not in Epic 1 | Vitest + Testing Library (setup only) |
| E2E Tests | Not in MVP scope | None |

### Test Approach per Story

**Story 1.1 - Project Initialization:**
- Verify `npm run dev` starts server
- Verify page loads without console errors
- Verify HMR on file edit

**Story 1.2 - Design Tokens:**
- Create test component displaying all design tokens
- Visual comparison against UX spec color values
- Check Network tab for font file loading

**Story 1.3 - Core Layout:**
- Visual inspection of header, tabs, layout
- Test tab click interactions
- Responsive testing at 375px (mobile), 768px (tablet), 1280px (desktop)

### Edge Cases

- Browser with JavaScript disabled: App will not function (expected, SPA)
- Slow network: Fonts may flash; mitigate with `font-display: swap`
- Very narrow viewport (< 320px): Ensure no horizontal scroll
