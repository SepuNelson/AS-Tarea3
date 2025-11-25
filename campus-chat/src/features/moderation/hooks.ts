import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBannedUsers,
  getModerationStatus,
  getUserViolations,
  moderateMessage,
  resetUserStrikes,
  unbanUser,
} from "./api";

export const useModerationStatus = (userId?: string, channelId?: string) =>
  useQuery({
    queryKey: ["moderation", "status", userId, channelId],
    queryFn: () => (userId && channelId ? getModerationStatus(userId, channelId) : null),
    enabled: Boolean(userId && channelId),
  });

export const useBannedUsers = (channelId?: string) =>
  useQuery({
    queryKey: ["moderation", "banned", channelId],
    queryFn: () => getBannedUsers(channelId),
  });

export const useUserViolations = (userId?: string, channelId?: string) =>
  useQuery({
    queryKey: ["moderation", "violations", userId, channelId],
    queryFn: () => (userId && channelId ? getUserViolations(userId, channelId) : null),
    enabled: Boolean(userId && channelId),
  });

export const useModerationActions = () => {
  const qc = useQueryClient();
  return {
    moderate: useMutation({ mutationFn: moderateMessage }),
    resetStrikes: useMutation({
      mutationFn: ({ userId, channelId }: { userId: string; channelId: string }) =>
        resetUserStrikes(userId, channelId),
      onSuccess: (_, { userId, channelId }) => {
        qc.invalidateQueries({ queryKey: ["moderation", "status", userId, channelId] });
        qc.invalidateQueries({ queryKey: ["moderation", "violations", userId, channelId] });
      },
    }),
    unban: useMutation({
      mutationFn: ({ userId, channelId, reason }: { userId: string; channelId: string; reason?: string }) =>
        unbanUser(userId, channelId, reason),
      onSuccess: (_, { userId, channelId }) => {
        qc.invalidateQueries({ queryKey: ["moderation", "status", userId, channelId] });
        qc.invalidateQueries({ queryKey: ["moderation", "banned", channelId] });
      },
    }),
  };
};




