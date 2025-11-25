import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPresenceStats, registerPresence, sendHeartbeat } from "./api";
import { useAuthStore } from "@/store/authStore";

export const usePresenceBoot = () => {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) return;
    
    // Registrar presencia inicial, fallos silenciosos para no contaminar consola
    registerPresence({ userId: user.id, device: "web" }).catch(() => {
      // Presencia es nice-to-have, no crítico para funcionalidad principal
    });

    const interval = setInterval(() => {
      sendHeartbeat(user.id).catch(() => {
        // Heartbeat silencioso, el servicio puede estar sobrecargado
      });
    }, 30_000);

    return () => clearInterval(interval);
  }, [user]);
};

export const usePresenceStats = () =>
  useQuery({
    queryKey: ["presence", "stats"],
    queryFn: getPresenceStats,
    refetchInterval: 60_000,
  });




