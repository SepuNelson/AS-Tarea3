import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChannels, useChannelMutations } from "@/features/channels/hooks";
import { useThreads, useThreadMutations } from "@/features/threads/hooks";
import { useMessages, useMessageActions } from "@/features/messages/hooks";
import { useAuthStore } from "@/store/authStore";
import { usePresenceBoot, usePresenceStats } from "@/features/presence/hooks";
import { useUIStore } from "@/store/uiStore";
import { useRealtime } from "@/hooks/useRealtime";
import { useModerationActions } from "@/features/moderation/hooks";
import { listFiles, uploadFile, presignDownload } from "@/features/files/api";
import { chatProgramming, chatWikipedia } from "@/features/bots/api";
import { logTelemetry } from "@/lib/telemetry";
import { logger } from "@/lib/logger";

export const useDashboardLogic = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- State & Store ---
  const user = useAuthStore((state) => state.user);
  const { typingState, setTypingState, clearTypingState } = useUIStore();
  const [moderationNotes, setModerationNotes] = useState<Record<string, string | null>>({});
  const [channelPage, setChannelPage] = useState(1);
  const CHANNELS_PER_PAGE = 10;

  // --- Routing & Params ---
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const { data: channels = [] } = useChannels(channelPage, CHANNELS_PER_PAGE);
  const selectedChannelId = searchParams.get("channel") ?? channels[0]?.id;
  const selectedThreadId = searchParams.get("thread") ?? undefined;

  // --- Derived Data ---
  const { data: threads = [] } = useThreads(selectedChannelId);
  const selectedThread = threads.find((thread) => thread.id === selectedThreadId);

  // Mensajes requiere UUID si está disponible, sino usa ID normal (fallback)
  const threadIdForMessages = selectedThread?.uuid ?? selectedThreadId;

  const messagesQuery = useMessages(threadIdForMessages);
  const messages = messagesQuery.data?.items ?? [];
  const presenceStats = usePresenceStats().data;
  // const bannedUsers = useBannedUsers(selectedChannelId).data;
  const bannedUsers: { total?: number; banned_users?: unknown[] } = { total: 0, banned_users: [] };

  const sharedFilesQuery = useQuery({
    queryKey: ["files", threadIdForMessages],
    queryFn: () => (threadIdForMessages ? listFiles({ thread_id: threadIdForMessages }) : []),
    // Solo habilitar si existe threadId y no es null/undefined
    enabled: Boolean(threadIdForMessages) && threadIdForMessages !== "null" && threadIdForMessages !== "undefined",
  });

  // --- Mutations ---
  const messageActions = useMessageActions(threadIdForMessages);
  const channelMutations = useChannelMutations();
  const threadMutations = useThreadMutations();
  const moderationActions = useModerationActions();

  // --- Effects ---
  usePresenceBoot();

  useEffect(() => {
    if (!selectedChannelId && channels.length > 0) {
      updateRoute({ channelId: channels[0].id });
    }
  }, [channels, selectedChannelId]);

  useEffect(() => {
    if (selectedChannelId && !selectedThreadId && threads.length > 0) {
      updateRoute({ channelId: selectedChannelId, threadId: threads[0].id });
    }
  }, [threads, selectedChannelId, selectedThreadId]);

  useRealtime({
    channelId: selectedChannelId,
    threadId: threadIdForMessages, // Usar el ID correcto para realtime también
    onMessage: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", threadIdForMessages] });
    },
    onTyping: (userId, isTyping) => {
      if (!threadIdForMessages) return;
      if (isTyping) setTypingState(threadIdForMessages, userId, true);
      else clearTypingState(threadIdForMessages);
    },
  });

  // --- Handlers ---
  const updateRoute = ({ channelId, threadId }: { channelId?: string; threadId?: string }) => {
    // Usar window.location.search para obtener el estado más reciente de la URL
    const params = new URLSearchParams(window.location.search);
    
    // Manejar channelId: set si tiene valor, delete si es undefined
    if (channelId !== undefined) {
      params.set("channel", channelId);
    }
    
    // Manejar threadId: set si tiene valor, delete si es undefined explícito
    if (threadId !== undefined) {
      params.set("thread", threadId);
    } else {
      // Si threadId es undefined, eliminar el parámetro de la URL
      params.delete("thread");
    }
    
    navigate({ pathname: "/app", search: params.toString() }, { replace: true });
  };

  const handleSendMessage = async (content: string) => {
    // Validar que tenemos IDs válidos antes de enviar mensaje
    if (!selectedChannelId || selectedChannelId === "null" || !selectedThreadId || selectedThreadId === "null") {
      logger.warn("No se puede enviar mensaje sin canal/hilo válido", {
        component: "Dashboard",
        selectedChannelId,
        selectedThreadId
      });
      return;
    }

    const result = await messageActions.send.mutateAsync({ content });

    // Simulate moderation check
    const moderation = await moderationActions.moderate.mutateAsync({
      message_id: result.id,
      user_id: user?.id ?? "",
      channel_id: selectedChannelId,
      content,
    });
    if (!moderation.is_approved) {
      setModerationNotes((prev) => ({ ...prev, [result.id]: moderation.message }));
    }
  };

  const handleUpload = async (file: File) => {
    // Validar que tenemos IDs válidos antes de subir archivo
    if (!threadIdForMessages || threadIdForMessages === "null" || !selectedChannelId || selectedChannelId === "null") {
      logger.warn("No se puede subir archivo sin canal/hilo válido", {
        component: "Dashboard",
        selectedChannelId,
        selectedThreadId: threadIdForMessages
      });
      return;
    }

    const uploaded = await uploadFile({ file, thread_id: threadIdForMessages });
    await messageActions.send.mutateAsync({
      content: `Archivo compartido: ${uploaded.filename}`,
      type: "file",
      paths: [uploaded.id],
    });
    queryClient.invalidateQueries({ queryKey: ["files", threadIdForMessages] });
    logTelemetry({ type: "file", action: "upload", fileId: uploaded.id });
  };

  const handleCommand = async (command: string) => {
    const [cmd, ...rest] = command.split(" ");
    const payload = rest.join(" ").trim() || "Necesito información";
    let response: string | undefined;

    // Solo incluir bots configurados y funcionales
    const bots = {
      "/wiki": chatWikipedia,
      "/code": chatProgramming,
    };

    type BotKey = keyof typeof bots;

    if (cmd in bots) {
      try {
        const botFn = bots[cmd as BotKey];
        const data = await botFn(payload);
        // Capitalize first letter for response prefix (e.g. "Wikipedia: ...")
        const prefix = cmd.slice(1).charAt(0).toUpperCase() + cmd.slice(2);
        response = `${prefix}: ${data.message}`;
      } catch (error) {
        response = `Error: No se pudo procesar el comando ${cmd}`;
      }
    }

    if (response) {
      await handleSendMessage(response);
      logTelemetry({ type: "message", action: "send", threadId: threadIdForMessages ?? "bot" });
    }
  };

  const handleCreateChannel = async () => {
    const name = window.prompt("Nombre del canal");
    if (!name || !user) return;
    
    try {
      await channelMutations.create.mutateAsync({ 
        name, 
        owner_id: user.id, 
        channel_type: "public" 
      });
      logger.info("Canal creado exitosamente", { component: "Dashboard", channelName: name });
    } catch (error) {
      logger.error("Error al crear canal", { component: "Dashboard", error });
      alert(`Error al crear canal: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  const handleCreateThread = () => {
    const title = window.prompt("Título del hilo");
    if (!title || !selectedChannelId || !user) return;
    threadMutations.create.mutate({ 
      channel_id: selectedChannelId, 
      thread_name: title,
      user_id: user.id 
    });
  };

  // Paginación de canales
  const handleNextChannelPage = () => setChannelPage((p) => p + 1);
  const handlePrevChannelPage = () => setChannelPage((p) => Math.max(1, p - 1));
  const hasMoreChannels = channels.length === CHANNELS_PER_PAGE; // Si hay exactamente el límite, probablemente hay más

  return {
    user,
    channels,
    selectedChannelId,
    threads,
    selectedThread,
    selectedThreadId,
    messages,
    messagesQuery,
    typingState,
    moderationNotes,
    presenceStats,
    bannedUsers,
    sharedFilesQuery,
    messageActions,
    updateRoute,
    handleSendMessage,
    handleUpload,
    handleCommand,
    handleCreateChannel,
    handleCreateThread,
    presignDownload,
    // Paginación de canales
    channelPage,
    hasMoreChannels,
    handleNextChannelPage,
    handlePrevChannelPage,
  };
};



