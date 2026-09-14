import { ApprovalRequestId } from "@t3tools/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";

import { ComposerStateAnnouncer } from "./ComposerStateAnnouncer";

const approval = {
  requestId: ApprovalRequestId.make("approval-1"),
  requestKind: "command" as const,
  createdAt: "2026-07-18T00:00:00.000Z",
  detail: "bun run release",
};

describe("ComposerStateAnnouncer", () => {
  // A pending approval empties the message box on screen and makes it
  // read-only. Nothing on the chat surface was a live region before this, so
  // the box stopped accepting input with no way for a screen-reader user to
  // find that out — they keep typing into a field that is no longer listening.
  it("says the message box went read-only when an approval arrives", () => {
    const markup = renderToStaticMarkup(<ComposerStateAnnouncer approval={approval} />);

    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain("Command approval requested");
    expect(markup).toContain("read-only until you respond");
  });

  // The region has to be in the DOM before the text arrives. A live region
  // mounted with its content already in it is announced inconsistently, so an
  // empty-but-present region is the whole point rather than dead markup.
  it("stays mounted and silent while no approval is pending", () => {
    const markup = renderToStaticMarkup(<ComposerStateAnnouncer approval={null} />);

    expect(markup).toContain('aria-live="polite"');
    expect(markup).not.toContain("approval requested");
    expect(markup).not.toContain("read-only");
  });
});
