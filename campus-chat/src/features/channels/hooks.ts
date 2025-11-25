import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMemberToChannel,
  createChannel,
  deactivateChannel,
  listChannelMembers,
  listChannels,
  reactivateChannel,
  removeMemberFromChannel,
  updateChannel,
} from "./api";

export const useChannels = (page = 1, pageSize = 10) =>
  useQuery({
    queryKey: ["channels", page, pageSize],
    queryFn: () => listChannels(page, pageSize),
  });

export const useChannelMembers = (channelId?: string) =>
  useQuery({
    queryKey: ["channels", channelId, "members"],
    queryFn: () => (channelId ? listChannelMembers(channelId) : []),
    // Solo habilitar si existe channelId y no es null/undefined
    enabled: Boolean(channelId) && channelId !== "null" && channelId !== "undefined",
  });

export const useChannelMutations = () => {
  const qc = useQueryClient();

  const invalidateAndRefetch = async () => {
    // Invalidar y forzar refetch inmediato
    await qc.invalidateQueries({ queryKey: ["channels"] });
    await qc.refetchQueries({ queryKey: ["channels"] });
  };

  const invalidateMembers = (channelId: string) => {
    qc.invalidateQueries({ queryKey: ["channels", channelId, "members"] });
  };

  return {
    create: useMutation({
      mutationFn: createChannel,
      onSuccess: async () => {
        await invalidateAndRefetch();
      },
    }),
    update: useMutation({
      mutationFn: ({ channelId, payload }: { channelId: string; payload: Parameters<typeof updateChannel>[1] }) => {
        if (!channelId || channelId === "null" || channelId === "undefined") {
          throw new Error("channelId missing or invalid");
        }
        return updateChannel(channelId, payload);
      },
      onSuccess: invalidateAndRefetch,
    }),
    deactivate: useMutation({
      mutationFn: (channelId: string) => {
        if (!channelId || channelId === "null" || channelId === "undefined") {
          throw new Error("channelId missing or invalid");
        }
        return deactivateChannel(channelId);
      },
      onSuccess: invalidateAndRefetch,
    }),
    reactivate: useMutation({
      mutationFn: (channelId: string) => {
        if (!channelId || channelId === "null" || channelId === "undefined") {
          throw new Error("channelId missing or invalid");
        }
        return reactivateChannel(channelId);
      },
      onSuccess: invalidateAndRefetch,
    }),
    addMember: useMutation({
      mutationFn: ({ channel_id, user_id }: { channel_id: string; user_id: string }) => {
        if (!channel_id || channel_id === "null" || channel_id === "undefined") {
          throw new Error("channel_id missing or invalid");
        }
        return addMemberToChannel(channel_id, user_id);
      },
      onSuccess: (_, variables) => invalidateMembers(variables.channel_id),
    }),
    removeMember: useMutation({
      mutationFn: ({ channel_id, user_id }: { channel_id: string; user_id: string }) => {
        if (!channel_id || channel_id === "null" || channel_id === "undefined") {
          throw new Error("channel_id missing or invalid");
        }
        return removeMemberFromChannel(channel_id, user_id);
      },
      onSuccess: (_, variables) => invalidateMembers(variables.channel_id),
    }),
  };
};




