# Echo-Clone 🎙️

Echo-Clone is a full-stack mobile application that allows users to create stories and generate custom audio using voice profiles. Built with a React Native (Expo) frontend and a robust FASTAPI/Dockerized backend, it seamlessly handles text-to-speech generation, story management, and secure audio storage.

## Features

- **User Authentication:** Secure JWT-based authentication.
- **Story Management:** Users can write, categorize, and save custom stories (Fables, Horror, Fairy Tales, Bed-time).
- **Voice Profiles:** Create and manage distinct voice profiles for text-to-speech generation.
- **Audio Generation:** Convert story text into high-quality audio using custom voice models.
- **Secure Storage:** All generated audio and voice samples are securely stored using MinIO (S3-compatible storage).
- **Sleek UI:** Dark mode interface with neon/emerald green accents built using React Native Paper.

---

## 🛠️ Tech Stack

**Frontend (Mobile App)**
- [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (Routing via `expo-router`)
- [React Native Paper](https://callstack.github.io/react-native-paper/) (UI Components)
- [Axios](https://axios-http.com/) (API Client)
- Expo SecureStore (Token management)

**Backend & Infrastructure**
- **Server:** FASTAPI (Port `7000`)
- **Database:** PostgreSQL (`vocal_db` container)
- **Object Storage:** MinIO (`vocal_storage` container)
- **Caching & Queues:** Redis (`Redis_container`)
- **Containerization:** Docker & Docker Compose

---

## 🗄️ Database Schema

The PostgreSQL database (`vocal_db`) consists of the following core tables:
- `users`: Manages user credentials and authentication.
- `stories`: Stores user-generated stories (Title, Category, Text, Author).
- `voice_profiles`: Stores metadata and references to voice cloning samples.
- `generated_audio`: Links stories to their synthesized audio files stored in MinIO.

---

## 🚀 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- [Docker](https://www.docker.com/) & Docker Compose
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### 1. Start the Infrastructure (Docker)
Ensure your Docker daemon is running, then spin up the required services (Postgres, Redis, MinIO)
