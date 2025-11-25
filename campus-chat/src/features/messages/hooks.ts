import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createMessage, deleteMessage, listMessages, updateMessage, createMessageOnThread } from "./api";
import { useAuthStore } from "@/store/authStore";
import { logTelemetry } from "@/lib/telemetry";

export const useMessages = (threadId?: string) =>
  useInfiniteQuery({
    queryKey: ["messages", threadId],
    queryFn: ({ pageParam }) => listMessages(threadId, 50, pageParam ?? null),
    // Solo habilitar si existe threadId y no es null/undefined
    enabled: Boolean(threadId) && threadId !== "null" && threadId !== "undefined",
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: data.pages.flatMap((page) => page.items),
    }),
  });

export const useMessageActions = (threadId?: string) => {
  const qc = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["messages", threadId] });
  };

  return {
    send: useMutation({
      mutationFn: (payload: Parameters<typeof createMessage>[1]) => {
        if (!threadId || threadId === "null" || threadId === "undefined" || !user) {
          throw new Error("thread/user missing or invalid");
        }
        return createMessage(threadId, payload, user.id);
      },
      onSuccess: () => {
        logTelemetry({ type: "message", action: "send", threadId: threadId ?? "unknown" });
        invalidate();
      },
    }),
    edit: useMutation({
      mutationFn: ({ messageId, payload }: { messageId: string; payload: Parameters<typeof updateMessage>[2] }) => {
        if (!threadId || threadId === "null" || threadId === "undefined" || !user) {
          throw new Error("thread/user missing or invalid");
        }
        return updateMessage(threadId, messageId, payload, user.id);
      },
      onSuccess: () => {
        logTelemetry({ type: "message", action: "edit", threadId: threadId ?? "unknown" });
        invalidate();
      },
    }),
    remove: useMutation({
      mutationFn: (messageId: string) => {
        if (!threadId || threadId === "null" || threadId === "undefined" || !user) {
          throw new Error("thread/user missing or invalid");
        }
        return deleteMessage(threadId, messageId, user.id);
      },
      onSuccess: () => {
        logTelemetry({ type: "message", action: "delete", threadId: threadId ?? "unknown" });
        invalidate();
      },
    }),
  };
};

// ========== MENSAJE EN THREAD (Servicio Threads) ==========

/**
 * Hook para crear mensajes usando el servicio de threads directamente
 * Útil cuando se necesita crear mensajes sin pasar por el servicio de mensajes
 */
export const useMessageOnThread = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (params: { thread_id: string; user_id: string; content: string }) =>
      createMessageOnThread(params),
    onSuccess: (_, variables) => {
      logTelemetry({ type: "message", action: "send-on-thread", threadId: variables.thread_id });
      qc.invalidateQueries({ queryKey: ["messages", variables.thread_id] });
    },
  });
};

