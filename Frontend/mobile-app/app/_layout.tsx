import { AuthProvider, useAuth } from "@/context/AuthContext";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";

const BASE_URL = "http://192.168.18.12:7000";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  console.log("Current user: ", user);
  console.log("Is loading: ", isLoading);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    console.log("In auth group: ", inAuthGroup);
    console.log("segments[0] are: ", segments[0]);
    console.log("user is: ", user);
    if (!user && !inAuthGroup) {
      // Not logged in, redirect to login
      console.log("User not logged in, redirecting to login...");
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // Logged in but on auth screen, redirect to tabs
      router.replace("/(tabs)");
    }
  }, [user, isLoading]);

  if (isLoading) return null;

  return (
    <PaperProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000" },
          animation: "none",
        }}
      ></Stack>
    </PaperProvider>
  );
}
