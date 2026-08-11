# Janus

Janus is an approachable desktop workspace for knowledge work and software work. Choose a workspace, describe the outcome you want in a chat-first task, then supervise progress and review the result. It is built on the inherited local-agent engine: repositories, checkpoints, previews, diffs, terminals, and provider integrations remain available when you need them.

## Prototype status

Janus v0.0.1 is an unsigned, unnotarized prototype. Install only from this repository's [GitHub Releases](https://github.com/zgbrenner/janus/releases), verify the published checksum and attestation, and expect operating-system security prompts. Janus does not operate a hosted web service, package registry distribution, app-store channel, relay deployment, or signing service.

## Provider setup

Janus uses the subscriptions and local CLI logins you already have. Install and authenticate at least one supported provider before opening a task:

- Codex: install the [Codex CLI](https://developers.openai.com/codex/cli) and run `codex login`.
- Claude: install [Claude Code](https://claude.com/product/claude-code) and run `claude auth login`.
- Cursor: install [Cursor CLI](https://cursor.com/cli) and run `agent login`.
- Grok Build: install [Grok Build CLI](https://x.ai/cli) and run `grok login`.
- OpenCode: install [OpenCode](https://opencode.ai) and run `opencode auth login`.

Those logins remain local to your machine and are not provisioned by Janus.

## Build from source

Prerequisites are Node.js 24.13.1 or later (within the version range in `package.json`), Rust for the resource monitor, and [Vite+](https://viteplus.dev/guide/). Install Vite+ with its documented platform-specific command, then run:

```bash
vp install --frozen-lockfile
vp run dev:desktop
```

Useful local checks:

```bash
vp check
vpr typecheck
vp run test
node scripts/export-brand-icons.ts --check
node scripts/release-smoke.ts
```

## GitHub-only releases

Maintainers publish Janus by pushing an exact semantic tag such as `v0.0.1`. The tag is the sole release-version source. GitHub Actions builds macOS arm64/x64, Linux x64, and Windows x64 artifacts, creates `SHA256SUMS.txt`, records provenance attestations, and creates one GitHub Release. See the [release operations guide](docs/operations/release.md) for the full checklist.

## Current limitations

- Builds are unsigned and unnotarized; they are not production-ready installers.
- Releases are desktop artifacts only. There is no Janus-hosted sync, relay, web deployment, or mobile-store distribution.
- Windows WSL support requires a glibc-based x64 WSL distribution; the release pipeline bundles its Linux terminal module for that backend.

## Attribution and license

Janus is a fork built from [pingdotgg/t3code](https://github.com/pingdotgg/t3code). It preserves the upstream MIT license and attribution in [LICENSE](LICENSE). Upstream terminology and internal package names remain where they are compatibility interfaces; Janus is the user-facing desktop identity.
