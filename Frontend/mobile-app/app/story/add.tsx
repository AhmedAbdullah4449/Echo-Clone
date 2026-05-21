import axios from "axios";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  IconButton,
  Menu,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";

const BASE_URL = "http://192.168.18.12:7000";

// --- Color Palette ---
const PRIMARY_GREEN = "#10B981"; // Emerald/Neon Green
const BACKGROUND_BLACK = "#0A0A0A"; // Deep Black
const SURFACE_DARK = "#1A1A1A"; // Dark Gray for inputs/menus

const AddStory = () => {
  const [storyName, setStoryName] = useState<string>("");
  const [storyCategory, setStoryCategory] = useState("Select Category");
  const [storyText, setStorytext] = useState<string>("");
  const [openMenu, setopenMenu] = useState<boolean>(false);
  const [visible, setvisible] = useState(false);
  const [snackmsg, setsnackmsg] = useState("");

  const categories = ["Fable", "Horror", "Fairy Tales", "Bed-time"];
  const router = useRouter();

  const handleAddStory = async () => {
    if (storyCategory === "Select Category") {
      setsnackmsg("Please select a category");
      setvisible(true);
      return;
    }
    if (storyName === "") {
      setsnackmsg("Please enter story name");
      setvisible(true);
      return;
    }
    if (storyText === "") {
      setsnackmsg("Please enter story text");
      setvisible(true);
      return;
    }

    const data = {
      category: storyCategory,
      text: storyText,
      title: storyName,
    };

    const token = await SecureStore.getItemAsync("userToken");

    try {
      const response = await axios.post(`${BASE_URL}/story/addStory`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setsnackmsg("Story added successfully!");
      setvisible(true);

      // Wait 1 second so the user can see the snackbar before navigating away
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err) {
      setsnackmsg(`Error encountered: ${err}`);
      setvisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={28}
          iconColor="#e3f4ee" // Green accent
          onPress={() => router.back()}
        />
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Add Story
        </Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.textInput}
          label="Story Name"
          value={storyName}
          onChangeText={(name) => setStoryName(name)}
          mode="outlined"
          textColor="#FFFFFF" // White text
          outlineColor="#333333" // Subtle gray outline when inactive
          activeOutlineColor={PRIMARY_GREEN} // Green outline when focused
          theme={{ colors: { onSurfaceVariant: "#A0A0A0" } }} // Label color
        />

        <View style={styles.menuWrapper}>
          <Menu
            visible={openMenu}
            onDismiss={() => setopenMenu(false)}
            contentStyle={{ backgroundColor: SURFACE_DARK }} // Dark menu background
            anchor={
              <Button
                mode="outlined"
                icon="chevron-down"
                contentStyle={{
                  flexDirection: "row-reverse",
                  paddingVertical: 4,
                }}
                style={styles.categoryButton}
                textColor={PRIMARY_GREEN}
                onPress={() => setopenMenu(true)}
              >
                {storyCategory}
              </Button>
            }
          >
            {categories.map((cat) => (
              <Menu.Item
                key={cat}
                onPress={() => {
                  setStoryCategory(cat);
                  setopenMenu(false);
                }}
                title={cat}
                titleStyle={{ color: "#FFFFFF" }} // White text for menu items
              />
            ))}
          </Menu>
        </View>

        <TextInput
          style={[styles.textInput, styles.textArea]}
          label="Story Text"
          value={storyText}
          onChangeText={(text) => setStorytext(text)}
          mode="outlined"
          multiline={true} // Allows text to wrap
          numberOfLines={6}
          textColor="#FFFFFF"
          outlineColor="#333333"
          activeOutlineColor={PRIMARY_GREEN}
          theme={{ colors: { onSurfaceVariant: "#A0A0A0" } }}
        />
      </View>

      <Button
        mode="contained"
        style={styles.submitButton}
        buttonColor="#16a875"
        textColor="#000000" // Black text for high contrast
        onPress={() => handleAddStory()}
      >
        Submit
      </Button>

      <Snackbar
        visible={visible}
        onDismiss={() => setvisible(false)}
        duration={3000}
        style={{ backgroundColor: "#34D399" }}
        action={{
          label: "OK",
          labelStyle: { color: "#000000" },
          onPress: () => setvisible(false),
        }}
      >
        <Text style={{ color: "#000000", fontWeight: "bold" }}>{snackmsg}</Text>
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 10,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    marginLeft: 10,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  formContainer: {
    paddingHorizontal: 15,
    flex: 1, // Pushes the submit button to the bottom
  },
  textInput: {
    marginVertical: 10,
    backgroundColor: SURFACE_DARK, // Slightly lighter than black to stand out
  },
  textArea: {
    minHeight: 150,
  },
  menuWrapper: {
    marginVertical: 10,
    alignItems: "flex-start",
  },
  categoryButton: {
    borderColor: "#34D399", // Green border for the dropdown button
    borderWidth: 1,
  },
  submitButton: {
    margin: 20,
    paddingVertical: 6,
    borderRadius: 8,
  },
});

export default AddStory;
