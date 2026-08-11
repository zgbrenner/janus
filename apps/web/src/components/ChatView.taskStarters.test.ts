import { act, createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { DraftId } from "../composerDraftStore";
import { useComposerDraftStore } from "../composerDraftStore";

vi.mock("./DiffWorkerPoolProvider", () => ({
  DiffWorkerPoolProvider: ({ children }: { children: React.ReactNode }) => children,
  useDiffWorkerPool: () => null,
}));

vi.mock("../hooks/useHandleNewThread", () => ({
  useNewThreadHandler: () => vi.fn(),
}));

import * as ChatViewModule from "./ChatView";

const { applyTaskStarterSelection } = ChatViewModule;

type FakeEventListener = (event: FakeMouseEvent) => void;

class FakeMouseEvent {
  defaultPrevented = false;
  propagationStopped = false;
  target: FakeElement | null = null;
  currentTarget: FakeElement | FakeDocument | null = null;

  constructor(
    readonly type: string,
    readonly init: { bubbles?: boolean; cancelable?: boolean } = {},
  ) {}

  get bubbles() {
    return this.init.bubbles ?? false;
  }

  get cancelable() {
    return this.init.cancelable ?? false;
  }

  preventDefault() {
    if (this.cancelable) this.defaultPrevented = true;
  }

  stopPropagation() {
    this.propagationStopped = true;
  }
}

abstract class FakeNode {
  abstract readonly nodeType: number;
  abstract readonly nodeName: string;
  parentNode: FakeNode | null = null;
  childNodes: FakeNode[] = [];
  ownerDocument: FakeDocument;

  constructor(ownerDocument: FakeDocument) {
    this.ownerDocument = ownerDocument;
  }

  appendChild<T extends FakeNode>(child: T): T {
    child.parentNode?.removeChild(child);
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }

  insertBefore<T extends FakeNode>(child: T, before: FakeNode | null): T {
    if (before === null) return this.appendChild(child);
    child.parentNode?.removeChild(child);
    const index = this.childNodes.indexOf(before);
    if (index < 0) throw new Error("Expected reference node to be a child.");
    child.parentNode = this;
    this.childNodes.splice(index, 0, child);
    return child;
  }

  removeChild<T extends FakeNode>(child: T): T {
    const index = this.childNodes.indexOf(child);
    if (index < 0) throw new Error("Expected child node.");
    this.childNodes.splice(index, 1);
    child.parentNode = null;
    return child;
  }

  get firstChild(): FakeNode | null {
    return this.childNodes[0] ?? null;
  }

  get textContent(): string {
    return this.childNodes.map((child) => child.textContent).join("");
  }

  set textContent(value: string) {
    this.childNodes = [];
    if (value) this.appendChild(this.ownerDocument.createTextNode(value));
  }
}

class FakeText extends FakeNode {
  readonly nodeType = 3;
  readonly nodeName = "#text";

  constructor(
    ownerDocument: FakeDocument,
    private value: string,
  ) {
    super(ownerDocument);
  }

  override get textContent() {
    return this.value;
  }

  override set textContent(value: string) {
    this.value = value;
  }
}

class FakeElement extends FakeNode {
  readonly nodeType = 1;
  readonly nodeName: string;
  readonly tagName: string;
  readonly namespaceURI = "http://www.w3.org/1999/xhtml";
  readonly style: Record<string, string> = {};
  readonly dataset: Record<string, string> = {};
  readonly attributes = new Map<string, string>();
  readonly listeners = new Map<string, FakeEventListener[]>();

  constructor(
    ownerDocument: FakeDocument,
    readonly localName: string,
  ) {
    super(ownerDocument);
    this.tagName = localName.toUpperCase();
    this.nodeName = this.tagName;
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }

  addEventListener(type: string, listener: FakeEventListener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  removeEventListener(type: string, listener: FakeEventListener) {
    this.listeners.set(
      type,
      (this.listeners.get(type) ?? []).filter((entry) => entry !== listener),
    );
  }

  dispatchEvent(event: FakeMouseEvent) {
    event.target ??= this;
    let current: FakeNode | null = this;
    while (current) {
      if (current instanceof FakeElement || current instanceof FakeDocument) {
        event.currentTarget = current;
        for (const listener of current.listeners.get(event.type) ?? []) {
          listener(event);
        }
      }
      if (!event.bubbles || event.propagationStopped) break;
      current = current.parentNode;
    }
    return !event.defaultPrevented;
  }

  querySelectorAll(selector: string): FakeElement[] {
    const matches: FakeElement[] = [];
    if (this.localName === selector.toLowerCase()) matches.push(this);
    for (const child of this.childNodes) {
      if (child instanceof FakeElement) matches.push(...child.querySelectorAll(selector));
    }
    return matches;
  }
}

class FakeDocument extends FakeNode {
  readonly nodeType = 9;
  readonly nodeName = "#document";
  readonly listeners = new Map<string, FakeEventListener[]>();
  readonly documentElement: FakeElement;
  readonly body: FakeElement;
  defaultView: Record<string, unknown> | null = null;
  activeElement: FakeElement | null = null;

  constructor() {
    super(undefined as never);
    this.ownerDocument = this;
    this.documentElement = this.createElement("html");
    this.body = this.createElement("body");
    this.appendChild(this.documentElement);
    this.documentElement.appendChild(this.body);
  }

  createElement(name: string) {
    return new FakeElement(this, name);
  }

  createElementNS(_namespace: string, name: string) {
    return this.createElement(name);
  }

  createTextNode(value: string) {
    return new FakeText(this, value);
  }

  addEventListener(type: string, listener: FakeEventListener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  removeEventListener(type: string, listener: FakeEventListener) {
    this.listeners.set(
      type,
      (this.listeners.get(type) ?? []).filter((entry) => entry !== listener),
    );
  }

  querySelectorAll(selector: string) {
    return this.documentElement.querySelectorAll(selector);
  }
}

function installDom() {
  const document = new FakeDocument();
  const window = {
    document,
    HTMLElement: FakeElement,
    HTMLIFrameElement: FakeElement,
    Node: FakeNode,
    Text: FakeText,
    event: undefined,
  };
  document.defaultView = window;
  vi.stubGlobal("document", document);
  vi.stubGlobal("window", window);
  vi.stubGlobal("navigator", { userAgent: "janus-test" });
  vi.stubGlobal("HTMLElement", FakeElement);
  vi.stubGlobal("HTMLIFrameElement", FakeElement);
  vi.stubGlobal("Node", FakeNode);
  vi.stubGlobal("Text", FakeText);
  vi.stubGlobal("MouseEvent", FakeMouseEvent);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  return document;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

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
  it("clicks the rendered starter through DraftHeroHeadline into the active draft without submitting", async () => {
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
    const prompt =
      "Prepare a brief for this work: clarify the goal, audience, key decisions, and next steps.";
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
    const document = installDom();

    try {
      const { createRoot } = await import("react-dom/client");
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container as never);
      await act(async () => {
        root.render(
          createElement(ChatViewTaskStarterHero, {
            activeProjectRef: null,
            activeProjectTitle: null,
            composerDraftTarget: draftId,
            composerRef,
          }),
        );
      });
      const starter = document
        .querySelectorAll("button")
        .find((button) => button.textContent === "Prepare a brief");
      expect(starter).toBeDefined();

      await act(async () => {
        starter?.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }) as unknown as FakeMouseEvent,
        );
      });

      expect(useComposerDraftStore.getState().getComposerDraft(draftId)?.prompt).toBe(prompt);
      expect(resetCursorState).toHaveBeenCalledExactlyOnceWith({
        cursor: prompt.length,
        prompt,
      });
      expect(requestAnimationFrame).toHaveBeenCalledOnce();
      expect(focusAtEnd).toHaveBeenCalledOnce();
      expect(submit).not.toHaveBeenCalled();

      await act(async () => root.unmount());
    } finally {
      useComposerDraftStore.getState().setPrompt(draftId, "");
      vi.unstubAllGlobals();
    }
  });
});
