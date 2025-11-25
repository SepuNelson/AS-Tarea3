import { apiClient } from "@/lib/apiClient";
import type { Channel, Thread, ThreadHide, ThreadReport } from "@/types";

// Payload para crear thread (usa query params según la API)
export interface CreateThreadPayload {
  channel_id: string;
  thread_name: string;
  user_id: string;
}

// Payload para editar thread (usa body JSON)
export interface ThreadEditPayload {
  title?: string | null;
  metadata?: Record<string, unknown> | null;
}

// Respuesta del conteo de threads
export interface ThreadCountResponse {
  count: number;
}

// Helper para normalizar IDs de threads (mapea thread_id a id)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeThreadId = (thread: any): Thread => {
  if (thread.thread_id && !thread.id) {
    return { ...thread, id: thread.thread_id };
  }
  return thread;
};

// ========== THREADS CRUD ==========

export const listThreads = async (channelId?: string): Promise<Thread[]> => {
  if (!channelId) return [];
  const { data } = await apiClient.get<Thread[]>("/v1/threads/channel/get_threads", { 
    params: { channel_id: channelId } 
  });
  return (data ?? []).map(normalizeThreadId);
};

export const getThread = async (threadId: string): Promise<Thread> => {
  const { data } = await apiClient.get<Thread>(`/v1/threads/threads/${threadId}`);
  return normalizeThreadId(data);
};

export const createThread = async (payload: CreateThreadPayload): Promise<Thread> => {
  // El servicio espera query params, no body JSON
  const { data } = await apiClient.post<Thread>("/v1/threads/threads/", null, {
    params: payload
  });
  return normalizeThreadId(data);
};

export const updateThread = async (threadId: string, payload: ThreadEditPayload): Promise<Thread> => {
  const { data } = await apiClient.put<Thread>(`/v1/threads/threads/${threadId}/edit`, payload);
  return normalizeThreadId(data);
};

export const deleteThread = async (threadId: string): Promise<void> => {
  await apiClient.delete(`/v1/threads/threads/${threadId}`);
};

export const getMyThreads = async (userId: string): Promise<Thread[]> => {
  const { data } = await apiClient.get<Thread[]>(`/v1/threads/threads/mine/${userId}`);
  return (data ?? []).map(normalizeThreadId);
};

// ========== MODERACIÓN DE THREADS ==========

export const hideThread = async (threadId: string, payload: ThreadHide): Promise<void> => {
  await apiClient.put(`/v1/threads/moderation/hide/${threadId}`, payload);
};

export const unhideThread = async (threadId: string): Promise<void> => {
  await apiClient.put(`/v1/threads/moderation/unhide/${threadId}`);
};

export const reportThread = async (threadId: string, payload: ThreadReport): Promise<void> => {
  await apiClient.put(`/v1/threads/moderation/report/${threadId}`, payload);
};

export const getHiddenThreads = async (userId: string): Promise<Thread[]> => {
  const { data } = await apiClient.get<Thread[]>(`/v1/threads/moderation/hidden/${userId}`);
  return (data ?? []).map(normalizeThreadId);
};

// ========== ADMIN DE THREADS ==========

/**
 * Eliminar thread (Admin) - Elimina cualquier thread por ID
 */
export const adminDeleteThread = async (threadId: string): Promise<void> => {
  await apiClient.delete(`/v1/threads/admin/thread/${threadId}`);
};

/**
 * Clasificar thread según ID con una etiqueta
 */
export const classifyThread = async (threadId: string, label: string): Promise<void> => {
  await apiClient.put(`/v1/threads/admin/thread/${threadId}/classify`, null, {
    params: { label }
  });
};

/**
 * Desactivar thread según ID
 */
export const deactivateThread = async (threadId: string): Promise<void> => {
  await apiClient.put(`/v1/threads/admin/thread/${threadId}/deactivate`);
};

/**
 * Reactivar thread según ID
 */
export const reactivateThread = async (threadId: string): Promise<void> => {
  await apiClient.put(`/v1/threads/admin/thread/${threadId}/reactivate`);
};

/**
 * Contar la cantidad de threads totales en el sitio
 */
export const countAllThreads = async (): Promise<ThreadCountResponse> => {
  const { data } = await apiClient.get<ThreadCountResponse>("/v1/threads/admin/threads/count");
  return data;
};

/**
 * Contar la cantidad de threads de un usuario específico
 */
export const countThreadsByUser = async (userId: string): Promise<ThreadCountResponse> => {
  const { data } = await apiClient.get<ThreadCountResponse>(`/v1/threads/admin/threads/count/${userId}`);
  return data;
};

// ========== CANALES (Desde Servicio Threads) ==========

/**
 * Obtener la lista de canales disponibles (desde la réplica local del servicio threads)
 */
export const getChannelsFromThreadsService = async (): Promise<Channel[]> => {
  const { data } = await apiClient.get<Channel[]>("/v1/threads/channel/channels");
  return data ?? [];
};
