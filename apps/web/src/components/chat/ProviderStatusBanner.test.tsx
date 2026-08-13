import { ProviderDriverKind, ProviderInstanceId, type ServerProvider } from "@t3tools/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";

import {
  getProviderStatusBannerKey,
  ProviderStatusBanner,
  shouldShowProviderStatusBanner,
} from "./ProviderStatusBanner";

function warningProvider(): ServerProvider {
  return {
    instanceId: ProviderInstanceId.make("codex"),
    driver: ProviderDriverKind.make("codex"),
    displayName: "Codex",
    enabled: true,
    installed: true,
    version: "1.0.0",
    status: "warning",
    auth: { status: "authenticated" },
    checkedAt: "2026-07-23T12:00:00.000Z",
    message: "Provider is temporarily degraded.",
    models: [],
    slashCommands: [],
    skills: [],
  };
}

describe("ProviderStatusBanner", () => {
  it("stays hidden after its current warning is dismissed", () => {
    const status = warningProvider();

    expect(shouldShowProviderStatusBanner(status, null)).toBe(true);
    expect(shouldShowProviderStatusBanner(status, getProviderStatusBannerKey(status))).toBe(false);
  });

  it("renders an accessible dismiss control for provider warnings", () => {
    const markup = renderToStaticMarkup(
      <ProviderStatusBanner status={warningProvider()} onDismiss={() => {}} />,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('aria-label="Dismiss Codex provider warning"');
    expect(markup).toContain("absolute top-2 right-2");
  });

  it("renders on a glass surface so the timeline never reads through the banner", () => {
    const markup = renderToStaticMarkup(
      <ProviderStatusBanner status={warningProvider()} onDismiss={() => {}} />,
    );

    expect(markup).toContain("alert-glass");
    expect(markup).toContain('data-variant="warning"');
  });

  it("labels error dismiss controls with the correct severity", () => {
    const markup = renderToStaticMarkup(
      <ProviderStatusBanner
        status={{ ...warningProvider(), status: "error" }}
        onDismiss={() => {}}
      />,
    );

    expect(markup).toContain('aria-label="Dismiss Codex provider error"');
  });

  it("offers a copyable sign-in command when a known provider is unauthenticated", () => {
    const markup = renderToStaticMarkup(
      <ProviderStatusBanner
        status={{
          ...warningProvider(),
          status: "error",
          auth: { status: "unauthenticated" },
          message: "Codex CLI is not authenticated. Run `codex login` and try again.",
        }}
        onDismiss={() => {}}
      />,
    );

    expect(markup).toContain("Codex needs sign-in");
    expect(markup).toContain("codex login");
    expect(markup).toContain('aria-label="Copy the Codex sign-in command"');
    expect(markup).not.toContain("is unauthenticated");
  });

  it("points at the install page when a known provider is missing", () => {
    const markup = renderToStaticMarkup(
      <ProviderStatusBanner
        status={{
          ...warningProvider(),
          status: "error",
          installed: false,
          message: "Codex CLI (`codex`) is not installed or not on PATH.",
        }}
        onDismiss={() => {}}
      />,
    );

    expect(markup).toContain("Codex isn&#x27;t installed");
    expect(markup).toContain("Get Codex");
    expect(markup).not.toContain("PATH.</div>");
  });

  it("falls back to plain guidance for fork drivers it does not know", () => {
    const markup = renderToStaticMarkup(
      <ProviderStatusBanner
        status={{
          ...warningProvider(),
          driver: ProviderDriverKind.make("my-fork"),
          displayName: "My Fork",
          status: "error",
          auth: { status: "unauthenticated" },
        }}
        onDismiss={() => {}}
      />,
    );

    expect(markup).toContain("My Fork needs sign-in");
    expect(markup).toContain("Sign in with the provider&#x27;s terminal app");
  });
});
