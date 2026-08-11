# Task 4G — Updater manifest block-map metadata

## Scope

- Updated only `scripts/lib/update-manifest.ts`, its direct parser test, the macOS merge test, the
  release-asset validator fixture, and this report.
- Did not relax workflow ordering, release-asset names, SHA-512 validation, or file-size
  validation.

## Correction

Electron-builder emits optional `blockMapSize` inside each updater `files` entry. The strict
parser previously accepted only `url`, `sha512`, and `size`, so a real Linux manifest stopped at
`blockMapSize: 164034` before release asset validation.

`blockMapSize` is now an optional per-file nonnegative safe integer. Nonnegative is intentional:
the real electron-builder field is positive, while treating zero as invalid would add an
unnecessary rule for optional metadata. The parser rejects decimal, negative, quoted, unsafe, or
missing values; rejects duplicate entries and a value with no preceding file; and preserves the
field through parse, serialization, and manifest merge. File URL, SHA-512, and size remain
required and unchanged.

## Test-first evidence

- Red: the revised validator fixture used the captured Linux shape with
  `blockMapSize: 164034`; validation failed with the remote error:
  `Invalid latest-linux.yml ... unsupported line '    blockMapSize: 164034'.`
- The new direct parser test also failed before implementation for the same valid Linux fixture
  and required specific errors for malformed, duplicate, and orphaned metadata.
- Green: valid Linux parse/serialize/reparse preserves URL, SHA-512, size, and block-map size;
  malformed/duplicate/orphaned values fail; and macOS multi-architecture merge retains the
  block-map values in serialized output.

## Verification evidence

- `pnpm exec vp test run scripts/lib/update-manifest.test.ts scripts/validate-release-assets.test.ts`
  — 10 tests passed.
- `pnpm exec vp test run scripts/merge-update-manifests.test.ts` — 8 tests passed.
- `pnpm exec vp run --filter @t3tools/scripts test` — 20 files and 214 tests passed.
- `pnpm exec vp run --filter @t3tools/scripts typecheck` — passed.
- `$env:PATH='C:\Users\zgbre\.vite-plus\bin;'+$env:PATH; node scripts/release-smoke.ts` —
  passed (`Release smoke checks passed.`).
- `pnpm exec vp fmt --check scripts/lib/update-manifest.ts scripts/lib/update-manifest.test.ts
scripts/merge-update-manifests.test.ts scripts/validate-release-assets.test.ts` — passed.
- `git diff --check` — passed.
