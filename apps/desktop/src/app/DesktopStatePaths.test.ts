import { assert, describe, it } from "@effect/vitest";
import * as Option from "effect/Option";

import { resolveDesktopBaseDir, resolveDesktopStateDir } from "./DesktopStatePaths.ts";

describe("DesktopStatePaths", () => {
  const joinPath = (...segments: ReadonlyArray<string>) => segments.join("/");

  it("isolates implicit production and development state under ~/.janus", () => {
    const baseDir = resolveDesktopBaseDir({
      homeDirectory: "/home/alice",
      joinPath,
      t3Home: Option.none(),
    });

    assert.equal(baseDir, "/home/alice/.janus");
    assert.equal(
      resolveDesktopStateDir({
        baseDir,
        isDevelopment: false,
        joinPath,
        t3Home: Option.none(),
      }),
      "/home/alice/.janus/userdata",
    );
    assert.equal(
      resolveDesktopStateDir({
        baseDir,
        isDevelopment: true,
        joinPath,
        t3Home: Option.none(),
      }),
      "/home/alice/.janus/dev",
    );
  });

  it("preserves an explicit T3CODE_HOME override without applying Janus subdirectory rules", () => {
    const baseDir = resolveDesktopBaseDir({
      homeDirectory: "/home/alice",
      joinPath,
      t3Home: Option.some("/custom/t3-compatible-home"),
    });

    assert.equal(baseDir, "/custom/t3-compatible-home");
    assert.equal(
      resolveDesktopStateDir({
        baseDir,
        isDevelopment: true,
        joinPath,
        t3Home: Option.some("/custom/t3-compatible-home"),
      }),
      "/custom/t3-compatible-home/userdata",
    );
  });
});
