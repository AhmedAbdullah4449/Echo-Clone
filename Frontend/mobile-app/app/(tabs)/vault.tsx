import axios from "axios";

import { Audio } from "expo-av";

import * as SecureStore from "expo-secure-store";

import React, { useEffect, useState } from "react";

import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import {
  ActivityIndicator,
  Avatar,
  Card,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";

const BASE_URL = "http://192.168.18.12:7000";

export default function VaultScreen() {
  const { colors } = useTheme();

  // --- State ---

  const [vaultData, setVaultData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  // --- Audio State ---

  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const [playingTaskId, setPlayingTaskId] = useState<string | null>(null);

  // --- Cleanup Audio on Unmount ---

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  // --- Fetch Data ---

  const fetchVaultData = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");

      // Using POST as you specified in your route

      const response = await axios.post(
        `${BASE_URL}/api/generatedData`,

        {},

        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Sort by newest first based on created_at

      const sortedData = response.data.generated_audio.sort(
        (a: any, b: any) => {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        },
      );

      setVaultData(sortedData);
    } catch (error) {
      console.error("Failed to fetch vault data:", error);

      Alert.alert("Error", "Could not load your generated stories.");
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  };

  // --- Initial Load ---

  useEffect(() => {
    console.log("Fetching vault data on mount...");
    fetchVaultData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);

    fetchVaultData();
  };

  // --- Audio Playback Logic ---

  useEffect(() => {
    return () => {
      if (sound) {
        sound
          .unloadAsync()
          .catch((err) => console.log("Unload on unmount skipped", err));
      }
    };
  }, [sound]);

  const handlePlayPause = async (taskId: string, status: string) => {
    if (status !== "completed") {
      Alert.alert("Still Processing", "This story is not ready to play yet.");

      return;
    }
    console.log(
      "Play/Pause pressed for taskId:",
      taskId,
      "with status:",
      status,
      " playingTaskId is: ",
      playingTaskId,
      " sound is: ",
      sound,
    );
    try {
      // 1. If clicking the currently playing track, just toggle pause/play

      if (playingTaskId === taskId && sound) {
        const status = await sound.getStatusAsync();

        if (status.isLoaded && status.isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }

        return;
      }

      // 2. If a different track is playing, stop and unload it first
      console.log("Stopping current track if exists...");
      try {
        if (sound) {
          await sound.stopAsync();

          await sound.unloadAsync();
        }
      } catch (err) {
        console.log(
          "Error during stop/unload probally due to unmounting: ",
          err,
        );
      }
      console.log("Current track stopped. Loading new track...");
      // 3. Load the new track using the streaming URL pattern

      setPlayingTaskId(taskId);

      const token = await SecureStore.getItemAsync("userToken");

      const streamUrl = `${BASE_URL}/api/getGeneratedStory?task_id=${taskId}`;

      const { sound: newSound } = await Audio.Sound.createAsync({
        uri: streamUrl,

        headers: { Authorization: `Bearer ${token}` },
      });

      setSound(newSound);

      await newSound.playAsync();

      // 4. Reset UI when the track finishes

      newSound.setOnPlaybackStatusUpdate((playbackStatus) => {
        if (playbackStatus.isLoaded && playbackStatus.didJustFinish) {
          setPlayingTaskId(null); // Resets the play button automatically
        }
      });
    } catch (error) {
      console.error("Playback error:", error);

      Alert.alert("Error", "Could not stream the audio.");

      setPlayingTaskId(null);
    }
  };

  // --- Render Individual Card ---

  const renderVaultItem = ({ item }: { item: any }) => {
    const isPlayingThis = playingTaskId === item.task_id;

    const isCompleted = item.status === "completed";

    // Format the date (e.g., "May 15, 2026")

    const formattedDate = new Date(item.created_at).toLocaleDateString(
      undefined,

      {
        month: "short",

        day: "numeric",

        year: "numeric",
      },
    );

    return (
      <Card
        style={[
          styles.card,

          isPlayingThis && { borderColor: colors.primary, borderWidth: 2 }, // Highlight if playing
        ]}
        mode="elevated"
      >
        <Card.Title
          title={item.storyname}
          subtitle={`Generated on ${formattedDate}`}
          titleStyle={{ color: "#F8FAFC", fontWeight: "bold" }} // Force light title
          subtitleStyle={{ color: "#94A3B8" }} // Force light subtitle
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon={isCompleted ? "headphones" : "clock-outline"}
              // Dark forest green for completed, dark amber for pending
              style={{ backgroundColor: isCompleted ? "#064E3B" : "#78350F" }}
              // Bright emerald for completed, bright amber for pending
              color={isCompleted ? "#34D399" : "#FBBF24"}
            />
          )}
          right={(props) => (
            <IconButton
              {...props}
              icon={
                isPlayingThis
                  ? "pause-circle"
                  : isCompleted
                    ? "play-circle"
                    : "dots-horizontal"
              }
              // Use primary color if playing, otherwise cool gray
              iconColor={isPlayingThis ? colors.primary : "#94A3B8"}
              size={36}
              onPress={() => handlePlayPause(item.task_id, item.status)}
            />
          )}
        />
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          My Vault
        </Text>

        <Text variant="bodyMedium" style={styles.subtext}>
          Your personal audiobook library
        </Text>
      </View>

      {/* LIST */}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={vaultData}
          keyExtractor={(item) => item.task_id}
          renderItem={renderVaultItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconButton
                icon="folder-open-outline"
                size={60}
                iconColor="#475569" // Mid-Slate icon
              />
              <Text style={{ color: "#94A3B8", fontSize: 16 }}>
                No stories in your vault yet.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", paddingHorizontal: 20 }, // Deep Slate
  header: { marginTop: 40, marginBottom: 20 },
  headerTitle: { fontWeight: "bold", color: "#F8FAFC" }, // Ice White
  subtext: { color: "#94A3B8", marginTop: 4 }, // Cool Gray
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { marginBottom: 15, backgroundColor: "#1E293B", borderRadius: 12 }, // Dark Slate Card
  emptyState: { alignItems: "center", marginTop: 80 },
});
