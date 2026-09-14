import { memo, useCallback, useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { Button } from "../ui/button";
import type { ExpandedImagePreview } from "./ExpandedImagePreview";

interface ExpandedImageDialogProps {
  preview: ExpandedImagePreview;
  onClose: () => void;
}

export const ExpandedImageDialog = memo(function ExpandedImageDialog({
  preview,
  onClose,
}: ExpandedImageDialogProps) {
  const [imageOffset, setImageOffset] = useState(0);
  const index = (preview.index + imageOffset + preview.images.length) % preview.images.length;

  const navigateImage = useCallback((direction: -1 | 1) => {
    setImageOffset((current) => current + direction);
  }, []);

  // Only the arrow keys are ours. Escape belongs to the dialog primitive, which
  // closes on it once focus is trapped inside — handling it here as well would
  // race the primitive's own teardown.
  useEffect(() => {
    if (preview.images.length <= 1) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        navigateImage(-1);
        return;
      }
      if (event.key !== "ArrowRight") return;
      event.preventDefault();
      event.stopPropagation();
      navigateImage(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigateImage, preview.images.length]);

  const item = preview.images[index];
  if (!item) return null;

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/75" />
        <DialogPrimitive.Popup
          aria-label="Expanded image preview"
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 outline-none [-webkit-app-region:no-drag]"
        >
          {/*
            Clicking the dark area still closes the lightbox. It is a bare div
            and aria-hidden on purpose: as a <button> it was a second tab stop
            carrying the same name as the real close button, so a keyboard or
            screen-reader user had to step over a decoy to reach the image.
            Escape and the close button cover the same intent for them.
          */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 cursor-zoom-out"
            onClick={onClose}
          />
          {preview.images.length > 1 && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 text-white/90 hover:bg-white/10 hover:text-white sm:left-6"
              aria-label="Previous image"
              onClick={() => navigateImage(-1)}
            >
              <ChevronLeftIcon className="size-5" />
            </Button>
          )}
          <div className="relative isolate z-10 max-h-[92vh] max-w-[92vw]">
            <DialogPrimitive.Close
              aria-label="Close image preview"
              className="absolute right-2 top-2"
              render={<Button size="icon-xs" variant="ghost" />}
            >
              <XIcon />
            </DialogPrimitive.Close>
            <img
              src={item.src}
              alt={item.name}
              className="max-h-[86vh] max-w-[92vw] select-none rounded-lg border border-border/70 bg-background object-contain shadow-2xl"
              draggable={false}
            />
            <p className="mt-2 max-w-[92vw] truncate text-center text-xs text-muted-foreground/80">
              {item.name}
              {preview.images.length > 1 ? ` (${index + 1}/${preview.images.length})` : ""}
            </p>
          </div>
          {preview.images.length > 1 && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 text-white/90 hover:bg-white/10 hover:text-white sm:right-6"
              aria-label="Next image"
              onClick={() => navigateImage(1)}
            >
              <ChevronRightIcon className="size-5" />
            </Button>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
});
