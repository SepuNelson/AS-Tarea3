import { apiClient } from "@/lib/apiClient";
import type { Channel, ChannelMember } from "@/types";

export interface PaginatedChannelsResponse {
  data: Channel[];
}

export interface ChannelCreatePayload {
  name: string;
  owner_id: string;
  channel_type?: "public" | "private";
}

export interface ChannelUpdatePayload {
  name?: string | null;
  owner_id?: string | null;
  channel_type?: "public" | "private" | null;
}

// Helper para normalizar IDs de canales (mapea _id a id)
const normalizeChannelId = (channel: any): Channel => {
  if (channel._id && !channel.id) {
    return { ...channel, id: channel._id };
  }
  return channel;
};

export const listChannels = async (page = 1, page_size = 100) => {
  try {
    const { data } = await apiClient.get<Channel[]>(`/v1/channels/`, { params: { page, page_size } });
    console.log("[Channels API] listChannels response:", data);
    return (data ?? []).map(normalizeChannelId);
  } catch (error) {
    console.error("[Channels API] listChannels error:", error);
    return [];
  }
};

export const createChannel = async (payload: ChannelCreatePayload) => {
  console.log("[Channels API] createChannel request:", payload);
  const { data } = await apiClient.post<Channel>("/v1/channels/", payload);
  console.log("[Channels API] createChannel response:", data);
  return normalizeChannelId(data);
};

export const updateChannel = async (channelId: string, payload: ChannelUpdatePayload) => {
  const { data } = await apiClient.put<Channel>(`/v1/channels/${channelId}`, payload);
  return normalizeChannelId(data);
};

export const deactivateChannel = async (channelId: string) => {
  const { data } = await apiClient.delete<{ id: string }>(`/v1/channels/${channelId}`);
  return data;
};

export const reactivateChannel = async (channelId: string) => {
  const { data } = await apiClient.post<{ id: string }>(`/v1/channels/${channelId}/reactivate`);
  return data;
};

export const listChannelMembers = async (channelId: string, page = 1, page_size = 100) => {
  const { data } = await apiClient.get<ChannelMember[]>(`/v1/members/channel/${channelId}`, {
    params: { page, page_size },
  });
  return data;
};

export const addMemberToChannel = async (channel_id: string, user_id: string) => {
  const { data } = await apiClient.post<Channel>(`/v1/members/`, { channel_id, user_id });
  return data;
};

export const removeMemberFromChannel = async (channel_id: string, user_id: string) => {
  const { data } = await apiClient.delete<Channel>(`/v1/members/`, { data: { channel_id, user_id } });
  return data;
};




