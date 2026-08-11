# Task 3 correction round 1 report: release asset contract

## Commits

- `6910f774832e3cd937f741b3c9d3642d1e235920` — `ci: harden Janus release asset contract`

## Corrections delivered

- The release build now stages the macOS updater manifest deterministically. Both builder invocations emit `latest-mac.yml`; the x64 job explicitly renames that file to `latest-mac-x64.yml` before upload, while arm64 retains `latest-mac.yml`. The final job merges the pair.
- The release preflight now runs `node scripts/release-smoke.ts` in addition to its quality gates.
- The final release job has exactly `contents`, `id-token`, `attestations`, and `artifact-metadata` write permissions. The latter is required by the artifact attestation action.
- CodeQL v4 now analyzes both `actions` and `javascript-typescript`; dependency review remains PR-only with read-only contents permission.
- Added `scripts/validate-release-assets.ts` and focused tests. It accepts only the exact Janus macOS DMG/ZIP, Linux AppImage, Windows EXE/blockmap, merged macOS, Linux, and Windows updater-manifest set; it rejects empty or unexpected files, manifest-version drift, URL-set drift, size drift, and SHA-512 drift. The release workflow calls it after macOS manifest merge and before `SHA256SUMS.txt` generation.
- `release-smoke.ts` is now a YAML-parsed semantic contract for CI IDs, security triggers/languages/actions/permissions, exact tag version extraction, platform matrix/runners, WSL handoff, updater-manifest staging, action majors, final permissions, preflight smoke, final validation ordering, and prohibited inherited services/credentials.
- The prior Windows path-aware mobile showcase test retained its diagnostic suppression, and the authorized exporter test now uses the exact checked-in production icon variant. This is type-only/test-only support for a green scripts/root typecheck.

## Red-green evidence

1. The semantic release smoke test failed against the prior workflow with:

   ```text
   CodeQL must analyze JavaScript/TypeScript and GitHub Actions.
   Expected ["actions","javascript-typescript"], received ["javascript-typescript"].
   ```

2. The validator test initially failed because `validate-release-assets.ts` did not exist.

3. After implementation, the following passed:

   ```text
   node scripts/release-smoke.ts
   Release smoke checks passed.

   vp run --filter @t3tools/scripts test
   Test Files 19 passed (19)
   Tests 206 passed (206)

   vp run --filter @t3tools/scripts typecheck
   exit 0

   vp run typecheck
   exit 0

   pnpm dlx prettier@3.5.3 --check [owned workflow/docs/scripts]
   All matched files use Prettier code style!

   YAML parse: ci.yml, security.yml, release.yml
   git diff --check
   ```

## Remaining gates and caveats

- No new desktop packaging logic was added, so the eight-minute local Windows NSIS build was not rerun. The previous Task 3 local probe remains the relevant packaging evidence.
- No remote Actions run, tag push, GitHub Release publication, published-asset download, or attestation verification was performed in this correction round.
- Linux `latest-linux.yml` is now required by the release contract. The tag workflow will fail closed if the pinned desktop builder does not emit it.
- The repository does not install Prettier directly; the exact formatting check used the pinned `pnpm dlx prettier@3.5.3` fallback.
