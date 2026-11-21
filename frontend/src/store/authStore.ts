import { create } from "zustand";
import type { User } from "../types/users";
import authService from "../services/auth";

type AuthState = {
  user: User | null;
  restoring: boolean;
  restore: () => Promise<void>;
  login: (credentials: {
    username: string;
    password: string;
  }) => Promise<User | null>;
  logout: () => Promise<void>;
  // Para refrescar datos del usuario logueado (ej: tras editar el perfil).
  setUser: (user: User | null) => void;
};

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  restoring: true,

  restore: async () => {
    const user = await authService.restoreLogin();
    set({ user, restoring: false });
  },

  login: async (credentials) => {
    await authService.login(credentials);
    const user = await authService.restoreLogin();
    set({ user, restoring: false });
    return user;
  },

  logout: async () => {
    await authService.logout();
    set({ user: null });
  },

  setUser: (user) => set({ user }),
}));

export default useAuthStore;
