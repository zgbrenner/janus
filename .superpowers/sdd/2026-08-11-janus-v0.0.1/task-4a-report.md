# Task 4A report: WSL state isolation correction

## Result

The WSL backend now sends `t3Home: "~/.janus"` in its bootstrap envelope.
That gives the Linux server an explicit Janus-native default and prevents its
normal server fallback from creating or using `~/.t3`.

`T3CODE_HOME` remains removed from the inherited WSL process environment. A
Windows-form explicit override is therefore still honored by the Windows
primary, but cannot become an invalid `/mnt/c` path or a shared SQLite state
directory in the WSL backend.

## Regression coverage

- Default WSL configuration asserts `bootstrap.t3Home === "~/.janus"`, rejects
  `~/.t3`, and confirms that `T3CODE_HOME` is absent from the launched WSL
  environment.
- Windows-form explicit `T3CODE_HOME` coverage asserts that the WSL bootstrap
  remains `~/.janus`, rejects the Windows path, and keeps the variable absent
  from its environment.

## Red-green evidence

- Before the production change, the focused configuration test failed twice:
  both sentinels received `undefined` for `wsl.bootstrap.t3Home` where
  `"~/.janus"` was required.
- After adding the bootstrap value, the same focused test command passed all
  24 tests.

## Verification

- `pnpm exec vp test run apps/desktop/src/backend/DesktopBackendConfiguration.test.ts`
  - passed: 1 file, 24 tests.
- `pnpm --filter @t3tools/desktop typecheck`
  - passed (exit 0). It emitted two pre-existing Effect suggestions in
    `DesktopBackendPool.test.ts` and `DesktopWslEnvironment.ts`, outside this
    change.
- `pnpm exec vp fmt --check apps/desktop/src/backend/DesktopBackendConfiguration.ts apps/desktop/src/backend/DesktopBackendConfiguration.test.ts`
  - passed after formatting the owned test file.
- `git diff --check`
  - passed.

Full desktop tests were not run: this configuration-only correction has a
focused behavior test and the repository guidance calls for the smallest proof
rather than repo-wide checks.
