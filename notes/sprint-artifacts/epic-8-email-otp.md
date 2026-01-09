# Epic 8: Email OTP Authentication for PWA

## Epic Overview

**Epic ID:** E8
**Epic Name:** Email OTP Authentication
**Epic Slug:** email-otp
**Priority:** High
**Status:** Draft

## Problem Statement

Magic links don't work properly in PWA (installed app) contexts on mobile devices. When users click a magic link in their email app, it opens in the system browser instead of the installed PWA, resulting in failed authentication.

## Objective

Implement Email OTP (One-Time Password) authentication as an alternative to magic links, allowing PWA users to authenticate by entering a 6-digit code directly in the app.

## Success Criteria

- [ ] Users can receive a 6-digit verification code via email
- [ ] Users can enter the code in the PWA to authenticate
- [ ] Session is created directly in the PWA context
- [ ] Cross-device sync works after OTP authentication
- [ ] Existing magic link flow preserved for browser users

## Stories

| Story ID | Story Name | Priority | Points | Status |
|----------|------------|----------|--------|--------|
| 8.1 | OTP Input Component | High | 3 | Draft |
| 8.2 | Extend useAuth with verifyOtp | High | 3 | Draft |
| 8.3 | Update LinkEmailModal with OTP Entry | High | 5 | Draft |

## Technical Approach

### Supabase Email OTP

Supabase natively supports Email OTP via the same `signInWithOtp()` method. The key difference:

- **Magic Link:** Include `emailRedirectTo` option → sends clickable link
- **OTP Code:** Omit `emailRedirectTo` option → sends 6-digit code

The email template must include `{{ .Token }}` to display the code.

### Flow

```
1. User enters email → signInWithOtp() called
2. Supabase sends email with 6-digit code
3. User enters code in OtpInput component
4. App calls verifyOtp(email, token, 'email')
5. Session created, user authenticated
```

## Dependencies

- Supabase Dashboard email template must be updated (manual, one-time)
- No new npm dependencies required

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Email template not updated | OTP won't appear in email | Document clearly, test before deploy |
| Code expires (60s default) | User frustration | Show clear expiration, resend option |
| Rate limiting | User blocked | Show rate limit message, wait timer |

## Out of Scope

- Phone/SMS OTP (requires paid SMS provider)
- Automatic OTP detection from clipboard
- Password-based authentication
- Social auth providers

## References

- [Tech Spec: Email OTP](/notes/tech-spec-email-otp.md)
- [Supabase OTP Docs](https://supabase.com/docs/guides/auth/auth-email-passwordless#with-otp)
- [Epic 5: Email Linking](/notes/sprint-artifacts/epic-5-email-linking.md)

---

*Epic created as part of BMAD tech-spec workflow*
*Date: 2026-01-08*
