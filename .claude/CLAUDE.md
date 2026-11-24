# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

u-choose is a group restaurant picker: users join a session and swipe on nearby restaurants Tinder-style, and the results are ranked by vote. It is a web app, with Tauri v2 used only as a shell for Android/iOS/desktop. Frontend: React Router v7 (SPA mode, `ssr: false`), MUI + Toolpad Core. Backend: Firebase (Auth + Realtime Database). The Rust side (`src-tauri/`) is still essentially the Tauri template; all application logic lives in `app/`.

The product roadmap, key decisions and open questions are in [docs/overview.md](docs/overview.md). Read it before starting feature work, and keep its checkboxes and decisions up to date.

## Commands

npm is the package manager used by CI (`npm ci`); ignore the stray `yarn.lock`.

- `npm run dev`: Vite dev server only (browser), fixed port 1420 (`strictPort`, fails if the port is taken)
- `npm run tauri dev`: desktop app (runs `npm run dev` first)
- `npm run tauri build`: desktop bundle (runs `npm run build`, serves `build/client`)
- `npm run build`: frontend build
- `npm run typecheck`: `react-router typegen && tsc`. Run typegen before tsc, because route modules import generated `./+types/<route>` types from `.react-router/types`.
- `npm run lint` / `npm run lint:fix`: ESLint + Prettier
- `npm run knip`: unused files/exports/dependencies check
- `npm run firebase -- emulators:start`: local Auth (9099) and RTDB (9000) emulators; the UI is on 3001. The app does **not** connect to them yet: the `connectAuthEmulator` call in `app/api/firebase/config.ts` is commented out.

There is no test framework set up.

CI (`.github/workflows/validate.yml`, on PRs to `develop`/`release`) runs typecheck, lint, knip, then build. Run all four before you open a PR.

## Architecture

- **Routing**: file-based routing via `flatRoutes()` (`app/routes.ts`), using React Router flat-route naming. `_dashboard.tsx` is a pathless layout route. It redirects to `/auth/signin` when there's no Toolpad session, and wraps children in `DashboardLayout`/`PageContainer`. `_dashboard.*.tsx` routes are its authenticated children.
- **Auth/session flow**: `app/root.tsx` subscribes to `firebaseAuth.onIdTokenChanged` and maps the Firebase user into a Toolpad `Session`. It passes that session to `ReactRouterAppProvider`, which adapts React Router's location/navigate to Toolpad's `AppProvider` router interface. Components read auth state with Toolpad's `useSession()`, not Firebase directly. Sign-in functions in `app/api/firebase/auth.ts` use session persistence and return a `{ success, user, error }` discriminated union instead of throwing.
- **Firebase layer**: `app/api/firebase/config.ts` initializes the app from `VITE_FIREBASE_*` env vars (in `.env`), with `databaseURL` hardcoded. `db.ts` holds all Realtime Database access. The data model is `sessions/{pushKey}` with `messages/{pushKey}: { message }` under each session. Push keys are 20 characters long, and the zod schemas rely on that length.
- **Forms**: react-hook-form + `zodResolver` with MUI `Controller` fields. Schemas and inferred types live in `app/validations/`. `sessionSchema` does an async `.refine` that queries RTDB to check that the session exists.
- **Path alias**: `~/*` → `app/*`.
- `database.rules.json` currently has time-limited open read/write rules (test-mode style), not real security rules.

## Conventions and release

- Conventional Commits are enforced by commitlint via a husky `commit-msg` hook. The allowed types include a custom `break` type, which triggers a major release. The pre-commit hook runs lint-staged (prettier + eslint on staged files).
- Branches: work on `develop`, which semantic-release publishes as prereleases. `release` is the main branch. A push to it builds Linux and Windows Tauri bundles and publishes a GitHub release. semantic-release writes the version into both `package.json` and `src-tauri/tauri.conf.json` via `scripts/set_version.ts`, so don't bump versions by hand.

### Commit messages

Whenever asked to generate a commit message:

- Wrap lines at 80 characters.
- Use the Conventional Commits format.
- Do not use scopes/groups in the tag (`feat: ...`, not `feat(group): ...`).
- Do not include `Co-Authored-By` lines.
