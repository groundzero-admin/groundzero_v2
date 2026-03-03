import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Activity } from "@/api/types";

export function useActivities(opts?: {
  module_id?: string;
  week?: number;
  session_number?: number;
  type?: string;
}) {
  return useQuery<Activity[]>({
    queryKey: ["activities", opts?.module_id, opts?.week, opts?.session_number, opts?.type],
    queryFn: async () =>
      (await api.get("/activities", { params: opts })).data,
    staleTime: Infinity,
  });
}

export function useActivity(activityId: string | null | undefined) {
  return useQuery<Activity>({
    queryKey: ["activity", activityId],
    queryFn: async () =>
      (await api.get(`/activities/${activityId}`)).data,
    enabled: !!activityId,
    staleTime: Infinity,
  });
}
