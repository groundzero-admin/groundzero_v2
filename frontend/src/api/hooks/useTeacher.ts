import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Cohort, Session, SessionActivity, LivePulseEvent, StudentScore, StudentActivityScores } from "@/api/types";
import type { Student } from "@/api/types";
import type { SessionViewOut } from "@/api/types/admin";

export function useCohorts() {
  return useQuery<Cohort[]>({
    queryKey: ["teacher-cohorts"],
    queryFn: async () => (await api.get("/teacher/my-cohorts")).data,
    staleTime: 60_000,
  });
}

export interface UpcomingSession {
  id: string;
  title: string | null;
  description: string | null;
  order: number | null;
  session_number: number;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  activity_count: number;
  total_questions: number;
  is_done: boolean;
}

export function useUpcomingSessions(cohortId: string | null | undefined) {
  return useQuery<UpcomingSession[]>({
    queryKey: ["upcoming-sessions", cohortId],
    queryFn: async () =>
      (await api.get(`/teacher/cohorts/${cohortId}/upcoming-sessions`)).data,
    enabled: !!cohortId,
    staleTime: 30_000,
  });
}

export function useCohortStudents(cohortId: string | null | undefined) {
  return useQuery<Student[]>({
    queryKey: ["cohort-students", cohortId],
    queryFn: async () =>
      (await api.get(`/teacher/cohorts/${cohortId}/students`)).data,
    enabled: !!cohortId,
    staleTime: 30_000,
  });
}

export function useLivePulse(cohortId: string | null | undefined, sessionId?: string | null) {
  return useQuery<LivePulseEvent[]>({
    queryKey: ["live-pulse", cohortId, sessionId],
    queryFn: async () =>
      (await api.get(`/teacher/cohorts/${cohortId}/live-pulse`, {
        params: sessionId ? { session_id: sessionId } : undefined,
      })).data,
    enabled: !!cohortId,
    refetchInterval: 5_000,
  });
}

export function useSessionScores(cohortId: string | null | undefined, sessionId?: string | null) {
  return useQuery<StudentScore[]>({
    queryKey: ["session-scores", cohortId, sessionId],
    queryFn: async () =>
      (await api.get(`/teacher/cohorts/${cohortId}/session-scores`, {
        params: { session_id: sessionId },
      })).data,
    enabled: !!cohortId && !!sessionId,
    refetchInterval: 5_000,
  });
}

export function useSessionActivityScores(cohortId: string | null | undefined, sessionId?: string | null) {
  return useQuery<StudentActivityScores[]>({
    queryKey: ["session-activity-scores", cohortId, sessionId],
    queryFn: async () =>
      (await api.get(`/teacher/cohorts/${cohortId}/session-activity-scores`, {
        params: { session_id: sessionId },
      })).data,
    enabled: !!cohortId && !!sessionId,
    refetchInterval: 5_000,
  });
}

export function useSessionActivities(sessionId: string | null | undefined) {
  return useQuery<SessionActivity[]>({
    queryKey: ["session-activities", sessionId],
    queryFn: async () =>
      (await api.get(`/sessions/${sessionId}/activities`)).data,
    enabled: !!sessionId,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
}

export function useTeacherSessionView(cohortId: string | undefined, sessionId: string | undefined) {
  return useQuery<SessionViewOut>({
    queryKey: ["teacher-session-view", cohortId, sessionId],
    queryFn: () =>
      api.get(`/teacher/cohorts/${cohortId}/sessions/${sessionId}/view`).then((r) => r.data),
    enabled: !!cohortId && !!sessionId,
  });
}

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      cohort_id: string;
      session_id?: string;
      teacher_id?: string;
    }) => {
      const { data } = await api.post<Session>("/sessions", params);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active-session"] });
      qc.invalidateQueries({ queryKey: ["cohort-sessions"] });
      qc.invalidateQueries({ queryKey: ["upcoming-sessions"] });
      qc.invalidateQueries({ queryKey: ["cohorts"] });
    },
  });
}

export function useLaunchActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { sessionId: string; activityId: string }) => {
      const { data } = await api.put<Session>(
        `/sessions/${params.sessionId}/launch-activity`,
        { activity_id: params.activityId },
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active-session"] });
      qc.invalidateQueries({ queryKey: ["session-activities"] });
      qc.invalidateQueries({ queryKey: ["teacher-session-view"] });
    },
  });
}

export interface ClassSummary {
  students: {
    student_id: string;
    student_name: string;
    grade: number;
    competencies: Record<string, {
      p_learned: number;
      stage: number;
      is_stuck: boolean;
      total_evidence: number;
      consecutive_failures: number;
    }>;
    overall: number;
    total_evidence: number;
    last_active: string | null;
  }[];
  interventions: {
    student_id: string;
    student_name: string;
    alert_type: "stuck" | "inactive" | "declining";
    detail: string;
    competency_id: string | null;
    competency_name: string | null;
    severity: number;
  }[];
  competency_ids: string[];
  competency_names: Record<string, string>;
}

export function useClassSummary(cohortId: string | null | undefined) {
  return useQuery<ClassSummary>({
    queryKey: ["class-summary", cohortId],
    queryFn: async () =>
      (await api.get(`/teacher/cohorts/${cohortId}/class-summary`)).data,
    enabled: !!cohortId,
    staleTime: 30_000,
  });
}

export function useEndSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.post<Session>(`/sessions/${sessionId}/end`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active-session"] });
      qc.invalidateQueries({ queryKey: ["cohort-sessions"] });
      qc.invalidateQueries({ queryKey: ["upcoming-sessions"] });
      qc.invalidateQueries({ queryKey: ["cohorts"] });
    },
  });
}

export function useRestartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.post<Session>(`/sessions/${sessionId}/restart`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active-session"] });
      qc.invalidateQueries({ queryKey: ["cohort-sessions"] });
      qc.invalidateQueries({ queryKey: ["upcoming-sessions"] });
    },
  });
}

export function useMarkSessionDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.post<Session>(`/sessions/${sessionId}/mark-done`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active-session"] });
      qc.invalidateQueries({ queryKey: ["cohort-sessions"] });
      qc.invalidateQueries({ queryKey: ["upcoming-sessions"] });
      qc.invalidateQueries({ queryKey: ["cohorts"] });
    },
  });
}

export function usePauseActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.put<Session>(`/sessions/${sessionId}/pause-activity`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active-session"] });
      qc.invalidateQueries({ queryKey: ["session-activities"] });
      qc.invalidateQueries({ queryKey: ["teacher-session-view"] });
    },
  });
}

