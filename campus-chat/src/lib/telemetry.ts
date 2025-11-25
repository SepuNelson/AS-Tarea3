import { logger } from "./logger";

type TelemetryEvent =
  | { type: "auth"; action: "login" | "logout" | "register" }
  | { type: "message"; action: "send" | "edit" | "delete"; threadId: string }
  | { type: "file"; action: "upload" | "download"; fileId: string }
  | { type: "moderation"; action: string; payload?: unknown }
  | { type: "search"; action: "query"; query: string };

export const logTelemetry = (event: TelemetryEvent) => {
  logger.info("Telemetry event", { event });
  // Hook for future integration (e.g., OpenTelemetry exporter)
};




