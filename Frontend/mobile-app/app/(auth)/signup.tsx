import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Snackbar, Text, TextInput } from "react-native-paper";
const BASE_URL = "http://192.168.18.12:7000";

export default function SingupScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSingup = async () => {
    try {
      console.log("Signup in with email: ", email);
      console.log("Signup in with name: ", name);
      console.log("Signup in with password: ", password);
      const response = await axios.post(`${BASE_URL}/auth/signup`, {
        email,
        name,
        password,
      });
      console.log(
        "response.data.access_token is: ",
        response.data.data.access_token,
      );
      await login(response.data.data.access_token);
      console.log("Token set successfully: ", response.data.data.access_token);
    } catch (err) {
      console.log("APi Returned error: ", err);
      setError("Invalid email or password");
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Signup
      </Text>
      <TextInput
        label="Name"
        mode="outlined"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
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
      <Button mode="contained" onPress={handleSingup} style={styles.button}>
        Signup
      </Button>
      <Button onPress={() => router.push("/(auth)/login")}>
        Already have an account? Login
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
