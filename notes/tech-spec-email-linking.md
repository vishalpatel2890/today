# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-06
**Project Level:** Quick Flow
**Change Type:** Feature Addition
**Development Context:** Brownfield (existing Today app with Supabase sync)

---

## Context

### Available Documents

| Document | Status | Key Insights |
|----------|--------|--------------|
| PRD (prd.md) | ✅ Loaded | Minimalist philosophy, local-first (now hybrid with Supabase), no complexity |
| Architecture (architecture.md) | ✅ Loaded | React 19 + Vite + Tailwind + Radix UI, useReducer pattern |
| Existing Supabase Integration | ✅ Analyzed | Anonymous auth, real-time sync, RLS policies in place |

### Project Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build Tool | Vite | 7.2.4 |
| Styling | Tailwind CSS | 4.1.18 |
| UI Primitives | Radix UI | 1.1.15+ |
| Backend | Supabase | 2.89.0 (@supabase/supabase-js) |
| Date Handling | date-fns | 4.1.0 |
| Icons | Lucide React | 0.562.0 |

### Existing Codebase Structure

```
today-app/src/
├── lib/supabase.ts              # Supabase client (configured)
├── hooks/
│   ├── useAuth.ts               # Anonymous auth → TO BE EXTENDED
│   ├── useTasks.ts              # Task CRUD with Supabase sync
│   ├── useAutoSurface.ts        # Date-based task surfacing
│   └── useLocalStorage.ts       # LocalStorage persistence
├── components/
│   ├── Header.tsx               # App header → ADD sync icon here
│   ├── Toast.tsx                # Toast notifications → USE for prompt
│   └── ... (12 total components)
├── contexts/ToastContext.tsx    # Toast state management
├── views/                       # Today/Tomorrow/Deferred views
└── types/database.ts            # Supabase types (auto-generated)
```

---

## The Change

### Problem Statement

Anonymous users get a unique user ID per browser/device. Data syncs to Supabase but is isolated per device because each device creates its own anonymous user. Users cannot access their tasks from multiple devices (phone, laptop, work computer).

### Proposed Solution

Add optional email linking via Supabase magic links. Users can:
1. See a prompt after their first task suggesting they link an email
2. Enter their email to receive a magic link
3. Click the link to convert their anonymous account to an email-based account
4. Access the same data from any device by signing in with that email

This preserves the "no account required" simplicity while offering sync for users who want it.

### Scope

**In Scope:**
- Prompt banner after first task creation offering email linking
- Email input UI for magic link request
- Supabase `updateUser` flow to link email to anonymous account
- Magic link verification handling (redirect back to app)
- Cloud icon indicator in header showing sync status
- Error handling: expired links, already-used emails, network errors
- "Check your email" confirmation state

**Out of Scope:**
- Password-based authentication
- Social auth providers (Google, GitHub, Apple)
- Account management (change email, delete account, unlink)
- Onboarding flow for brand new email users (only anonymous → email upgrade)
- Email verification for non-anonymous signups

---

## Implementation Details

### Source Tree Changes

| File | Action | Changes |
|------|--------|---------|
| `src/hooks/useAuth.ts` | MODIFY | Add `linkEmail()`, `isAnonymous`, `isLinked` state |
| `src/components/Header.tsx` | MODIFY | Add SyncStatusIcon component |
| `src/components/SyncStatusIcon.tsx` | CREATE | Cloud icon with linked/unlinked states |
| `src/components/LinkEmailBanner.tsx` | CREATE | Prompt banner shown after first task |
| `src/components/LinkEmailModal.tsx` | CREATE | Radix Dialog for email input + magic link flow |
| `src/hooks/useFirstTaskPrompt.ts` | CREATE | Track if user has seen the link prompt |
| `src/App.tsx` | MODIFY | Add LinkEmailBanner, pass auth state |
| `src/views/TodayView.tsx` | MODIFY | Trigger first-task prompt after addTask |

### Technical Approach

**Supabase Anonymous → Email Upgrade:**

Supabase supports converting anonymous users to permanent accounts via `updateUser`:

```typescript
// Link email to anonymous user
const { error } = await supabase.auth.updateUser({
  email: 'user@example.com'
})
// This sends a magic link to the email
// When clicked, the anonymous user becomes a permanent email user
// Same user_id is preserved → all existing data stays linked
```

**Magic Link Redirect Handling:**

Supabase magic links redirect to the app URL with tokens in the hash. The existing `onAuthStateChange` listener in `useAuth.ts` will automatically pick up the verified session.

**First Task Prompt Logic:**

