import { describe, expect, it, vi } from "vite-plus/test";
import type { DraftId } from "../composerDraftStore";

vi.mock("./DiffWorkerPoolProvider", () => ({
  DiffWorkerPoolProvider: ({ children }: { children: React.ReactNode }) => children,
  useDiffWorkerPool: () => null,
}));

import { applyTaskStarterSelection } from "./ChatView";

describe("applyTaskStarterSelection", () => {
  it("keeps a starter selection in the draft before resetting and focusing the composer", () => {
    const setPrompt = vi.fn();
    const resetCursorState = vi.fn();
    const focusAtEnd = vi.fn();
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const prompt = "Prepare a brief for this work.";
    const composerDraftTarget = "draft-task-starter" as DraftId;

    applyTaskStarterSelection({
      composerDraftTarget,
      prompt,
      setPrompt,
      composerRef: { current: { resetCursorState, focusAtEnd } },
      requestFrame,
    });

    expect(setPrompt).toHaveBeenCalledExactlyOnceWith(composerDraftTarget, prompt);
    expect(resetCursorState).toHaveBeenCalledExactlyOnceWith({ cursor: prompt.length, prompt });
    expect(requestFrame).toHaveBeenCalledOnce();
    expect(focusAtEnd).toHaveBeenCalledOnce();
  });
});
