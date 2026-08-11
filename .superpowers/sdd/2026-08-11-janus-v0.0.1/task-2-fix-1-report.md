# Task 2 correction round 1 report

## Summary

Completed source commit `18d9a610660f79bc7954666dd5f1c86c58f430ae` isolates implicit desktop and backend state under Janus, completes native/updater-facing Janus branding, and removes the macOS launcher's dependency on the deleted checked-in ICNS.

## Identity matrix

| Surface                                    | Production                                      | Development                                     |
| ------------------------------------------ | ----------------------------------------------- | ----------------------------------------------- |
| Display name                               | Janus                                           | Janus Dev                                       |
| App ID                                     | com.zgbrenner.janus                             | com.zgbrenner.janus.dev                         |
| Executable / WM class / scheme             | janus                                           | janus-dev                                       |
| Electron user data directory               | janus                                           | janus-dev                                       |
| Default backend base and state             | ~/.janus / ~/.janus/userdata                    | ~/.janus / ~/.janus/dev                         |
| Explicit T3CODE_HOME                       | Preserved exactly as an override, with userdata | Preserved exactly as an override, with userdata |
| Production updater repository and artifact | zgbrenner/janus; Janus-<version>-<arch>         | n/a                                             |

Production Linux/macOS package protocols now register only `janus`; the development launcher continues to register only `janus-dev`.

## Changed files

- Desktop state/early startup/backend/catalog: `DesktopStatePaths`, `DesktopEnvironment` and early-startup tests, `DesktopBackendConfiguration` and test, plus a catalog sentinel integration test that creates a legacy `~/.t3/userdata/connection-catalog.json` and proves default Janus reads/writes only `~/.janus/userdata`.
- macOS launcher and portable launcher test: production/development cached ICNS generation now derives from `assets/prod/black-macos-1024.png` and `assets/dev/blueprint-macos-1024.png`. Missing/generated-icon failures retain Electron's bundled fallback rather than dereferencing a removed ICNS.
- Artifact builder and test: staged package is `janus`; author/copyright are Janus contributors; macOS/Linux production protocol metadata is `janus` only.
- Update UI logic/test and directly coupled native copy: release links target `zgbrenner/janus`; Janus names appear in update, startup, menu, auth, keyring, WSL, and SSH user-facing strings.

No generated asset changed in this correction: `icons:export` regenerated the existing 30 deterministic outputs and `icons:check` verified them current. No `package.json` or lockfile change was made in this correction.

## Verification

- Focused state, sentinel/catalog, backend, launcher, builder, and update tests: 98 passed.
- Focused native-copy, updater, builder, and launcher tests: 87 passed.
- Full desktop suite: 59 files, 449 tests passed.
- Desktop typecheck passed; two pre-existing Effect style suggestions remain in `DesktopBackendPool.test.ts` and `DesktopWslEnvironment.ts`.
- Web typecheck passed.
- Exporter/builder tests: 32 passed.
- `vp run icons:export` and `vp run icons:check` passed; all 30 generated assets current.
- `git diff --check` passed before commit.

The broad `vp test run scripts` command remains red outside this task: two existing Windows path-separator failures in `scripts/mobile-showcase.test.ts`, an unrelated Windows file-mode assertion in `apps/server/scripts/t3-sqlite-state.test.ts`, and a `.github` Node test that Vitest reports as having no suite. The owned direct builder/exporter tests passed.

## Packaging and risks

Windows NSIS was not rerun in this correction. The prior attempt reached desktop/server/web staging but stopped before installer creation because `native/resource-monitor` resolves `sysinfo@0.39.3`, which requires Rust 1.95 while this environment has Rust 1.94.1. Therefore this correction has no new installer/updater-cache artifact inspection; source contracts and builder tests are complete. macOS `sips`/`iconutil` execution is covered by deterministic code paths and tests on Windows, but a macOS host still needs to exercise its native ICNS conversion during packaging.
