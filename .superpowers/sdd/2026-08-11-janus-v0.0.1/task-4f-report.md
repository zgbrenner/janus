# Task 4F — Linux x64 release artifact normalization

## Scope

- Updated only the desktop artifact builder, its direct test, and this report.
- Preserved the release workflow and its validator's exact public artifact allowlist.

## Correction

Electron-builder emits a Linux x64 AppImage with its platform-native `x86_64` suffix, while the
public Janus release contract is `x64`. The builder now normalizes only Linux x64 stage output:

- `Janus-<version>-x86_64.AppImage` is staged as `Janus-<version>-x64.AppImage`.
- `latest-linux.yml` is parsed and rewritten so its sole `files[].url` and top-level `path` use
  the public x64 name. The existing SHA-512 and size fields are preserved unchanged.
- `builder-debug.yml` is omitted from all staged platform artifacts before upload. The strict
  release validator remains responsible for rejecting any other unexpected file.

Linux arm64 naming is untouched. A malformed Linux x64 manifest, a manifest with a different
artifact reference, or a multi-file manifest fails rather than being silently rewritten.

## Test-first evidence

- Red: the new simulated electron-builder output test failed before implementation because
  `normalizeLinuxX64ArtifactName` did not exist.
- Green: `scripts/build-desktop-artifact.test.ts` now simulates an `x86_64` AppImage,
  `latest-linux.yml`, and `builder-debug.yml`; it proves the final names contain only the public
  x64 artifact and manifest, retain the manifest SHA-512/size, and contain no stale `x86_64`.

## Verification evidence

- `pnpm exec vp test run scripts/build-desktop-artifact.test.ts` — 32 tests passed.
- `pnpm exec vp test run scripts/validate-release-assets.test.ts` — 8 tests passed; its existing
  unexpected-build-byproduct rejection remains green.
- `pnpm exec vp run --filter @t3tools/scripts test -- build-desktop-artifact.test.ts` — full
  scripts suite: 19 files and 212 tests passed.
- `pnpm exec vp run --filter @t3tools/scripts typecheck` — passed.
- `$env:PATH='C:\Users\zgbre\.vite-plus\bin;'+$env:PATH; node scripts/release-smoke.ts` —
  passed (`Release smoke checks passed.`).
- `pnpm exec vp fmt --check scripts/build-desktop-artifact.ts
scripts/build-desktop-artifact.test.ts` — passed.
- `git diff --check` — passed.

## Local limit

The exact remote electron-builder output originated on the Linux release runner. The local
verification uses the captured x86_64 naming shape as a simulated fixture; it does not claim a
new Linux packaging run on this Windows host.
