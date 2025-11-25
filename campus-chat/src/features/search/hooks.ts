import { useQuery } from "@tanstack/react-query";
import {
  searchMessages,
  searchFiles,
  searchChannels,
  searchThreadsByKeyword,
  searchThreadById,
  searchThreadsByAuthor,
  searchThreadsByDateRange,
  searchThreadsByStatus,
  type SearchMessagesParams,
  type SearchFilesParams,
  type SearchChannelsParams,
} from "./api";

// ========== BÚSQUEDA DE MENSAJES ==========

export const useSearchMessages = (params: SearchMessagesParams, enabled = true) =>
  useQuery({
    queryKey: ["search", "messages", params],
    queryFn: () => searchMessages(params),
    enabled: enabled && Boolean(params.q || params.user_id || params.thread_id || params.message_id),
  });

// ========== BÚSQUEDA DE ARCHIVOS ==========

export const useSearchFiles = (params: SearchFilesParams, enabled = true) =>
  useQuery({
    queryKey: ["search", "files", params],
    queryFn: () => searchFiles(params),
    enabled: enabled && Boolean(params.q || params.file_id || params.thread_id || params.message_id),
  });

// ========== BÚSQUEDA DE CANALES ==========

export const useSearchChannels = (params: SearchChannelsParams, enabled = true) =>
  useQuery({
    queryKey: ["search", "channels", params],
    queryFn: () => searchChannels(params),
    enabled: enabled && Boolean(params.q || params.channel_id || params.owner_id),
  });

// ========== BÚSQUEDA DE THREADS ==========

export const useSearchThreadsByKeyword = (keyword?: string) =>
  useQuery({
    queryKey: ["search", "threads", "keyword", keyword],
    queryFn: () => searchThreadsByKeyword(keyword!),
    enabled: Boolean(keyword),
  });

export const useSearchThreadById = (threadId?: string) =>
  useQuery({
    queryKey: ["search", "threads", "id", threadId],
    queryFn: () => searchThreadById(threadId!),
    enabled: Boolean(threadId),
  });

export const useSearchThreadsByAuthor = (authorId?: string) =>
  useQuery({
    queryKey: ["search", "threads", "author", authorId],
    queryFn: () => searchThreadsByAuthor(authorId!),
    enabled: Boolean(authorId),
  });

export const useSearchThreadsByDateRange = (startDate?: Date | string, endDate?: Date | string) =>
  useQuery({
    queryKey: ["search", "threads", "daterange", startDate, endDate],
    queryFn: () => searchThreadsByDateRange(startDate!, endDate!),
    enabled: Boolean(startDate && endDate),
  });

export const useSearchThreadsByStatus = (status?: string) =>
  useQuery({
    queryKey: ["search", "threads", "status", status],
    queryFn: () => searchThreadsByStatus(status!),
    enabled: Boolean(status),
  });

