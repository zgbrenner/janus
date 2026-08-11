# Task 4E — Remote CI guard compatibility correction

## Scope

- Updated the fork CI and release workflows, their release-smoke semantic contract, and the two
  current maintainer command references in `README.md` and `docs/operations/release.md`.
- Did not relax action versions, release order, job IDs, or any existing release guards.

## Corrections

### Current preload bridge contract

The Windows desktop post-build guard had retained the obsolete `wsUrl` literal. It now requires a
real generated `preload.cjs` plus the current exposed bridge and IPC symbols:

- `desktopBridge`
- `getLocalEnvironmentBootstraps`
- `getLocalEnvironmentBearerToken`
- `PICK_FOLDER_CHANNEL`
- `pickFolder`

This keeps the missing-or-invalid-bundle failure behavior while validating APIs the desktop
preload actually provides.

### Icon check without global pnpm

The Test job and release preflight now invoke `node scripts/export-brand-icons.ts --check`.
`voidzero-dev/setup-vp` installs the locked Vite Plus command, not a global `pnpm` executable, so
the direct Node invocation is portable across the fork CI runners. The release-smoke contract
requires the direct command in both workflows and rejects `pnpm icons:check` in the CI Test job.
The README and maintainer release instructions use the same command.

## Test-first evidence

- After a successful local `pnpm exec vp run build:desktop`, the old exact PowerShell guard failed
  with `Preload is missing wsUrl`.
- With a PATH limited to the setup-vp and Node locations, `pnpm icons:check` failed with
  `CommandNotFoundException`, matching the remote command-absence contract.
- Red: the expanded release-smoke workflow contract failed before workflow changes with
  `CI test job must run the icon check without a global package-manager command.`
- Green: the current PowerShell preload guard passed against the generated bundle, and the direct
  icon command reported all 30 generated icon assets current.

## Verification evidence

- `pnpm exec vp run build:desktop` — passed. It emitted the existing Vite chunk-size and plugin
  timing/sourcemap warnings.
- Exact updated PowerShell preload guard — passed.
- `node scripts/export-brand-icons.ts --check` — passed.
- `$env:PATH='C:\Users\zgbre\.vite-plus\bin;'+$env:PATH; node scripts/release-smoke.ts` —
  passed (`Release smoke checks passed.`).
- `pnpm exec vp run --filter @t3tools/scripts test` — 19 files and 211 tests passed.
- `pnpm exec vp run --filter @t3tools/scripts typecheck` — passed.
- `pnpm exec vp fmt --check scripts/release-smoke.ts .github/workflows/ci.yml
.github/workflows/release.yml README.md docs/operations/release.md` — passed.
- `pnpm dlx prettier@3.5.3 --check .github/workflows/ci.yml .github/workflows/release.yml
README.md docs/operations/release.md` — passed.
- `git diff --check` — passed.
