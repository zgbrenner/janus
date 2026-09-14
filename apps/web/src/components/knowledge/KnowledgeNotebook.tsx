import { useCallback, useState } from "react";
import { useAtomValue } from "@effect/atom-react";
import { EnvironmentId } from "@t3tools/contracts";
import { knowledgeListQuery, knowledgeWriteCommand, knowledgeReadQuery } from "../../state/knowledge";
import { useAtomCommand } from "../../state/use-atom-command";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { BookOpen, Edit2, Plus, ArrowLeft } from "lucide-react";
import { cn } from "../../lib/utils";

export interface KnowledgeNotebookProps {
  environmentId: EnvironmentId | null;
  threadId: string | null;
}

export function KnowledgeNotebook({ environmentId }: KnowledgeNotebookProps) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  if (!environmentId) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <BookOpen className="mb-4 size-10 opacity-20" />
        <p>Knowledge base is only available within an active project.</p>
      </div>
    );
  }

  if (activeNoteId) {
    return (
      <KnowledgeNoteEditor
        environmentId={environmentId}
        noteId={activeNoteId}
        onBack={() => setActiveNoteId(null)}
      />
    );
  }

  return (
    <KnowledgeNoteList
      environmentId={environmentId}
      onOpenNote={(id) => setActiveNoteId(id)}
    />
  );
}

function KnowledgeNoteList({
  environmentId,
  onOpenNote,
}: {
  environmentId: EnvironmentId;
  onOpenNote: (id: string | null) => void;
}) {
  const listState = useAtomValue(knowledgeListQuery({ environmentId, input: {} }));

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Knowledge Base</h2>
        <Button size="sm" variant="outline" onClick={() => onOpenNote("new")}>
          <Plus className="mr-1.5 size-3.5" />
          New Note
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {listState._tag === "Loading" ? (
          <div className="p-4 text-sm text-muted-foreground">Loading notes...</div>
        ) : listState._tag === "Failure" ? (
          <div className="p-4 text-sm text-red-500">
            Error loading notes: {String(listState.error)}
          </div>
        ) : listState.value.notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <BookOpen className="mb-4 size-8 opacity-20" />
            <p className="mb-4 text-sm">No notes found in the knowledge base.</p>
          </div>
        ) : (
          <div className="divide-y">
            {listState.value.notes.map((note) => (
              <button
                key={note.id}
                type="button"
                className="flex w-full flex-col items-start px-4 py-3 text-left transition-colors hover:bg-accent/50"
                onClick={() => onOpenNote(note.id)}
              >
                <div className="mb-1 font-medium text-sm">{note.title}</div>
                <div className="line-clamp-2 text-xs text-muted-foreground">
                  {note.content}
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground/60">
                  Last updated: {new Date(note.updatedAt).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function KnowledgeNoteEditor({
  environmentId,
  noteId,
  onBack,
}: {
  environmentId: EnvironmentId;
  noteId: string;
  onBack: () => void;
}) {
  const isNew = noteId === "new";

  // For a real app, you might only read if !isNew, but effect/atom-react queries need consistent rules
  // So we pass a dummy ID for new notes, but the query might fail, so we might need a workaround.
  // We'll conditionally read from the atom only if it's an existing note.
  const existingNoteState = useAtomValue(
    knowledgeReadQuery({ environmentId, input: { id: noteId } })
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [initialized, setInitialized] = useState(isNew);

  const writeCommand = useAtomCommand(knowledgeWriteCommand, { reportFailure: true });
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state once the note loads
  if (!isNew && !initialized && existingNoteState._tag === "Success") {
    setTitle(existingNoteState.value.note.title);
    setContent(existingNoteState.value.note.content);
    setInitialized(true);
  }

  const handleSave = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSaving(true);
    await writeCommand({
      environmentId,
      input: {
        ...(isNew ? {} : { id: noteId }),
        title,
        content,
      },
    });
    setIsSaving(false);
    onBack(); // Return to list on save
  }, [title, content, writeCommand, environmentId, isNew, noteId, onBack]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="size-6 rounded-full" onClick={onBack}>
            <ArrowLeft className="size-3.5" />
          </Button>
          <h2 className="text-sm font-semibold">{isNew ? "New Note" : "Edit Note"}</h2>
        </div>
        <Button size="sm" onClick={handleSave} disabled={isSaving || !title.trim() || !content.trim()}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      {!initialized && existingNoteState._tag === "Loading" ? (
        <div className="p-4 text-sm text-muted-foreground">Loading note...</div>
      ) : !initialized && existingNoteState._tag === "Failure" ? (
        <div className="p-4 text-sm text-red-500">
          Error loading note: {String(existingNoteState.error)}
        </div>
      ) : (
        <div className="flex flex-1 flex-col p-4">
          <input
            type="text"
            className="mb-4 w-full bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground"
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            placeholder="Write your knowledge base content here (Markdown supported by agents)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
