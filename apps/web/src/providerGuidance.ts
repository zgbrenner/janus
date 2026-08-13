/**
 * Client-side setup guidance for the built-in provider drivers. The server
 * reports what went wrong (not installed, not signed in); these are the
 * concrete actions that fix it, phrased for people who don't live in a
 * terminal. Fork/unknown drivers return null so callers fall back to
 * whatever text the server supplied.
 */
export interface ProviderGuidance {
  /** Terminal command that signs the provider's CLI in. */
  readonly loginCommand: string;
  /** Where to download the provider's CLI. */
  readonly installUrl: string;
}

const GUIDANCE_BY_DRIVER: Readonly<Record<string, ProviderGuidance>> = {
  codex: {
    loginCommand: "codex login",
    installUrl: "https://developers.openai.com/codex/cli",
  },
  claudeAgent: {
    loginCommand: "claude auth login",
    installUrl: "https://claude.com/product/claude-code",
  },
  cursor: {
    loginCommand: "agent login",
    installUrl: "https://cursor.com/cli",
  },
  grok: {
    loginCommand: "grok login",
    installUrl: "https://x.ai/cli",
  },
  opencode: {
    loginCommand: "opencode auth login",
    installUrl: "https://opencode.ai",
  },
};

export function getProviderGuidance(driver: string | undefined): ProviderGuidance | null {
  if (driver === undefined) return null;
  return GUIDANCE_BY_DRIVER[driver] ?? null;
}
