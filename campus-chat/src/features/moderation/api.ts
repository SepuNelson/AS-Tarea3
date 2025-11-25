import { apiClient } from "@/lib/apiClient";
import type { ModerationStatus, ModerationViolation } from "@/types";

// API Key para endpoints de admin (configurar en .env)
const MODERATION_API_KEY = import.meta.env.VITE_MODERATION_API_KEY || "";

export interface ModerateMessagePayload {
  message_id: string;
  user_id: string;
  channel_id: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ModerateMessageResponse {
  is_approved: boolean;
  action: string;
  severity: string;
  strike_count: number;
  toxicity_score: number;
  message: string;
  detected_words?: string[] | null;
}

export const moderateMessage = async (payload: ModerateMessagePayload) => {
  const { data } = await apiClient.post<ModerateMessageResponse>("/api/v1/moderation/check", payload);
  return data;
};

export const getModerationStatus = async (userId: string, channelId: string) => {
  const { data } = await apiClient.get<ModerationStatus>(
    `/api/v1/moderation/status/${userId}/${channelId}`,
  );
  return data;
};

export const getBannedUsers = async (channelId?: string) => {
  const headers = MODERATION_API_KEY ? { "X-API-Key": MODERATION_API_KEY } : {};
  const { data } = await apiClient.get<{ total: number; banned_users: ModerationStatus[] }>(
    "/api/v1/admin/banned-users",
    { 
      params: { channel_id: channelId },
      headers,
    },
  );
  return data;
};

export const getUserViolations = async (userId: string, channelId: string) => {
  const headers = MODERATION_API_KEY ? { "X-API-Key": MODERATION_API_KEY } : {};
  const { data } = await apiClient.get<{
    total_violations: number;
    current_strikes: number;
    violations: ModerationViolation[];
  }>(`/api/v1/admin/users/${userId}/violations`, { 
    params: { channel_id: channelId },
    headers,
  });
  return data;
};

export const resetUserStrikes = async (userId: string, channelId: string) => {
  const headers = MODERATION_API_KEY ? { "X-API-Key": MODERATION_API_KEY } : {};
  await apiClient.post(`/api/v1/admin/users/${userId}/reset-strikes`, null, {
    params: { channel_id: channelId },
    headers,
  });
};

export const unbanUser = async (userId: string, channelId: string, reason?: string) => {
  const headers = MODERATION_API_KEY ? { "X-API-Key": MODERATION_API_KEY } : {};
  await apiClient.put(`/api/v1/admin/users/${userId}/unban`, {
    channel_id: channelId,
    reason,
  }, {
    headers,
  });
};




