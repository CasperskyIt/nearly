---
phase: 1
slug: foundation-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Karma / Jasmine (Angular default) |
| **Config file** | `frontend/karma.conf.js` |
| **Quick run command** | `cd frontend && npm test -- --watch=false` |
| **Full suite command** | `cd frontend && npm test -- --watch=false` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npm test -- --watch=false`
- **After every plan wave:** Run `cd frontend && npm test -- --watch=false`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | FOUND-01 | manual | `git log --all -S "supabase.co"` | ✅ | ⬜ pending |
| 1-01-02 | 01 | 1 | FOUND-01 | manual | check `.gitignore` for `.env` entries | ✅ | ⬜ pending |
| 1-02-01 | 02 | 1 | FOUND-02 | unit | `cd frontend && npm test -- --watch=false` | ✅ | ⬜ pending |
| 1-02-02 | 02 | 1 | FOUND-02 | lint | `wc -l frontend/src/app/pages/home/home.component.ts` | ✅ | ⬜ pending |
| 1-03-01 | 03 | 1 | FOUND-03 | grep | `grep -r "Math.random\|loadMockData\|mockPlaces" frontend/src/app --include="*.ts"` | ✅ | ⬜ pending |
| 1-03-02 | 03 | 1 | FOUND-03 | grep | `grep -r "console\.\(log\|error\)" frontend/src/app --include="*.ts"` | ✅ | ⬜ pending |
| 1-03-03 | 03 | 1 | FOUND-03 | unit | `cd frontend && npm test -- --watch=false` | ⬜ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/app/app.component.spec.ts` — fix or replace with passing stub (provides `provideRouter([])`)

*Existing Karma infrastructure is in place; only the broken spec needs repair.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `.env` file is gitignored and not committed | FOUND-01 | Git state not checkable by unit test | Run `git status` after creating `.env`; confirm it appears as untracked and is NOT staged |
| Angular build uses `fileReplacements` to inject credentials | FOUND-01 | Build output verification | Run `npm run build` and verify `dist/` files do not contain the placeholder `YOUR_SUPABASE_URL` |
| `HomeComponent` renders correctly after decomposition | FOUND-02 | Visual regression | Start dev server, navigate to `/nearly` and `/dogly`, confirm map and place list display |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
