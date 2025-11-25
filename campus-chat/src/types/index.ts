export type ChannelType = "public" | "private";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
}

export interface Channel {
  id: string;
  name: string;
  owner_id: string;
  channel_type: ChannelType;
  is_active: boolean;
  user_count: number;
  created_at: number;
  users: ChannelMember[];
}

export interface ChannelMember {
  id: string;
  joined_at: number | string;
}

export interface Thread {
  id: string;
  uuid?: string; // Agregado para compatibilidad con Message Service
  channel_id: string;
  title: string;
  created_by: string;
  status: string;
  created_at: string;
  updated_at: string;
  meta: Record<string, unknown>;
}

export type MessageType = "text" | "audio" | "file";

export interface Message {
  id: string;
  thread_id: string;
  user_id: string;
  content: string | null;
  type: MessageType | null;
  paths: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  files: FileResource[];
  metadata: Record<string, unknown>;
  is_system: boolean;
}

export interface FileResource {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  bucket: string;
  object_key: string;
  message_id: string | null;
  thread_id: string | null;
  checksum_sha256: string;
  created_at: string;
  deleted_at: string | null;
}

export type DeviceType = "web" | "mobile" | "desktop" | "unknown";

export interface PresenceRecord {
  userId: string;
  status: "online" | "offline";
  lastSeen?: string;
  device?: DeviceType;
  ip?: string | null;
}

export interface PresenceStats {
  online: number;
  offline: number;
  total: number;
}

export interface ModerationStatus {
  user_id: string;
  channel_id: string;
  strike_count: number;
  is_banned: boolean;
  ban_type: "temporary" | "permanent" | null;
  ban_expires_at: string | null;
  last_violation: string | null;
}

export interface ModerationViolation {
  id: string;
  message_id: string;
  severity: string;
  action_taken: string;
  strike_count_at_time: number;
  timestamp: string;
}

export interface SearchResult<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface ChatbotMessage {
  message: string;
  source?: string;
}

// ========== MODERACIÓN DE THREADS ==========

export interface ThreadHide {
  hidden_by: string;
}

export interface ThreadReport {
  reason: string;
  reported_by: string;
}
