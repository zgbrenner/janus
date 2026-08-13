import { ProviderDriverKind, ProviderInstanceId, type ServerProvider } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { getProviderGuidance } from "~/providerGuidance";
import { getProviderSummary } from "./providerStatus";

function provider(overrides: Partial<ServerProvider> = {}): ServerProvider {
  return {
    instanceId: ProviderInstanceId.make("codex"),
    driver: ProviderDriverKind.make("codex"),
    displayName: "Codex",
    enabled: true,
    installed: true,
    version: "1.0.0",
    status: "ready",
    auth: { status: "authenticated" },
    checkedAt: "2026-08-13T12:00:00.000Z",
    models: [],
    slashCommands: [],
    skills: [],
    ...overrides,
  };
}

describe("getProviderGuidance", () => {
  it("knows the sign-in command and install page for every built-in driver", () => {
    for (const driver of ["codex", "claudeAgent", "cursor", "grok", "opencode"]) {
      const guidance = getProviderGuidance(driver);
      expect(guidance?.loginCommand).toBeTruthy();
      expect(guidance?.installUrl).toMatch(/^https:\/\//);
    }
  });

  it("returns null for fork drivers and missing values", () => {
    expect(getProviderGuidance("my-fork")).toBeNull();
    expect(getProviderGuidance(undefined)).toBeNull();
  });
});

describe("getProviderSummary", () => {
  it("reports a pending probe when the server has not answered yet", () => {
    expect(getProviderSummary(undefined).headline).toBe("Checking provider status");
  });

  it("offers the install page when a known provider is not installed", () => {
    const summary = getProviderSummary(provider({ installed: false, status: "error" }));

    expect(summary.headline).toBe("Not installed");
    expect(summary.detail).toContain("can't find this provider's app");
    expect(summary.action).toEqual({
      kind: "install",
      url: "https://developers.openai.com/codex/cli",
    });
  });

  it("offers the sign-in command when a known provider is unauthenticated", () => {
    const summary = getProviderSummary(
      provider({ status: "error", auth: { status: "unauthenticated" } }),
    );

    expect(summary.headline).toBe("Not signed in");
    expect(summary.detail).toContain("terminal");
    expect(summary.action).toEqual({ kind: "sign-in", command: "codex login" });
  });

  it("keeps the server's own message while still offering the action", () => {
    const summary = getProviderSummary(
      provider({
        status: "error",
        auth: { status: "unauthenticated" },
        message: "Codex CLI is not authenticated. Run `codex login` and try again.",
      }),
    );

    expect(summary.detail).toBe("Codex CLI is not authenticated. Run `codex login` and try again.");
    expect(summary.action).toEqual({ kind: "sign-in", command: "codex login" });
  });

  it("stays generic for fork drivers it has no guidance for", () => {
    const summary = getProviderSummary(
      provider({
        driver: ProviderDriverKind.make("my-fork"),
        status: "error",
        auth: { status: "unauthenticated" },
      }),
    );

    expect(summary.headline).toBe("Not signed in");
    expect(summary.action).toBeUndefined();
  });

  it("labels healthy providers as signed in", () => {
    expect(
      getProviderSummary(provider({ auth: { status: "authenticated", label: "Pro" } })).headline,
    ).toBe("Signed in · Pro");
    expect(getProviderSummary(provider()).headline).toBe("Signed in");
  });
});
