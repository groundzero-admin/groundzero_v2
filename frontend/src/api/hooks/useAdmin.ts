/** React Query hooks for admin CRUD operations. */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type {
    Template,
    Cohort,
    CohortWithSessions,
    CohortSession,
    QuestionTemplate,
    ActivityQuestion,
} from "@/api/types/admin";

// ──────────────── Template hooks ────────────────

export function useTemplates() {
    return useQuery<Template[]>({
        queryKey: ["templates"],
        queryFn: () => api.get("/templates").then((r) => r.data),
    });
}

export function useTemplate(id: string | undefined) {
    return useQuery<Template>({
        queryKey: ["templates", id],
        queryFn: () => api.get(`/templates/${id}`).then((r) => r.data),
        enabled: !!id,
    });
}

export function useCreateTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { title: string; description?: string; order?: number; activities?: string[] }) =>
            api.post<Template>("/templates", data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
    });
}

export function useUpdateTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string; order?: number; activities?: string[] }) =>
            api.put<Template>(`/templates/${id}`, data).then((r) => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ["templates"] });
            qc.invalidateQueries({ queryKey: ["templates", vars.id] });
            qc.invalidateQueries({ queryKey: ["cohorts"] });  // sync template changes to sessions
        },
    });
}

export function useDeleteTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/templates/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
    });
}

// ──────────────── Cohort hooks ────────────────

export function useCohorts() {
    return useQuery<Cohort[]>({
        queryKey: ["cohorts"],
        queryFn: () => api.get("/cohorts").then((r) => r.data),
    });
}

export function useCohort(id: string | undefined) {
    return useQuery<CohortWithSessions>({
        queryKey: ["cohorts", id],
        queryFn: () => api.get(`/cohorts/${id}`).then((r) => r.data),
        enabled: !!id,
    });
}

export function useCreateCohort() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; description?: string; grade_band?: string; board?: string }) =>
            api.post<Cohort>("/cohorts", data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["cohorts"] }),
    });
}

export function useUpdateCohort() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; grade_band?: string; board?: string }) =>
            api.put<Cohort>(`/cohorts/${id}`, data).then((r) => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ["cohorts"] });
            qc.invalidateQueries({ queryKey: ["cohorts", vars.id] });
        },
    });
}

export function useDeleteCohort() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/cohorts/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["cohorts"] }),
    });
}

export interface ImportTemplateItem {
    template_id: string;
    scheduled_at?: string;
    teacher_id?: string;
}

export function useImportTemplates() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ cohortId, items }: { cohortId: string; items: ImportTemplateItem[] }) =>
            api
                .post<CohortSession[]>(`/cohorts/${cohortId}/import-templates`, items)
                .then((r) => r.data),
        onSuccess: (_data, vars) =>
            qc.invalidateQueries({ queryKey: ["cohorts", vars.cohortId] }),
    });
}

export function useUpdateCohortSession() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            cohortId,
            sessionId,
            ...data
        }: {
            cohortId: string;
            sessionId: string;
            title?: string;
            description?: string;
            order?: number;
            scheduled_at?: string;
            teacher_id?: string;
        }) =>
            api
                .put<CohortSession>(`/cohorts/${cohortId}/sessions/${sessionId}`, data)
                .then((r) => r.data),
        onSuccess: (_data, vars) =>
            qc.invalidateQueries({ queryKey: ["cohorts", vars.cohortId] }),
    });
}

// Keep old name as alias
export const useLiveBatches = useCohorts;

// ──────────────── Question Template hooks ────────────────

export function useQuestionTemplates() {
    return useQuery<QuestionTemplate[]>({
        queryKey: ["question-templates"],
        queryFn: () => api.get("/admin/question-templates").then((r) => r.data),
    });
}

export function useQuestionTemplate(id: string | undefined) {
    return useQuery<QuestionTemplate>({
        queryKey: ["question-templates", id],
        queryFn: () => api.get(`/admin/question-templates/${id}`).then((r) => r.data),
        enabled: !!id,
    });
}

export function useUpdateQuestionTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string } & Partial<QuestionTemplate>) =>
            api.put<QuestionTemplate>(`/admin/question-templates/${id}`, data).then((r) => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ["question-templates"] });
            qc.invalidateQueries({ queryKey: ["question-templates", vars.id] });
        },
    });
}

export function useGenerateQuestion() {
    return useMutation({
        mutationFn: ({ templateId, description, gradeBand }: { templateId: string; description: string; gradeBand: string }) =>
            api.post<{ data: Record<string, unknown> }>(`/admin/question-templates/${templateId}/generate`, {
                description,
                grade_band: gradeBand,
            }).then((r) => r.data.data),
    });
}

// ──────────────── Activity hooks ────────────────

export function useActivities(moduleId?: string) {
    const params = moduleId ? `?module_id=${moduleId}` : "";
    return useQuery({
        queryKey: ["activities", moduleId ?? "all"],
        queryFn: () => api.get(`/activities${params}`).then((r) => r.data),
    });
}

export function useCreateActivity() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => api.post("/activities", data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
    });
}

export function useUpdateActivity() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
            api.put(`/activities/${id}`, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
    });
}

export function useDeleteActivity() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/activities/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
    });
}

export function useLinkActivityQuestion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ activityId, questionId }: { activityId: string; questionId: string }) =>
            api.post(`/activities/${activityId}/questions/${questionId}`).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
    });
}

export function useUnlinkActivityQuestion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ activityId, questionId }: { activityId: string; questionId: string }) =>
            api.delete(`/activities/${activityId}/questions/${questionId}`).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
    });
}

// ──────────────── Activity Question hooks ────────────────

export function useActivityQuestions(templateId?: string) {
    const params = templateId ? `?template_id=${templateId}` : "";
    return useQuery<ActivityQuestion[]>({
        queryKey: ["activity-questions", templateId ?? "all"],
        queryFn: () => api.get(`/admin/activity-questions${params}`).then((r) => r.data),
    });
}

export function useCreateActivityQuestion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { template_id: string; title: string; data: Record<string, unknown>; grade_band?: string; competency_id: string; difficulty?: number; is_published?: boolean }) =>
            api.post<ActivityQuestion>("/admin/activity-questions", data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["activity-questions"] }),
    });
}

export function useUpdateActivityQuestion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; title?: string; data?: Record<string, unknown>; grade_band?: string; competency_id?: string; difficulty?: number; is_published?: boolean }) =>
            api.put<ActivityQuestion>(`/admin/activity-questions/${id}`, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["activity-questions"] }),
    });
}

export function useDeleteActivityQuestion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/admin/activity-questions/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["activity-questions"] }),
    });
}
