import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it, vi } from "vite-plus/test";
import type { DraftId } from "../composerDraftStore";
import { useComposerDraftStore } from "../composerDraftStore";

const starterHarness = vi.hoisted(() => ({
  clickStarter: undefined as (() => void) | undefined,
}));

vi.mock("./DiffWorkerPoolProvider", () => ({
  DiffWorkerPoolProvider: ({ children }: { children: React.ReactNode }) => children,
  useDiffWorkerPool: () => null,
}));

vi.mock("./chat/TaskStarterPrompts", () => ({
  TaskStarterPrompts: ({ onSelect }: { onSelect: (prompt: string) => void }) => {
    starterHarness.clickStarter = () => onSelect("Prepare a brief for this work.");
    return createElement("button", { type: "button" }, "Prepare a brief");
  },
}));

import * as ChatViewModule from "./ChatView";

const { applyTaskStarterSelection } = ChatViewModule;

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

describe("ChatView task starters", () => {
  it("routes a rendered DraftHeroHeadline starter into the active draft without submitting", () => {
    const ChatViewTaskStarterHero = (
      ChatViewModule as typeof ChatViewModule & {
        ChatViewTaskStarterHero?: React.ComponentType<{
          activeProjectRef: null;
          activeProjectTitle: null;
          composerDraftTarget: DraftId;
          composerRef: React.RefObject<unknown>;
        }>;
      }
    ).ChatViewTaskStarterHero;
    expect(ChatViewTaskStarterHero).toBeDefined();
    if (!ChatViewTaskStarterHero) return;

    const draftId = "draft-rendered-task-starter" as DraftId;
    const resetCursorState = vi.fn();
    const focusAtEnd = vi.fn();
    const submit = vi.fn();
    const composerRef = {
      current: {
        resetCursorState,
        focusAtEnd,
        // The starter flow must not invoke composer submission.
        submit,
      },
    };
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);

    try {
      const markup = renderToStaticMarkup(
        createElement(ChatViewTaskStarterHero, {
          activeProjectRef: null,
          activeProjectTitle: null,
          composerDraftTarget: draftId,
          composerRef,
        }),
      );

      expect(markup).toContain("Prepare a brief");
      expect(starterHarness.clickStarter).toBeTypeOf("function");
      starterHarness.clickStarter?.();

      expect(useComposerDraftStore.getState().getComposerDraft(draftId)?.prompt).toBe(
        "Prepare a brief for this work.",
      );
      expect(resetCursorState).toHaveBeenCalledExactlyOnceWith({
        cursor: "Prepare a brief for this work.".length,
        prompt: "Prepare a brief for this work.",
      });
      expect(requestAnimationFrame).toHaveBeenCalledOnce();
      expect(focusAtEnd).toHaveBeenCalledOnce();
      expect(submit).not.toHaveBeenCalled();
    } finally {
      useComposerDraftStore.getState().setPrompt(draftId, "");
      vi.unstubAllGlobals();
    }
  });
});
