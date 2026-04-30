export type QaDebugCategory = "AUTH" | "SHARE" | "METADATA" | "SAVED";

export type QaDebugEvent = {
  timestamp: string;
  category: QaDebugCategory;
  message: string;
  data?: string;
};

const MAX_EVENTS = 100;
type QaDebugStore = {
  events: QaDebugEvent[];
  listeners: Set<() => void>;
  sequenceByCategory: Record<QaDebugCategory, number>;
};

const storeKey = "__vexoQaDebugStore";
const globalStore = globalThis as typeof globalThis & {
  [storeKey]?: QaDebugStore;
};

const qaStore: QaDebugStore =
  globalStore[storeKey] ||
  (globalStore[storeKey] = {
    events: [],
    listeners: new Set<() => void>(),
    sequenceByCategory: {
      AUTH: 0,
      SHARE: 0,
      METADATA: 0,
      SAVED: 0,
    },
  });

function safeStringify(data: unknown): string {
  if (data === undefined) return "";
  try {
    const seen = new WeakSet<object>();
    return JSON.stringify(data, (_key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
      }
      return value;
    });
  } catch {
    return String(data);
  }
}

function notify() {
  qaStore.listeners.forEach((listener) => listener());
}

export function nextQaSequence(category: QaDebugCategory): number {
  qaStore.sequenceByCategory[category] += 1;
  return qaStore.sequenceByCategory[category];
}

export function qaLog(
  category: QaDebugCategory,
  message: string,
  data?: unknown,
): void {
  const event: QaDebugEvent = {
    timestamp: new Date().toISOString(),
    category,
    message,
    data: data === undefined ? undefined : safeStringify(data),
  };
  qaStore.events.push(event);
  if (qaStore.events.length > MAX_EVENTS) {
    qaStore.events.splice(0, qaStore.events.length - MAX_EVENTS);
  }
  notify();
}

export function getQaLogs(): QaDebugEvent[] {
  return qaStore.events;
}

export function clearQaLogs(): void {
  qaStore.events.splice(0, qaStore.events.length);
  notify();
}

export function subscribeQaLogs(listener: () => void): () => void {
  qaStore.listeners.add(listener);
  return () => qaStore.listeners.delete(listener);
}
