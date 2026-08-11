# Task 3 correction round 2 report

Source correction commit: `3deb96c71 ci: complete Janus release artifact contract`

This correction completes the reviewed release-asset contract without changing desktop build implementation or generating package outputs.

## Changes

- The final GitHub Release job now installs Vite+ with a locked dependency install before its Effect-based manifest merge and asset-validation scripts.
- Every macOS build must upload its architecture-specific DMG and ZIP external blockmaps. The exact four blockmaps are part of the fail-closed release allowlist and checksum/attestation asset glob.
- The semantic release smoke now verifies final-job dependency ordering, exact Linux `node-pty` WSL upload/download handoff, macOS blockmap requirements, security PR trigger and least-privilege permission keys, and validation before checksum, attestation, and publication.
- Asset validator fixtures exercise success with all four macOS blockmaps and failure for version, URL, size, digest, missing, empty, unexpected file, and directory cases.

## Verification

Red phase before implementation:

- `node scripts/release-smoke.ts` failed because macOS packaging did not yet require both external blockmaps per architecture.
- `vp run --filter @t3tools/scripts test -- validate-release-assets` failed because the expanded full-blockmap fixture was initially rejected by the exact allowlist.

Green phase and final gates:

- `vp run --filter @t3tools/scripts test -- validate-release-assets` — 19 files, 211 tests passed.
- `node scripts/release-smoke.ts` — passed.
- `vp run --filter @t3tools/scripts typecheck` — passed.
- `vp run typecheck` — passed; it emitted existing non-failing Effect suggestions in client-runtime, desktop, and server code.
- `pnpm dlx prettier@3.5.3 --check` on the workflows, release docs, and contract scripts — passed.
- Semantic parse of `ci.yml`, `security.yml`, and `release.yml` with the checked-in YAML parser — passed.
- `git diff --check` — passed.
- The commit hook ran `vp fmt` for all five staged owned files — passed.

## Caveats

- No Windows NSIS/package build was rerun for this correction because it changes workflow and validation contracts, not desktop build implementation.
- GitHub Actions, attestation, artifact upload/download, and release publication were not executed locally. A real signed tag on GitHub remains the integration gate.
- The prototype remains unsigned and unnotarized as documented; distribution is GitHub Releases only.
