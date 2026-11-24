# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

u-choose is a group restaurant picker: users join a session and swipe on nearby restaurants Tinder-style, and the results are ranked by vote. It is a web app, with Tauri v2 used only as a shell for Android/iOS/desktop. Frontend: React Router v7 (SPA mode, `ssr: false`), MUI + Toolpad Core. Backend: Firebase (Auth + Realtime Database). The Rust side (`backend/`) is still essentially the Tauri template; all application logic lives in `frontend/src/`.

The product roadmap, key decisions and open questions are in [docs/overview.md](docs/overview.md). Read it before starting feature work, and keep its checkboxes and decisions up to date.

## Commands

Yarn 4 is the package manager, with `node_modules` linking. The executable is committed in `.yarn/releases` and any global `yarn` delegates to it through `.yarnrc.yml`. CI uses `yarn install --immutable`.

- `yarn dev`: Vite dev server only (browser), fixed port 1420 (`strictPort`, fails if the port is taken)
- `yarn tauri dev`: desktop app (runs `yarn dev` first)
- `yarn tauri build`: desktop bundle (runs `yarn build`, serves `frontend/build/client`)
- `yarn build`: frontend build
- `yarn typecheck`: `react-router typegen && tsc -b`. Run typegen before tsc, because route modules import generated `./+types/<route>` types from `frontend/.react-router/types`.
- `yarn lint` / `yarn lint:fix`: ESLint + Prettier
- `yarn knip`: unused files/exports/dependencies check
- `yarn firebase emulators:start`: local Auth (9099) and RTDB (9000) emulators; the UI is on 3001. The app does **not** connect to them yet: the `connectAuthEmulator` call in `frontend/src/api/firebase/config.ts` is commented out.

There is no test framework set up. Vitest files will go in `frontend/tests`. Rust integration tests go in `backend/tests`, and each needs a `[[test]]` entry in `Cargo.toml` because Cargo only discovers `tests/` beside it.

CI (`.github/workflows/validate.yml`, on PRs to `develop`/`release`) runs typecheck, lint, knip, then build. Run all four before you open a PR.

## Architecture

- **Layout**: `frontend/` is the React Router/Vite root (its scripts run from there, because React Router needs the working directory to be its root). `backend/` holds the Rust source. `Cargo.toml`, `tauri.conf.json`, `capabilities/`, `icons/` and `gen/` are in the repo root. `.env` files are in the root too (`envDir`).
- **TypeScript**: the root `tsconfig.json` only references `tsconfig.app.json` (browser code in `frontend/`) and `tsconfig.node.json` (config files and `scripts/`). Ambient `.d.ts` files go in `frontend/types`.
- **Watching**: `.taurignore` is a denylist, so add new top-level files or folders that should not restart `tauri dev`.
- **Routing**: file-based routing via `flatRoutes()` (`frontend/src/routes.ts`), using React Router flat-route naming. `_dashboard.tsx` is a pathless layout route. It redirects to `/auth/signin` when there's no Toolpad session, and wraps children in `DashboardLayout`/`PageContainer`. `_dashboard.*.tsx` routes are its authenticated children.
- **Auth/session flow**: `frontend/src/root.tsx` subscribes to `firebaseAuth.onIdTokenChanged` and maps the Firebase user into a Toolpad `Session`. It passes that session to `ReactRouterAppProvider`, which adapts React Router's location/navigate to Toolpad's `AppProvider` router interface. Components read auth state with Toolpad's `useSession()`, not Firebase directly. Sign-in functions in `frontend/src/api/firebase/auth.ts` use session persistence and return a `{ success, user, error }` discriminated union instead of throwing.
- **Firebase layer**: `frontend/src/api/firebase/config.ts` initializes the app from `VITE_FIREBASE_*` env vars (in `.env`), with `databaseURL` hardcoded. `db.ts` holds all Realtime Database access. The data model is `sessions/{pushKey}` with `messages/{pushKey}: { message }` under each session. Push keys are 20 characters long, and the zod schemas rely on that length.
- **Forms**: react-hook-form + `zodResolver` with MUI `Controller` fields. Schemas and inferred types live in `frontend/src/validations/`. `sessionSchema` does an async `.refine` that queries RTDB to check that the session exists.
- **Path alias**: `~/*` → `frontend/src/*`.
- `database.rules.json` currently has time-limited open read/write rules (test-mode style), not real security rules.

## Conventions and release

- Commits follow Conventional Commits, configured in `commitlint.config.ts`; there are no git hooks, so run `yarn commitlint --last` to check. The allowed types include a custom `break` type, which triggers a major release.
- Branches: work on `develop`, which semantic-release publishes as prereleases. `release` is the main branch. A push to it builds Linux and Windows Tauri bundles and publishes a GitHub release. semantic-release writes the version into both `package.json` and `tauri.conf.json` via `scripts/set_version.ts`, so don't bump versions by hand.

### Commit messages

Whenever asked to generate a commit message:

- Wrap lines at 80 characters.
- Use the Conventional Commits format.
- Do not use scopes/groups in the tag (`feat: ...`, not `feat(group): ...`).
- Do not include `Co-Authored-By` lines.
