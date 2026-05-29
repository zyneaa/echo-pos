import { Platform } from "react-native";

const devDefaultUrl =
  Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL ?? (__DEV__ ? devDefaultUrl : undefined);
if (!SERVER_URL) {
  throw new Error("Missing EXPO_PUBLIC_SERVER_URL in .env file");
}

export const Config = {
  apiUrl: SERVER_URL,
  timeout: 5000,
} as const;
