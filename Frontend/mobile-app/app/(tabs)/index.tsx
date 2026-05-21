import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Dialog,
  IconButton,
  List,
  Text,
  useTheme,
} from "react-native-paper";

const BASE_URL = "http://192.168.18.12:7000";

export default function HomeTab() {
  const { colors } = useTheme();
  const router = useRouter();

  // --- State Management ---
  const [loading, setLoading] = useState(true);
  const [hasVoice, setHasVoice] = useState(false);
  const [userName, setUserName] = useState("Abdullah");
  const [recentStories, setRecentStories] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState<any | null>(null);
  const [showDialog, setshowDialog] = useState(false);
  const { user, logout } = useAuth();

  const getUserStatus = async () => {
    try {
      console.log("Checking user status with token...");
      const token = await SecureStore.getItemAsync("userToken");
      console.log("Token is: ", token);
      const response = await axios.post(
        `${BASE_URL}/api/generatedData`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log("User status response: ", response.data);
      return response.data;
    } catch (err) {
      throw new Error(`HTTP error ${err}`);
    }
  };

  // --- API Call on Mounting ---
  const loadDashboard = async () => {
    try {
      setLoading(true);
      console.log("Fetching user status...");
      const status = await getUserStatus();
      console.log("user is: ", user.data.name);
      setUserName(user.data.name || "User");
      setHasVoice(status.voice_profiles.length > 0);
      setRecentStories(status.generated_audio);
      setVoiceProfile(status.voice_profiles[0] || null);
    } catch (error) {
      console.error("Daasync shboard Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };
  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  // --- UI Components ---

  // 1. Loading State
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          animating={true}
          color={colors.primary}
          size="large"
        />
        <Text style={{ marginTop: 10 }}>Syncing your library...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadDashboard} />
      }
    >
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={styles.bold}>
            {hasVoice
              ? `Welcome back, ${userName}!`
              : "Welcome to Vocal Legacy"}
          </Text>
          <Text variant="bodyMedium" style={{ color: "#94A3B8" }}>
            {hasVoice
              ? "Your AI stories are ready"
              : "Let's personalize your experience"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setshowDialog(true)}>
          <Avatar.Text
            size={48}
            label={userName[0]}
            style={{ backgroundColor: colors.primaryContainer }}
          />
        </TouchableOpacity>
      </View>

      {/* --- CONDITIONAL STATUS CARD --- */}
      {!hasVoice ? (
        /* NEWCOMER VIEW */
        <Card
          style={[styles.heroCard, { backgroundColor: "#1E1B4B" }]}
          mode="elevated"
        >
          <Card.Content>
            <View style={styles.row}>
              <IconButton
                icon="microphone-outline"
                iconColor={colors.primary}
                size={30}
              />
              <Text variant="titleMedium" style={styles.bold}>
                Unlock Your Voice
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.heroText}>
              Upload a 10-second clip to generate stories that sound exactly
              like you.
            </Text>
          </Card.Content>
          <Card.Actions>
            {/* <Button mode="contained" onPress={() => router.push("/record")}> */}
            <Button mode="contained" onPress={() => router.push("/record")}>
              Start Recording
            </Button>
          </Card.Actions>
        </Card>
      ) : (
        /* VETERAN VIEW (Status Card) */
        <Card style={styles.statusCard} mode="outlined">
          <Card.Content style={styles.rowBetween}>
            <View style={styles.row}>
              <Avatar.Icon
                size={36}
                icon="check-decagram"
                style={{ backgroundColor: "#064E3B" }}
                color="#34D399"
              />
              <View style={{ marginLeft: 12 }}>
                <Text variant="labelLarge" style={{ color: "#F8FAFC" }}>
                  {voiceProfile
                    ? voiceProfile.profile_name
                    : "Your Voice Profile"}
                </Text>
                <Text variant="bodySmall" style={{ color: "#34D399" }}>
                  Active & Calibrated
                </Text>
              </View>
            </View>
            <Button mode="text" onPress={() => router.push("/record")} compact>
              {/* <Button mode="text" compact> */}
              Retrain
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* --- RECENTLY GENERATED (Veteran Only) --- */}
      {recentStories.length > 0 ? (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Recently Generated
          </Text>
          {recentStories.map((item) => (
            <Card
              key={item.id}
              style={styles.listCard}
              mode="contained"
              // onPress={() => router.push(`/story/${item.id}`)}
            >
              <List.Item
                title={item.storyname}
                description={`Generated on ${new Date(item.created_at).toLocaleDateString()}`}
                left={(props) => (
                  <List.Icon {...props} icon="play-circle-outline" />
                )}
                right={(props) => (
                  <IconButton {...props} icon="chevron-right" />
                )}
              />
            </Card>
          ))}
        </View>
      ) : (
        <View>
          <Card style={styles.listCard} mode="elevated">
            <Card.Content style={styles.center}>
              <IconButton
                icon="book-open-variant"
                size={40}
                iconColor={colors.primary}
              />
              <Text variant="titleMedium" style={styles.bold}>
                No Stories Yet
              </Text>
              <Text variant="bodyMedium" style={styles.heroText}>
                Your generated storiesssssss will appear here. Start creating to
                see them in actionnnnnnn!
              </Text>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* --- QUICK ACTIONS --- */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Quick Actions
        </Text>
        <View style={styles.rowBetween}>
          <Card
            style={styles.actionCard}
            onPress={() => router.push("/library")}
          >
            <Card.Content style={styles.center}>
              <IconButton icon="book-open-variant" />
              <Text variant="labelLarge">Library</Text>
            </Card.Content>
          </Card>
          <Card style={styles.actionCard} onPress={() => router.push("/vault")}>
            {/* <Card style={styles.actionCard}> */}
            <Card.Content style={styles.center}>
              <IconButton icon="folder-music-outline" />
              <Text variant="labelLarge">My Vault</Text>
            </Card.Content>
          </Card>
        </View>
      </View>
      <Dialog visible={showDialog} onDismiss={() => setshowDialog(false)}>
        <Dialog.Title>Logout</Dialog.Title>
        <Dialog.Content>
          <Text>Do you want to logout</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setshowDialog(false)}>Cancel</Button>
          <Button onPress={() => handleLogout()}>Logout</Button>
        </Dialog.Actions>
      </Dialog>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 30,
    paddingTop: 30,
  },
  bold: { fontWeight: "700", color: "#F8FAFC" },
  row: { flexDirection: "row", alignItems: "center" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroCard: { borderRadius: 16, marginBottom: 25 },
  statusCard: {
    borderRadius: 12,
    marginBottom: 25,
    borderColor: "#334155",
    backgroundColor: "#1E293B",
  },
  heroText: { marginVertical: 10, lineHeight: 20, color: "#94A3B8" },
  section: { marginBottom: 30 },
  sectionTitle: { marginBottom: 15, fontWeight: "600", color: "#F8FAFC" },
  listCard: { marginBottom: 10, backgroundColor: "#1E293B" },
  actionCard: { width: "47%", paddingVertical: 10, backgroundColor: "#1E293B" },
});
