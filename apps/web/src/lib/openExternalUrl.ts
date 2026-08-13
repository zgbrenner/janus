import { toastManager } from "~/components/ui/toast";
import { readLocalApi } from "~/localApi";

/** Open a URL in the user's browser via the desktop shell when available,
    surfacing failures as a toast instead of throwing from a click handler. */
export function openExternalUrl(url: string, failureTitle: string): void {
  void (async () => {
    try {
      if (await readLocalApi()?.shell.openExternal(url)) return;
    } catch {
      // Surface rejected IPC calls through the same user-visible fallback.
    }
    toastManager.add({
      type: "error",
      title: failureTitle,
      description: url,
    });
  })();
}