- Use localStorage flag: `today-app-link-prompt-shown`
- Show banner once after first task is created (not on every session)
- Dismissing sets the flag to prevent re-showing
- Header icon provides permanent access to linking flow

### Existing Patterns to Follow

From `useAuth.ts`:
```typescript
// Arrow function component
export function useAuth() {
  // State with explicit types
  const [user, setUser] = useState<User | null>(null)

  // Dev logging pattern
  if (import.meta.env.DEV) {
    console.log('[Today] Auth: existing session', session.user.id)
  }
}
```

From `Toast.tsx`:
```typescript
// Named export, Tailwind styling
export const Toast = ({ message, type, onClose }: ToastProps) => {
  return (
    <div className="fixed bottom-4 left-1/2 ...">
```

From `Header.tsx`:
```typescript
// Minimal, no semicolons
export const Header = () => {
  return (
    <header className="py-6 text-center">
```

### Integration Points

| Component | Integrates With | How |
|-----------|-----------------|-----|
| `useAuth` | Supabase Auth | `supabase.auth.updateUser()`, `onAuthStateChange` |
| `LinkEmailBanner` | `useAuth` | Reads `isAnonymous`, triggers `linkEmail()` |
| `LinkEmailModal` | `useAuth` | Calls `linkEmail(email)`, shows loading/error states |
| `SyncStatusIcon` | `useAuth` | Reads `isLinked`, `user.email` for tooltip |
| `TodayView` | `useFirstTaskPrompt` | Triggers prompt visibility after `addTask` |
| `App.tsx` | All above | Orchestrates banner visibility, passes props |

---

## Development Context

### Relevant Existing Code

| File | Lines | Reference For |
|------|-------|---------------|
| `src/hooks/useAuth.ts` | 1-62 | Auth hook pattern, state management |
| `src/components/Toast.tsx` | 1-50 | Banner/notification styling |
| `src/components/Header.tsx` | 1-15 | Header layout, icon placement |
| `src/components/DeferModal.tsx` | 1-200 | Radix Dialog usage pattern |
| `src/contexts/ToastContext.tsx` | 1-50 | Context pattern for global state |

### Dependencies

**Framework/Libraries (already installed):**
- `@supabase/supabase-js` v2.89.0 - Auth methods
- `@radix-ui/react-dialog` v1.1.15 - Modal for email input
- `lucide-react` v0.562.0 - Cloud icon (`Cloud`, `CloudOff`)

**No new dependencies required.**

**Internal Modules:**
- `src/lib/supabase.ts` - Supabase client
- `src/contexts/ToastContext.tsx` - Toast notifications for errors

### Configuration Changes

**Supabase Dashboard (manual):**
- Ensure "Email" auth provider is enabled (should already be for magic links)
- Confirm Site URL is set to `http://localhost:5173` (dev) and production URL
- Confirm Redirect URLs include app URLs

**No code configuration changes needed** - `.env.local` already has Supabase credentials.

### Existing Conventions

| Convention | Pattern | Apply To |
|------------|---------|----------|
| Exports | Named exports, no default | All new files |
| Functions | Arrow functions | All components/hooks |
| Semicolons | None | All TypeScript |
| Logging | `console.log('[Today]', ...)` in DEV | New auth flows |
| Styling | Tailwind utility classes | All components |
| State | useState with explicit types | useAuth extensions |
| Modals | Radix Dialog | LinkEmailModal |

### Test Framework & Standards

**Note:** No test files currently exist in the project. Testing patterns from architecture.md suggest:
- Vitest + Testing Library (not yet set up)
- Test files: `*.test.ts` / `*.test.tsx`

For this feature, manual testing is sufficient given project scope.

---

## Implementation Stack

| Layer | Technology | Version | Usage |
|-------|------------|---------|-------|
| Runtime | Node.js | 18+ | Development |
| Framework | React | 19.2.0 | UI components |
| Language | TypeScript | 5.9.3 | Type safety |
| Styling | Tailwind CSS | 4.1.18 | Component styling |
| UI Primitives | Radix UI | 1.1.15 | Modal dialog |
| Auth | Supabase Auth | 2.89.0 | Magic link, user management |
| Icons | Lucide React | 0.562.0 | Cloud sync icon |
| Build | Vite | 7.2.4 | Dev server, bundling |

---

## Technical Details

### Magic Link Flow Sequence

