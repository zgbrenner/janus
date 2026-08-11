// @effect-diagnostics nodeBuiltinImport:off
import * as NodeChildProcess from "node:child_process";
import * as NodeCrypto from "node:crypto";
import * as NodeFS from "node:fs";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";
import * as NodeURL from "node:url";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import { parseDocument } from "yaml";

const repoRoot = NodePath.resolve(NodePath.dirname(NodeURL.fileURLToPath(import.meta.url)), "..");

const workspaceFiles = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "apps/server/package.json",
  "apps/desktop/package.json",
  "apps/web/package.json",
  "apps/mobile/package.json",
  "apps/mobile/deps/react-native-nitro-markdown-0.5.0.tgz",
  "apps/mobile/modules/t3-markdown-text/package.json",
  "apps/mobile/modules/t3-review-diff/package.json",
  "apps/mobile/modules/t3-terminal/package.json",
  "apps/marketing/package.json",
  "infra/relay/package.json",
  "oxlint-plugin-t3code/package.json",
  "packages/client-runtime/package.json",
  "packages/contracts/package.json",
  "packages/shared/package.json",
  "packages/ssh/package.json",
  "packages/tailscale/package.json",
  "packages/effect-acp/package.json",
  "packages/effect-codex-app-server/package.json",
  "scripts/package.json",
] as const;

function copyWorkspaceManifestFixture(targetRoot: string): void {
  for (const relativePath of workspaceFiles) {
    const sourcePath = NodePath.resolve(repoRoot, relativePath);
    const destinationPath = NodePath.resolve(targetRoot, relativePath);
    NodeFS.mkdirSync(NodePath.dirname(destinationPath), { recursive: true });
    NodeFS.cpSync(sourcePath, destinationPath);
  }

  const patchesDirectory = NodePath.resolve(repoRoot, "patches");
  if (NodeFS.existsSync(patchesDirectory)) {
    NodeFS.cpSync(patchesDirectory, NodePath.resolve(targetRoot, "patches"), {
      recursive: true,
    });
  }
}

function writeMacManifestFixtures(targetRoot: string): {
  arm64Path: string;
  x64Path: string;
} {
  const assetDirectory = NodePath.resolve(targetRoot, "release-assets");
  NodeFS.mkdirSync(assetDirectory, { recursive: true });

  const arm64Path = NodePath.resolve(assetDirectory, "latest-mac.yml");
  const x64Path = NodePath.resolve(assetDirectory, "latest-mac-x64.yml");

  NodeFS.writeFileSync(
    arm64Path,
    `version: 9.9.9-smoke.0
files:
  - url: Janus-9.9.9-smoke.0-arm64.zip
    sha512: arm64zip
    size: 125621344
  - url: Janus-9.9.9-smoke.0-arm64.dmg
    sha512: arm64dmg
    size: 131754935
path: Janus-9.9.9-smoke.0-arm64.zip
sha512: arm64zip
releaseDate: '2026-03-08T10:32:14.587Z'
`,
  );

  NodeFS.writeFileSync(
    x64Path,
    `version: 9.9.9-smoke.0
files:
  - url: Janus-9.9.9-smoke.0-x64.zip
    sha512: x64zip
    size: 132000112
  - url: Janus-9.9.9-smoke.0-x64.dmg
    sha512: x64dmg
    size: 138148807
path: Janus-9.9.9-smoke.0-x64.zip
sha512: x64zip
releaseDate: '2026-03-08T10:36:07.540Z'
`,
  );

  return { arm64Path, x64Path };
}

function assertContains(haystack: string, needle: string, message: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(message);
  }
}

