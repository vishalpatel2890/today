# Today - Architecture

## Executive Summary

**Today** is a minimalist, local-first to-do web application. The architecture prioritizes simplicity: a single-page React application with no backend, storing all data in the browser's localStorage as JSON. This eliminates server complexity, authentication overhead, and data sync concerns—delivering the core value proposition of focus and calm through technical minimalism.

## Project Initialization

First implementation story should execute:

```bash
npm create vite@latest today-app -- --template react-ts
cd today-app
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-popover
npm install lucide-react
npm install date-fns
```

This establishes the base architecture with:
- Vite + React + TypeScript (fast dev server, modern tooling)
- Tailwind CSS (utility-first styling)
- Radix UI primitives (accessible modal, select, popover)
- Lucide icons (consistent icon set)
- date-fns (lightweight date utilities)

---

## Decision Summary

| Category | Decision | Version | Affects FRs | Rationale |
|----------|----------|---------|-------------|-----------|
| Framework | React + TypeScript | React 18.x, TS 5.x | All | Component-based, excellent DX, strong typing |
| Build Tool | Vite | 5.x | All | Fast HMR, minimal config, modern defaults |
| Styling | Tailwind CSS | 3.x | All UI | Matches UX spec design tokens, utility-first |
| UI Primitives | Radix UI | Latest | FR5-10 (defer modal) | Unstyled, accessible primitives |
| Icons | Lucide React | Latest | All UI | Consistent outline style per UX spec |
| Date Handling | date-fns | 3.x | FR11-13 (auto-surfacing) | Lightweight, tree-shakeable |
| Storage | localStorage | Native | FR19-21 | No backend needed, browser-native |
| State Management | React useState/useReducer | Native | All | Simple app, no need for Redux/Zustand |
| Routing | None (tab-based) | N/A | FR14-16 | Single view with tabs, no URL routing needed |
| Testing | Vitest + Testing Library | Latest | All | Fast, Vite-native, React-friendly |

---

## Project Structure

```
today-app/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component with tab state
│   ├── index.css                   # Tailwind imports + design tokens
│   ├── types/
│   │   └── index.ts                # Task, AppState types
│   ├── hooks/
│   │   ├── useLocalStorage.ts      # localStorage persistence hook
│   │   ├── useTasks.ts             # Task CRUD operations
│   │   └── useAutoSurface.ts       # Date-based task surfacing
│   ├── components/
│   │   ├── Header.tsx              # App title + date
│   │   ├── TabBar.tsx              # Today/Tomorrow/Deferred tabs
│   │   ├── TaskList.tsx            # List container
│   │   ├── TaskCard.tsx            # Individual task with actions
│   │   ├── AddTaskInput.tsx        # Quick add input
│   │   ├── DeferModal.tsx          # Radix Dialog for deferment
│   │   ├── CategoryDropdown.tsx    # Radix Select for categories
│   │   ├── DatePicker.tsx          # Radix Popover calendar
│   │   ├── CategorySection.tsx     # Collapsible category in Deferred
│   │   └── Toast.tsx               # Feedback notifications
│   ├── views/
│   │   ├── TodayView.tsx           # Today's tasks
│   │   ├── TomorrowView.tsx        # Tomorrow's tasks
│   │   └── DeferredView.tsx        # Categorized deferred tasks
│   └── utils/
│       ├── storage.ts              # localStorage helpers
│       ├── dates.ts                # Date formatting/comparison
│       └── constants.ts            # Design tokens as CSS variables
└── tests/
    ├── components/
    │   └── TaskCard.test.tsx
    └── hooks/
        └── useTasks.test.ts
```

---

## FR Category to Architecture Mapping

