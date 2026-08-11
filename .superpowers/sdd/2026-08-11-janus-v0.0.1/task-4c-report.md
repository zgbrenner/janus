# Task 4C — Relay CI compatibility correction

## Scope

- Updated only `infra/relay/scripts/deploy.test.ts` and this report.
- Did not restore, modify, or otherwise couple relay deployment to the Janus release workflow.

## Correction

Removed the obsolete `release workflow tracing config propagation` test and its now-unused
Effect filesystem imports. That test read `.github/workflows/release.yml` from the relay unit
suite and required the inherited relay tracing artifact path.

The meaningful fail-closed ownership boundary is already enforced by `scripts/release-smoke.ts`:
it rejects any `relay` reference in the Janus release workflow. Keeping a second relay-owned test
for the old deployment design would make the two contracts contradictory. The relay suite now
tests relay deployment helpers and configuration serialization only.

## Test-first evidence

- Red: `pnpm exec vp run --filter t3code-relay test -- deploy.test.ts` failed at
  `release workflow tracing config propagation > uses an artifact instead of a masked cross-job
token output`, because Janus `release.yml` intentionally no longer contains
  `--github-env-file "$RUNNER_TEMP/relay-client-tracing.env"`.
- Green: after removing that obsolete test, the same focused command passed: 27 files and
  208 tests.

## Verification evidence

- `pnpm exec vp run --filter t3code-relay typecheck` — passed.
- `pnpm exec vp fmt --check infra/relay/scripts/deploy.test.ts` — passed.
- `$env:PATH='C:\Users\zgbre\.vite-plus\bin;'+$env:PATH; node scripts/release-smoke.ts` —
  passed (`Release smoke checks passed.`), including its no-`relay` release-workflow guard.
- `git diff --check` — passed.

## Windows invocation note

`pnpm run release:smoke` alone still fails before the smoke assertions with `spawnSync vp
ENOENT` on this Windows host. `scripts/release-smoke.ts` invokes `vp` directly; prepending the
repository's Vite Plus binary directory lets that unchanged contract run successfully.
