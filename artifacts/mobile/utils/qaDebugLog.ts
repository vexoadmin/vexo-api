export type QaDebugCategory = "AUTH" | "SHARE" | "METADATA" | "SAVED";

export type QaDebugEvent = {
  timestamp: string;
  category: QaDebugCategory;
  message: string;
  data?: string;
};

const MAX_EVENTS = 100;
const qaEvents: QaDebugEvent[] = [];
const listeners = new Set<() => void>();
const sequenceByCategory: Record<QaDebugCategory, number> = {
  AUTH: 0,
  SHARE: 0,
  METADATA: 0,
  SAVED: 0,
};

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
  listeners.forEach((listener) => listener());
}

export function nextQaSequence(category: QaDebugCategory): number {
  sequenceByCategory[category] += 1;
  return sequenceByCategory[category];
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
  qaEvents.push(event);
  if (qaEvents.length > MAX_EVENTS) {
    qaEvents.splice(0, qaEvents.length - MAX_EVENTS);
  }
  notify();
}

export function getQaLogs(): QaDebugEvent[] {
  return [...qaEvents];
}

export function subscribeQaLogs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
