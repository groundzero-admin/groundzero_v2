import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { CurriculumTopic, TopicDetail } from "@/api/types";

export function useTopics(opts?: {
  board?: string;
  subject?: string;
  grade?: number;
}) {
  return useQuery<CurriculumTopic[]>({
    queryKey: ["topics", opts?.board, opts?.subject, opts?.grade],
    queryFn: async () =>
      (await api.get("/topics", { params: opts })).data,
    enabled: !!opts?.board,
    staleTime: Infinity,
  });
}

export function useTopic(topicId: string | null | undefined) {
  return useQuery<TopicDetail>({
    queryKey: ["topic", topicId],
    queryFn: async () =>
      (await api.get(`/topics/${topicId}`)).data,
    enabled: !!topicId,
    staleTime: Infinity,
  });
}
