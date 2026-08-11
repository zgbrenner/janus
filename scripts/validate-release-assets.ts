// @effect-diagnostics nodeBuiltinImport:off
import * as NodeCrypto from "node:crypto";
import * as NodeFS from "node:fs";
import * as NodePath from "node:path";
import * as NodeURL from "node:url";

import { parseUpdateManifest } from "./lib/update-manifest.ts";

export interface ReleaseAssetValidationInput {
  readonly assetsDir: string;
  readonly version: string;
}

export interface ReleaseAssetValidationResult {
  readonly artifacts: ReadonlyArray<string>;
  readonly manifests: ReadonlyArray<string>;
}

const manifestNames = ["latest-mac.yml", "latest-linux.yml", "latest.yml"] as const;

function expectedArtifactNames(version: string): ReadonlyArray<string> {
  return [
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
  ];
}

function sha512(path: string): string {
  return NodeCrypto.createHash("sha512").update(NodeFS.readFileSync(path)).digest("base64");
}

function validateManifest(
  assetsDir: string,
  manifestName: (typeof manifestNames)[number],
  version: string,
  expectedUrls: ReadonlyArray<string>,
): void {
  const manifestPath = NodePath.join(assetsDir, manifestName);
  const manifest = parseUpdateManifest(
    NodeFS.readFileSync(manifestPath, "utf8"),
    manifestPath,
    manifestName,
  );
  if (manifest.version !== version) {
    throw new Error(
      `${manifestName} version mismatch: expected ${version}, received ${manifest.version}.`,
    );
  }

  const filesByUrl = new Map(manifest.files.map((file) => [file.url, file]));
  if (filesByUrl.size !== manifest.files.length) {
    throw new Error(`${manifestName} contains duplicate updater file URLs.`);
  }
  if (
    JSON.stringify([...filesByUrl.keys()].toSorted()) !==
    JSON.stringify([...expectedUrls].toSorted())
  ) {
    throw new Error(`${manifestName} does not describe exactly its expected Janus artifacts.`);
  }

  for (const url of expectedUrls) {
    const file = filesByUrl.get(url);
    if (!file) throw new Error(`${manifestName} is missing ${url}.`);
    const artifactPath = NodePath.join(assetsDir, url);
    const size = NodeFS.statSync(artifactPath).size;
    if (file.size !== size) {
      throw new Error(
        `${manifestName} size mismatch for ${url}: expected ${size}, received ${file.size}.`,
      );
    }
    const digest = sha512(artifactPath);
    if (file.sha512 !== digest) {
      throw new Error(`${manifestName} SHA-512 mismatch for ${url}.`);
    }
  }
}

export function validateReleaseAssets(
  input: ReleaseAssetValidationInput,
): ReleaseAssetValidationResult {
  const artifacts = expectedArtifactNames(input.version);
  const expectedFiles = new Set([...artifacts, ...manifestNames]);
  const actualEntries = NodeFS.readdirSync(input.assetsDir, {
    withFileTypes: true,
  });
  for (const entry of actualEntries) {
    if (!entry.isFile()) throw new Error(`Unexpected release entry: ${entry.name}.`);
    if (!expectedFiles.has(entry.name)) throw new Error(`Unexpected release file: ${entry.name}.`);
  }
  for (const file of expectedFiles) {
    const path = NodePath.join(input.assetsDir, file);
    if (!NodeFS.existsSync(path) || NodeFS.statSync(path).size === 0) {
      throw new Error(`Missing or empty release file: ${file}.`);
    }
  }

  validateManifest(input.assetsDir, "latest-mac.yml", input.version, artifacts.slice(0, 4));
  validateManifest(input.assetsDir, "latest-linux.yml", input.version, [artifacts[4]!]);
  validateManifest(input.assetsDir, "latest.yml", input.version, [artifacts[5]!]);

  return { artifacts, manifests: [...manifestNames] };
}

function readOption(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing required ${name} option.`);
  return value;
}

function isCliInvocation(): boolean {
  const entrypoint = process.argv[1];
  return (
    entrypoint !== undefined &&
    NodeURL.fileURLToPath(import.meta.url) === NodePath.resolve(entrypoint)
  );
}

if (isCliInvocation()) {
  validateReleaseAssets({
    assetsDir: readOption("--assets-dir"),
    version: readOption("--version"),
  });
  process.stdout.write("Release asset validation passed.\n");
}
