import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";

import { MessageCopyButton } from "./MessageCopyButton";

describe("MessageCopyButton", () => {
  // The button copies the message body, so a name mentioning a link sends
  // screen-reader users past the control they are looking for — and the
  // visible tooltip already reads "Copy to clipboard", which hides the
  // mismatch from anyone reviewing it with their eyes.
  it("names itself after what it copies", () => {
    const markup = renderToStaticMarkup(<MessageCopyButton text="the assistant reply" />);

    expect(markup).toContain('aria-label="Copy message to clipboard"');
    expect(markup).not.toContain("Copy link");
  });
});
