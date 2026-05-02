import * as ExpoClipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  clearQaLogs,
  getQaLogs,
  qaLog,
  QaDebugEvent,
  subscribeQaLogs,
} from "@/utils/qaDebugLog";

const BG = "#060814";
const SURFACE = "#0B1020";
const BORDER = "rgba(255,255,255,0.10)";

const REDACT_KEYS = new Set([
  "access_token",
  "refresh_token",
  "token",
  "authorization",
  "password",
]);

function redactUnknown(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map(redactUnknown);
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (REDACT_KEYS.has(k.toLowerCase())) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = redactUnknown(v);
      }
    }
    return out;
  }
  return input;
}

function redactLogDataString(raw: string): string {
  try {
    const parsed: unknown = JSON.parse(raw);
    return JSON.stringify(redactUnknown(parsed), null, 2);
  } catch {
    return raw.replace(
      /"(access_token|refresh_token|token|authorization|password)"\s*:\s*"[^"]*"/gi,
      '"$1":"[REDACTED]"',
    );
  }
}

function buildSerializedLogsNewestFirst(): string {
  const chronological = getQaLogs();
  const newestFirst = [...chronological].reverse();
  return newestFirst
    .map((ev) => {
      const dataBlock = ev.data
        ? `\nData: ${redactLogDataString(ev.data)}`
        : "";
      return `[${ev.category}] ${ev.timestamp}\n${ev.message}${dataBlock}`;
    })
    .join("\n\n---\n\n");
}

async function copySerializedLogs(text: string): Promise<boolean> {
  try {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    await ExpoClipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

async function shareSerializedLogs(text: string): Promise<void> {
  await Share.share({ message: text });
}

export default function QaDebugScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [logs, setLogs] = useState<QaDebugEvent[]>([]);

  const refreshLogs = useCallback(() => {
    const latest = getQaLogs();
    setLogs([...latest].reverse());
  }, []);

  useEffect(() => {
    refreshLogs();
    return subscribeQaLogs(() => {
      refreshLogs();
    });
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>QA Debug Logs</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
      <Text style={styles.todo}>TODO: remove before production.</Text>
      <View style={styles.controlsRow}>
        <Pressable
          onPress={refreshLogs}
          style={[styles.controlBtn, styles.refreshBtn]}
        >
          <Text style={styles.controlText}>Refresh</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            qaLog("AUTH", "manual test log", { now: new Date().toISOString() });
          }}
          style={[styles.controlBtn, styles.testBtn]}
        >
          <Text style={styles.controlText}>Add test log</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            clearQaLogs();
            refreshLogs();
          }}
          style={[styles.controlBtn, styles.clearBtn]}
        >
          <Text style={styles.controlText}>Clear logs</Text>
        </Pressable>
      </View>
      {/* TODO: remove Copy logs / Share logs before production */}
      <View style={styles.controlsRow}>
        <Pressable
          onPress={async () => {
            const text = buildSerializedLogsNewestFirst();
            const ok = await copySerializedLogs(text);
            if (ok) {
              Alert.alert("Copied", "QA logs copied to clipboard.");
            } else {
              Alert.alert(
                "Copy unavailable",
                "Use “Share logs” to export logs from this device.",
              );
            }
          }}
          style={[styles.controlBtn, styles.copyBtn]}
        >
          <Text style={styles.controlText}>Copy logs</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            const text = buildSerializedLogsNewestFirst();
            try {
              await shareSerializedLogs(text);
            } catch {
              Alert.alert("Share failed", "Could not open the share sheet.");
            }
          }}
          style={[styles.controlBtn, styles.shareBtn]}
        >
          <Text style={styles.controlText}>Share logs</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {logs.length === 0 ? (
          <Text style={styles.empty}>No logs yet.</Text>
        ) : (
          logs.map((log, index) => (
            <View key={`${log.timestamp}-${index}`} style={styles.item}>
              <Text style={styles.meta}>
                [{log.category}] {log.timestamp}
              </Text>
              <Text style={styles.message}>{log.message}</Text>
              {log.data ? <Text style={styles.data}>{log.data}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  closeBtn: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: SURFACE,
  },
  closeText: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_500Medium" },
  todo: {
    color: "#F59E0B",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 10,
  },
  controlsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  controlBtn: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },
  refreshBtn: {},
  testBtn: { backgroundColor: "rgba(52,211,153,0.15)" },
  clearBtn: { backgroundColor: "rgba(248,113,113,0.12)" },
  copyBtn: { backgroundColor: "rgba(96,165,250,0.12)" },
  shareBtn: { backgroundColor: "rgba(167,139,250,0.12)" },
  controlText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  scroll: { flex: 1 },
  empty: { color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular" },
  item: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  meta: {
    color: "#A5F3FC",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  message: { color: "#fff", fontSize: 13, fontFamily: "Inter_500Medium" },
  data: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
});
