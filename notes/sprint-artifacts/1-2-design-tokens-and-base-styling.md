# Story 1.2: Design Tokens & Base Styling

Status: done

## Story

As a **developer**,
I want **the Slate Sophisticated design tokens configured in Tailwind CSS**,
so that **all components use consistent colors, typography, and spacing from the UX specification**.

## Acceptance Criteria

1. **AC-1.2.1**: Custom Tailwind classes `bg-background`, `bg-surface`, `text-foreground`, `text-muted-foreground`, `border-border` apply correct colors
2. **AC-1.2.2**: Background color is #f8fafc, surface is #ffffff, border is #e2e8f0
3. **AC-1.2.3**: Font classes `font-display`, `font-body`, `font-mono` apply Playfair Display, DM Sans, JetBrains Mono respectively
4. **AC-1.2.4**: Spacing scale follows 8px base (space-2 = 8px, space-4 = 16px, etc.)
5. **AC-1.2.5**: Google Fonts load correctly (check Network tab for font files)

## Frontend Test Gate

**Gate ID**: 1-2-TG1

### Prerequisites
- [ ] App running locally (`npm run dev` at localhost:5173)
- [ ] Browser with DevTools available
- [ ] Starting state: Project initialized from Story 1.1

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Open localhost:5173 | Browser address bar | Page loads with light gray background (#f8fafc) |
| 2 | Inspect page background | DevTools → Computed Styles | background-color: rgb(248, 250, 252) |
| 3 | Look for test component with design tokens | Main content area | Token showcase visible with color swatches |
| 4 | Inspect "Today" heading font | DevTools → Computed Styles | font-family includes "Playfair Display" |
| 5 | Inspect body text font | DevTools → Computed Styles | font-family includes "DM Sans" |
| 6 | Open Network tab, filter by "Font" | DevTools → Network | Google Font files loaded (woff2 files) |
| 7 | Inspect spacing between elements | DevTools → Computed Styles | Margins/padding follow 8px multiples |

### Success Criteria (What User Sees)
- [ ] Page background is light slate gray (#f8fafc)
- [ ] "Today" heading uses Playfair Display serif font
- [ ] Body text uses DM Sans sans-serif font
- [ ] Google Font files visible in Network tab (woff2)
- [ ] Custom color classes apply correctly (bg-background, bg-surface, etc.)
- [ ] No console errors in browser DevTools
- [ ] No 404 errors for font files

### Feedback Questions
1. Do the colors match the UX specification's Slate Sophisticated palette?
2. Are the fonts rendering correctly (not falling back to system fonts)?
3. Does the spacing feel consistent with 8px base unit?
4. Any font loading flicker (FOUT/FOIT)?

## Tasks / Subtasks

- [x] **Task 1: Configure Tailwind CSS Design Tokens** (AC: 1, 2)
  - [x] Add custom colors to Tailwind configuration using CSS variables
  - [x] Define color tokens: background (#f8fafc), surface (#ffffff), surface-muted (#f1f5f9)
  - [x] Define color tokens: border (#e2e8f0), border-subtle (#f1f5f9)
  - [x] Define color tokens: foreground (#0f172a), muted-foreground (#64748b), tertiary (#94a3b8)
  - [x] Define color tokens: primary (#475569), primary-hover (#334155), accent (#0f172a)
  - [x] Define color tokens: success (#22c55e), success-bg (#f0fdf4), error (#ef4444), error-bg (#fef2f2)

- [x] **Task 2: Add Google Fonts Integration** (AC: 3, 5)
  - [x] Add Google Fonts link to index.html for Playfair Display, DM Sans, JetBrains Mono
  - [x] Configure font-display: swap for FOUT handling
  - [x] Define font-family CSS variables in index.css
  - [x] Add Tailwind font family extensions: font-display, font-body, font-mono
  - [x] Add system font fallbacks for each font family

- [x] **Task 3: Configure Spacing Scale** (AC: 4)
  - [x] Verify Tailwind default spacing aligns with 8px base (space-2 = 0.5rem = 8px)
  - [x] Add CSS custom properties for spacing tokens if needed
  - [x] Document spacing scale: space-1 (4px), space-2 (8px), space-3 (12px), space-4 (16px), etc.

- [x] **Task 4: Add Shadow and Border Radius Tokens** (AC: 1)
  - [x] Configure shadow tokens: shadow-sm, shadow, shadow-lg per UX spec
  - [x] Configure border-radius tokens: radius-sm (4px), radius (6px), radius-lg (8px), radius-xl (12px)

- [x] **Task 5: Create Token Showcase Test Component** (AC: 1, 2, 3, 4)
  - [x] Create temporary TokenShowcase.tsx component to display all design tokens
  - [x] Show color swatches with token names and hex values
  - [x] Show typography samples with each font family
  - [x] Show spacing examples with measurements
  - [x] Add component to App.tsx temporarily for visual verification

- [x] **Task 6: Verify All Design Tokens** (AC: 1, 2, 3, 4, 5)
  - [x] Test each color token applies correctly via Tailwind classes
  - [x] Verify font files load in Network tab
  - [x] Confirm no fallback to system fonts
  - [x] Check computed styles match expected values
  - [x] Run build to ensure no TypeScript/CSS errors

## Dev Notes

### Architecture Alignment

Per architecture.md, this story implements the styling layer using:
- **Tailwind CSS**: JIT compilation with custom design tokens extending the default theme
- **CSS Variables**: Runtime-accessible design tokens in index.css for potential theming

### Tailwind v4 Configuration (from Story 1.1)

Story 1.1 established that we're using **Tailwind v4** which uses CSS-first configuration:
- No tailwind.config.js file needed (v4 uses @tailwindcss/vite plugin)
- Configuration happens directly in CSS via `@theme` directive
- Custom colors/fonts defined as CSS custom properties in index.css

### Design Token Reference

From ux-design-specification.md Section 1.2:

**Colors (Slate Sophisticated):**
```css
:root {
  --background: #f8fafc;
  --surface: #ffffff;
  --surface-muted: #f1f5f9;
  --border: #e2e8f0;
  --border-subtle: #f1f5f9;
  --foreground: #0f172a;
  --muted-foreground: #64748b;
  --tertiary: #94a3b8;
  --primary: #475569;
  --primary-hover: #334155;
  --accent: #0f172a;
  --success: #22c55e;
  --success-bg: #f0fdf4;
  --error: #ef4444;
  --error-bg: #fef2f2;
}
```

**Typography:**
```css
:root {
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

**Spacing (8px base):**
```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
}
```

### Component Patterns

Per architecture.md "Component Patterns" section:
- All components MUST be functional components with TypeScript
- Use arrow function syntax
- Use named exports (not default)
- Destructure props in function signature

### Project Structure Notes

Per architecture.md, this story modifies:
```
today-app/
├── index.html          # Add Google Fonts links
├── src/
│   ├── index.css       # Design tokens as CSS variables, Tailwind @theme
│   ├── App.tsx         # Temporarily include TokenShowcase
│   └── components/
│       └── TokenShowcase.tsx  # Temporary test component
```

### Learnings from Previous Story

**From Story 1-1-project-initialization (Status: review)**

- **Tailwind v4 Used**: Project uses Tailwind v4 (not v3.x as originally spec'd) - uses CSS-first configuration with @tailwindcss/vite plugin
- **React 19 Installed**: Latest React version (19.x) instead of React 18 - fully compatible
- **TypeScript 5.9**: Latest TypeScript version
- **Vite 7.3**: Latest Vite version
- **Named Exports**: App.tsx uses `export const App` pattern per architecture constraints
- **Base Styling Applied**: Minimal Tailwind classes already working (bg-slate-50, text-slate-900, text-4xl, font-bold)
- **Bundle Size**: 193KB JS (gzipped: 60KB) - under 100KB target

**Key Files Created:**
- `today-app/src/index.css` - Currently has minimal Tailwind import
- `today-app/src/App.tsx` - Minimal "Today" heading
- `today-app/index.html` - Standard Vite template

[Source: notes/sprint-artifacts/1-1-project-initialization.md#Dev-Agent-Record]

### Testing Standards

Per architecture.md "Development Environment" section:
- Manual visual verification for design token stories
- No automated tests required for styling configuration
- Visual comparison against UX spec color values
- Check Network tab for font file loading

### References

- [Source: notes/architecture.md#Decision-Summary] - Tailwind CSS 3.x selection (note: using v4)
- [Source: notes/architecture.md#ADR-003] - Tailwind + Radix rationale
- [Source: notes/ux-design-specification.md#1.2-Design-Tokens] - Complete token definitions
- [Source: notes/ux-design-specification.md#3.1-Color-System] - Color application guide
- [Source: notes/ux-design-specification.md#3.2-Typography-System] - Typography specs
- [Source: notes/sprint-artifacts/tech-spec-epic-1.md#Story-1.2] - Acceptance criteria
- [Source: notes/sprint-artifacts/1-1-project-initialization.md#Debug-Log-References] - Tailwind v4 usage

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/1-2-design-tokens-and-base-styling.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Implemented Tailwind v4 CSS-first configuration using @theme directive in index.css
- All 15 color tokens defined as CSS custom properties and mapped to Tailwind theme
- Google Fonts loaded with preconnect for performance and font-display: swap for FOUT handling
- Spacing, shadow, and border-radius tokens configured in both :root and @theme
- Created TokenShowcase component for visual verification of all design tokens
- Build passes with no TypeScript/CSS errors (201KB JS, 12KB CSS)

### Completion Notes List

- All design tokens from UX specification implemented in index.css
- Tailwind v4 @theme directive used for color, font, radius, and shadow tokens
- Google Fonts (Playfair Display, DM Sans, JetBrains Mono) integrated with system font fallbacks
- TokenShowcase component displays all tokens for manual verification
- App.tsx updated to use bg-background (design token) instead of bg-slate-50
- ✅ Test Gate PASSED by Vishal (2026-01-06)

### File List

| File | Status | Description |
|------|--------|-------------|
| today-app/src/index.css | Modified | Added design tokens (colors, fonts, spacing, shadows, radius) with CSS variables and Tailwind @theme |
| today-app/index.html | Modified | Added Google Fonts links with preconnect and font-display: swap |
| today-app/src/App.tsx | Modified | Updated to use design token classes, added TokenShowcase component |
| today-app/src/components/TokenShowcase.tsx | Created | Temporary component for visual verification of all design tokens |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-06 | Story drafted | SM Agent |
| 2026-01-06 | Implemented all 6 tasks: design tokens, fonts, spacing, shadows, TokenShowcase component | Dev Agent |
| 2026-01-06 | Story marked done after review | Vishal |