function assertNotContains(haystack: string, needle: string, message: string): void {
  if (haystack.includes(needle)) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message} Expected ${String(expected)}, received ${String(actual)}.`);
  }
}

function assertArray(value: unknown, message: string): asserts value is ReadonlyArray<unknown> {
  if (!Array.isArray(value)) throw new Error(message);
}

function assertRecord(value: unknown, message: string): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(message);
}

function workflowDocument(path: string): Record<string, unknown> {
  const document = parseDocument(NodeFS.readFileSync(path, "utf8"));
  if (document.errors.length > 0) {
    throw new Error(
      `${path} is invalid YAML: ${document.errors.map((error) => error.message).join("; ")}`,
    );
  }
  const workflow = document.toJS();
  assertRecord(workflow, `${path} must contain a YAML object.`);
  return workflow;
}

function job(workflow: Record<string, unknown>, id: string): Record<string, unknown> {
  assertRecord(workflow.jobs, "Workflow must contain jobs.");
  const value = workflow.jobs[id];
  assertRecord(value, `Workflow is missing '${id}' job.`);
  return value;
}

function steps(jobDefinition: Record<string, unknown>): ReadonlyArray<Record<string, unknown>> {
  assertArray(jobDefinition.steps, "Job must contain steps.");
  return jobDefinition.steps.map((step) => {
    assertRecord(step, "Job step must be an object.");
    return step;
  });
}

function hasStep(
  steps: ReadonlyArray<Record<string, unknown>>,
  predicate: (step: Record<string, unknown>) => boolean,
): boolean {
  return steps.some(predicate);
}

function workflowActions(
  workflow: Record<string, unknown>,
): ReadonlyArray<{ readonly jobId: string; readonly uses: string }> {
  assertRecord(workflow.jobs, "Workflow must contain jobs.");
  return Object.entries(workflow.jobs).flatMap(([jobId, definition]) => {
    assertRecord(definition, `Workflow job '${jobId}' must be an object.`);
    return steps(definition).flatMap((step) =>
      typeof step.uses === "string" ? [{ jobId, uses: step.uses }] : [],
    );
  });
}

function assertActionOccurrences(
  actions: ReadonlyArray<{ readonly jobId: string; readonly uses: string }>,
  action: string,
  expectedCount: number,
): void {
  const actionName = action.slice(0, action.lastIndexOf("@"));
  const occurrences = actions.filter((entry) => entry.uses.startsWith(`${actionName}@`));
  assertEqual(
    occurrences.length,
    expectedCount,
    `Expected ${expectedCount} ${actionName} action occurrence(s).`,
  );
  for (const occurrence of occurrences) {
    assertEqual(
      occurrence.uses,
      action,
      `${occurrence.jobId} must use the required ${action} major.`,
    );
  }
}

function assertPackageVersion(path: string, version: string): void {
  const packageJson = JSON.parse(NodeFS.readFileSync(path, "utf8")) as {
    readonly version?: unknown;
  };

  if (packageJson.version !== version) {
    throw new Error(`Expected ${path} to have version ${version}.`);
  }
}

function assertNoTrackedGitlinks(root: string): void {
  const stagedPaths = NodeChildProcess.execFileSync("git", ["ls-files", "--stage"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const gitlinkPaths = stagedPaths
    .split(/\r?\n/)
    .flatMap((line) => /^160000 [0-9a-f]{40} \d+\t(.+)$/.exec(line)?.[1] ?? []);

  if (gitlinkPaths.length > 0) {
    throw new Error(
      `Release checkout must not track gitlinks or submodules: ${gitlinkPaths.join(", ")}.`,
    );
  }
}

function assertJanusSigningCertificate(root: string): void {
  const certificate = new NodeCrypto.X509Certificate(
    NodeFS.readFileSync(NodePath.resolve(root, "certs/Janus-Code-Signing-Certificate.crt")),
  );
  assertEqual(
    certificate.subject,
    certificate.issuer,
    "Janus signing certificate must be self-signed.",
  );
  assertEqual(
    certificate.subject.includes("CN=Janus Project"),
    true,
    "Janus signing certificate must identify the Janus Project.",
  );
  assertEqual(
    certificate.ca,
    false,
    "Janus signing certificate must not be a certificate authority.",
  );
  assertEqual(
    certificate.keyUsage?.includes("1.3.6.1.5.5.7.3.3"),
    true,
    "Janus signing certificate must be restricted to code signing.",
  );
}

assertNoTrackedGitlinks(repoRoot);
assertJanusSigningCertificate(repoRoot);

const tempRoot = NodeFS.mkdtempSync(NodePath.join(NodeOS.tmpdir(), "t3-release-smoke-"));

try {
  copyWorkspaceManifestFixture(tempRoot);

  NodeChildProcess.execFileSync(
    process.execPath,
    [
      NodePath.resolve(repoRoot, "scripts/update-release-package-versions.ts"),
      "9.9.9-smoke.0",
      "--root",
      tempRoot,
    ],
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  );

  NodeFS.rmSync(NodePath.resolve(tempRoot, "pnpm-lock.yaml"), { force: true });

  NodeChildProcess.execFileSync("vp", ["install", "--lockfile-only", "--ignore-scripts"], {
    cwd: tempRoot,
    stdio: "inherit",
  });

  const lockfile = NodeFS.readFileSync(NodePath.resolve(tempRoot, "pnpm-lock.yaml"), "utf8");
  assertContains(lockfile, "lockfileVersion:", "Expected pnpm-lock.yaml to be regenerated.");

  for (const relativePath of [
    "apps/server/package.json",
    "apps/desktop/package.json",
    "apps/web/package.json",
    "packages/contracts/package.json",
  ]) {
    assertPackageVersion(NodePath.resolve(tempRoot, relativePath), "9.9.9-smoke.0");
  }

  const ciWorkflow = workflowDocument(NodePath.resolve(repoRoot, ".github/workflows/ci.yml"));
  assertRecord(ciWorkflow.jobs, "CI must define jobs.");
  assertEqual(
    JSON.stringify(Object.keys(ciWorkflow.jobs).toSorted()),
    JSON.stringify(["check", "desktop_build", "release_smoke", "rust", "test"]),
    "CI job IDs must be stable.",
  );
  const ciTest = job(ciWorkflow, "test");
  const ciTestSteps = steps(ciTest);
  assertEqual(
    hasStep(ciTestSteps, (step) => step.run === "node scripts/export-brand-icons.ts --check"),
    true,
    "CI test job must run the icon check without a global package-manager command.",
  );
  assertEqual(
    hasStep(ciTestSteps, (step) => step.run === "pnpm icons:check"),
    false,
    "CI test job must not require pnpm from setup-vp.",
  );
  const desktopBuild = job(ciWorkflow, "desktop_build");
  const desktopBuildSteps = steps(desktopBuild);
  const preloadGuard = desktopBuildSteps.find((step) => step.name === "Verify preload bundle");
  assertRecord(preloadGuard, "Desktop build must verify the generated preload bundle.");
  assertEqual(preloadGuard.shell, "pwsh", "Preload bundle guard must use PowerShell on Windows.");
  const preloadGuardRun = preloadGuard.run;
  assertEqual(
    typeof preloadGuardRun === "string" &&
      [
        "apps/desktop/dist-electron/preload.cjs",
        "desktopBridge",
        "getLocalEnvironmentBootstraps",
        "getLocalEnvironmentBearerToken",
        "PICK_FOLDER_CHANNEL",
        "pickFolder",
      ].every((symbol) => preloadGuardRun.includes(symbol)) &&
      !preloadGuardRun.includes("wsUrl"),
    true,
    "Preload bundle guard must require the current desktop bridge API and reject the obsolete wsUrl contract.",
  );

  const securityWorkflow = workflowDocument(
    NodePath.resolve(repoRoot, ".github/workflows/security.yml"),
  );
  assertRecord(securityWorkflow.on, "Security workflow must define triggers.");
  assertEqual(
    JSON.stringify(Object.keys(securityWorkflow.on).toSorted()),
    JSON.stringify(["pull_request", "push", "schedule", "workflow_dispatch"]),
    "Security workflow must have only PR, main, weekly, and manual triggers.",
  );
  assertEqual(
    securityWorkflow.on.pull_request,
    null,
    "Security workflow pull-request trigger must have no broadened shape.",
  );
  assertRecord(securityWorkflow.on.push, "Security workflow must scan main pushes.");
  assertEqual(
    JSON.stringify(securityWorkflow.on.push),
    JSON.stringify({ branches: ["main"] }),
    "Security workflow push trigger must target main only.",
  );
  assertEqual(
    JSON.stringify(securityWorkflow.on.schedule),
    JSON.stringify([{ cron: "23 4 * * 1" }]),
    "Security workflow must scan on the exact weekly cron.",
  );
  assertEqual(
    securityWorkflow.on.workflow_dispatch,
    null,
    "Security workflow manual trigger must have no broadened shape.",
  );
  assertEqual(
    JSON.stringify(Object.keys(securityWorkflow.jobs ?? {}).toSorted()),
    JSON.stringify(["codeql", "dependency_review"]),
    "Security workflow must contain only its two security jobs.",
  );
  const codeqlJob = job(securityWorkflow, "codeql");
  assertEqual(
    Object.hasOwn(codeqlJob, "if"),
    false,
    "CodeQL must run for PR, main, schedule, and manual security triggers.",
  );
  assertRecord(codeqlJob.strategy, "CodeQL must use a language matrix.");
  assertRecord(codeqlJob.strategy.matrix, "CodeQL must use a language matrix.");
  assertArray(codeqlJob.strategy.matrix.language, "CodeQL must declare languages.");
  assertEqual(
    JSON.stringify([...codeqlJob.strategy.matrix.language].toSorted()),
    JSON.stringify(["actions", "javascript-typescript"]),
    "CodeQL must analyze JavaScript/TypeScript and GitHub Actions.",
  );
  assertRecord(codeqlJob.permissions, "CodeQL must declare least-privilege permissions.");
  assertEqual(
    JSON.stringify(codeqlJob.permissions),
    JSON.stringify({ contents: "read", "security-events": "write" }),
    "CodeQL must have only read contents and security-events write permissions.",
  );
  assertRecord(securityWorkflow.permissions, "Security workflow must declare permissions.");
  assertEqual(
    JSON.stringify(securityWorkflow.permissions),
    JSON.stringify({ contents: "read" }),
    "Security workflow must default to read-only contents.",
  );
  const dependencyReviewJob = job(securityWorkflow, "dependency_review");
  assertEqual(
    dependencyReviewJob.if,
    "github.event_name == 'pull_request'",
    "Dependency review must run only on pull requests.",
  );
  assertRecord(
    dependencyReviewJob.permissions,
    "Dependency review must declare least-privilege permissions.",
  );
  assertEqual(
    JSON.stringify(dependencyReviewJob.permissions),
    JSON.stringify({ contents: "read" }),
    "Dependency review must only read contents.",
  );

  const ciActions = workflowActions(ciWorkflow);
  const securityActions = workflowActions(securityWorkflow);
  const releaseActions = workflowActions(
    workflowDocument(NodePath.resolve(repoRoot, ".github/workflows/release.yml")),
  );
  const allActions = [...ciActions, ...securityActions, ...releaseActions];
  assertActionOccurrences(allActions, "actions/checkout@v6", 11);
  assertActionOccurrences(allActions, "voidzero-dev/setup-vp@v1", 8);
  assertActionOccurrences(allActions, "actions/upload-artifact@v7", 2);
  assertActionOccurrences(allActions, "actions/download-artifact@v8", 2);
  assertActionOccurrences(allActions, "github/codeql-action/init@v4", 1);
  assertActionOccurrences(allActions, "github/codeql-action/analyze@v4", 1);
  assertActionOccurrences(allActions, "actions/dependency-review-action@v4", 1);
  assertActionOccurrences(allActions, "actions/attest@v4", 1);
  assertActionOccurrences(allActions, "softprops/action-gh-release@v3", 1);

  assertEqual(
    JSON.stringify(securityWorkflow.on.push.branches),
    JSON.stringify(["main"]),
    "Security workflow must scan main pushes.",
  );

  const releasePath = NodePath.resolve(repoRoot, ".github/workflows/release.yml");
  const releaseWorkflow = workflowDocument(releasePath);
  assertRecord(releaseWorkflow.on, "Release workflow must define triggers.");
  assertRecord(releaseWorkflow.on.push, "Release workflow must be tag-driven.");
  assertArray(releaseWorkflow.on.push.tags, "Release workflow must filter tags.");
  assertEqual(
    JSON.stringify(releaseWorkflow.on.push.tags),
    JSON.stringify(["v*.*.*"]),
    "Release workflow must only receive version-like tags before preflight validation.",
  );
  const preflight = job(releaseWorkflow, "preflight");
  const preflightSteps = steps(preflight);
  assertEqual(
    hasStep(
      preflightSteps,
      (step) =>
        step.id === "tag" &&
        typeof step.run === "string" &&
        step.run.includes("Release tags must be exact vX.Y.Z semantic versions.") &&
        step.run.includes("version=${tag#v}"),
    ),
    true,
    "Release tag must be the sole version source.",
  );
  assertEqual(
    hasStep(preflightSteps, (step) => step.run === "node scripts/release-smoke.ts"),
    true,
    "Release preflight must run the release contract.",
  );
  for (const run of [
    "vp check",
    "vpr typecheck",
    "vp run test",
    "node scripts/export-brand-icons.ts --check",
  ]) {
    assertEqual(
      hasStep(preflightSteps, (step) => step.run === run),
      true,
      `Release preflight is missing ${run}.`,
    );
  }
  const wslBuild = job(releaseWorkflow, "build_wsl_node_pty");
  assertEqual(
    JSON.stringify(wslBuild.needs),
    JSON.stringify("preflight"),
    "WSL terminal module must wait for preflight.",
  );
  const wslUpload = steps(wslBuild).find((step) => step.uses === "actions/upload-artifact@v7");
  assertRecord(wslUpload, "WSL terminal module must use upload-artifact v7.");
  assertRecord(wslUpload.with, "WSL terminal module upload must declare its artifact path.");
  assertEqual(wslUpload.with.name, "wsl-node-pty-x64", "WSL upload name must be stable.");
  assertEqual(wslUpload.with.path, "wsl-prebuild/pty.node", "WSL upload path must be stable.");
  const build = job(releaseWorkflow, "build");
  assertRecord(build.strategy, "Release build must use a platform matrix.");
  assertRecord(build.strategy.matrix, "Release build must use a platform matrix.");
  assertArray(build.strategy.matrix.include, "Release build must include every platform.");
  assertEqual(
    JSON.stringify(build.strategy.matrix.include),
    JSON.stringify([
      {
        id: "macos-arm64",
        runner: "macos-15",
        platform: "mac",
        target: "dmg",
        arch: "arm64",
      },
      {
        id: "macos-x64",
        runner: "macos-15-intel",
        platform: "mac",
        target: "dmg",
        arch: "x64",
      },
      {
        id: "linux-x64",
        runner: "ubuntu-24.04",
        platform: "linux",
        target: "AppImage",
        arch: "x64",
      },
      {
        id: "windows-x64",
        runner: "windows-2025",
        platform: "win",
        target: "nsis",
        arch: "x64",
      },
    ]),
    "Release matrix must cover the four Janus desktop targets.",
  );
  const buildSteps = steps(build);
  assertEqual(
    JSON.stringify(build.needs),
    JSON.stringify(["preflight", "build_wsl_node_pty"]),
    "Windows packaging must wait for the WSL terminal module build.",
  );
  assertEqual(
    hasStep(buildSteps, (step) => step.name === "Stage macOS updater manifest"),
    true,
    "Each macOS build must stage a deterministic updater-manifest name.",
  );
  const manifestStagingStep = buildSteps.find(
    (step) => step.name === "Stage macOS updater manifest",
  );
  assertRecord(manifestStagingStep, "Release is missing macOS updater-manifest staging.");
  assertEqual(
    typeof manifestStagingStep.run === "string" &&
      manifestStagingStep.run.includes('source_manifest="release-publish/latest-mac.yml"') &&
      manifestStagingStep.run.includes('mv "$source_manifest" release-publish/latest-mac-x64.yml'),
    true,
    "macOS x64 must rename the builder's common updater manifest before upload.",
  );
  const wslDownload = buildSteps.find((step) => step.uses === "actions/download-artifact@v8");
  assertRecord(wslDownload, "Windows packaging must use download-artifact v8 for the WSL module.");
  assertRecord(wslDownload.with, "WSL download must declare its artifact path.");
  assertEqual(wslDownload.if, "matrix.platform == 'win'", "WSL download must be Windows-only.");
  assertEqual(wslDownload.with.name, "wsl-node-pty-x64", "WSL download name must match upload.");
  assertEqual(wslDownload.with.path, "wsl-prebuild", "WSL download path must be stable.");
  assertEqual(
    hasStep(
      buildSteps,
      (step) =>
        typeof step.run === "string" &&
        step.run.includes("--build-version") &&
        step.run.includes("needs.preflight.outputs.version") &&
        step.run.includes("--wsl-prebuild"),
    ),
    true,
    "Platform packaging must consume the tag version and Windows WSL module.",
  );
  const signedWindowsBuild = buildSteps.find(
    (step) => step.name === "Build self-signed Windows artifact",
  );
  assertRecord(signedWindowsBuild, "Windows packaging must use the self-signed build path.");
  assertEqual(
    signedWindowsBuild.if,
    "matrix.platform == 'win'",
    "The self-signed build path must be Windows-only.",
  );
  assertRecord(signedWindowsBuild.env, "The self-signed Windows build must receive CI secrets.");
  assertEqual(
    signedWindowsBuild.env.CSC_LINK,
    "${{ secrets.WINDOWS_CODE_SIGNING_PFX_BASE64 }}",
    "Windows signing must load the private certificate from an Actions secret.",
  );
  assertEqual(
    signedWindowsBuild.env.CSC_KEY_PASSWORD,
    "${{ secrets.WINDOWS_CODE_SIGNING_PFX_PASSWORD }}",
    "Windows signing must load the private certificate password from an Actions secret.",
  );
  assertEqual(
    signedWindowsBuild.env.JANUS_WINDOWS_SIGNING_PROVIDER,
    "csc",
    "Windows signing must select electron-builder CSC certificate discovery.",
  );
  assertEqual(
    typeof signedWindowsBuild.run === "string" && signedWindowsBuild.run.includes("--signed"),
    true,
    "Windows packaging must enable signing explicitly.",
  );
  const signatureVerification = buildSteps.find(
    (step) => step.name === "Verify self-signed Windows artifact",
  );
  assertRecord(
    signatureVerification,
    "Windows packaging must verify the generated Authenticode signature.",
  );
  assertEqual(
    signatureVerification.if,
    "matrix.platform == 'win'",
    "Authenticode verification must be Windows-only.",
  );
  assertEqual(
    typeof signatureVerification.run === "string" &&
      signatureVerification.run.includes("Get-AuthenticodeSignature") &&
      signatureVerification.run.includes("SignerCertificate.Thumbprint") &&
      signatureVerification.run.includes("Status -ne 'Valid'"),
    true,
    "Windows verification must prove signer identity and signature validity.",
  );
  assertEqual(
    hasStep(
      buildSteps,
      (step) => typeof step.run === "string" && step.run.includes("latest-linux.yml"),
    ),
    true,
    "Linux packaging must produce its updater manifest.",
  );
  assertEqual(
    hasStep(
      buildSteps,
      (step) =>
        typeof step.run === "string" &&
        step.run.includes('.dmg.blockmap"') &&
        step.run.includes('.zip.blockmap"'),
    ),
    true,
    "macOS packaging must require both external blockmaps for every architecture.",
  );
  assertEqual(
    hasStep(buildSteps, (step) => step.uses === "actions/upload-artifact@v7"),
    true,
    "Platform packaging must upload artifacts with upload-artifact v7.",
  );
  const release = job(releaseWorkflow, "release");
  assertRecord(release.permissions, "Final release must declare release-only permissions.");
  assertEqual(
    JSON.stringify(Object.keys(release.permissions).toSorted()),
    JSON.stringify(["artifact-metadata", "attestations", "contents", "id-token"]),
    "Final release must have exactly its publication and attestation permissions.",
  );
  assertEqual(
    release.permissions.contents,
    "write",
    "Final release must publish GitHub Release assets.",
  );
  assertEqual(release.permissions["id-token"], "write", "Final release must create attestations.");
  assertEqual(release.permissions.attestations, "write", "Final release must upload attestations.");
  assertEqual(
    release.permissions["artifact-metadata"],
    "write",
    "Final release must create artifact attestations.",
  );
  assertEqual(
    hasStep(
      steps(release),
      (step) =>
        step.run ===
        "node scripts/validate-release-assets.ts --assets-dir release-assets --version ${{ needs.preflight.outputs.version }}",
    ),
    true,
    "Release must validate the final asset set before checksums.",
  );
  const releaseSteps = steps(release);
  const certificateStagingIndex = releaseSteps.findIndex(
    (step) => step.name === "Stage public signing certificate",
  );
  const finalSetupIndex = releaseSteps.findIndex(
    (step) => step.uses === "voidzero-dev/setup-vp@v1",
  );
  const finalInstallIndex = releaseSteps.findIndex(
    (step) => step.run === "vp install --frozen-lockfile",
  );
  const mergeIndex = releaseSteps.findIndex(
    (step) => step.name === "Merge macOS updater manifests",
  );
  const validationIndex = releaseSteps.findIndex((step) => step.name === "Validate release assets");
  const checksumIndex = releaseSteps.findIndex((step) => step.name === "Create checksums");
  const attestIndex = releaseSteps.findIndex((step) => step.uses === "actions/attest@v4");
  const publishIndex = releaseSteps.findIndex(
    (step) => step.uses === "softprops/action-gh-release@v3",
  );
  assertEqual(
    0 <= finalSetupIndex &&
      0 <= certificateStagingIndex &&
      finalSetupIndex < finalInstallIndex &&
      finalInstallIndex < mergeIndex &&
      mergeIndex < validationIndex &&
      certificateStagingIndex < validationIndex &&
      validationIndex < checksumIndex &&
      checksumIndex < attestIndex &&
      attestIndex < publishIndex,
    true,
    "Final release steps must stage the public certificate before validation and publication.",
  );
  assertEqual(
    hasStep(releaseSteps, (step) => step.uses === "actions/attest@v4"),
    true,
    "Release must use actions/attest v4.",
  );
  for (const action of [
    "actions/checkout@v6",
    "actions/download-artifact@v8",
    "actions/attest@v4",
    "softprops/action-gh-release@v3",
  ]) {
    assertEqual(
      hasStep(releaseSteps, (step) => step.uses === action),
      true,
      `Final release must use ${action}.`,
    );
  }

  const releaseText = NodeFS.readFileSync(releasePath, "utf8").toLowerCase();
  for (const forbidden of [
    "relay",
    "npm publish",
    "publish cli",
    "vercel",
    "discord",
    "blacksmith",
    "self-hosted",
    "nightly",
    "release_app",
    "release app",
    "pingdotgg/t3code",
    "t3 code",
    "t3-code",
  ]) {
    assertNotContains(releaseText, forbidden, `Release must not include '${forbidden}'.`);
  }

  const { arm64Path, x64Path } = writeMacManifestFixtures(tempRoot);
  NodeChildProcess.execFileSync(
    process.execPath,
    [
      NodePath.resolve(repoRoot, "scripts/merge-update-manifests.ts"),
      "--platform",
      "mac",
      arm64Path,
      x64Path,
    ],
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  );

  const mergedManifest = NodeFS.readFileSync(arm64Path, "utf8");
  assertContains(
    mergedManifest,
    "Janus-9.9.9-smoke.0-arm64.zip",
    "Merged manifest is missing the arm64 asset.",
  );
  assertContains(
    mergedManifest,
    "Janus-9.9.9-smoke.0-x64.zip",
    "Merged manifest is missing the x64 asset.",
  );

  Effect.runSync(Console.log("Release smoke checks passed."));
} finally {
  NodeFS.rmSync(tempRoot, { recursive: true, force: true });
}
