import axios, { AxiosHeaders } from "axios";
import { useAuthStore } from "@/store/authStore";

const baseURL = import.meta.env.VITE_API_URL ?? "/api";

export const apiClient = axios.create({
  baseURL,
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  const headers = (config.headers = config.headers instanceof AxiosHeaders ? config.headers : new AxiosHeaders(config.headers));
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("X-App-Client", "campus-chat-web");
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const buildRealtimeURL = () =>
  import.meta.env.VITE_REALTIME_URL ?? baseURL.replace("https", "wss").replace("http", "ws");

