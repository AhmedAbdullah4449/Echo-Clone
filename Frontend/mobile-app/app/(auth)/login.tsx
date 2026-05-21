import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Snackbar, Text, TextInput } from "react-native-paper";

const BASE_URL = "http://192.168.18.12:7000";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();
  const handleLogin = async () => {
    try {
      console.log("Logging in with email: ", email);
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      const response = await axios.post(
        `${BASE_URL}/auth/login`,
        formData.toString(),
      );
      console.log("Login successfully: ", response);

      console.log("Login successfully: ", response);
      await login(response.data.access_token);
      console.log("Token set successfully: ", response.data.access_token);
    } catch (err) {
      console.log("APi Returned error: ", err);
      setError("Invalid email or password");
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Login
      </Text>
      <TextInput
        label="Email"
        mode="outlined"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        label="Password"
        mode="outlined"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Button mode="contained" onPress={handleLogin} style={styles.button}>
        Login
      </Button>
      <Button onPress={() => router.push("/(auth)/signup")}>
        Don't have an account? Sign Up
      </Button>
      <Snackbar
        visible={!!error}
        onDismiss={() => setError("")}
        duration={3000}
        style={{ backgroundColor: "red" }}
      >
        <Text style={{ color: "white" }}>{error}</Text>{" "}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#0F172A",
  },
  title: { textAlign: "center", marginBottom: 20, fontWeight: "bold" },
  input: { marginBottom: 15 },
  button: { marginTop: 10, paddingVertical: 5 },
});
