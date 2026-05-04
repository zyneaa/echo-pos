import { create } from "zustand"
import axios from "axios"
import { Config } from "@/constants/config";

interface Product {
  id: string;
  barcode_id: string;
  name: string;
  image_url: string;
  description: string;
  type_id: string;
  price_mmk: number;
  stock_quantity: number;
  cost_price_mmk: number;
  alert_stock: number;
  expire_at: string;
  created_at: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface AuthState {
  token: string | null;
  user: any | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string | null) => void;
  setUser: (user: any | null) => void;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  login: async (username, password) => {
    const response = await axios.post(`${Config.apiUrl}/login`, { username, password });
    const token = response.data.token;
    set({ token });
  },

  logout: () => set({ token: null, user: null }),
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
}));

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  addItem: (product) => {
    const items = get().items;
    const existingItem = items.find((item) => item.id === product.id);
    let newItems;
    if (existingItem) {
      newItems = items.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newItems = [...items, { ...product, quantity: 1 }];
    }
    const total = newItems.reduce((acc, item) => acc + item.price_mmk * item.quantity, 0);
    set({ items: newItems, total });
  },
  removeItem: (productId) => {
    const items = get().items.filter((item) => item.id !== productId);
    const total = items.reduce((acc, item) => acc + item.price_mmk * item.quantity, 0);
    set({ items, total });
  },
  updateQuantity: (productId, quantity) => {
    const items = get().items;
    let newItems;
    if (quantity <= 0) {
      newItems = items.filter((item) => item.id !== productId);
    } else {
      newItems = items.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
    }
    const total = newItems.reduce((acc, item) => acc + item.price_mmk * item.quantity, 0);
    set({ items: newItems, total });
  },
  clearCart: () => set({ items: [], total: 0 }),
}));
