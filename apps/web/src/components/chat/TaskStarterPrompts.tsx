export type TaskStarter = Readonly<{
  id: "research" | "brief" | "organize" | "analyze" | "build";
  label: string;
  prompt: string;
}>;

export const TASK_STARTERS: ReadonlyArray<TaskStarter> = [
  {
    id: "research",
    label: "Synthesize research",
    prompt:
      "Research this topic: gather reliable sources, compare the key findings, and give me a concise, cited summary.",
  },
  {
    id: "brief",
    label: "Prepare a brief",
    prompt:
      "Prepare a brief for this work: clarify the goal, audience, key decisions, and next steps.",
  },
  {
    id: "organize",
    label: "Organize files",
    prompt:
      "Organize these files: review the workspace, propose a clear structure, and make the changes after I approve.",
  },
  {
    id: "analyze",
    label: "Analyze data",
    prompt:
      "Analyze this dataset: identify the important patterns, explain the findings, and recommend the next steps.",
  },
  {
    id: "build",
    label: "Build or fix software",
    prompt:
      "Build or fix this software: inspect the workspace, propose a plan, and implement the smallest reliable change.",
  },
];

export function TaskStarterPrompts({
  onSelect,
}: {
  readonly onSelect: (prompt: string) => void;
}): React.JSX.Element {
  return (
    <div aria-label="Task starters" className="janus-task-starters" role="group">
      {TASK_STARTERS.map((starter) => (
        <button key={starter.id} type="button" onClick={() => onSelect(starter.prompt)}>
          {starter.label}
        </button>
      ))}
    </div>
  );
}
