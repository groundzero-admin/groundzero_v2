/** React Query hooks for admin CRUD operations. */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type {
    Template,
    Cohort,
    CohortWithSessions,
    CohortSession,
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

export function useImportTemplates() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ cohortId, templateIds }: { cohortId: string; templateIds: string[] }) =>
            api
                .post<CohortSession[]>(`/cohorts/${cohortId}/import-templates`, templateIds)
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
