import type { PersistedComposerImageAttachment } from "~/composerDraftStore";
import { compressImageForStash, type CompressStashImageResult } from "~/lib/imageCompression";

export interface DraftAttachmentSource {
  readonly id: string;
  readonly name: string;
  readonly file: File;
}

/**
 * Encodes composer images into the copy persisted with the draft.
 *
 * Drafts live in localStorage, which gives the whole origin ~5MB, while the
 * composer accepts images far larger than that. Each attachment is therefore
 * budgeted the same way the prompt stash budgets its own copies: an image
 * that will not fit is left unstaged, so the composer flags it as unsaved
 * rather than the write failing and costing every other draft its storage.
 * Only the persisted copy shrinks — the live attachment keeps its original
 * file, so what gets sent to the provider is unaffected.
 *
 * An image that cannot be encoded falls back to its previously persisted
 * copy when one exists, so a transient encoder failure does not discard a
 * copy that was already saved.
 */
export async function buildPersistedDraftAttachments(
  images: readonly DraftAttachmentSource[],
  existingById: ReadonlyMap<string, PersistedComposerImageAttachment>,
  compress: (file: File) => Promise<CompressStashImageResult> = compressImageForStash,
): Promise<PersistedComposerImageAttachment[]> {
  const stagedById = new Map<string, PersistedComposerImageAttachment>();

  await Promise.all(
    images.map(async (image) => {
      const keepAlreadyPersisted = () => {
        const existing = existingById.get(image.id);
        if (existing) {
          stagedById.set(image.id, existing);
        }
      };

      try {
        const result = await compress(image.file);
        if (!result.ok) {
          keepAlreadyPersisted();
          return;
        }
        stagedById.set(image.id, {
          id: image.id,
          name: image.name,
          mimeType: result.image.mimeType,
          sizeBytes: result.image.sizeBytes,
          dataUrl: result.image.dataUrl,
        });
      } catch {
        keepAlreadyPersisted();
      }
    }),
  );

  // Emit in composer order rather than encode-completion order, so a restored
  // draft shows its attachments the way they were arranged on screen.
  return images.flatMap((image) => {
    const staged = stagedById.get(image.id);
    return staged ? [staged] : [];
  });
}
