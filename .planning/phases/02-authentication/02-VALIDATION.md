---
phase: 2
slug: authentication
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Karma/Jasmine |
| **Config file** | `frontend/karma.conf.js` |
| **Quick run command** | `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` |
| **Full suite command** | `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless`
- **After every plan wave:** Run `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-00-01 | 00 | 0 | AUTH-01..04 | scaffold | `npm test -- --watch=false --browsers=ChromeHeadless` | Created by 02-00 | pending |
| 2-01-01 | 01 | 1 | AUTH-01 | unit | `npm test -- --include=**/supabase.service.spec*` | Created by 02-00 | pending |
| 2-01-02 | 01 | 1 | AUTH-02 | unit | `npm test -- --include=**/auth*.guard.spec*` | Created by 02-00 | pending |
| 2-02-01 | 02 | 2 | AUTH-01 | unit | `npm test -- --include=**/login*.spec*` | Created by 02-00 | pending |
| 2-02-02 | 02 | 2 | AUTH-03 | unit | `npm test -- --include=**/auth-callback*.spec*` | Created by 02-00 | pending |
| 2-03-01 | 03 | 2 | AUTH-04 | unit | `npm test -- --include=**/header*.spec*` | Created by 02-00 | pending |
| 2-03-02 | 03 | 2 | AUTH-02 | manual | Full OAuth round-trip (human verify) | N/A | pending |

*Status: pending -- green -- red -- flaky*

---

## Wave 0 Requirements

Fulfilled by **02-00-PLAN.md** (Wave 0):

- [ ] `frontend/src/app/services/supabase.service.spec.ts` — auth state signal + signInWithOAuth + signOut stubs
- [ ] `frontend/src/app/guards/auth.guard.spec.ts` — guard redirect stubs for AUTH-02
- [ ] `frontend/src/app/pages/login/login.component.spec.ts` — login page unit stubs
- [ ] `frontend/src/app/pages/auth-callback/auth-callback.component.spec.ts` — callback component stubs
- [ ] `frontend/src/app/components/header/header.component.spec.ts` — sign-out button stubs (if header spec doesn't exist)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google OAuth consent screen opens | AUTH-01 | Requires live browser + Google Cloud credentials | Click "Sign in with Google" on `/dogly/login`; Google consent screen must appear |
| Session persists after hard refresh | AUTH-02 | Browser state; not unit-testable | Navigate to `/dogly/account`, press Cmd+Shift+R; user must remain authenticated |
| Back button after sign-out does not restore session | AUTH-04 | Browser history; not unit-testable | Sign out, press browser back button; must stay on login page |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (fulfilled by 02-00-PLAN.md)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
