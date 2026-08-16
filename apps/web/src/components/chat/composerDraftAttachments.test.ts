import { describe, expect, it, vi } from "vite-plus/test";

import type { PersistedComposerImageAttachment } from "~/composerDraftStore";
import type { CompressStashImageResult } from "~/lib/imageCompression";
import {
  buildPersistedDraftAttachments,
  type DraftAttachmentSource,
} from "./composerDraftAttachments";

function image(id: string, name = `${id}.png`): DraftAttachmentSource {
  return { id, name, file: new File(["x"], name, { type: "image/png" }) };
}

function compressed(dataUrl: string, sizeBytes = 128): CompressStashImageResult {
  return {
    ok: true,
    image: { dataUrl, mimeType: "image/webp", sizeBytes, recompressed: true },
  };
}

function persisted(id: string): PersistedComposerImageAttachment {
  return {
    id,
    name: `${id}.png`,
    mimeType: "image/png",
    sizeBytes: 10,
    dataUrl: `data:image/png;base64,${id}-already-saved`,
  };
}

describe("buildPersistedDraftAttachments", () => {
  it("stores the budgeted encoding rather than the original file", async () => {
    const attachments = await buildPersistedDraftAttachments([image("a")], new Map(), () =>
      Promise.resolve(compressed("data:image/webp;base64,small", 512)),
    );

    expect(attachments).toEqual([
      {
        id: "a",
        name: "a.png",
        mimeType: "image/webp",
        sizeBytes: 512,
        dataUrl: "data:image/webp;base64,small",
      },
    ]);
  });

  it("leaves an over-budget image unstaged so it is flagged as unsaved", async () => {
    const attachments = await buildPersistedDraftAttachments(
      [image("a"), image("b")],
      new Map(),
      (file) =>
        Promise.resolve(
          file.name === "a.png"
            ? ({ ok: false, reason: "too-large" } satisfies CompressStashImageResult)
            : compressed("data:image/webp;base64,b"),
        ),
    );

    expect(attachments.map((attachment) => attachment.id)).toEqual(["b"]);
  });

  it("keeps a copy that was already saved when re-encoding fails", async () => {
    const existing = new Map([["a", persisted("a")]]);

    const tooLarge = await buildPersistedDraftAttachments([image("a")], existing, () =>
      Promise.resolve({ ok: false, reason: "unreadable" } satisfies CompressStashImageResult),
    );
    const threw = await buildPersistedDraftAttachments([image("a")], existing, () =>
      Promise.reject(new Error("canvas exploded")),
    );

    expect(tooLarge).toEqual([persisted("a")]);
    expect(threw).toEqual([persisted("a")]);
  });

  it("returns attachments in composer order, not encode-completion order", async () => {
    const delays: Record<string, number> = { "a.png": 20, "b.png": 0, "c.png": 10 };
    const compress = (file: File) =>
      new Promise<CompressStashImageResult>((resolve) => {
        setTimeout(
          () => resolve(compressed(`data:image/webp;base64,${file.name}`)),
          delays[file.name] ?? 0,
        );
      });

    const attachments = await buildPersistedDraftAttachments(
      [image("a"), image("b"), image("c")],
      new Map(),
      compress,
    );

    expect(attachments.map((attachment) => attachment.id)).toEqual(["a", "b", "c"]);
  });

  it("encodes every image once", async () => {
    const compress = vi.fn(() => Promise.resolve(compressed("data:image/webp;base64,x")));

    await buildPersistedDraftAttachments([image("a"), image("b")], new Map(), compress);

    expect(compress).toHaveBeenCalledTimes(2);
  });

  it("has nothing to stage for an empty composer", async () => {
    expect(await buildPersistedDraftAttachments([], new Map())).toEqual([]);
  });
});
