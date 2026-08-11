import { describe, expect, it, vi } from "vite-plus/test";

import { TASK_STARTERS, TaskStarterPrompts } from "./TaskStarterPrompts";

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
  it("offers five stable knowledge and developer-work starters", () => {
    expect(TASK_STARTERS.map((starter) => starter.id)).toEqual([
      "research",
      "brief",
      "organize",
      "analyze",
      "build",
    ]);
    expect(TASK_STARTERS.map((starter) => starter.prompt)).toEqual([
      expect.stringMatching(/research/i),
      expect.stringMatching(/brief/i),
      expect.stringMatching(/organize/i),
      expect.stringMatching(/data/i),
      expect.stringMatching(/build|fix/i),
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
    expect(onSelect).toHaveBeenCalledWith(TASK_STARTERS[0]?.prompt);
  });
});
