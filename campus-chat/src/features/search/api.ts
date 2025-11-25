import { apiClient } from "@/lib/apiClient";
import type { Channel, FileResource, Message, Thread } from "@/types";

// ========== BÚSQUEDA DE MENSAJES ==========

export interface SearchMessagesParams {
  q?: string;
  user_id?: number;
  thread_id?: number;
  message_id?: number;
  type_?: "text" | "audio" | "file";
  limit?: number;
  offset?: number;
}

export const searchMessages = async (params: SearchMessagesParams) => {
  const { data } = await apiClient.get<Message[]>("/api/message/search_message", { params });
  return data ?? [];
};

// ========== BÚSQUEDA DE ARCHIVOS ==========

export interface SearchFilesParams {
  q?: string;
  file_id?: string;
  thread_id?: string;
  message_id?: string;
  limit?: number;
  offset?: number;
}

export const searchFiles = async (params: SearchFilesParams) => {
  const { data } = await apiClient.get<FileResource[]>("/api/files/search_files", { params });
  return data ?? [];
};

// ========== BÚSQUEDA DE CANALES ==========

export interface SearchChannelsParams {
  q?: string;
  channel_id?: number;
  owner_id?: string;
  channel_type?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export const searchChannels = async (params: SearchChannelsParams) => {
  const { data } = await apiClient.get<Channel[]>("/api/channel/search_channel", { params });
  return data ?? [];
};

// ========== BÚSQUEDA DE THREADS ==========

/**
 * Buscar threads por palabra clave
 */
export const searchThreadsByKeyword = async (thread_keyword: string) => {
  const { data } = await apiClient.get<Thread[]>(`/api/threads/keyword/${thread_keyword}`);
  return data ?? [];
};

/**
 * Buscar thread por ID (servicio de búsqueda)
 */
export const searchThreadById = async (thread_id: string) => {
  const { data } = await apiClient.get<Thread[]>(`/api/threads/id/${thread_id}`);
  return data ?? [];
};

/**
 * Buscar threads por autor/creador
 */
export const searchThreadsByAuthor = async (created_by: string) => {
  const { data } = await apiClient.get<Thread[]>(`/api/threads/author/${created_by}`);
  return data ?? [];
};

/**
 * Buscar threads por rango de fechas
 */
export const searchThreadsByDateRange = async (start_date: Date | string, end_date: Date | string) => {
  const startIso = start_date instanceof Date ? start_date.toISOString() : start_date;
  const endIso = end_date instanceof Date ? end_date.toISOString() : end_date;
  
  const { data } = await apiClient.get<Thread[]>("/api/threads/daterange", {
    params: { start_date: startIso, end_date: endIso }
  });
  return data ?? [];
};

/**
 * Buscar threads por status
 */
export const searchThreadsByStatus = async (status: string) => {
  const { data } = await apiClient.get<Thread[]>(`/api/threads/status/${status}`);
  return data ?? [];
};





