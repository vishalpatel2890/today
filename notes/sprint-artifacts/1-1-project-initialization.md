# Story 1.1: Project Initialization

Status: done

## Story

As a **developer**,
I want **the project initialized with React, TypeScript, Vite, Tailwind, and Radix**,
so that **I have a working development environment with all dependencies**.

## Acceptance Criteria

1. **AC-1.1.1**: Running `npm run dev` starts a development server at localhost:5173 without errors
2. **AC-1.1.2**: The page displays "Today" as the app title
3. **AC-1.1.3**: TypeScript compilation completes without errors (`npm run build` succeeds)
4. **AC-1.1.4**: Tailwind utility classes (e.g., `bg-white`, `text-slate-900`) apply correctly
5. **AC-1.1.5**: Hot module replacement (HMR) updates the page on file save without full reload

## Frontend Test Gate

**Gate ID**: 1-1-TG1

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] Terminal in project directory
- [ ] No other process using port 5173

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `npm run dev` in terminal | Terminal | Server starts, shows "Local: http://localhost:5173" |
| 2 | Open http://localhost:5173 in browser | Browser address bar | Page loads without errors |
| 3 | Inspect page for "Today" title | Main heading | "Today" text visible on page |
| 4 | Open DevTools Console | Browser DevTools (F12) | No red error messages |
| 5 | Edit App.tsx, change any text | Code editor | Page updates instantly without full reload |
| 6 | Run `npm run build` in terminal | Terminal | Build completes with "built in Xs" message |

### Success Criteria (What User Sees)
- [ ] Dev server running at localhost:5173
- [ ] "Today" displayed as page heading
- [ ] Tailwind classes applying (e.g., background color visible)
- [ ] HMR working (changes appear without page refresh)
- [ ] No console errors in browser DevTools
- [ ] Build completes without TypeScript errors

### Feedback Questions
1. Could you start the dev server without issues?
2. Did HMR update changes within 1-2 seconds?
3. Were there any TypeScript or build errors?
4. Any unexpected configuration issues?

## Tasks / Subtasks

- [x] **Task 1: Initialize Vite Project** (AC: 1, 3, 5)
  - [x] Run `npm create vite@latest today-app -- --template react-ts`
  - [x] Navigate into project directory
  - [x] Verify `package.json` has React 18 and TypeScript 5
  - [x] Run `npm install` to install base dependencies

- [x] **Task 2: Install Production Dependencies** (AC: 4)
  - [x] Install Radix UI: `npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-popover`
  - [x] Install Lucide icons: `npm install lucide-react`
  - [x] Install date-fns: `npm install date-fns`

- [x] **Task 3: Install and Configure Tailwind CSS** (AC: 4)
  - [x] Install Tailwind: `npm install -D tailwindcss postcss autoprefixer`
  - [x] Configure Tailwind v4 with Vite plugin (@tailwindcss/vite)
  - [x] Add Tailwind import to `src/index.css`: `@import "tailwindcss";`
  - [x] Note: Tailwind v4 uses CSS-first configuration, no tailwind.config.js needed

- [x] **Task 4: Create Minimal App Shell** (AC: 2)
  - [x] Update `src/App.tsx` to display "Today" as heading
  - [x] Apply basic Tailwind classes to verify styling works
  - [x] Remove Vite default content (logo, counter)

- [x] **Task 5: Verify Development Environment** (AC: 1, 3, 5)
  - [x] Run `npm run dev` and verify server starts at localhost:5173
  - [x] Verify page loads with "Today" heading
  - [x] Test HMR by editing App.tsx and observing instant update
  - [x] Run `npm run build` and verify no TypeScript errors
  - [x] Check browser console for any errors

## Dev Notes

### Architecture Alignment
- **Framework**: React 18.x + TypeScript 5.x per architecture.md Decision Summary
- **Build Tool**: Vite 5.x per ADR-002 (faster than CRA, better TypeScript support)
- **Styling**: Tailwind CSS 3.x per ADR-003 (matches UX spec design tokens)
- **UI Primitives**: Radix UI per ADR-003 (unstyled, accessible primitives)

### Project Structure Notes

Per architecture.md, this story creates the base structure:

```
today-app/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx          # Entry point
│   ├── App.tsx           # Root component (minimal for this story)
│   └── index.css         # Tailwind imports
```

### Commands Reference

```bash
# Project initialization (run from parent directory)
npm create vite@latest today-app -- --template react-ts
cd today-app
npm install

# Install additional dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-popover
npm install lucide-react
npm install date-fns

# Development
npm run dev          # Start dev server at localhost:5173

# Build verification
npm run build        # TypeScript compilation + production build
```

### Testing Standards
- Manual visual verification for this story
- Vitest + Testing Library setup deferred to later story
- No automated tests required for project initialization

### References

- [Source: notes/architecture.md#Project-Initialization] - Exact npm commands
- [Source: notes/architecture.md#Decision-Summary] - Technology choices
- [Source: notes/architecture.md#ADR-002] - Vite rationale
- [Source: notes/architecture.md#ADR-003] - Tailwind + Radix rationale
- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#Story-1.1] - Acceptance criteria

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/1-1-project-initialization.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Used Tailwind v4 (latest) instead of v3.x - v4 uses CSS-first configuration with @tailwindcss/vite plugin
- React 19 installed (latest stable) instead of React 18 - fully compatible
- TypeScript 5.9 installed (latest) - exceeds minimum requirement of TypeScript 5.x
- Vite 7.3 installed (latest) - exceeds minimum requirement of Vite 5.x

### Completion Notes List

- Project initialized with modern stack: React 19, TypeScript 5.9, Vite 7.3, Tailwind v4
- All production dependencies installed: @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-popover, lucide-react, date-fns
- App.tsx updated to named export per architecture constraints (export const App)
- Minimal "Today" heading displayed with Tailwind utility classes (bg-slate-50, text-slate-900, text-4xl, font-bold)
- Build succeeds with 0 TypeScript errors, produces 193KB JS bundle (gzipped: 60KB)
- Dev server starts successfully at localhost:5173
- ✅ Test Gate PASSED by Vishal (2026-01-06)

### File List

- NEW: today-app/package.json
- NEW: today-app/tsconfig.json
- NEW: today-app/tsconfig.app.json
- NEW: today-app/tsconfig.node.json
- NEW: today-app/vite.config.ts
- NEW: today-app/index.html
- NEW: today-app/eslint.config.js
- NEW: today-app/src/main.tsx
- NEW: today-app/src/App.tsx
- NEW: today-app/src/index.css
- NEW: today-app/src/vite-env.d.ts
- NEW: today-app/public/vite.svg
- NEW: today-app/src/assets/react.svg
