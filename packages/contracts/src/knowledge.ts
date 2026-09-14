import * as Schema from "effect/Schema";

export const KnowledgeNote = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  content: Schema.String,
  updatedAt: Schema.String,
});
export type KnowledgeNote = typeof KnowledgeNote.Type;

export const KnowledgeListInput = Schema.Struct({});
export const KnowledgeListResult = Schema.Struct({
  notes: Schema.Array(KnowledgeNote),
});

export const KnowledgeReadInput = Schema.Struct({
  id: Schema.String,
});
export const KnowledgeReadResult = Schema.Struct({
  note: KnowledgeNote,
});

export const KnowledgeWriteInput = Schema.Struct({
  id: Schema.optional(Schema.String),
  title: Schema.String,
  content: Schema.String,
});
export const KnowledgeWriteResult = Schema.Struct({
  note: KnowledgeNote,
});

export class KnowledgeError extends Schema.TaggedErrorClass<KnowledgeError>()(
  "KnowledgeError",
  {
    reason: Schema.String,
  },
) {
  override get message(): string {
    return this.reason;
  }
}
