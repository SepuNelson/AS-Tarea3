import { apiClient } from "@/lib/apiClient";
import type { FileResource } from "@/types";

/**
 * Subir un archivo
 * POST /v1/files
 * - message_id y thread_id van como query params (no form data)
 */
export const uploadFile = async (payload: {
  file: File;
  message_id?: string;
  thread_id?: string;
}) => {
  const formData = new FormData();
  formData.append("upload", payload.file);

  // Los parámetros van como query params según la especificación
  const params: Record<string, string> = {};
  if (payload.message_id) params.message_id = payload.message_id;
  if (payload.thread_id) params.thread_id = payload.thread_id;

  const { data } = await apiClient.post<FileResource>("/v1/files", formData, {
    params,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

/**
 * Listar archivos
 * GET /v1/files
 */
export const listFiles = async (params: { thread_id?: string; message_id?: string }) => {
  const { data } = await apiClient.get<FileResource[]>("/v1/files", { params });
  return data;
};

/**
 * Obtener información de un archivo
 * GET /v1/files/{file_id}
 */
export const getFile = async (fileId: string) => {
  const { data } = await apiClient.get<FileResource>(`/v1/files/${fileId}`);
  return data;
};

/**
 * Eliminar un archivo
 * DELETE /v1/files/{file_id}
 */
export const deleteFile = async (fileId: string): Promise<void> => {
  await apiClient.delete(`/v1/files/${fileId}`);
};

/**
 * Obtener URL pre-firmada para descargar un archivo
 * POST /v1/files/{file_id}/presign-download
 */
export const presignDownload = async (fileId: string) => {
  const { data } = await apiClient.post<{ url: string }>(`/v1/files/${fileId}/presign-download`);
  return data;
};




