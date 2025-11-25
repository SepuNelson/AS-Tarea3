import { apiClient } from "@/lib/apiClient";
import type { PresenceRecord, PresenceStats, DeviceType } from "@/types";

export const registerPresence = async (payload: { userId: string; device?: DeviceType; ip?: string }) => {
  // Asegurar que device tiene un valor válido
  const deviceValue: DeviceType = payload.device || "web";
  await apiClient.post("/api/v1.0.0/presence", {
    ...payload,
    device: deviceValue,
  });
};

export const sendHeartbeat = async (userId: string) => {
  await apiClient.patch(`/api/v1.0.0/presence/${userId}`, { heartbeat: true });
};

export const updatePresenceStatus = async (userId: string, status: "online" | "offline") => {
  await apiClient.patch(`/api/v1.0.0/presence/${userId}`, { status });
};

export const listPresence = async (status?: "online" | "offline") => {
  const { data } = await apiClient.get<PresenceRecord[]>("/api/v1.0.0/presence", { params: { status } });
  return data;
};

export const getPresence = async (userId: string) => {
  const { data } = await apiClient.get<PresenceRecord>(`/api/v1.0.0/presence/${userId}`);
  return data;
};

export const getPresenceStats = async () => {
  const { data } = await apiClient.get<PresenceStats>("/api/v1.0.0/presence/stats");
  return data;
};




