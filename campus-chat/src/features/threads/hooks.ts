import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createThread,
  listThreads,
  updateThread,
  deleteThread,
  getThread,
  getMyThreads,
  hideThread,
  unhideThread,
  reportThread,
  getHiddenThreads,
  adminDeleteThread,
  classifyThread,
  deactivateThread,
  reactivateThread,
  countAllThreads,
  countThreadsByUser,
  getChannelsFromThreadsService,
  type CreateThreadPayload,
  type ThreadEditPayload,
} from "./api";
import type { ThreadHide, ThreadReport } from "@/types";

// ========== QUERIES DE THREADS ==========

export const useThreads = (channelId?: string) =>
  useQuery({
    queryKey: ["threads", channelId],
    queryFn: () => listThreads(channelId),
    // Solo habilitar si existe channelId y no es null/undefined
    enabled: Boolean(channelId) && channelId !== "null" && channelId !== "undefined",
  });

export const useThread = (threadId?: string) =>
  useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => getThread(threadId!),
    enabled: Boolean(threadId),
  });

export const useMyThreads = (userId?: string) =>
  useQuery({
    queryKey: ["threads", "mine", userId],
    queryFn: () => getMyThreads(userId!),
    enabled: Boolean(userId),
  });

export const useHiddenThreads = (userId?: string) =>
  useQuery({
    queryKey: ["threads", "hidden", userId],
    queryFn: () => getHiddenThreads(userId!),
    enabled: Boolean(userId),
  });

// ========== QUERIES DE ADMIN ==========

export const useThreadsCount = () =>
  useQuery({
    queryKey: ["threads", "admin", "count"],
    queryFn: () => countAllThreads(),
  });

export const useUserThreadsCount = (userId?: string) =>
  useQuery({
    queryKey: ["threads", "admin", "count", userId],
    queryFn: () => countThreadsByUser(userId!),
    enabled: Boolean(userId),
  });

export const useChannelsFromThreadsService = () =>
  useQuery({
    queryKey: ["channels", "from-threads-service"],
    queryFn: () => getChannelsFromThreadsService(),
  });

// ========== MUTACIONES DE THREADS ==========

export const useThreadMutations = () => {
  const qc = useQueryClient();
  return {
    create: useMutation({
      mutationFn: (payload: CreateThreadPayload) => createThread(payload),
      onSuccess: (_, variables) => {
        qc.invalidateQueries({ queryKey: ["threads", variables.channel_id] });
      },
    }),
    update: useMutation({
      mutationFn: ({ threadId, payload }: { threadId: string; payload: ThreadEditPayload }) =>
        updateThread(threadId, payload),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["threads"] });
        qc.invalidateQueries({ queryKey: ["thread"] });
      },
    }),
    delete: useMutation({
      mutationFn: (threadId: string) => deleteThread(threadId),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["threads"] });
      },
    }),
  };
};

// ========== MUTACIONES DE MODERACIÓN DE THREADS ==========

export const useThreadModeration = () => {
  const qc = useQueryClient();
  return {
    hide: useMutation({
      mutationFn: ({ threadId, payload }: { threadId: string; payload: ThreadHide }) =>
        hideThread(threadId, payload),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["threads"] });
        qc.invalidateQueries({ queryKey: ["threads", "hidden"] });
      },
    }),
    unhide: useMutation({
      mutationFn: (threadId: string) => unhideThread(threadId),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["threads"] });
        qc.invalidateQueries({ queryKey: ["threads", "hidden"] });
      },
    }),
    report: useMutation({
      mutationFn: ({ threadId, payload }: { threadId: string; payload: ThreadReport }) =>
        reportThread(threadId, payload),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["threads"] });
      },
    }),
  };
};

// ========== MUTACIONES DE ADMIN DE THREADS ==========

export const useThreadAdminMutations = () => {
  const qc = useQueryClient();
  return {
    adminDelete: useMutation({
      mutationFn: (threadId: string) => adminDeleteThread(threadId),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["threads"] });
        qc.invalidateQueries({ queryKey: ["threads", "admin", "count"] });
      },
    }),
    classify: useMutation({
      mutationFn: ({ threadId, label }: { threadId: string; label: string }) =>
        classifyThread(threadId, label),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["threads"] });
        qc.invalidateQueries({ queryKey: ["thread"] });
      },
    }),
    deactivate: useMutation({
      mutationFn: (threadId: string) => deactivateThread(threadId),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["threads"] });
        qc.invalidateQueries({ queryKey: ["thread"] });
      },
    }),
    reactivate: useMutation({
      mutationFn: (threadId: string) => reactivateThread(threadId),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["threads"] });
        qc.invalidateQueries({ queryKey: ["thread"] });
      },
    }),
  };
};




