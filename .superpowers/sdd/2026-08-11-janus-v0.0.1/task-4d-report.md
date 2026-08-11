# Task 4D — CI checkout compatibility correction

## Scope

- Removed only the invalid tracked gitlink at
  `.repos/alchemy-effect/.vendor/alchemy` from the Git index.
- Added the Janus release-checkout guard in `scripts/release-smoke.ts`.
- Did not add or initialize an external submodule, and did not alter the physical reference
  directory.

## Root cause and correction

The fork contained one mode-160000 index entry at
`.repos/alchemy-effect/.vendor/alchemy`, while the fork root had no corresponding `.gitmodules`
entry. GitHub Actions checkout then failed during recursive submodule cleanup with `No url found
for submodule path`.

`git rm --cached` removes that index entry without removing the working-tree directory. The local
physical path existed before and after the operation. The release smoke guard runs
`git ls-files --stage`, rejects every mode-160000 entry, and therefore prevents both malformed
submodule metadata and intentionally declared external submodules from entering a Janus release
checkout. Its Git output buffer is explicitly 16 MiB because this repository's full index exceeds
Node's default 1 MiB child-process capture limit.

## Test-first evidence

- Before the correction, `git submodule foreach --recursive` failed with:
  `fatal: No url found for submodule path '.repos/alchemy-effect/.vendor/alchemy' in .gitmodules`.
- Red: after adding the release-smoke guard but before removing the gitlink, release smoke failed
  with `Release checkout must not track gitlinks or submodules:
.repos/alchemy-effect/.vendor/alchemy.`
- Green: after the index-only removal, release smoke and recursive submodule traversal passed.

## Verification evidence

- `$env:PATH='C:\Users\zgbre\.vite-plus\bin;'+$env:PATH; node scripts/release-smoke.ts` —
  passed (`Release smoke checks passed.`).
- `git submodule foreach --recursive 'echo $sm_path'` — passed (no tracked submodules).
- `pnpm exec vp run --filter @t3tools/scripts typecheck` — passed.
- `pnpm exec vp fmt --check scripts/release-smoke.ts` — passed.
- `git diff --check` — passed.
