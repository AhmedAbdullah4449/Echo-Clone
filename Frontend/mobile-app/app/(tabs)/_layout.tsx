import { MaterialCommunityIcons } from "@expo/vector-icons"; // Standard for Expo apps
import { Tabs } from "expo-router";
import React from "react";
import { useTheme } from "react-native-paper";

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#34D399", // Uses your Paper theme's primary color
        tabBarInactiveTintColor: "#64748B", // Soft grey for inactive tabs

        tabBarStyle: {
          backgroundColor: "#1E293B", // Matches your app's background
          borderTopWidth: 1,
          borderTopColor: "#334155",
          height: 65, // Slightly taller for a premium feel
          paddingBottom: 10, // Lift the text off the bottom of the screen
          paddingTop: 5,
          elevation: 0, // Removes Android shadow for a flatter, modern look
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      {/* TAB 1: HOME (index.tsx) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="home-variant"
              color={color}
              size={size + 2}
            />
          ),
        }}
      />

      {/* TAB 2: LIBRARY (library.tsx) */}
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="book-open-page-variant"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* TAB 3: MY VAULT (vault.tsx) */}
      <Tabs.Screen
        name="vault"
        options={{
          title: "My Vault",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="folder-music"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
