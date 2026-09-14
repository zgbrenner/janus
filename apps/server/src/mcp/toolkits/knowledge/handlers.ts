import * as Effect from "effect/Effect";
import * as KnowledgeBaseService from "../../../knowledge/KnowledgeBase.ts";
import { KnowledgeToolkit } from "./tools.ts";
import { KnowledgeListResult, KnowledgeReadResult, KnowledgeWriteResult } from "@t3tools/contracts";

const handlers = {
  knowledge_list: (_input) => Effect.gen(function* () {
    const service = yield* KnowledgeBaseService.KnowledgeBaseService;
    const notes = yield* service.listNotes;
    return { notes } as KnowledgeListResult;
  }),
  knowledge_read: (input) => Effect.gen(function* () {
    const service = yield* KnowledgeBaseService.KnowledgeBaseService;
    const note = yield* service.readNote(input.id);
    return { note } as KnowledgeReadResult;
  }),
  knowledge_write: (input) => Effect.gen(function* () {
    const service = yield* KnowledgeBaseService.KnowledgeBaseService;
    const note = yield* service.writeNote(input.title, input.content, input.id);
    return { note } as KnowledgeWriteResult;
  }),
} satisfies Parameters<typeof KnowledgeToolkit.toLayer>[0];

export const KnowledgeToolkitHandlersLive = KnowledgeToolkit.toLayer(handlers);
