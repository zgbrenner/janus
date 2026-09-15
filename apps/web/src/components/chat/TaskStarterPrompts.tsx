import { useUiStateStore } from "../../uiStateStore";

export type TaskStarter = Readonly<{
  id: string;
  label: string;
  prompt: string;
}>;

export const ENGINEER_STARTERS: ReadonlyArray<TaskStarter> = [
  {
    id: "build",
    label: "Build a new feature",
    prompt:
      "Build a new feature: inspect the workspace, propose a plan, and implement the necessary changes.",
  },
  {
    id: "refactor",
    label: "Refactor code",
    prompt:
      "Refactor this code: analyze the current implementation, suggest improvements for maintainability and performance, and apply the refactor.",
  },
  {
    id: "test",
    label: "Write unit tests",
    prompt:
      "Write unit tests: review the code coverage, identify missing test cases, and write comprehensive tests.",
  },
  {
    id: "debug",
    label: "Debug an issue",
    prompt:
      "Debug an issue: I am seeing an error. Please investigate the logs or code, identify the root cause, and propose a fix.",
  },
  {
    id: "explain",
    label: "Explain codebase",
    prompt:
      "Explain this codebase: give me a high-level overview of the architecture, key patterns, and where to find the core logic.",
  },
];

export const KNOWLEDGE_WORKER_STARTERS: ReadonlyArray<TaskStarter> = [
  {
    id: "research",
    label: "Synthesize research",
    prompt:
      "Research this topic: gather reliable sources, compare the key findings, and give me a concise, cited summary.",
  },
  {
    id: "brief",
    label: "Draft a brief",
    prompt:
      "Draft a brief for this work: clarify the goal, audience, key decisions, and next steps.",
  },
  {
    id: "analyze",
    label: "Analyze data",
    prompt:
      "Analyze this dataset: identify the important patterns, explain the findings, and recommend the next steps.",
  },
  {
    id: "organize",
    label: "Organize files",
    prompt:
      "Organize these files: review the documents, propose a clear folder structure, and organize them logically.",
  },
  {
    id: "summarize",
    label: "Summarize findings",
    prompt:
      "Summarize the findings: read through the provided notes or documents and extract the key takeaways into bullet points.",
  },
];

export function TaskStarterPrompts({
  onSelect,
}: {
  readonly onSelect: (prompt: string) => void;
}): React.JSX.Element {
  const experienceMode = useUiStateStore((state) => state.experienceMode);
  const starters =
    experienceMode === "knowledge_worker" ? KNOWLEDGE_WORKER_STARTERS : ENGINEER_STARTERS;

  return (
    <div aria-label="Task starters" className="janus-task-starters" role="group">
      {starters.map((starter) => (
        <button key={starter.id} type="button" onClick={() => onSelect(starter.prompt)}>
          {starter.label}
        </button>
      ))}
    </div>
  );
}