| FR Category | Component(s) | Hook(s) |
|-------------|--------------|---------|
| Task Management (FR1-4) | TaskCard, AddTaskInput | useTasks |
| Deferment System (FR5-10) | DeferModal, CategoryDropdown, DatePicker | useTasks |
| Auto-Surfacing (FR11-13) | N/A (runs on load) | useAutoSurface |
| Views & Navigation (FR14-18) | TabBar, TodayView, TomorrowView, DeferredView | App state |
| Data & Persistence (FR19-23) | N/A (cross-cutting) | useLocalStorage |
| Categories (FR24-27) | CategoryDropdown, CategorySection | useTasks |
| Responsive (FR28-30) | All components via Tailwind | N/A |

---

## Technology Stack Details

### Core Technologies

**React 18 + TypeScript**
- Functional components with hooks
- Strict mode enabled
- No class components

**Vite 5**
- Development server with HMR
- Production build with Rollup
- TypeScript compilation via esbuild

**Tailwind CSS 3**
- JIT compilation
- Custom design tokens in `tailwind.config.js`
- No CSS-in-JS overhead

### Integration Points

| Component A | Component B | Integration |
|-------------|-------------|-------------|
| App | useTasks | Tasks state and dispatch |
| TaskCard | DeferModal | Opens modal with task context |
| DeferModal | useTasks | Calls deferTask action |
| useAutoSurface | useTasks | Updates task dates on mount |
| useTasks | useLocalStorage | Persists state changes |

---

## Data Architecture

### Core Types

```typescript
// src/types/index.ts

export interface Task {
  id: string;                    // UUID
  text: string;                  // Task content
  createdAt: string;             // ISO date string
  deferredTo: string | null;     // ISO date or null for "someday"
  category: string | null;       // Only set when deferred
  completedAt: string | null;    // ISO date when completed
}

export interface AppState {
  tasks: Task[];
  categories: string[];          // List of category names
}

export type TaskAction =
  | { type: 'ADD_TASK'; text: string }
  | { type: 'COMPLETE_TASK'; id: string }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'DEFER_TASK'; id: string; deferredTo: string | null; category: string }
  | { type: 'SURFACE_TASKS' }    // Move tasks to correct view based on date
  | { type: 'LOAD_STATE'; state: AppState };
```

### Storage Schema

```typescript
// localStorage key: 'today-app-state'
// Value: JSON.stringify(AppState)

{
  "tasks": [
    {
      "id": "uuid-1",
      "text": "Review PRD",
      "createdAt": "2026-01-05T10:00:00.000Z",
      "deferredTo": null,
      "category": null,
      "completedAt": null
    }
  ],
  "categories": ["Work", "Personal"]
}
```

---

## Implementation Patterns

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TaskCard.tsx` |
| Hooks | camelCase with `use` prefix | `useTasks.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `interface Task` |
| CSS classes | Tailwind utilities | `className="bg-white"` |
| Constants | SCREAMING_SNAKE_CASE | `STORAGE_KEY` |

### Component Patterns

**All components MUST:**
- Be functional components with TypeScript
- Use arrow function syntax
- Destructure props in function signature
- Export as named export (not default)

```typescript
// CORRECT
export const TaskCard = ({ task, onComplete }: TaskCardProps) => {
  return <div>...</div>;
};

// INCORRECT
export default function TaskCard(props) { ... }
```

### State Update Patterns

**All state updates MUST:**
- Use the reducer pattern via `useTasks` hook
- Return new objects/arrays (no mutation)
- Trigger localStorage save after update

```typescript
// CORRECT
const addTask = (text: string) => {
  dispatch({ type: 'ADD_TASK', text });
};

// INCORRECT
tasks.push(newTask); // Never mutate!
```

### Date Handling Patterns

**All dates MUST:**
- Be stored as ISO 8601 strings
- Use `date-fns` for comparison and formatting
- Compare using `isToday()`, `isTomorrow()` from date-fns

```typescript
import { isToday, isTomorrow, parseISO } from 'date-fns';

const taskDate = parseISO(task.deferredTo);
if (isToday(taskDate)) { /* show in Today view */ }
```

---

## Consistency Rules

### Error Handling

**Pattern:** No backend = minimal errors. Handle:
- localStorage quota exceeded → Show toast, don't crash
- Invalid date → Default to "no date" (someday)

