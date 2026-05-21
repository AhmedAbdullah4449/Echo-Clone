import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {
    ActivityIndicator,
    Button,
    Card,
    IconButton,
    Text,
    TextInput,
    useTheme,
} from "react-native-paper";
const BASE_URL = "http://192.168.18.12:7000";
// ⚙️ Strict .WAV configuration (Fully typed to satisfy TypeScript)
const WAV_RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: ".wav",
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    // Required by TypeScript, even if we are only testing on Android
    extension: ".wav",
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    // Required by TypeScript
    mimeType: "audio/webm",
  },
};
export default function RecordScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // --- State ---
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [profileName, setProfileName] = useState("Mommy's Voice");
  const [isUploading, setIsUploading] = useState(false);

  // --- Permissions Cleanup ---
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // --- 🎙️ Recording Logic ---
  async function startRecording() {
    try {
      // 1. Request Permission
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need access to your microphone to save your voice.",
        );
        return;
      }

      // 2. Prepare device for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 3. Start Recording in .WAV
      const { recording } = await Audio.Recording.createAsync(
        WAV_RECORDING_OPTIONS,
      );
      setRecording(recording);
      setAudioUri(null); // Clear previous recordings
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setAudioUri(uri);

      // Reset audio mode for playback
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  }

  // --- 🎧 Playback Logic ---
  async function playAudio() {
    if (!audioUri) return;
    setIsPlaying(true);
    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
    setSound(sound);
    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        setIsPlaying(false);
      }
    });
  }

  // --- ☁️ Upload Logic (Multipart Form Data) ---
  async function uploadVoice() {
    if (!audioUri) return;
    setIsUploading(true);

    try {
      // 1. Package the file for FastAPI
      const formData = new FormData();

      // 2. Extract the filename from the URI
      const filename = audioUri.split("/").pop() || "recording.wav";

      // 3. Append the .wav file
      // Note: React Native's FormData requires this specific object structure for files
      formData.append("voice_file", {
        uri: audioUri,
        name: filename,
        type: "audio/wav",
      } as any);

      // 4. Append the profile name
      formData.append("profile_name", profileName);

      // 5. Send to your Backend
      // REPLACE THIS URL with your actual backend Ngrok/Localhost URL
      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${await SecureStore.getItemAsync("userToken")}`,
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert(
          "Success!",
          "Your voice profile is ready to generate stories.",
        );
        router.back(); // Send them back to the Home screen
      } else {
        Alert.alert("Upload Failed", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Network Error", "Could not reach the server.");
    } finally {
      setIsUploading(false);
    }
  }

  // --- UI ---
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <IconButton
          icon="close"
          iconColor="#F8FAFC"
          size={28}
          onPress={() => router.back()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          Voice Studio
        </Text>
        {/* Spacer to center title */}
        <View style={{ width: 48 }} />
      </View>

      {/* INSTRUCTIONS CARD */}
      <Card style={styles.instructionCard} mode="contained">
        <Card.Content>
          <Text
            variant="titleMedium"
            style={{ fontWeight: "bold", marginBottom: 8 }}
          >
            🎙️ Before you record:
          </Text>
          <Text style={styles.bullet}>
            • Find a quiet room and close the door
          </Text>
          <Text style={styles.bullet}>
            • Hold your phone 6-8 inches from your mouth
          </Text>
          <Text style={styles.bullet}>
            • Take a breath, then start reading naturally
          </Text>
          <Text style={styles.bullet}>
            • Don't rush — speak the way you'd read to your child
          </Text>
          <Text style={styles.bullet}>
            • Do one practice read, then record the second take
          </Text>
        </Card.Content>
      </Card>

      {/* THE SCRIPT */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Read this text:
      </Text>
      <Card style={styles.scriptCard} mode="outlined">
        <Card.Content>
          <Text variant="bodyLarge" style={styles.scriptText}>
            "The sun was warm, but the wind was cool. She walked slowly through
            the garden, stopping to smell the roses. 'What a beautiful day,' she
            whispered softly. Every morning felt like a gift — full of wonder,
            full of peace."
          </Text>
        </Card.Content>
      </Card>

      {/* PROFILE NAME INPUT */}
      <View style={{ marginTop: 20 }}>
        <TextInput
          textColor="#F8FAFC"
          outlineColor="#334155"
          activeOutlineColor="#34D399"
          label="Name this voice profile"
          style={{ backgroundColor: "#1E293B" }}
          value={profileName}
          onChangeText={setProfileName}
          mode="outlined"
          left={<TextInput.Icon color="#94A3B8" icon="account-voice" />}
        />
      </View>

      {/* RECORDING CONTROLS */}
      <View style={styles.controlsContainer}>
        {isUploading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#34D399" />
            <Text style={{ marginTop: 10, color: "#94A3B8" }}>
              Saving your Voice DNA...
            </Text>
          </View>
        ) : (
          <>
            {/* The Big Record Button */}
            {!audioUri && (
              <IconButton
                icon={recording ? "stop-circle" : "microphone"}
                iconColor={recording ? "#EF4444" : "#34D399"}
                size={80}
                onPress={recording ? stopRecording : startRecording}
                style={styles.recordButton}
              />
            )}
            {recording && (
              <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                Recording... Tap to Stop
              </Text>
            )}

            {/* Playback & Upload Buttons */}
            {audioUri && (
              <View style={styles.postRecordActions}>
                <Button
                  icon={isPlaying ? "pause" : "play"}
                  mode="outlined"
                  onPress={playAudio}
                  textColor="#F8FAFC"
                  style={styles.actionBtn}
                >
                  {isPlaying ? "Playing..." : "Listen Back"}
                </Button>

                <Button
                  icon="refresh"
                  mode="text"
                  textColor="#94A3B8"
                  onPress={() => setAudioUri(null)} // Deletes and lets them try again
                  style={styles.actionBtn}
                >
                  Retake
                </Button>

                <Button
                  icon="cloud-upload"
                  mode="contained"
                  onPress={uploadVoice}
                  buttonColor="#34D399"
                  textColor="#0F172A"
                  style={[styles.actionBtn, { marginTop: 20, width: "100%" }]}
                >
                  Save Profile
                </Button>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 40,
    marginBottom: 10,
  },
  headerTitle: { fontWeight: "bold", color: "#F8FAFC" },
  instructionCard: { backgroundColor: "#1E1B4B", marginBottom: 20 },
  bullet: { lineHeight: 22, color: "#E2E8F0" },
  sectionTitle: { fontWeight: "600", marginBottom: 10, color: "#F8FAFC" },
  scriptCard: { backgroundColor: "#1E293B", borderColor: "#334155" },
  scriptText: {
    fontStyle: "italic",
    lineHeight: 28,
    color: "#94A3B8",
    fontSize: 18,
    textAlign: "center",
  },
  controlsContainer: { marginTop: 30, alignItems: "center", minHeight: 200 },
  recordButton: {
    backgroundColor: "#1E293B",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  postRecordActions: { width: "100%", alignItems: "center" },
  actionBtn: { marginVertical: 5, width: "80%", borderColor: "#334155" },
  center: { alignItems: "center", justifyContent: "center" },
});
