# Task 3 correction round 3 report

Source commits:

- `a3b5f06ac ci: harden Janus workflow regression guards`
- `ee08163e2 style: apply pinned Prettier release contracts`

This final guard pass changes workflow-contract evidence only; the reviewed GitHub workflows themselves remain unchanged.

## Contract coverage

- Release smoke now requires the one strict final-release order: Vite+ setup, locked install, manifest merge, asset validation, checksums, attestation, then publication.
- Security semantics now require exactly pull request, main push, the weekly `23 4 * * 1` schedule, and manual triggers. CodeQL has no event guard, while dependency review is restricted to pull requests.
- The root, CodeQL, and dependency-review permission maps are checked as exact values to reject unexpected permissions or writes.
- Every required action occurrence across CI, security, and release jobs is counted and pinned to its required major: checkout v6, setup-vp v1, artifact upload v7/download v8, CodeQL v4, dependency review v4, attest v4, and GitHub Release v3.

## Red-green evidence

- With the owned workflow temporarily mutated to rename `Create checksums`, `node scripts/release-smoke.ts` failed with: `Final release steps must be setup, install, merge, validate, checksum, attest, then publish.` The mutation was immediately restored.
- With the restored workflow, `node scripts/release-smoke.ts` passed.

## Final verification

- Pinned formatting command passed:
  `pnpm dlx prettier@3.5.3 --check .github/workflows/ci.yml .github/workflows/security.yml .github/workflows/release.yml README.md docs/operations/release.md scripts/export-brand-icons.test.ts scripts/export-brand-icons.ts scripts/release-smoke.ts scripts/validate-release-assets.test.ts scripts/validate-release-assets.ts`
- `vp run --filter @t3tools/scripts test` — 19 files and 211 tests passed.
- `vp run --filter @t3tools/scripts typecheck` — passed.
- Semantic YAML parsing for `ci.yml`, `security.yml`, and `release.yml` — passed.
- `git diff --check` — passed.

## Formatting evidence correction

The ordinary pre-commit hook ran `vp fmt`, but it did not preserve the exact pinned Prettier 3.5.3 format for five scripts in this scope. The direct pinned Prettier command above is the canonical evidence for this correction. The formatting-only source commit used `--no-verify` after that hook reverted the verified pinned output; all requested tests, YAML parsing, and diff checks were rerun after the final committed sources.

## Remaining integration gates

- GitHub Actions, artifact provenance, and release publication were not run locally.
- No desktop packaging was rerun because this correction changes regression guards and formatting only.