```typescript
try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
} catch (e) {
  showToast('Storage full. Some data may not save.');
}
```

### Logging Strategy

**Pattern:** Console only, development mode

```typescript
if (import.meta.env.DEV) {
  console.log('[Today]', action.type, action);
}
```

### ID Generation

**Pattern:** Use `crypto.randomUUID()`

```typescript
const newTask: Task = {
  id: crypto.randomUUID(),
  // ...
};
```

---

## API Contracts

**N/A** - This is a local-only application with no API. All data operations are synchronous localStorage reads/writes.

---

## Security Architecture

**Minimal attack surface:**
- No backend = no server-side vulnerabilities
- No user accounts = no auth to compromise
- No network requests = no CSRF, XSS vectors
- Data stays on device = no cloud data breaches

**CSP Considerations:**
- Inline styles: Allowed (Tailwind JIT)
- External scripts: None required
- External fonts: Google Fonts for typography

---

## Performance Considerations

| NFR | Implementation |
|-----|----------------|
| Initial load < 2s | Vite tree-shaking, no heavy deps |
| Interaction < 100ms | All operations synchronous, no network |
| Storage < 1KB/100 tasks | Minimal JSON structure |
| Time to interactive < 1.5s | React 18 concurrent features |

**Bundle Size Targets:**
- Total JS: < 100KB gzipped
- CSS: < 20KB gzipped
- No lazy loading needed (small app)

---

## Deployment Architecture

**Static Hosting (recommended options):**
- Vercel (zero-config)
- Netlify (zero-config)
- GitHub Pages (free)
- Any static file server

**Build Command:**
```bash
npm run build
```

**Output:** `dist/` folder with static HTML, JS, CSS

**No server required.** No environment variables. No database. Just static files.

---

## Development Environment

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- Modern browser (Chrome, Firefox, Safari, Edge)

### Setup Commands

```bash
# Clone and install
git clone <repo>
cd today-app
npm install

# Development
npm run dev          # Start dev server at localhost:5173

# Testing
npm run test         # Run Vitest
npm run test:watch   # Watch mode

# Build
npm run build        # Production build
npm run preview      # Preview production build

# Linting
npm run lint         # ESLint check
npm run format       # Prettier format
```

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar) - for TS support

---

## Architecture Decision Records (ADRs)

### ADR-001: No Backend

**Context:** Today is a personal productivity app with no collaboration features.

**Decision:** Build as a client-only SPA with localStorage.

**Rationale:**
- Zero operational cost
- No authentication complexity
- Instant load (no network)
- Privacy by default (data never leaves device)

**Consequences:**
- No sync across devices (acceptable for MVP)
- Data lost if browser storage cleared (acceptable for MVP)

---

### ADR-002: Vite over Create React App

**Context:** Need a React development environment.

**Decision:** Use Vite with React TypeScript template.

**Rationale:**
- CRA is deprecated/maintenance mode
- Vite is faster (esbuild, Rollup)
- Better TypeScript support
- Smaller bundle sizes

---

### ADR-003: Tailwind CSS + Radix UI

**Context:** Need styling solution matching UX spec.

**Decision:** Tailwind for utilities, Radix for accessible primitives.

**Rationale:**
- UX spec already defines Tailwind tokens
- Radix provides unstyled, accessible modal/select/popover
- No design system overhead for simple app
- Full control over visual styling

---

### ADR-004: No Router

**Context:** App has three views (Today, Tomorrow, Deferred).

**Decision:** Manage view state with React useState, no router.

**Rationale:**
- Tab-based navigation doesn't need URLs
- Simpler mental model
- No route-related bugs
- Can add router later if needed (PWA deep linking)

---

### ADR-005: useReducer for State Management

**Context:** Need to manage tasks, categories, and persistence.

**Decision:** Custom `useTasks` hook with useReducer pattern.

**Rationale:**
- Single source of truth
- Predictable state updates
- Easy to test
- No external dependency (Redux/Zustand)

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2026-01-05_
_For: Vishal_
