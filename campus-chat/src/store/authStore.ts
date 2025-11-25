import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/types";

interface AuthState {
  token?: string;
  user?: UserProfile;
  isLoadingProfile: boolean;
  setToken: (token: string | undefined) => void;
  setUser: (user: UserProfile | undefined) => void;
  logout: () => void;
  setIsLoadingProfile: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: undefined,
      user: undefined,
      isLoadingProfile: false,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setIsLoadingProfile: (isLoadingProfile) => set({ isLoadingProfile }),
      logout: () => set({ token: undefined, user: undefined }),
    }),
    { name: "campus-chat-auth" },
  ),
);




