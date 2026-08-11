import { assert, describe, it } from "vite-plus/test";

import { parseUpdateManifest, serializeUpdateManifest } from "./update-manifest.ts";

const linuxManifest = (blockMapLines: string) => `version: 0.0.1
files:
  - url: Janus-0.0.1-x64.AppImage
    sha512: linux-sha512
    size: 125621344
${blockMapLines}path: Janus-0.0.1-x64.AppImage
sha512: linux-sha512
releaseDate: '2026-08-11T00:00:00.000Z'
`;

describe("update manifest blockMapSize", () => {
  it("round-trips the electron-builder Linux AppImage manifest shape", () => {
    const parsed = parseUpdateManifest(
      linuxManifest("    blockMapSize: 164034\n"),
      "latest-linux.yml",
      "Linux",
    );

    assert.deepStrictEqual(parsed.files, [
      {
        url: "Janus-0.0.1-x64.AppImage",
        sha512: "linux-sha512",
        size: 125621344,
        blockMapSize: 164034,
      },
    ]);
    assert.deepStrictEqual(
      parseUpdateManifest(
        serializeUpdateManifest(parsed, { platformLabel: "Linux" }),
        "latest-linux.yml",
        "Linux",
      ),
      parsed,
    );
  });

  it("rejects malformed, duplicate, and orphaned blockMapSize values", () => {
    for (const value of ["-1", "1.5", "9007199254740992", "'164034'"]) {
      assert.throws(
        () =>
          parseUpdateManifest(
            linuxManifest(`    blockMapSize: ${value}\n`),
            "latest-linux.yml",
            "Linux",
          ),
        /blockMapSize must be a nonnegative safe integer/,
      );
    }

    assert.throws(
      () =>
        parseUpdateManifest(
          linuxManifest("    blockMapSize: 1\n    blockMapSize: 2\n"),
          "latest-linux.yml",
          "Linux",
        ),
      /duplicate blockMapSize/,
    );
    assert.throws(
      () =>
        parseUpdateManifest(
          `version: 0.0.1\nfiles:\n    blockMapSize: 1\nreleaseDate: '2026-08-11T00:00:00.000Z'\n`,
          "latest-linux.yml",
          "Linux",
        ),
      /blockMapSize without a file entry/,
    );
  });
});
