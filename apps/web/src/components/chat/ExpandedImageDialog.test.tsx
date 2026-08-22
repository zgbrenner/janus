import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";

import { ExpandedImageDialog } from "./ExpandedImageDialog";

const preview = {
  index: 0,
  images: [
    { src: "first.png", name: "first.png" },
    { src: "second.png", name: "second.png" },
  ],
};

describe("ExpandedImageDialog", () => {
  // The lightbox used to be a hand-rolled `<div role="dialog" aria-modal="true">`
  // rendered straight into the chat view. Nothing trapped focus and nothing
  // restored it, so Tab walked out into the timeline behind the image and focus
  // was stranded once the lightbox closed — and claiming `aria-modal` while the
  // rest of the page stays reachable is precisely what misleads a screen reader.
  //
  // What this pins is that the markup no longer carries a hand-rolled modal: the
  // dialog primitive owns the trap, the restore, and the Escape key, and it
  // portals its content, so nothing renders here on the server. The trap itself
  // is the primitive's behavior and needs a DOM to exercise — this suite has
  // none — so this test guards the structure, not the runtime focus order.
  it("does not hand-roll a modal of its own", () => {
    const markup = renderToStaticMarkup(
      <ExpandedImageDialog preview={preview} onClose={() => {}} />,
    );

    expect(markup).not.toContain("aria-modal");
    expect(markup).not.toContain('role="dialog"');
  });
});
