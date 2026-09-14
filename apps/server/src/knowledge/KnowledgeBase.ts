import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import { ServerConfig } from "../config.ts";
import { KnowledgeNote, KnowledgeError } from "@t3tools/contracts";
import * as Crypto from "effect/Crypto";
import * as DateTime from "effect/DateTime";

export class KnowledgeBaseService extends Context.Service<KnowledgeBaseService>()(
  "t3/KnowledgeBaseService",
) {}

const make = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const config = yield* ServerConfig;
  const crypto = yield* Crypto.Crypto;

  const getKnowledgeDir = () => config.knowledgeDir;

  const listNotes = Effect.gen(function* () {
    const dir = getKnowledgeDir();
    const exists = yield* fs.exists(dir);
    if (!exists) return [];

    const files = yield* fs.readDirectory(dir);
    const notes: KnowledgeNote[] = [];

    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      
      const id = file.replace(/\.md$/, "");
      const fullPath = path.join(dir, file);
      
      try {
        const content = yield* fs.readFileString(fullPath);
        const stat = yield* fs.stat(fullPath);
        // We'll extract a title from the first line if it's a heading, or default to id
        let title = id;
        const firstLine = content.split("\n")[0];
        if (firstLine && firstLine.startsWith("# ")) {
          title = firstLine.substring(2).trim();
        }

        notes.push({
          id,
          title,
          content,
          updatedAt: DateTime.formatIso(DateTime.unsafeMake(stat.mtimeMillis || 0)),
        });
      } catch (e) {
        yield* Effect.logWarning(`Failed to read knowledge note ${file}`, { error: e });
      }
    }

    return notes;
  });

  const readNote = (id: string) => Effect.gen(function* () {
    const dir = getKnowledgeDir();
    const fullPath = path.join(dir, `${id}.md`);
    
    const exists = yield* fs.exists(fullPath);
    if (!exists) {
      return yield* Effect.fail(new KnowledgeError({ reason: `Note not found: ${id}` }));
    }

    const content = yield* fs.readFileString(fullPath);
    const stat = yield* fs.stat(fullPath);
    
    let title = id;
    const firstLine = content.split("\n")[0];
    if (firstLine && firstLine.startsWith("# ")) {
      title = firstLine.substring(2).trim();
    }

    return {
      id,
      title,
      content,
      updatedAt: DateTime.formatIso(DateTime.unsafeMake(stat.mtimeMillis || 0)),
    };
  });

  const writeNote = (title: string, content: string, existingId?: string) => Effect.gen(function* () {
    const dir = getKnowledgeDir();
    
    const id = existingId || (yield* crypto.randomUUIDv4);
    const fullPath = path.join(dir, `${id}.md`);
    
    yield* fs.writeFileString(fullPath, content);
    
    return yield* readNote(id);
  });

  return {
    listNotes,
    readNote,
    writeNote,
  };
});

export const layer = Layer.effect(KnowledgeBaseService, make);
