import { type ServerProvider } from "@t3tools/contracts";
import { memo } from "react";
import { CopyIcon, InfoIcon, XIcon } from "lucide-react";
import { APP_BASE_NAME } from "~/branding";
import { useCopyToClipboard } from "~/hooks/useCopyToClipboard";
import { openExternalUrl } from "~/lib/openExternalUrl";
import { cn } from "~/lib/utils";
import { getProviderGuidance } from "~/providerGuidance";
import { formatProviderDriverKindLabel } from "../../providerModels";
import { toastManager } from "../ui/toast";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";

export function getProviderStatusBannerKey(status: ServerProvider | null): string | null {
  return !status || status.status === "ready" || status.status === "disabled"
    ? null
    : [status.instanceId, status.status, status.auth.status, status.message ?? ""].join("\u0000");
}

export function shouldShowProviderStatusBanner(
  status: ServerProvider | null,
  dismissedBannerKey: string | null,
): boolean {
  const bannerKey = getProviderStatusBannerKey(status);
  return bannerKey !== null && bannerKey !== dismissedBannerKey;
}

function CopyCommandAction({ command, providerName }: { command: string; providerName: string }) {
  const { copyToClipboard } = useCopyToClipboard({
    target: "sign-in command",
    onCopy: () => {
      toastManager.add({
        type: "success",
        title: `${providerName} sign-in command copied`,
        description: "Paste it into a terminal and follow the sign-in steps.",
      });
    },
    onError: (error) => {
      toastManager.add({
        type: "error",
        title: `Could not copy the ${providerName} sign-in command`,
        description: error.message,
      });
    },
  });
  return (
    <button
      type="button"
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border/60 bg-foreground/4 px-2 py-1 font-mono text-xs text-foreground transition-colors hover:bg-foreground/8 focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Copy the ${providerName} sign-in command`}
      onClick={() => copyToClipboard(command)}
    >
      <code>{command}</code>
      <CopyIcon aria-hidden className="size-3 shrink-0 text-muted-foreground" />
    </button>
  );
}

export const ProviderStatusBanner = memo(function ProviderStatusBanner({
  onDismiss,
  status,
}: {
  onDismiss: () => void;
  status: ServerProvider | null;
}) {
  if (!status || status.status === "ready" || status.status === "disabled") {
    return null;
  }

  const providerName = status.displayName?.trim() || formatProviderDriverKindLabel(status.driver);
  const guidance = getProviderGuidance(status.driver);
  const isNotInstalled = !status.installed;
  const isUnauthenticated =
    !isNotInstalled && status.status === "error" && status.auth.status === "unauthenticated";

  const title = isNotInstalled
    ? `${providerName} isn't installed`
    : isUnauthenticated
      ? `${providerName} needs sign-in`
      : `${providerName} provider status`;
  const message = isNotInstalled
    ? `${APP_BASE_NAME} can't find ${providerName} on this computer. Install it, then restart ${APP_BASE_NAME}.`
    : isUnauthenticated
      ? guidance
        ? "Copy the command below, paste it into a terminal, and follow the sign-in steps."
        : "Sign in with the provider's terminal app, then try again."
      : (status.message ??
        (status.status === "error"
          ? `${providerName} provider is unavailable.`
          : `${providerName} provider has limited availability.`));
  // The server's own report often carries specifics (a configured binary
  // path, the exact probe failure); keep it reachable via the tooltip.
  const messageDetail = status.message ?? message;

  const action = isNotInstalled ? (
    guidance ? (
      <button
        type="button"
        className="inline-flex w-fit cursor-pointer items-center rounded-md border border-border/60 bg-foreground/4 px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-foreground/8 focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => openExternalUrl(guidance.installUrl, "Unable to open the install page")}
      >
        Get {providerName}
      </button>
    ) : null
  ) : isUnauthenticated && guidance ? (
    <CopyCommandAction command={guidance.loginCommand} providerName={providerName} />
  ) : null;

  return (
    <div className="pointer-events-auto mx-auto w-fit max-w-[calc(100%-2rem)] pt-3">
      <div
        className={cn(
          "alert-glass relative inline-flex items-center gap-3 rounded-xl border py-3 ps-3.5 pe-10 text-card-foreground text-sm",
          status.status === "warning"
            ? "border-warning/32 [&_svg]:text-warning"
            : "border-destructive/32 text-destructive-foreground [&_svg]:text-destructive",
        )}
        data-variant={status.status === "warning" ? "warning" : "error"}
        role="alert"
      >
        <InfoIcon className="size-4 shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="font-medium">{title}</div>
          <Tooltip>
            <TooltipTrigger
              render={<div className="line-clamp-3 text-muted-foreground">{message}</div>}
            />
            <TooltipPopup side="top" className="max-w-96 whitespace-pre-wrap">
              {messageDetail}
            </TooltipPopup>
          </Tooltip>
          {action}
        </div>
        <button
          type="button"
          aria-label={`Dismiss ${providerName} provider ${status.status}`}
          className="absolute top-2 right-2 inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-foreground/8 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onDismiss}
        >
          <XIcon aria-hidden className="size-3.5" />
        </button>
      </div>
    </div>
  );
});
