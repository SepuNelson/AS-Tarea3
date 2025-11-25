import { apiClient } from "@/lib/apiClient";
import type { ChatbotMessage } from "@/types";

// ============================================
// CHATBOTS CONFIGURADOS Y FUNCIONALES
// ============================================

/**
 * Chatbot de Wikipedia - FUNCIONAL ✅
 * Responde preguntas usando contenido de Wikipedia
 */
export const chatWikipedia = async (message: string) => {
  const { data } = await apiClient.post<ChatbotMessage>("/chat-wikipedia", { message });
  return data;
};

/**
 * Chatbot de Programación - FUNCIONAL ✅
 * Responde preguntas sobre programación y tecnología
 */
export const chatProgramming = async (message: string) => {
  const { data } = await apiClient.post<{ reply: string }>("/chat", { message });
  return { message: data.reply };
};

// ============================================
// CHATBOTS NO CONFIGURADOS - DESHABILITADOS
// ============================================
// Los siguientes chatbots NO están configurados en el API Gateway.
// Están deshabilitados para evitar errores en consola.
// Para habilitarlos:
// 1. Verificar que los servicios existan y estén desplegados
// 2. Agregar las rutas al archivo api-gateway/index.js
// 3. Agregar las URLs de los servicios a las variables de entorno
// 4. Descomentar las funciones a continuación

/**
 * Chatbot Académico - DESHABILITADO
 * Para habilitar, configurar el endpoint en API Gateway
 */
export const chatAcademic = async (message: string): Promise<ChatbotMessage> => {
  throw new Error("Chatbot académico no está disponible actualmente");
};

/**
 * Chatbot de Utilidades - DESHABILITADO
 * Para habilitar, configurar el endpoint en API Gateway
 */
export const chatUtility = async (message: string): Promise<ChatbotMessage> => {
  throw new Error("Chatbot de utilidades no está disponible actualmente");
};

/**
 * Chatbot Calculadora - DESHABILITADO
 * Para habilitar, configurar el endpoint en API Gateway
 */
export const chatCalc = async (message: string): Promise<ChatbotMessage> => {
  throw new Error("Chatbot calculadora no está disponible actualmente");
};




