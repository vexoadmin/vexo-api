import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getQaLogs, QaDebugEvent, subscribeQaLogs } from "@/utils/qaDebugLog";

const BG = "#060814";
const SURFACE = "#0B1020";
const BORDER = "rgba(255,255,255,0.10)";

export default function QaDebugScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [logs, setLogs] = useState<QaDebugEvent[]>(() => getQaLogs().reverse());

  useEffect(() => {
    return subscribeQaLogs(() => {
      setLogs(getQaLogs().reverse());
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
