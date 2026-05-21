import axios from "axios";
import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, IconButton, Text, useTheme } from "react-native-paper";

const BASE_URL = "http://192.168.18.12:7000";

export default function StoryDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // 1. Grab params from URL (Passed from the Library screen)
  const { id, storyData } = useLocalSearchParams();
  const story = storyData ? JSON.parse(storyData as string) : null;

  // --- API & State Variables ---
  const [status, setStatus] = useState<
    "ready" | "polling" | "completed" | "failed"
  >("ready");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // --- Audio Player State ---
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Bulletproof TypeScript fix for environments mixing Node & React Native types
  const pollingTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  // --- Cleanup on Unmount ---
  useEffect(() => {
    return () => {
      // Prevent memory leaks if the user leaves the screen
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  // --- API: Trigger Generation ---
  const handleGenerate = async () => {
    try {
      setStatus("polling");
      const token = await SecureStore.getItemAsync("userToken");

      // Hit the generation route
      console.log("Starting generation with token: ", token);
      const response = await axios.post(
        `${BASE_URL}/api/generate_story`,
        { story_id: story.id },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      console.log("Generation response: ", response.data);
      if (response.data.status === "true" || response.data.taskId) {
        // Start the polling loop with the returned taskId
        pollTaskStatus(response.data.taskId);
      } else {
        throw new Error("No Task ID returned");
      }
    } catch (error) {
      console.error("Failed to start generation:", error);
      setStatus("failed");
      Alert.alert("Error", "Could not connect to the AI engine.");
    }
  };

  // --- API: Polling Engine ---
  const pollTaskStatus = async (taskId: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/status/${taskId}`);
      const currentStatus = response.data.status?.toUpperCase();

      if (currentStatus === "SUCCESS" || currentStatus === "COMPLETED") {
        // Construct the streaming URL (Directly to your FastAPI streaming route)
        const streamUrl = `${BASE_URL}/api/getGeneratedStory?task_id=${taskId}`;

        setAudioUrl(streamUrl);
        setStatus("completed");
      } else if (currentStatus === "FAILURE" || currentStatus === "FAILED") {
        setStatus("failed");
        Alert.alert(
          "Generation Failed",
          "The AI encountered an issue crafting the audio.",
        );
      } else {
        // If it's PENDING or PROCESSING, wait 5 seconds and poll again
        pollingTimeoutRef.current = setTimeout(
          () => pollTaskStatus(taskId),
          5000,
        );
      }
    } catch (error) {
      console.error("Polling error:", error);
      // If network drops temporarily, don't fail immediately, just try again in 5s
      pollingTimeoutRef.current = setTimeout(
        () => pollTaskStatus(taskId),
        5000,
      );
    }
  };

  // --- Audio Playback Logic ---
  const togglePlayPause = async () => {
    if (!audioUrl) return;

    if (sound) {
      // If sound is already loaded, just toggle play/pause
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      // First time pressing play: Load the sound SECURELY and play
      try {
        const token = await SecureStore.getItemAsync("userToken");

        const { sound: newSound } = await Audio.Sound.createAsync({
          uri: audioUrl,
          headers: { Authorization: `Bearer ${token}` }, // Send JWT to FastAPI Streaming Response!
        });

        setSound(newSound);
        setIsPlaying(true);
        await newSound.playAsync();

        // Listen for when the audio finishes to flip the button back to "Play"
        newSound.setOnPlaybackStatusUpdate((playbackStatus) => {
          if (playbackStatus.isLoaded && playbackStatus.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } catch (err) {
        console.error("Failed to load audio stream:", err);
        Alert.alert("Playback Error", "Could not play the generated story.");
      }
    }
  };

  // --- Error Fallback if data didn't pass correctly ---
  if (!story) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#F8FAFC" }}>Story not found!</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor="#F8FAFC"
          onPress={() => router.back()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          {story.category}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* STORY TITLE */}
        <Text variant="headlineMedium" style={styles.title}>
          {story.title}
        </Text>

        {/* STORY CONTENT */}
        <Card style={styles.textCard} mode="outlined">
          <Card.Content>
            <Text variant="bodyLarge" style={styles.storyText}>
              {story.content}
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FIXED BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        {/* <View
      
        // style={[styles.bottomBar, { borderTopColor: colors.surfaceVariant }]}
      > */}
        {/* State 1: Ready */}
        {status === "ready" && (
          <Button
            mode="contained"
            icon="auto-fix"
            style={styles.generateBtn}
            contentStyle={{ paddingVertical: 5 }}
            onPress={handleGenerate}
          >
            Generate in My Voice
          </Button>
        )}

        {/* State 2: Polling */}
        {status === "polling" && (
          <Button
            mode="contained-tonal"
            loading={true}
            style={styles.generateBtn}
            contentStyle={{ paddingVertical: 5 }}
          >
            AI is cloning your voice...
          </Button>
        )}

        {/* State 3: Completed (Audio Player) */}
        {status === "completed" && (
          <View style={{ alignItems: "center" }}>
            <Text
              variant="labelMedium"
              style={{ marginBottom: 10, color: "#34D399", fontWeight: "bold" }}
            >
              ✨ Audio Ready!
            </Text>
            <Button
              mode="contained"
              icon={isPlaying ? "pause" : "play"}
              style={[
                styles.generateBtn,
                { backgroundColor: colors.primary, width: "100%" },
              ]}
              contentStyle={{ paddingVertical: 5 }}
              onPress={togglePlayPause}
            >
              {isPlaying ? "Pause Story" : "Listen to Story"}
            </Button>
          </View>
        )}

        {/* State 4: Failed */}
        {status === "failed" && (
          <Button
            mode="outlined"
            icon="refresh"
            style={styles.generateBtn}
            contentStyle={{ paddingVertical: 5 }}
            textColor="#EF4444"
            onPress={handleGenerate}
          >
            Generation Failed. Tap to Retry
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" }, // Deep Slate
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    paddingHorizontal: 10,
    backgroundColor: "#0F172A", // Deep Slate
  },
  headerTitle: { fontWeight: "600", color: "#94A3B8" }, // Cool Gray
  scrollContent: { padding: 20, paddingBottom: 140 },
  title: {
    fontWeight: "bold",
    color: "#F8FAFC", // Ice White
    marginBottom: 20,
    textAlign: "center",
  },
  textCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderColor: "#334155",
  }, // Dark Slate
  storyText: { lineHeight: 28, color: "#CBD5E1", fontSize: 16 }, // Soft Light Slate for reading
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1E293B", // Dark Slate
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "#334155", // Mid-Slate
  },
  generateBtn: { borderRadius: 30 },
});