```
1. User creates first task
   └─> TodayView triggers useFirstTaskPrompt
   └─> LinkEmailBanner appears at bottom

2. User clicks "Link" on banner
   └─> LinkEmailModal opens
   └─> User enters email, clicks "Send Link"

3. App calls supabase.auth.updateUser({ email })
   └─> Supabase sends magic link email
   └─> Modal shows "Check your email" state

4. User clicks link in email
   └─> Browser opens app URL with tokens
   └─> Supabase client auto-exchanges tokens
   └─> onAuthStateChange fires with updated user

5. useAuth updates state
   └─> isLinked = true, user.email populated
   └─> SyncStatusIcon shows solid cloud
   └─> Modal closes (if still open)
```

### State Shape Extensions (useAuth)

```typescript
interface AuthState {
  user: User | null
  isLoading: boolean
  error: Error | null
  // New fields:
  isAnonymous: boolean      // user?.is_anonymous ?? true
  isLinked: boolean         // !isAnonymous && !!user?.email
  linkingStatus: 'idle' | 'sending' | 'sent' | 'error'
  linkingError: string | null
}
```

### Error Scenarios

| Error | Detection | User Message |
|-------|-----------|--------------|
| Email already used | Supabase error code | "This email is already linked to another account" |
| Invalid email format | Client validation | "Please enter a valid email" |
| Magic link expired | User reports / Supabase | "Link expired. Request a new one." |
| Network error | Catch block | "Connection error. Please try again." |
| Rate limited | Supabase error | "Too many attempts. Please wait a moment." |

### localStorage Keys

| Key | Purpose | Value |
|-----|---------|-------|
| `today-app-auth` | Supabase session (existing) | JWT tokens |
| `today-app-state` | Task/category data (existing) | JSON |
| `today-app-link-prompt-dismissed` | Track if user dismissed prompt | `"true"` |

---

## Development Setup

```bash
# Already set up - just run:
cd today-app
npm run dev

# Opens http://localhost:5173
# Supabase credentials in .env.local
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b feature/email-linking`
2. Verify dev server running: `npm run dev`
3. Verify Supabase connection: Check console for `[Today] Auth:` logs
4. Review existing code: `useAuth.ts`, `Header.tsx`, `Toast.tsx`

### Implementation Steps

**Story 1: Link Email UI + Send Magic Link**

1. Extend `useAuth.ts`:
   - Add `isAnonymous`, `isLinked` computed properties
   - Add `linkEmail(email)` function
   - Add `linkingStatus`, `linkingError` state

2. Create `SyncStatusIcon.tsx`:
   - Cloud icon (Lucide)
   - Hollow when anonymous, solid when linked
   - Tooltip showing email when linked
   - Click opens LinkEmailModal

3. Create `LinkEmailModal.tsx`:
   - Radix Dialog
   - Email input with validation
   - Submit button → calls `linkEmail()`
   - Loading state while sending
   - "Check your email" success state
   - Error display

4. Update `Header.tsx`:
   - Add SyncStatusIcon to right side

**Story 2: First-Task Prompt + Verification Handling**

1. Create `useFirstTaskPrompt.ts`:
   - Check localStorage for dismissed flag
   - Track if first task was just created
   - Return `{ showPrompt, dismissPrompt }`

2. Create `LinkEmailBanner.tsx`:
   - Fixed position bottom banner
   - "Sync across devices?" message
   - [Link] button opens modal
   - [×] dismisses and sets localStorage flag

3. Update `TodayView.tsx`:
   - After successful `addTask`, check if first task
   - Trigger prompt visibility

4. Update `App.tsx`:
   - Render LinkEmailBanner conditionally
   - Pass auth state to children

5. Handle magic link verification:
   - Existing `onAuthStateChange` handles this
   - Verify user state updates correctly
   - Test modal closes on success

### Testing Strategy

**Manual Testing Checklist:**

- [ ] First task creation shows banner (new browser/incognito)
- [ ] Banner dismiss persists across page refresh
- [ ] Cloud icon shows hollow when anonymous
- [ ] Clicking cloud icon opens modal
- [ ] Invalid email shows validation error
- [ ] Valid email sends magic link (check email)
- [ ] Modal shows "Check your email" state
- [ ] Clicking magic link redirects to app
- [ ] User state updates (isLinked = true)
- [ ] Cloud icon becomes solid after linking
- [ ] Tooltip shows linked email
- [ ] Second device can sign in with same email
- [ ] Data syncs between devices

### Acceptance Criteria

**Story 1:**
- [ ] AC1.1: `useAuth` exposes `isAnonymous`, `isLinked`, `linkEmail()`
- [ ] AC1.2: SyncStatusIcon renders in Header
- [ ] AC1.3: Icon shows correct state (hollow/solid)
- [ ] AC1.4: LinkEmailModal opens on icon click
- [ ] AC1.5: Valid email triggers `updateUser` call
- [ ] AC1.6: Success shows "Check your email" message
- [ ] AC1.7: Errors display appropriately

