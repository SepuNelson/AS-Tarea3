import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import type { Message } from "@/types";
import { buildRealtimeURL } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { realtimeLogger } from "@/lib/logger";

interface UseRealtimeOptions {
  channelId?: string;
  threadId?: string;
  onMessage?: (message: Message) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
  onPresence?: (payload: { userId: string; status: "online" | "offline" }) => void;
}

export const useRealtime = ({ channelId, threadId, onMessage, onTyping, onPresence }: UseRealtimeOptions) => {
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!channelId) return;
    
    // Deshabilitar WebSocket temporalmente si el servicio no está disponible
    const WEBSOCKET_ENABLED = false; // Cambiar a true cuando haya servidor Socket.IO
    if (!WEBSOCKET_ENABLED) return;
    
    let socket: Socket | undefined;

    try {
      // En entorno de mock/dev, podemos deshabilitar el intento de conexión real si sabemos que fallará,
      // o manejar el error silenciosamente.
      const isMockEnv = import.meta.env.VITE_API_URL?.includes("localhost") || import.meta.env.VITE_API_URL?.includes("127.0.0.1");
      
      socket = io(buildRealtimeURL(), {
        auth: { token },
        query: { channelId, threadId },
        transports: ["websocket"],
        reconnection: !isMockEnv, // No reconectar infinitamente en local mock
        reconnectionAttempts: isMockEnv ? 0 : Infinity 
      });
      
      socket.on("connect_error", (err) => {
          if (!isMockEnv) {
              // Solo logear en producción y de forma más limpia
              realtimeLogger.error(err);
          }
          // En mock env, error silencioso - es esperado
      });

      socket.on("connect", () => {
        realtimeLogger.connect(buildRealtimeURL());
      });

      socket.on("disconnect", (reason) => {
        realtimeLogger.disconnect(reason);
      });

    } catch (error) {
      // Inicialización fallida es generalmente no crítico, la app funciona sin realtime
      realtimeLogger.error(error as Error);
      return;
    }

    socket.on("message:new", (payload: Message) => {
      onMessage?.(payload);
    });

    socket.on("message:typing", ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      onTyping?.(userId, isTyping);
    });

    socket.on("presence:update", (payload: { userId: string; status: "online" | "offline" }) => {
      onPresence?.(payload);
    });

    return () => {
      socket?.disconnect();
    };
  }, [channelId, threadId, token, onMessage, onTyping, onPresence]);
};


