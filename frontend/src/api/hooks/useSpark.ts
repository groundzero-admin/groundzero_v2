import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type {
  SparkConversationCreate,
  SparkStartResponse,
  SparkTurnResponse,
  SparkHintRequest,
  SparkHintResponse,
  SparkEndResponse,
} from "@/api/types";

export function useSparkStart() {
  return useMutation<SparkStartResponse, Error, SparkConversationCreate>({
    mutationFn: async (data) =>
      (await api.post("/spark/conversations", data)).data,
  });
}

export function useSparkTurn(conversationId: string | null) {
  return useMutation<SparkTurnResponse, Error, string>({
    mutationFn: async (content) =>
      (
        await api.post(`/spark/conversations/${conversationId}/turn`, {
          content,
        })
      ).data,
  });
}

export function useSparkEnd(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<SparkEndResponse, Error, void>({
    mutationFn: async () =>
      (await api.post(`/spark/conversations/${conversationId}/end`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-state"] });
    },
  });
}

export function useSparkHint() {
  return useMutation<SparkHintResponse, Error, SparkHintRequest>({
    mutationFn: async (data) => (await api.post("/spark/hint", data)).data,
  });
}
