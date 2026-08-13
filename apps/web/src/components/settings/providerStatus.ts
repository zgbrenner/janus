import type { ServerProvider, ServerProviderVersionAdvisory } from "@t3tools/contracts";
import { APP_BASE_NAME } from "~/branding";
import { getProviderGuidance } from "~/providerGuidance";

/**
 * Visual treatment for each server-reported provider status. Centralized so
 * the default-driver card and per-instance cards share the same language.
 */
export const PROVIDER_STATUS_STYLES = {
  disabled: {
    dot: "bg-amber-400",
  },
  error: {
    dot: "bg-destructive",
  },
  ready: {
    dot: "bg-success",
  },
  warning: {
    dot: "bg-warning",
  },
} as const;

export type ProviderStatusKey = keyof typeof PROVIDER_STATUS_STYLES;

/** A concrete fix the UI can offer next to a provider problem: a sign-in
    command to copy into a terminal, or the page where the CLI is installed. */
export type ProviderSummaryAction =
  | { readonly kind: "sign-in"; readonly command: string }
  | { readonly kind: "install"; readonly url: string };

export interface ProviderSummary {
  readonly headline: string;
  readonly detail: string | null;
  readonly action?: ProviderSummaryAction;
}

/**
 * Derive the headline + detail copy shown under a provider's name in the
 * settings page. Prefers `provider.message` for server-supplied detail and
 * falls back to generic phrasing when the server has not yet reported any
 * state — which happens before the first probe or when an instance names a
 * driver this build does not ship. When the fix is known (install the CLI,
 * run its login command), `action` carries it in structured form.
 */
export function getProviderSummary(provider: ServerProvider | undefined): ProviderSummary {
  if (!provider) {
    return {
      headline: "Checking provider status",
      detail: "Waiting for the server to report installation and authentication details.",
    };
  }
  const guidance = getProviderGuidance(provider.driver);
  if (!provider.enabled) {
    return {
      headline: "Disabled",
      detail:
        provider.message ??
        `This provider is installed but disabled for new sessions in ${APP_BASE_NAME}.`,
    };
  }
  if (!provider.installed) {
    return {
      headline: "Not installed",
      detail:
        provider.message ??
        `${APP_BASE_NAME} can't find this provider's app on this computer. Install it, then restart ${APP_BASE_NAME}.`,
      ...(guidance ? { action: { kind: "install", url: guidance.installUrl } } : {}),
    };
  }
  if (provider.auth.status === "authenticated") {
    const authLabel = provider.auth.label ?? provider.auth.type;
    return {
      headline: authLabel ? `Signed in · ${authLabel}` : "Signed in",
      detail: provider.message ?? null,
    };
  }
  if (provider.auth.status === "unauthenticated") {
    return {
      headline: "Not signed in",
      detail:
        provider.message ??
        (guidance
          ? "Open a terminal, run the sign-in command, and follow its steps."
          : "Sign in with the provider's terminal app, then try again."),
      ...(guidance ? { action: { kind: "sign-in", command: guidance.loginCommand } } : {}),
    };
  }
  if (provider.status === "warning") {
    return {
      headline: "Needs attention",
      detail:
        provider.message ?? "The provider is installed, but the server could not fully verify it.",
    };
  }
  if (provider.status === "error") {
    return {
      headline: "Unavailable",
      detail: provider.message ?? "The provider failed its startup checks.",
    };
  }
  return {
    headline: "Available",
    detail: provider.message ?? "Installed and ready, but authentication could not be verified.",
  };
}

/**
 * Normalize a version string for display. Adds the `v` prefix when the
 * driver reported a bare version (e.g. `1.2.3`) so cards render
 * consistently regardless of driver.
 */
export function getProviderVersionLabel(version: string | null | undefined) {
  if (!version) return null;
  return version.startsWith("v") ? version : `v${version}`;
}

export function getProviderVersionAdvisoryPresentation(
  advisory: ServerProviderVersionAdvisory | undefined,
): {
  readonly detail: string;
  readonly updateCommand: string | null;
  readonly emphasis: "normal" | "strong";
} | null {
  if (!advisory || advisory.status === "current" || advisory.status === "unknown") {
    return null;
  }

  const label = "Update available";
  const version = advisory.latestVersion;
  const versionLabel = getProviderVersionLabel(version);

  return {
    detail:
      advisory.message ??
      (versionLabel
        ? `${label}: install ${versionLabel}.`
        : `${label}: install the latest provider version.`),
    updateCommand: advisory.updateCommand,
    emphasis: "normal" as const,
  };
}
