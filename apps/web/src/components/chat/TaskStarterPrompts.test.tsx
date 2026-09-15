import { describe, expect, it, vi, beforeEach } from "vite-plus/test";
import {
  ENGINEER_STARTERS,
  KNOWLEDGE_WORKER_STARTERS,
  TaskStarterPrompts,
} from "./TaskStarterPrompts";
import { useUiStateStore } from "../../uiStateStore";

function findButtons(node: unknown): Array<{ props: Record<string, unknown> }> {
  if (typeof node !== "object" || node === null) return [];
  const element = node as { type?: unknown; props?: Record<string, unknown> };
  const children = element.props?.children;
  const nested = Array.isArray(children) ? children.flatMap(findButtons) : findButtons(children);
  return element.type === "button" && element.props
    ? [element as { props: Record<string, unknown> }, ...nested]
    : nested;
}

describe("TaskStarterPrompts", () => {
  beforeEach(() => {
    useUiStateStore.setState({ experienceMode: "engineer" });
  });

  it("offers five stable engineer starters", () => {
    expect(ENGINEER_STARTERS.map((starter: any) => starter.id)).toEqual([
      "build",
      "refactor",
      "test",
      "debug",
      "explain",
    ]);
  });

  it("renders semantic buttons that select exactly one starter prompt", () => {
    const onSelect = vi.fn();
    const buttons = findButtons(TaskStarterPrompts({ onSelect }));

    expect(buttons).toHaveLength(5);
    expect(buttons.map((button) => button.props.type)).toEqual([
      "button",
      "button",
      "button",
      "button",
      "button",
    ]);

    (buttons[0]?.props.onClick as (() => void) | undefined)?.();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(ENGINEER_STARTERS[0]?.prompt);
  });
});
