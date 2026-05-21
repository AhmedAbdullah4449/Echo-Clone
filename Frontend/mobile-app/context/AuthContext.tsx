import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

const BASE_URL = "http://192.168.18.12:7000";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async (token: string) => {
    try {
      const res = await axios.get(`${BASE_URL}/auth/check-token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUser = async () => {
    const token = await SecureStore.getItemAsync("userToken");
    console.log("Loaded token: ", token);
    if (!token) {
      setIsLoading(false);
      return;
    }
    await fetchUser(token);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (token: string) => {
    await SecureStore.setItemAsync("userToken", token);
    await fetchUser(token);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("userToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