**Story 2:**
- [ ] AC2.1: Banner appears after first task (anonymous user)
- [ ] AC2.2: Banner does not appear for linked users
- [ ] AC2.3: Dismiss button hides banner and sets localStorage
- [ ] AC2.4: Banner does not reappear after dismiss
- [ ] AC2.5: Link button opens LinkEmailModal
- [ ] AC2.6: Magic link click updates auth state
- [ ] AC2.7: Icon updates to solid after successful link
- [ ] AC2.8: Cross-device sync works with linked email

---

## Developer Resources

### File Paths Reference

**Existing (to modify):**
- `/today-app/src/hooks/useAuth.ts`
- `/today-app/src/components/Header.tsx`
- `/today-app/src/App.tsx`
- `/today-app/src/views/TodayView.tsx`

**New (to create):**
- `/today-app/src/components/SyncStatusIcon.tsx`
- `/today-app/src/components/LinkEmailModal.tsx`
- `/today-app/src/components/LinkEmailBanner.tsx`
- `/today-app/src/hooks/useFirstTaskPrompt.ts`

### Key Code Locations

| What | File | Reference |
|------|------|-----------|
| Supabase client | `src/lib/supabase.ts` | Import for auth calls |
| Auth state listener | `src/hooks/useAuth.ts:50-54` | `onAuthStateChange` pattern |
| Toast styling | `src/components/Toast.tsx` | Banner appearance reference |
| Modal pattern | `src/components/DeferModal.tsx` | Radix Dialog usage |
| Header layout | `src/components/Header.tsx` | Icon placement |

### Testing Locations

Manual testing only for this feature. No automated tests required.

### Documentation to Update

- [ ] README.md - Add "Sync across devices" feature mention
- [ ] (Optional) Add inline JSDoc to new hooks/components

---

## UX/UI Considerations

### Components Affected

| Component | Change | Notes |
|-----------|--------|-------|
| Header | Add icon | Right side, subtle |
| New: SyncStatusIcon | Cloud icon | Lucide `Cloud` / `CloudOff` |
| New: LinkEmailBanner | Bottom banner | Dismissible, non-blocking |
| New: LinkEmailModal | Centered dialog | Radix Dialog, matches DeferModal style |

### Visual Design

**SyncStatusIcon:**
- Size: 20px (matches existing icon sizes)
- Color: `text-muted-foreground` (unlinked), `text-foreground` (linked)
- Hover: Slight opacity change
- Position: Header right side

**LinkEmailBanner:**
- Position: Fixed bottom, above any existing toasts
- Background: `bg-white` with subtle shadow
- Text: "Sync across devices?" in `text-sm`
- Buttons: [Link] primary style, [×] ghost/icon

**LinkEmailModal:**
- Width: Match DeferModal (~400px max)
- Content: Email input + action button
- States: Input → Loading → Success/Error

### Accessibility

- Modal traps focus (Radix handles this)
- Escape closes modal
- Cloud icon has `aria-label`: "Sync status: [unlinked/linked to email]"
- Banner has `role="alert"` for screen readers
- Email input has proper label association

---

## Testing Approach

### Manual Test Plan

1. **Fresh user flow:**
   - Open incognito browser
   - Add first task
   - Verify banner appears
   - Verify cloud icon is hollow

2. **Link flow:**
   - Click Link on banner (or cloud icon)
   - Enter valid email
   - Verify "Check your email" message
   - Open email, click magic link
   - Verify redirect to app
   - Verify cloud icon solid
   - Verify tooltip shows email

3. **Cross-device:**
   - Open different browser/device
   - Click cloud icon
   - Enter same email
   - Click magic link
   - Verify same tasks appear

4. **Error handling:**
   - Try invalid email format
   - Try email already linked to different account
   - Try with network disabled

---

## Deployment Strategy

### Deployment Steps

1. Merge PR to main
2. Vercel auto-deploys (or manual `npm run build` + deploy)
3. Update Supabase Dashboard redirect URLs if needed
4. Test magic link flow on production URL

### Rollback Plan

1. Revert merge commit
2. Redeploy previous version
3. No data migration needed (additive change only)

### Monitoring

- Check Supabase Auth logs for errors
- Monitor console for `[Today] Auth:` errors in production
- User feedback on magic link delivery

---

*Generated by BMAD Tech-Spec Workflow*
*Date: 2026-01-06*
