import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  FAB,
  Menu,
  Text,
  useTheme,
} from "react-native-paper";
const BASE_URL = "http://192.168.18.12:7000";

const CATEGORIES = ["All", "Fable", "Fiction"];

export default function LibraryScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // --- State ---
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  // Dropdown / Filter State
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchStories = async () => {
    try {
      setLoading(true);
      console.log("Fetching stories with token...");
      const token = await SecureStore.getItemAsync("userToken");
      console.log("Token is: ", token);
      const category =
        selectedCategory === "All" ? "" : `?category=${selectedCategory}`;
      console.log("Fetching from URL: ", `${BASE_URL}/story/${category}`);
      const response = await axios.post(
        `${BASE_URL}/story/${category}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log("Stories fetched: ", response.data);
      setStories(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching stories: ", err);
      setStories([]);
      setLoading(false);
      Alert.alert("Error Encountered", "Failed to fetch stories.");
    }
  };

  // --- Initial Load & Re-focus Load ---
  useFocusEffect(
    useCallback(() => {
      console.log("LibraryScreen focused, fetching stories...");
      fetchStories();
    }, [selectedCategory]),
  );

  // --- Render Function for the List ---
  const renderStoryCard = ({ item }: { item: any }) => (
    <Card
      style={styles.storyCard}
      mode="elevated"
      onPress={() => {
        router.push({
          pathname: "/story/[id]",
          params: {
            id: item.id,
            storyData: JSON.stringify(item),
          },
        });
      }}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            {item.title}
          </Text>
          <Chip
            compact
            style={styles.categoryChip}
            textStyle={{ fontSize: 10 }}
          >
            {item.category}
          </Chip>
        </View>

        {/* numberOfLines automatically cuts the text and adds "..." */}
        <Text variant="bodyMedium" numberOfLines={2} style={styles.cardContent}>
          {item.content}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* HEADER & DROPDOWN */}
      <View style={styles.header}>
        <Text
          variant="headlineSmall"
          style={{ fontWeight: "bold", color: "#F8FAFC" }}
        >
          Library
        </Text>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              icon="chevron-down"
              contentStyle={{ flexDirection: "row-reverse" }}
              style={styles.dropdownBtn}
              textColor="#F8FAFC"
            >
              {selectedCategory}
            </Button>
          }
        >
          {CATEGORIES.map((cat) => (
            <Menu.Item
              key={cat}
              onPress={() => {
                setSelectedCategory(cat);
                setMenuVisible(false);
              }}
              title={cat}
            />
          ))}
        </Menu>
      </View>

      {/* THE LIST */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderStoryCard}
          contentContainerStyle={{ paddingBottom: 100 }} // Gives space for the FAB
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text
              style={{ textAlign: "center", marginTop: 50, color: "#94A3B8" }}
            >
              No stories found in this category.
            </Text>
          }
        />
      )}

      {/* FLOATING ACTION BUTTON (Add Custom Story) */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        color="white"
        label="Add Story"
        onPress={() => {
          router.push("/story/add");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", paddingHorizontal: 20 }, // Main deep slate background
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  dropdownBtn: { borderColor: "#334155", borderRadius: 8 }, // Mid-slate border
  storyCard: {
    marginBottom: 15,
    backgroundColor: "#1E293B", // Dark slate card background
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: "bold",
    flex: 1,
    color: "#F8FAFC", // Off-white/Ice text for contrast
  },
  categoryChip: {
    backgroundColor: "#334155", // Mid-slate to pop against the card
    marginLeft: 10,
  },
  cardContent: {
    color: "#94A3B8", // Cool gray for secondary text
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
