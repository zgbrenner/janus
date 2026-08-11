import * as NodePath from "node:path";
import { assert, describe, it } from "vite-plus/test";

import {
  desktopDir,
  makeDevelopmentLauncherScript,
  resolveElectronBinaryPath,
  resolveMacIconPaths,
  resolveMacLauncherPaths,
} from "./electron-launcher.mjs";

describe("electron development launcher", () => {
  it("uses captured values only as fallbacks for a live runner environment", () => {
    const script = makeDevelopmentLauncherScript({
      electronBinaryPath: "/repo/node_modules/electron/Electron",
      mainEntryPath: "/repo/apps/desktop/dist-electron/main.cjs",
      desktopRoot: "/repo/apps/desktop",
      environment: {
        VITE_DEV_SERVER_URL: "http://127.0.0.1:8526",
        T3CODE_PORT: "16566",
        T3CODE_HOME: "/tmp/t3",
      },
    });

    assert.include(
      script,
      "if [ -z \"${VITE_DEV_SERVER_URL:-}\" ]; then export VITE_DEV_SERVER_URL='http://127.0.0.1:8526'; fi",
    );
    assert.notInclude(script, "\nexport VITE_DEV_SERVER_URL=");
    assert.include(
      script,
      "exec '/repo/node_modules/electron/Electron' --t3code-dev-root='/repo/apps/desktop' '/repo/apps/desktop/dist-electron/main.cjs' \"$@\"",
    );
  });

  it("repairs Electron before loading the package entrypoint", () => {
    const calls = [];
    const electronPath = resolveElectronBinaryPath({
      ensureRuntime: () => {
        calls.push("ensure");
      },
      createRequire: () => (specifier) => {
        calls.push(`require:${specifier}`);
        return "/repo/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron";
      },
      moduleUrl: import.meta.url,
    });

    assert.equal(
      electronPath,
      "/repo/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron",
    );
    assert.deepEqual(calls, ["ensure", "require:electron"]);
  });

  it("keeps the native Electron executable name inside the branded macOS bundle", () => {
    const paths = resolveMacLauncherPaths(
      "/repo/apps/desktop/.electron-runtime/Janus Dev.app",
      "Janus Dev",
    );

    assert.equal(paths.launcherExecutableName, "Janus Dev Launcher");
    assert.equal(
      paths.launcherBinaryPath,
      NodePath.join(
        "/repo/apps/desktop/.electron-runtime/Janus Dev.app",
        "Contents",
        "MacOS",
        "Janus Dev Launcher",
      ),
    );
    assert.equal(
      paths.runtimeElectronBinaryPath,
      NodePath.join(
        "/repo/apps/desktop/.electron-runtime/Janus Dev.app",
        "Contents",
        "MacOS",
        "Electron",
      ),
    );

    const script = makeDevelopmentLauncherScript({
      electronBinaryPath: paths.runtimeElectronBinaryPath,
      mainEntryPath: "/repo/apps/desktop/dist-electron/main.cjs",
      desktopRoot: "/repo/apps/desktop",
      environment: {},
    });
    assert.include(script, `exec '${paths.runtimeElectronBinaryPath}'`);
    assert.notInclude(script, "node_modules/electron");
  });

  it("derives production and development ICNS files from generated Janus PNG assets", () => {
    assert.deepEqual(resolveMacIconPaths(false), {
      sourcePngPath: NodePath.join(
        NodePath.resolve(desktopDir, "..", ".."),
        "assets",
        "prod",
        "black-macos-1024.png",
      ),
      generatedIcnsFileName: "icon.icns",
    });
    assert.deepEqual(resolveMacIconPaths(true), {
      sourcePngPath: NodePath.join(
        NodePath.resolve(desktopDir, "..", ".."),
        "assets",
        "dev",
        "blueprint-macos-1024.png",
      ),
      generatedIcnsFileName: "icon-dev.icns",
    });
  });
});
