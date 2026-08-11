# Task 4B — Reachable copy and desktop categories

## Scope

- Updated only the assigned chat landing and Settings presentation surfaces.
- Preserved internal compatibility identifiers such as `useThreadShells`, `useNewThreadHandler`,
  `scopeProjectRef`, `stackedThreadToast`, and the existing `T3CODE_*` environment variables.

## User-visible terminology

- Replaced rendered legacy T3 Code product references with Janus.
- Replaced rendered thread references with task and project references with workspace on the assigned
  landing and Connections copy, including WSL restart and availability messaging.
- Updated theme artwork and keybinding warnings to name Janus and workspaces.

## Desktop categories

- macOS: `public.app-category.productivity`.
- Linux: `Office`.

These are valid electron-builder platform values and describe knowledge/productivity work without
retaining the developer-only category.

## Test-first evidence

- Added the platform category assertions in `scripts/build-desktop-artifact.test.ts` before the
  implementation change.
- Red: `pnpm exec vp test run scripts/build-desktop-artifact.test.ts` failed because macOS still
  returned `public.app-category.developer-tools` instead of
  `public.app-category.productivity`.
- Green: the same focused command passed, with 31/31 tests passing.

## Verification evidence

- `pnpm exec vp run --filter @t3tools/web typecheck` — passed.
- `pnpm exec vp run --filter @t3tools/web build` — passed; Vite built 4,502 modules. It emitted
  the existing plugin-timing and >500 kB bundle-size warnings.
- `pnpm exec vp run --filter @t3tools/scripts typecheck` — passed.
- `pnpm exec vp run --filter @t3tools/web test` — 2,157 passing, 14 skipped; failed only because
  the unrelated `src/components/chat/MessagesTimeline.test.tsx` `beforeAll` import hook timed out
  at 30 seconds.
- `pnpm run release:smoke` — blocked on this Windows host before product checks: its direct
  `execFileSync("vp", ...)` call returns `ENOENT`. Retrying with the repository-local
  `node_modules/.bin` prepended to `PATH` produced the same result; `vp.cmd` direct spawn returns
  `EINVAL`. The release-smoke script is outside this task's ownership and was not changed.
- `pnpm exec vp fmt` ran on the six changed source/test files.
- `git diff --check` passed.
