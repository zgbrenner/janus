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
  `Janus-${version}-arm64.dmg.blockmap`,
  `Janus-${version}-arm64.zip.blockmap`,
  `Janus-${version}-x64.dmg.blockmap`,
  `Janus-${version}-x64.zip.blockmap`,
] as const;

function sha512(content: string): string {
  return NodeCrypto.createHash("sha512").update(content).digest("base64");
}

function manifestEntry(name: string, content: string, blockMapSize?: number): string {
  return `  - url: ${name}\n    sha512: ${sha512(content)}\n    size: ${Buffer.byteLength(content)}\n${blockMapSize === undefined ? "" : `    blockMapSize: ${blockMapSize}\n`}`;
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
  NodeFS.writeFileSync(
    NodePath.join(assetsDir, "latest-linux.yml"),
    `version: ${version}\nfiles:\n${manifestEntry(artifactNames[4], contents.get(artifactNames[4])!, 164034)}releaseDate: '2026-08-11T00:00:00.000Z'\n`,
  );
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

  it("rejects an updater manifest with a different version", () => {
    const assetsDir = writeFixture();
    try {
      const manifestPath = NodePath.join(assetsDir, "latest-linux.yml");
      NodeFS.writeFileSync(
        manifestPath,
        NodeFS.readFileSync(manifestPath, "utf8").replace(`version: ${version}`, "version: 9.9.9"),
      );
      assert.throws(() => validateReleaseAssets({ assetsDir, version }), /version mismatch/);
    } finally {
      NodeFS.rmSync(assetsDir, { recursive: true, force: true });
    }
  });

  it("rejects an updater manifest with an unexpected URL set", () => {
    const assetsDir = writeFixture();
    try {
      const manifestPath = NodePath.join(assetsDir, "latest-linux.yml");
      NodeFS.writeFileSync(
        manifestPath,
        `version: ${version}\nfiles:\n${manifestEntry(`Janus-${version}-wrong.AppImage`, "wrong")}releaseDate: '2026-08-11T00:00:00.000Z'\n`,
      );
      assert.throws(
        () => validateReleaseAssets({ assetsDir, version }),
        /does not describe exactly/,
      );
    } finally {
      NodeFS.rmSync(assetsDir, { recursive: true, force: true });
    }
  });

  it("rejects updater metadata with a stale size", () => {
    const assetsDir = writeFixture();
    try {
      NodeFS.appendFileSync(NodePath.join(assetsDir, artifactNames[4]), "larger");
      assert.throws(() => validateReleaseAssets({ assetsDir, version }), /size mismatch/);
    } finally {
      NodeFS.rmSync(assetsDir, { recursive: true, force: true });
    }
  });

  it("rejects missing and empty required release files", () => {
    const missingAssetsDir = writeFixture();
    const emptyAssetsDir = writeFixture();
    try {
      NodeFS.rmSync(NodePath.join(missingAssetsDir, artifactNames[0]));
      assert.throws(
        () => validateReleaseAssets({ assetsDir: missingAssetsDir, version }),
        /Missing or empty release file/,
      );
      NodeFS.writeFileSync(NodePath.join(emptyAssetsDir, artifactNames[1]), "");
      assert.throws(
        () => validateReleaseAssets({ assetsDir: emptyAssetsDir, version }),
        /Missing or empty release file/,
      );
    } finally {
      NodeFS.rmSync(missingAssetsDir, { recursive: true, force: true });
      NodeFS.rmSync(emptyAssetsDir, { recursive: true, force: true });
    }
  });

  it("rejects directories in the flat release asset set", () => {
    const assetsDir = writeFixture();
    try {
      NodeFS.mkdirSync(NodePath.join(assetsDir, "stage"));
      assert.throws(
        () => validateReleaseAssets({ assetsDir, version }),
        /Unexpected release entry/,
      );
    } finally {
      NodeFS.rmSync(assetsDir, { recursive: true, force: true });
    }
  });
});
