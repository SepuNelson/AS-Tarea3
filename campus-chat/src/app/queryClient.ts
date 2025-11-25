import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      // Retry logic para queries
      retry: (failureCount, error: any) => {
        // No reintentar errores de cliente (4xx excepto 408)
        if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 408) {
          return false;
        }
        // Reintentar errores de servidor (5xx) hasta 3 veces
        if (error?.response?.status >= 500) {
          return failureCount < 3;
        }
        // Reintentar errores de red hasta 2 veces
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => {
        // Backoff exponencial: 1s, 2s, 4s
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
    },
    mutations: {
      // Retry logic para mutations
      retry: (failureCount, error: any) => {
        // Solo reintentar errores 503 (servicio no disponible) y 429 (rate limit)
        if (error?.response?.status === 503 || error?.response?.status === 429) {
          return failureCount < 2;
        }
        // No reintentar otros errores en mutations (pueden causar duplicados)
        return false;
      },
      retryDelay: (attemptIndex) => {
        // Para 503/429, usar backoff más agresivo: 2s, 4s
        return Math.min(2000 * 2 ** attemptIndex, 10000);
      },
    },
  },
});




