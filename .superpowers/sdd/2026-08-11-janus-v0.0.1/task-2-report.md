# Task 2 report: Janus desktop identity and assets

## Summary

Implemented Janus's OS-visible desktop identity without renaming `@t3tools`, `T3CODE_*`, database, or RPC compatibility contracts. The desktop now uses isolated Janus application identifiers, schemes, user-data paths, preview partitions, Linux entries, launcher metadata, updater target, and artifact naming. The checked-in exporter now uses pinned Sharp 0.34.5 to deterministically generate Janus SVG-derived PNG/ICO assets on Windows, macOS, and Linux; it updates desktop PNG/ICO resources and public favicon copies.

## Identity matrix

| Surface               | Production                     | Development               |
| --------------------- | ------------------------------ | ------------------------- |
| Display name          | `Janus`                        | `Janus Dev`               |
| Application ID        | `com.zgbrenner.janus`          | `com.zgbrenner.janus.dev` |
| Executable / WM class | `janus`                        | `janus-dev`               |
| Scheme                | `janus`                        | `janus-dev`               |
| User-data directory   | `janus`                        | `janus-dev`               |
| Preview partition     | `persist:janus-preview-`       | `persist:janus-preview-`  |
| Updater repository    | `zgbrenner/janus`              | `zgbrenner/janus`         |
| Artifact name         | `Janus-<version>-<arch>.<ext>` | n/a                       |

## Changed files and assets

- Desktop identity, protocol, preview partition, Linux handler, launcher, package product name, and focused contract tests under `apps/desktop`.
- Desktop builder and its tests in `scripts/build-desktop-artifact.*`.
- `scripts/export-brand-icons.ts`, new exporter tests, root pinned Sharp dev dependency, and the corresponding root lockfile importer entry.
- Generated Janus PNG/ICO assets under `assets/dev`, `assets/nightly`, `assets/prod`, `apps/web/public`, and `apps/desktop/resources`; the inherited checked-in `apps/desktop/resources/icon.icns` was removed because the macOS staging path derives ICNS from the generated macOS PNG.

## Verification

- Passed: focused non-Electron identity tests, 28 tests total (`DesktopAssets`, `DesktopEnvironment`, early Linux startup, protocol, preview session, and launcher).
- Passed: `scripts/export-brand-icons.test.ts` (1 test) and `scripts/build-desktop-artifact.test.ts` (30 tests).
- Passed: deterministic `node scripts/export-brand-icons.ts` followed by `node scripts/export-brand-icons.ts --check` (30 generated assets current).
- Passed: `git diff --check`.
- Desktop typecheck reached only two pre-existing Effect suggestions in `DesktopBackendPool.test.ts` and `DesktopWslEnvironment.ts`; `tsgo` returned nonzero for those suggestions.
- Full desktop tests could not complete after a frozen dependency-link recovery left Electron's binary absent: 23 suites failed at import with `Electron failed to install correctly`. This is a host/dependency runtime blocker, not an identity assertion failure.
- Full scripts tests retain two unrelated Windows path-separator failures in `mobile-showcase.test.ts`.
- Windows NSIS build reached web branding and release staging, then stopped while compiling the resource monitor: installed `rustc 1.94.1` is below `sysinfo@0.39.3`'s required Rust 1.95. No installer or updater metadata was produced.

## Inherited Windows-path baseline disposition

Fixed 15 desktop test-only path portability assertions by deriving expected paths through Effect `Path.Path`, covering desktop assets, environment paths, connection catalog paths, saved-environment paths, and resource-monitor paths. The remaining documented baseline was not independently re-countable because Electron's runtime import failed before 23 desktop suites could load.

## Commit and risks

Commit SHA: c94c99ec8586a8b4b954f6a91825085e8aab8d88 (amended below to include this report).

Risks: the Sharp dependency's root links must be restored by a normal frozen install in a clean environment; macOS artifact staging still requires its existing platform `sips`/`iconutil` tools. The Windows NSIS build additionally requires Rust 1.95 or a compatible locked `sysinfo` version.
