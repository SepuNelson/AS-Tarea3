import { apiClient } from "@/lib/apiClient";
import type { Message, MessageType } from "@/types";

export interface MessageCreatePayload {
  content: string;
  type?: MessageType | null;
  paths?: string[] | null;
}

export interface MessageUpdatePayload {
  content?: string | null;
  paths?: string[] | null;
}

export interface MessagesPage {
  items: Message[];
  next_cursor?: string | null;
  has_more?: boolean;
}

export const listMessages = async (threadId?: string, limit = 50, cursor?: string | null) => {
  if (!threadId) return { items: [] as Message[], has_more: false };
  const { data } = await apiClient.get<MessagesPage>(`/threads/${threadId}/messages`, {
    params: { limit, cursor },
  });
  return data;
};

export const createMessage = async (threadId: string, payload: MessageCreatePayload, userId: string) => {
  const { data } = await apiClient.post<Message>(`/threads/${threadId}/messages`, payload, {
    headers: { "X-User-Id": userId },
  });
  return data;
};

export const updateMessage = async (
  threadId: string,
  messageId: string,
  payload: MessageUpdatePayload,
  userId: string,
) => {
  const { data } = await apiClient.put<Message>(`/threads/${threadId}/messages/${messageId}`, payload, {
    headers: { "X-User-Id": userId },
  });
  return data;
};

export const deleteMessage = async (threadId: string, messageId: string, userId: string) => {
  await apiClient.delete(`/threads/${threadId}/messages/${messageId}`, {
    headers: { "X-User-Id": userId },
  });
};

// ========== MENSAJE EN THREAD (Servicio Threads) ==========

/**
 * Crear un mensaje directamente en un thread (usando el servicio de threads)
 * Este endpoint usa query params en lugar de body JSON
 */
export const createMessageOnThread = async (params: {
  thread_id: string;
  user_id: string;
  content: string;
}): Promise<Message> => {
  const { data } = await apiClient.post<Message>("/v1/threads/message/message-on-thread", null, {
    params: {
      thread_id: params.thread_id,
      user_id: params.user_id,
      content: params.content,
    },
  });
  return data;
};




