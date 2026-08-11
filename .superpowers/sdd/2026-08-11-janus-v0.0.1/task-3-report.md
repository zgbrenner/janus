# Task 3 report: Janus GitHub CI and release contract

## Commits

- `b89a48028853c89110e904c5e2034fe90890d0fa` — `ci: add Janus build and release pipeline`

## Delivered automation

- Replaced inherited service- and secret-dependent workflows with a GitHub-hosted CI workflow containing stable job IDs `check`, `test`, `desktop_build`, `rust`, and `release_smoke`.
- Added a least-privilege security workflow: dependency review for pull requests and CodeQL v4 for pull requests, `main`, weekly scheduled scans, and manual dispatch.
- Replaced release automation with exact `vX.Y.Z` tag preflight, four desktop build targets, Linux x64 WSL terminal-module handoff to Windows, updater-manifest validation/merge, checksum generation, artifact attestations, and one `Janus vX.Y.Z` GitHub Release.
- Removed inherited relay deployment, web deployment, mobile-store, private-runner, release-app, version-bump, package publication, and notification workflows.
- Rewrote the README and maintainer release guide for the Janus prototype, local provider logins, GitHub-only distribution, unsigned-build warning, verification commands, and upstream MIT attribution.
- Strengthened `release-smoke.ts` with Janus fixture artifacts and static prohibitions on inherited release services, private runners, scheduled release variants, release-app credentials, and upstream release identity.
- Made the two Windows-sensitive mobile showcase expectations host-path-aware. This is test-only portability work; the production path functions were already host-native.

## Verification evidence

Passed after the source changes:

```text
pnpm dlx prettier@3.5.3 --check .github/workflows/ci.yml .github/workflows/security.yml .github/workflows/release.yml README.md docs/operations/release.md scripts/release-smoke.ts scripts/mobile-showcase.test.ts
All matched files use Prettier code style!

node scripts/release-smoke.ts
Release smoke checks passed.

vp run --filter @t3tools/scripts test
Test Files 18 passed (18)
Tests 203 passed (203)

YAML parse: ci.yml, security.yml, release.yml
git diff --check
```

The initial contract run against the inherited workflow failed with `Release name must use Janus v<version>.`, proving the new contract rejected the upstream release identity before the workflow was replaced.

An optional local Windows packaging probe also passed with Rust 1.97.1 under `CARGO_BUILD_JOBS=1` and `CARGO_PROFILE_DEV_DEBUG=0`:

```text
Janus-0.0.1-x64.exe          148316586 bytes
Janus-0.0.1-x64.exe.blockmap 154659 bytes
latest.yml
SHA256 A5ECBA64F87F2655A9946BA2B381C5FD3C51F33C8DC52DD94D254023AC31EF6A
```

## Limits and follow-up gates

- No GitHub Actions run, tag push, GitHub Release publication, attestation verification against a published release, or cross-platform runtime smoke was performed locally.
- The local Windows probe deliberately omitted the Linux WSL `pty.node` input and therefore warned that its WSL backend would not start. The release workflow builds that module on Ubuntu, downloads it with `actions/download-artifact@v8`, and passes it through `--wsl-prebuild` to the Windows packager.
- The v0.0.1 artifacts remain unsigned and unnotarized by design. Operating-system security warnings are expected.
- The local Prettier executable is not a repository dependency. Formatting was verified with the pinned `pnpm dlx prettier@3.5.3` fallback; semantic YAML parsing used the locked `yaml@2.9.0` dependency already linked for `scripts`.
- The temporary local packaging output remains outside the worktree at `%TEMP%\janus-task3-nsis`; cleanup was rejected by the command policy. It is not a repository change.
