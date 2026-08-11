# Janus release operations

Janus releases are GitHub-only desktop prototype builds. We do not operate release signing, notarization, package-registry publication, a hosted web deployment, a relay, or an app-store channel.

## Maintainer procedure

1. Start from the reviewed `main` commit and run the local quality gates:

   ```bash
   vp install --frozen-lockfile
   vp check
   vpr typecheck
   vp run test
   pnpm icons:check
   node scripts/release-smoke.ts
   cargo fmt --manifest-path native/resource-monitor/Cargo.toml -- --check
   cargo test --locked --manifest-path native/resource-monitor/Cargo.toml
   ```

2. Create and push an annotated, exact semantic-version tag. Prerelease suffixes and manually supplied versions are intentionally rejected; the tag is the only version source.

   ```bash
   git tag -a v0.0.1 -m "Janus v0.0.1"
   git push origin v0.0.1
   ```

3. Wait for the `Release` workflow. Its preflight repeats the quality gates and release smoke, validates `vX.Y.Z`, builds macOS arm64/x64, Linux x64, and Windows x64 on GitHub-hosted runners, and publishes one `Janus vX.Y.Z` GitHub Release.

4. Verify that the release contains the four platform artifacts, merged `latest-mac.yml`, `latest-linux.yml`, Windows `latest.yml`, blockmap metadata, `SHA256SUMS.txt`, and GitHub attestations. The workflow rejects missing, empty, unexpected, version-mismatched, or digest-mismatched release files before computing checksums or publishing.

The Windows build receives the Linux x64 `node-pty` prebuild generated on Ubuntu, so its WSL backend does not need to compile on a user's machine. This still requires a glibc-based x64 WSL distribution.

## User verification

Download the artifact and `SHA256SUMS.txt` from the same GitHub Release. On macOS or Linux:

```bash
sha256sum -c SHA256SUMS.txt
gh attestation verify Janus-0.0.1-x64.AppImage --repo zgbrenner/janus
```

On Windows PowerShell, compare the published SHA-256 value with:

```powershell
(Get-FileHash .\Janus-0.0.1-x64.exe -Algorithm SHA256).Hash
gh attestation verify .\Janus-0.0.1-x64.exe --repo zgbrenner/janus
```

Use the correct downloaded filename in the attestation command. The checksum confirms downloaded-file integrity; the GitHub attestation verifies the repository and release build provenance.

## Prototype warning

The v0.0.1 artifacts are unsigned and unnotarized. Users must expect platform warnings and should not treat them as production-trustworthy installers. Do not state or imply that Janus has a code-signing certificate, notarization, hosted authentication, managed provider accounts, package-store listing, or deployment service.

## Attribution

Janus is derived from [pingdotgg/t3code](https://github.com/pingdotgg/t3code) and retains its MIT license and attribution. Provider subscriptions and local login commands are inherited capabilities: users authenticate their own Codex, Claude, Cursor, Grok Build, or OpenCode CLI locally.
