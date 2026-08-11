# Janus release operations

Janus releases are GitHub-only desktop prototype builds. Windows artifacts use the Janus Project's self-signed Authenticode certificate; macOS artifacts are unsigned and unnotarized. We do not operate CA-trusted signing, notarization, package-registry publication, a hosted web deployment, a relay, or an app-store channel.

## Maintainer procedure

1. Start from the reviewed `main` commit and run the local quality gates:

   ```bash
   vp install --frozen-lockfile
   vp check
   vpr typecheck
   vp run test
   node scripts/export-brand-icons.ts --check
   node scripts/release-smoke.ts
   cargo fmt --manifest-path native/resource-monitor/Cargo.toml -- --check
   cargo test --locked --manifest-path native/resource-monitor/Cargo.toml
   ```

2. Create and push an annotated, exact semantic-version tag. Prerelease suffixes and manually supplied versions are intentionally rejected; the tag is the only version source.

   ```bash
   git tag -a v0.0.2 -m "Janus v0.0.2"
   git push origin v0.0.2
   ```

3. Wait for the `Release` workflow. Its preflight repeats the quality gates and release smoke, validates `vX.Y.Z`, builds macOS arm64/x64, Linux x64, and Windows x64 on GitHub-hosted runners, signs the Windows package with the encrypted PFX stored in Actions secrets, verifies that signature against `certs/Janus-Code-Signing-Certificate.crt`, and publishes one `Janus vX.Y.Z` GitHub Release.

4. Verify that the release contains the four platform artifacts, four macOS external blockmaps, the Windows installer blockmap, `Janus-Code-Signing-Certificate.crt`, merged `latest-mac.yml`, `latest-linux.yml`, Windows `latest.yml`, `SHA256SUMS.txt`, and GitHub attestations. The workflow rejects missing, empty, unexpected, version-mismatched, or digest-mismatched release files before computing checksums or publishing.

The Windows build receives the Linux x64 `node-pty` prebuild generated on Ubuntu, so its WSL backend does not need to compile on a user's machine. This still requires a glibc-based x64 WSL distribution.

## User verification

Download the artifact and `SHA256SUMS.txt` from the same GitHub Release. On macOS or Linux:

```bash
sha256sum -c SHA256SUMS.txt
gh attestation verify Janus-0.0.1-x64.AppImage --repo zgbrenner/janus
```

On Windows PowerShell, compare the published SHA-256 value with:

```powershell
(Get-FileHash .\Janus-0.0.2-x64.exe -Algorithm SHA256).Hash
gh attestation verify .\Janus-0.0.2-x64.exe --repo zgbrenner/janus
$certificate = Get-PfxCertificate .\Janus-Code-Signing-Certificate.crt
$signature = Get-AuthenticodeSignature .\Janus-0.0.2-x64.exe
$signature.SignerCertificate.Thumbprint -eq $certificate.Thumbprint
$signature.SignerCertificate.Subject
$certificate.GetCertHashString([System.Security.Cryptography.HashAlgorithmName]::SHA256)
```

Use the correct downloaded filename in the attestation command. The checksum confirms downloaded-file integrity; the GitHub attestation verifies the repository and release build provenance; the thumbprint comparison confirms the installer carries the Janus release certificate. Because the certificate is self-signed, Windows can still report the signature chain as untrusted even when that comparison succeeds.

The v0.0.2 certificate SHA-256 fingerprint is `DAA97BD59C62E51B52F5602A4D899D0A6E5C47D65BF6864083825FCF4B63E5D8`.

## Prototype warning

The v0.0.2 Windows installer is self-signed, not CA-trusted. The macOS artifacts are unsigned and unnotarized. Users must expect platform warnings and should not treat these as production-trustworthy installers. Do not state or imply that Janus has CA-trusted signing, notarization, hosted authentication, managed provider accounts, a package-store listing, or a deployment service. Do not instruct ordinary users to install the self-signed certificate as a trusted root.

## Attribution

Janus is derived from [pingdotgg/t3code](https://github.com/pingdotgg/t3code) and retains its MIT license and attribution. Provider subscriptions and local login commands are inherited capabilities: users authenticate their own Codex, Claude, Cursor, Grok Build, or OpenCode CLI locally.
