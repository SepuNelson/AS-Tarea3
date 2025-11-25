/**
 * Logger centralizado para campus-chat
 * 
 * Este logger proporciona funciones de logging condicional
 * que solo se ejecutan en modo desarrollo.
 * En producción, los logs son suprimidos automáticamente.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  component?: string;
  action?: string;
  [key: string]: any;
}

const isDev = import.meta.env.DEV;

/**
 * Logger principal - solo ejecuta en desarrollo
 */
class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log informativo - para eventos normales
   */
  info(message: string, context?: LogContext): void {
    if (!isDev) return;
    console.info(this.formatMessage("info", message, context));
  }

  /**
   * Log de warning - para situaciones no ideales pero no críticas
   */
  warn(message: string, context?: LogContext): void {
    if (!isDev) return;
    console.warn(this.formatMessage("warn", message, context));
  }

  /**
   * Log de error - para errores que deben ser visibles
   * NOTA: Los errores críticos se logean incluso en producción
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      errorMessage: error?.message,
      errorStack: isDev ? error?.stack : undefined,
    };
    console.error(this.formatMessage("error", message, errorContext));
  }

  /**
   * Log de debug - para debugging detallado
   */
  debug(message: string, data?: any): void {
    if (!isDev) return;
    console.debug(this.formatMessage("debug", message), data);
  }

  /**
   * Log de grupo - para agrupar logs relacionados
   */
  group(label: string, fn: () => void): void {
    if (!isDev) return;
    console.group(label);
    fn();
    console.groupEnd();
  }
}

export const logger = new Logger();

/**
 * Helpers específicos para diferentes áreas de la app
 */

export const apiLogger = {
  request: (method: string, url: string, data?: any) => {
    logger.debug(`API Request: ${method} ${url}`, data);
  },
  response: (method: string, url: string, status: number) => {
    logger.debug(`API Response: ${method} ${url} - ${status}`);
  },
  error: (method: string, url: string, error: Error) => {
    logger.error(`API Error: ${method} ${url}`, error);
  },
};

export const realtimeLogger = {
  connect: (url: string) => {
    logger.info("WebSocket conectado", { url });
  },
  disconnect: (reason: string) => {
    logger.warn("WebSocket desconectado", { reason });
  },
  error: (error: Error) => {
    logger.warn("WebSocket error (no crítico)", { error: error.message });
  },
  message: (event: string, data?: any) => {
    logger.debug(`WebSocket event: ${event}`, data);
  },
};

export const componentLogger = {
  mount: (component: string) => {
    logger.debug(`Component mounted: ${component}`);
  },
  unmount: (component: string) => {
    logger.debug(`Component unmounted: ${component}`);
  },
  render: (component: string, props?: any) => {
    logger.debug(`Component render: ${component}`, props);
  },
};

