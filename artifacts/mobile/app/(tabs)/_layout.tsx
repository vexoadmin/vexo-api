import { Tabs } from "expo-router";
import React from "react";
import { Platform, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIconText({ symbol, color }: { symbol: string; color: string }) {
  return (
    <Text
      style={{
        color,
        fontSize: 25,
        lineHeight: 25,
        marginBottom: 1,
      }}
    >
      {symbol}
    </Text>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  const androidBottomSpace = Math.max(insets.bottom, 20);
  const tabBarHeight =
    Platform.OS === "android" ? 78 + androidBottomSpace : 76 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#8B5CF6",
        tabBarInactiveTintColor: "rgba(255,255,255,0.55)",
        tabBarStyle: {
          backgroundColor: "#050814",
          borderTopColor: "rgba(255,255,255,0.08)",
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: Platform.OS === "android" ? androidBottomSpace : 10,
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontFamily: "Inter_500Medium",
          marginTop: 0,
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIconText symbol="⌂" color={color} />,
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          tabBarIcon: ({ color }) => <TabIconText symbol="▦" color={color} />,
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => <TabIconText symbol="⋯" color={color} />,
        }}
      />
    </Tabs>
  );
}