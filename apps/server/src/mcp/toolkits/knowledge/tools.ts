import { Tool, Toolkit } from "effect/unstable/ai";
import {
  KnowledgeListInput,
  KnowledgeListResult,
  KnowledgeReadInput,
  KnowledgeReadResult,
  KnowledgeWriteInput,
  KnowledgeWriteResult,
  KnowledgeError,
} from "@t3tools/contracts";

export const KnowledgeListTool = Tool.make("knowledge_list", {
  description: "List all notes currently stored in the knowledge base.",
  parameters: KnowledgeListInput,
  success: KnowledgeListResult,
  failure: KnowledgeError,
})
  .annotate(Tool.Title, "List Knowledge Notes")
  .annotate(Tool.Readonly, true);

export const KnowledgeReadTool = Tool.make("knowledge_read", {
  description: "Read the contents of a specific knowledge base note by ID.",
  parameters: KnowledgeReadInput,
  success: KnowledgeReadResult,
  failure: KnowledgeError,
})
  .annotate(Tool.Title, "Read Knowledge Note")
  .annotate(Tool.Readonly, true);

export const KnowledgeWriteTool = Tool.make("knowledge_write", {
  description: "Create or update a knowledge base note. Returns the updated note. To update an existing note, provide its ID. The title is usually the filename or heading.",
  parameters: KnowledgeWriteInput,
  success: KnowledgeWriteResult,
  failure: KnowledgeError,
})
  .annotate(Tool.Title, "Write Knowledge Note")
  .annotate(Tool.Destructive, true);

export const KnowledgeToolkit = Toolkit.make("KnowledgeBase", {
  knowledge_list: KnowledgeListTool,
  knowledge_read: KnowledgeReadTool,
  knowledge_write: KnowledgeWriteTool,
});
