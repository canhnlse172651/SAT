---
feature: 001
plan: ./plan.md
created: 2026-10-23
---

# Tasks — Accounts and Authentication

<!--
Line format (machine-parsed by sdd):
  - [ ] T### [tags] <imperative description> (AC-x.y, AC-x.z) — files: `path/a`, `path/b`
State: [ ] todo · [~] in progress · [x] done · [!] blocked — change with: node .sdd/scripts/sdd.mjs task T### <state>
Lean mode (constitution 2.0.0): one task per REQ; module behaviour is verified by test-cases.md (QA, /test-module 001);
foundation files touched by [infra] tasks keep their Vitest tests.
-->

## Phase 1: Foundation

- [x] T001 [infra] Shared account contracts and field rules, e-mail port events + dev provider simulation, ApiError details and 401 reason in the session store, fflate dependency — files: `packages/shared/src/accounts.ts`, `apps/api/src/common/ports/email.ts`, `apps/web/src/lib/api-client.ts`, `apps/web/src/features/session/session-store.ts`, `apps/api/package.json`
- [x] T002 [infra] Accounts module skeleton: users/workspaces models, WORKSPACE_DIRECTORY + session principal resolver, throttle and audit services; repoint test factories, dev sign-in and seed; drop dev_* collections — files: `apps/api/src/modules/accounts/accounts.module.ts`, `apps/api/src/modules/accounts/accounts.model.ts`, `apps/api/src/common/directory/workspace-directory.ts`, `apps/api/src/test/factories.ts`, `apps/api/src/seed.ts`

## Phase 2: Sign-up, sign-in, sessions (US-1, US-2, US-6, US-8)

- [x] T010 REQ-2 Common input and password rules: required/format messages, e-mail normalisation, password rules checklist, random HV passwords, no password ever shown (AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5, AC-2.6) — files: `packages/shared/src/accounts.ts`, `apps/api/src/modules/accounts/passwords.ts`, `apps/web/src/features/auth/PasswordRules.tsx`, `apps/web/src/features/auth/fields.tsx`
- [x] T011 REQ-1 GV sign-up on A02: workspace + GV, unique e-mail, field errors, no HV self sign-up (AC-1.1, AC-1.2, AC-1.3, AC-1.4) — files: `apps/api/src/modules/accounts/auth.controller.ts`, `apps/api/src/modules/accounts/auth.service.ts`, `apps/web/src/features/auth/RegisterPage.tsx`, `apps/web/src/features/auth/auth-store.ts`, `apps/web/src/app/routes.tsx`
- [x] T012 REQ-3 Sign-in on A01 with role home, generic failure, locked HV message, signed-in users kept out of A01/A02/A03 (AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5) — files: `apps/api/src/modules/accounts/auth.service.ts`, `apps/web/src/features/auth/LoginPage.tsx`, `apps/web/src/features/auth/RedirectIfSignedIn.tsx`
- [x] T013 REQ-4 Temporary sign-in lock after 5 failures in 15 minutes, same answer for unknown e-mails, counter reset (AC-4.1, AC-4.2, AC-4.3, AC-4.4) — files: `apps/api/src/modules/accounts/throttle.service.ts`, `apps/api/src/modules/accounts/auth.service.ts`
- [x] T014 REQ-5 Sessions: logout dialog, idle expiry GV 8 h / HV 30 days, expired-session notice, returnTo, several sessions per account (AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-5.6) — files: `apps/api/src/modules/accounts/auth.controller.ts`, `apps/web/src/features/account/LogoutButton.tsx`, `apps/web/src/features/session/RequireRole.tsx`, `apps/web/src/layouts/TeacherShell.tsx`
- [x] T015 REQ-6 GV forgot / reset password on A03: generic answer, 60-minute single-use link, 3 mails per hour, sessions ended, invalid-link screen (AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-6.6) — files: `apps/api/src/modules/accounts/password-reset.service.ts`, `apps/api/src/modules/accounts/password-reset.model.ts`, `apps/web/src/features/auth/ForgotPasswordPage.tsx`
- [ ] T016 REQ-16 Workspace isolation and role rules on every student endpoint and screen (AC-16.1, AC-16.2, AC-16.3, AC-16.4, AC-16.5) — files: `apps/api/src/modules/accounts/students.controller.ts`, `apps/api/src/modules/accounts/students.repository.ts`

## Phase 3: Students (US-3, US-4, US-5)

