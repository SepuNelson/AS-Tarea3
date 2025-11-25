import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, login, register, updateProfile } from "./api";
import { useAuthStore } from "@/store/authStore";
import { logTelemetry } from "@/lib/telemetry";

export const useProfile = () => {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const setIsLoadingProfile = useAuthStore((state) => state.setIsLoadingProfile);

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      setIsLoadingProfile(true);
      try {
        const user = await fetchProfile();
        setUser(user);
        return user;
      } finally {
        setIsLoadingProfile(false);
      }
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    meta: { description: "Fetch current user profile" },
    retry: 1,
    placeholderData: () => useAuthStore.getState().user,
    select: (data) => data,
  });
};

export const useLogin = () => {
  const setToken = useAuthStore((state) => state.setToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setToken(data.access_token);
      logTelemetry({ type: "auth", action: "login" });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      logTelemetry({ type: "auth", action: "register" });
    },
  });
};

export const useUpdateProfile = () => {
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      setUser(user);
    },
  });
};

