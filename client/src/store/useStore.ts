import { create } from "zustand"
import axios from "axios"
import { Config } from "@/constants/config";

interface AuthState {
  token: string | null;
  user: any | null;

  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  login: async (username, password) => {
    const response = await axios.post(`${Config.apiUrl}/login`, { username, password });
    const token = response.data.token;
    console.log(token);

    set({ token });
  },

  logout: () => set({ token: null, user: null }),
}));