- [ ] T017 REQ-8 Add one student in T12 (pending, no mail), "Vừa thêm" list, close without confirmation, validation (AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-8.5) — files: `apps/api/src/modules/accounts/students.service.ts`, `apps/web/src/features/students/AddStudentsDialog.tsx`, `apps/web/src/features/students/students-store.ts`
- [ ] T018 REQ-11 Student list T11: columns, newest first, 50 per page, accent-insensitive search, status filters with counts, empty states, edit (AC-11.1, AC-11.2, AC-11.3, AC-11.4, AC-11.5, AC-11.6) — files: `apps/api/src/modules/accounts/students.service.ts`, `apps/web/src/features/students/StudentsPage.tsx`, `apps/web/src/features/students/EditStudentDialog.tsx`
- [ ] T019 REQ-17 Account e-mail templates and the read-only preview drawer (AC-17.1, AC-17.2, AC-17.3, AC-17.4, AC-17.5, AC-17.6) — files: `apps/api/src/modules/accounts/account-mail.templates.ts`, `apps/web/src/features/students/EmailPreviewDrawer.tsx`
- [ ] T020 REQ-7 Activate one or many students: random password mailed, "Đang gửi email", confirm dialog with skipped count, 500 limit, status re-check, pending students usable in classes (AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5, AC-7.6) — files: `apps/api/src/modules/accounts/student-mail.service.ts`, `apps/api/src/modules/accounts/students.service.ts`, `apps/web/src/features/students/BulkBar.tsx`
- [ ] T021 REQ-18 Delivery results, failed banner, resend one / many, per-student and per-workspace sending limits (AC-18.1, AC-18.2, AC-18.3, AC-18.4, AC-18.5, AC-18.6) — files: `apps/api/src/modules/accounts/student-mail.service.ts`, `apps/api/src/modules/accounts/account-email.model.ts`, `apps/web/src/features/students/students-store.ts`
- [ ] T022 REQ-12 Reset password, lock, unlock, locked-session message, actions offered by status (AC-12.1, AC-12.2, AC-12.3, AC-12.4, AC-12.5, AC-12.6) — files: `apps/api/src/modules/accounts/students.service.ts`, `apps/web/src/features/students/StudentRowActions.tsx`
- [ ] T023 REQ-13 Delete a student without submissions; refuse with "Khóa tài khoản" otherwise (AC-13.1, AC-13.2, AC-13.3) — files: `apps/api/src/modules/accounts/students.service.ts`, `apps/api/src/modules/accounts/student-links.ts`, `apps/web/src/features/students/StudentRowActions.tsx`
- [ ] T024 REQ-9 Excel template and file check report (AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5) — files: `apps/api/src/modules/accounts/xlsx.ts`, `apps/api/src/modules/accounts/student-import.service.ts`, `apps/web/src/features/students/ImportTab.tsx`
- [ ] T025 REQ-10 Confirm an import: valid rows only, result list, no mail, disabled when nothing valid, all-or-nothing re-check (AC-10.1, AC-10.2, AC-10.3, AC-10.4, AC-10.5) — files: `apps/api/src/modules/accounts/student-import.service.ts`, `apps/web/src/features/students/ImportTab.tsx`

## Phase 4: Own account and self-study entry (US-7, US-10)

- [ ] T026 REQ-14 GV account T17: name, e-mail change with current password (AC-14.1, AC-14.2, AC-14.3) — files: `apps/api/src/modules/accounts/account.service.ts`, `apps/api/src/modules/accounts/account.controller.ts`, `apps/web/src/features/account/AccountPage.tsx`
- [ ] T027 REQ-15 Change password for GV (T17) and HV (S10, 001 part), wrong-password limit per session, password source (AC-15.1, AC-15.2, AC-15.3, AC-15.4, AC-15.5) — files: `apps/api/src/modules/accounts/account.service.ts`, `apps/web/src/features/account/ChangePasswordForm.tsx`, `apps/web/src/features/account/StudentAccountPage.tsx`
- [ ] T028 REQ-20 Self-study entry points and rules: "Tự học" tab, "Kho tự học" item, GV/HV redirects, privacy and deletion hooks, logout warning hook (AC-20.1, AC-20.2, AC-20.3, AC-20.4, AC-20.5, AC-20.6, AC-20.7, AC-20.8, AC-20.9, AC-20.10) — files: `apps/api/src/modules/accounts/student-links.ts`, `apps/web/src/features/account/logout-guard.ts`, `apps/web/src/layouts/StudentShell.tsx`
