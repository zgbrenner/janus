import { Debouncer } from "@tanstack/react-pacer";

export interface StateStorage<R = unknown> {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => R;
  removeItem: (name: string) => R;
}

export interface DebouncedStorage<R = unknown> extends StateStorage<R> {
  flush: () => void;
}

export function createMemoryStorage(): StateStorage {
  const store = new Map<string, string>();
  return {
    getItem: (name) => store.get(name) ?? null,
    setItem: (name, value) => {
      store.set(name, value);
    },
    removeItem: (name) => {
      store.delete(name);
    },
  };
}

export function isStateStorage(
  storage: Partial<StateStorage> | null | undefined,
): storage is StateStorage {
  return (
    storage !== null &&
    storage !== undefined &&
    typeof storage.getItem === "function" &&
    typeof storage.setItem === "function" &&
    typeof storage.removeItem === "function"
  );
}

export function resolveStorage(storage: Partial<StateStorage> | null | undefined): StateStorage {
  return isStateStorage(storage) ? storage : createMemoryStorage();
}

export function createDebouncedStorage(
  baseStorage: Partial<StateStorage> | null | undefined,
  debounceMs: number = 300,
): DebouncedStorage {
  const resolvedStorage = resolveStorage(baseStorage);
  const pendingWrites = new Map<string, string>();

  const writePending = () => {
    for (const [name, value] of pendingWrites) {
      pendingWrites.delete(name);
      try {
        resolvedStorage.setItem(name, value);
      } catch (error) {
        // A quota or disabled-storage error thrown here would escape as an
        // uncaught exception from the debounce timer; the value simply stays
        // unpersisted, and other pending keys still get their write.
        console.error(`Could not persist "${name}" to storage.`, error);
      }
    }
  };

  const debouncedWrite = new Debouncer(writePending, { wait: debounceMs });

  return {
    // Serve the pending value so reads inside the debounce window are not stale.
    getItem: (name) => pendingWrites.get(name) ?? resolvedStorage.getItem(name),
    setItem: (name, value) => {
      pendingWrites.set(name, value);
      debouncedWrite.maybeExecute();
    },
    removeItem: (name) => {
      pendingWrites.delete(name);
      resolvedStorage.removeItem(name);
    },
    flush: () => {
      debouncedWrite.cancel();
      writePending();
    },
  };
}

interface FlushEventTarget {
  addEventListener(type: string, listener: () => void): void;
}

interface FlushVisibilityTarget extends FlushEventTarget {
  readonly visibilityState?: string;
}

/** Flush pending writes whenever the page may be going away. `beforeunload`
    alone is not enough: mobile browsers skip it, and a tab entering bfcache or
    being discarded under memory pressure only gets `pagehide` or a
    `visibilitychange` to hidden. */
export function flushOnPageExit(
  flush: () => void,
  win: FlushEventTarget | undefined = typeof window === "undefined" ? undefined : window,
  doc: FlushVisibilityTarget | undefined = typeof document === "undefined" ? undefined : document,
): void {
  if (win && typeof win.addEventListener === "function") {
    win.addEventListener("beforeunload", flush);
    win.addEventListener("pagehide", flush);
  }
  if (doc && typeof doc.addEventListener === "function") {
    doc.addEventListener("visibilitychange", () => {
      if (doc.visibilityState === "hidden") {
        flush();
      }
    });
  }
}
