# Install Janus

Janus is a desktop workspace app for running agents on your machine. It is distributed only
through [GitHub Releases](https://github.com/zgbrenner/janus/releases) — there is no package
registry, app store, or hosted web version. The app bundles everything it needs, including its
local server; you do not install a separate CLI.

## Download

Download the latest release from
[GitHub Releases](https://github.com/zgbrenner/janus/releases) and pick the artifact for your
platform:

| Platform              | Artifact                                         |
| --------------------- | ------------------------------------------------ |
| macOS (Apple Silicon) | `Janus-<version>-arm64.dmg` (ZIP also available) |
| macOS (Intel)         | `Janus-<version>-x64.dmg` (ZIP also available)   |
| Windows (x64)         | `Janus-<version>-x64.exe`                        |
| Linux (x64)           | `Janus-<version>-x64.AppImage`                   |

Janus builds are prototypes and are not signed by a platform-trusted certificate, so expect a
security prompt the first time you run one. Only download from the releases page above, and
verify the checksum (see [Verify Your Download](#verify-your-download)) before proceeding past
any warning.

### macOS

macOS builds are unsigned and not notarized, so Gatekeeper blocks the first launch.

1. Open the DMG and drag Janus to Applications (or unzip the ZIP and move `Janus.app` there).
2. Verify the download's checksum.
3. Try to open Janus once; macOS will refuse to open it.
4. Go to **System Settings** → **Privacy & Security**, find the message saying Janus was
   blocked, and choose **Open Anyway**.

On an Apple Silicon Mac, use the `arm64` build. The `x64` build runs under Rosetta and Janus
will warn you about it.

### Windows

The Windows installer is Authenticode-signed with the Janus Project's self-signed
code-signing certificate. Windows does not trust that certificate automatically, so SmartScreen
warns when you run the installer.

1. Verify the download's checksum.
2. Run the installer. If SmartScreen appears, choose **More info**, then **Run anyway**.

The public certificate (`Janus-Code-Signing-Certificate.crt`) is included with each release, so
you can additionally check that the installer's signature matches the published Janus
certificate before running it.

### Linux

1. Verify the download's checksum.
2. Make the AppImage executable and run it:

```sh
chmod +x Janus-<version>-x64.AppImage
./Janus-<version>-x64.AppImage
```

If your distribution cannot run AppImages out of the box, install its AppImage/FUSE support
package first.

## Verify Your Download

Every release includes a `SHA256SUMS.txt` manifest listing the checksum of each artifact.
Compare your download against it:

macOS:

```sh
shasum -a 256 Janus-<version>-arm64.dmg
```

Linux:

```sh
sha256sum Janus-<version>-x64.AppImage
```

Windows (PowerShell):

```powershell
Get-FileHash Janus-<version>-x64.exe -Algorithm SHA256
```

The output must match the corresponding line in `SHA256SUMS.txt` exactly.

Each release also carries GitHub provenance attestations. With the
[GitHub CLI](https://cli.github.com) you can confirm an artifact was built by this repository's
release workflow:

```sh
gh attestation verify Janus-<version>-x64.AppImage --repo zgbrenner/janus
```

## Providers

Janus drives provider CLIs; it does not ship them. Install the CLI for each provider you want
to use, then authenticate it.

| Provider   | CLI                                                   | Default binary | Log in with           |
| ---------- | ----------------------------------------------------- | -------------- | --------------------- |
| Codex      | [Codex CLI](https://developers.openai.com/codex/cli)  | `codex`        | `codex login`         |
| Claude     | [Claude Code](https://claude.com/product/claude-code) | `claude`       | `claude auth login`   |
| Cursor     | [Cursor CLI](https://cursor.com/cli)                  | `cursor-agent` | `agent login`         |
| Grok Build | [Grok Build CLI](https://x.ai/cli)                    | `grok`         | `grok login`          |
| OpenCode   | [OpenCode](https://opencode.ai)                       | `opencode`     | `opencode auth login` |

Cursor is the one to watch: install Cursor CLI, which provides the `cursor-agent` binary that
Janus looks for, but authenticate with `agent login`, not `cursor-agent login`.

These logins stay local to your machine; Janus does not provision them.

### Binary Discovery

Each provider CLI must be on the `PATH`, or have an explicit binary path set in
**Settings** → the provider instance → **Binary path**. Use the explicit path when a version
manager or a non-standard install location keeps the CLI off the `PATH` of the shell that
started Janus.

### When Auth Is Needed

Provider auth is required before you start a task with that provider, not before you open
Janus. You can install Janus, open it, and add providers afterwards. A provider that is not
authenticated shows its status in **Settings**, and tasks with it will fail until you run its
login command.

For multi-account setups, see [Codex](./providers-codex.md) and [Claude](./providers-claude.md).

## Next Steps

- [Permission modes](./permission-modes.md): how much Janus asks before acting
- [Keeping Janus up to date](./updating.md): automatic and manual updates
