const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;
if (!SERVER_URL) {
  throw new Error("Missing EXPO_PUBLIC_SERVER_URL in .env file");
}

export const Config = {
  apiUrl: SERVER_URL,
  timeout: 5000,
} as const;
