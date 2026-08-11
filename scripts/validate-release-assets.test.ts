// @effect-diagnostics nodeBuiltinImport:off
import * as NodeCrypto from "node:crypto";
import * as NodeFS from "node:fs";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";
import { assert, describe, it } from "vite-plus/test";

import { validateReleaseAssets } from "./validate-release-assets.ts";

const version = "9.9.9-smoke.0";

const artifactNames = [
  `Janus-${version}-arm64.dmg`,
  `Janus-${version}-arm64.zip`,
  `Janus-${version}-x64.dmg`,
  `Janus-${version}-x64.zip`,
  `Janus-${version}-x64.AppImage`,
  `Janus-${version}-x64.exe`,
  `Janus-${version}-x64.exe.blockmap`,
] as const;

function sha512(content: string): string {
  return NodeCrypto.createHash("sha512").update(content).digest("base64");
}

function manifestEntry(name: string, content: string): string {
  return `  - url: ${name}\n    sha512: ${sha512(content)}\n    size: ${Buffer.byteLength(content)}\n`;
}

function writeFixture(): string {
  const assetsDir = NodeFS.mkdtempSync(NodePath.join(NodeOS.tmpdir(), "janus-release-assets-"));
  const contents = new Map<string, string>();
  for (const [index, name] of artifactNames.entries()) {
    const content = `Janus release fixture ${index}`;
    contents.set(name, content);
    NodeFS.writeFileSync(NodePath.join(assetsDir, name), content);
  }

  const manifest = (names: ReadonlyArray<string>) =>
    `version: ${version}\nfiles:\n${names
      .map((name) => manifestEntry(name, contents.get(name)!))
      .join("")}releaseDate: '2026-08-11T00:00:00.000Z'\n`;
  NodeFS.writeFileSync(
    NodePath.join(assetsDir, "latest-mac.yml"),
    manifest([artifactNames[0], artifactNames[1], artifactNames[2], artifactNames[3]]),
  );
  NodeFS.writeFileSync(NodePath.join(assetsDir, "latest-linux.yml"), manifest([artifactNames[4]]));
  NodeFS.writeFileSync(NodePath.join(assetsDir, "latest.yml"), manifest([artifactNames[5]]));
  return assetsDir;
}

describe("validate-release-assets", () => {
  it("accepts exactly the Janus release set and matching updater metadata", () => {
    const assetsDir = writeFixture();
    try {
      assert.deepStrictEqual(validateReleaseAssets({ assetsDir, version }), {
        artifacts: [...artifactNames],
        manifests: ["latest-mac.yml", "latest-linux.yml", "latest.yml"],
      });
    } finally {
      NodeFS.rmSync(assetsDir, { recursive: true, force: true });
    }
  });

  it("rejects an unexpected build byproduct", () => {
    const assetsDir = writeFixture();
    try {
      NodeFS.writeFileSync(NodePath.join(assetsDir, "builder-debug.yml"), "debug");
      assert.throws(() => validateReleaseAssets({ assetsDir, version }), /Unexpected release file/);
    } finally {
      NodeFS.rmSync(assetsDir, { recursive: true, force: true });
    }
  });

  it("rejects updater metadata that no longer matches an installer", () => {
    const assetsDir = writeFixture();
    try {
      const installerPath = NodePath.join(assetsDir, artifactNames[5]);
      NodeFS.writeFileSync(installerPath, "x".repeat(NodeFS.statSync(installerPath).size));
      assert.throws(() => validateReleaseAssets({ assetsDir, version }), /SHA-512 mismatch/);
    } finally {
      NodeFS.rmSync(assetsDir, { recursive: true, force: true });
    }
  });
});
