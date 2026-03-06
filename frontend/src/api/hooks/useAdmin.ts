/** React Query hooks for admin CRUD operations. */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type {
    TemplateCohort,
    TemplateCohortWithSessions,
    LiveBatch,
    LiveBatchWithSessions,
    LiveBatchSession,
    TemplateSession,
} from "@/api/types/admin";

// ──────────────── Template Cohort hooks ────────────────

export function useTemplateCohorts() {
    return useQuery<TemplateCohort[]>({
        queryKey: ["template-cohorts"],
        queryFn: () => api.get("/template-cohorts").then((r) => r.data),
    });
}

export function useTemplateCohort(id: string | undefined) {
    return useQuery<TemplateCohortWithSessions>({
        queryKey: ["template-cohorts", id],
        queryFn: () => api.get(`/template-cohorts/${id}`).then((r) => r.data),
        enabled: !!id,
    });
}

export function useCreateTemplateCohort() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; level?: number; mode?: string; description?: string }) =>
            api.post<TemplateCohort>("/template-cohorts", data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["template-cohorts"] }),
    });
}

export function useUpdateTemplateCohort() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; name?: string; level?: number; mode?: string; description?: string }) =>
            api.put<TemplateCohort>(`/template-cohorts/${id}`, data).then((r) => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ["template-cohorts"] });
            qc.invalidateQueries({ queryKey: ["template-cohorts", vars.id] });
        },
    });
}

export function useDeleteTemplateCohort() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/template-cohorts/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["template-cohorts"] }),
    });
}

// ──────────────── Template Session hooks ────────────────

export function useCreateTemplateSession() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            cohortId,
            ...data
        }: {
            cohortId: string;
            title: string;
            description?: string;
            day: number;
            order: number;
        }) =>
            api
                .post<TemplateSession>(`/template-cohorts/${cohortId}/sessions`, data)
                .then((r) => r.data),
        onSuccess: (_data, vars) =>
            qc.invalidateQueries({ queryKey: ["template-cohorts", vars.cohortId] }),
    });
}

export function useUpdateTemplateSession() {
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
            day?: number;
            order?: number;
        }) =>
            api
                .put<TemplateSession>(`/template-cohorts/${cohortId}/sessions/${sessionId}`, data)
                .then((r) => r.data),
        onSuccess: (_data, vars) =>
            qc.invalidateQueries({ queryKey: ["template-cohorts", vars.cohortId] }),
    });
}

export function useDeleteTemplateSession() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ cohortId, sessionId }: { cohortId: string; sessionId: string }) =>
            api.delete(`/template-cohorts/${cohortId}/sessions/${sessionId}`),
        onSuccess: (_data, vars) =>
            qc.invalidateQueries({ queryKey: ["template-cohorts", vars.cohortId] }),
    });
}

// ──────────────── Live Batch hooks ────────────────

export function useLiveBatches() {
    return useQuery<LiveBatch[]>({
        queryKey: ["live-batches"],
        queryFn: () => api.get("/live-batches").then((r) => r.data),
    });
}

export function useLiveBatch(id: string | undefined) {
    return useQuery<LiveBatchWithSessions>({
        queryKey: ["live-batches", id],
        queryFn: () => api.get(`/live-batches/${id}`).then((r) => r.data),
        enabled: !!id,
    });
}

export function useCreateLiveBatch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; description?: string; start_date: string; daily_timing: string }) =>
            api.post<LiveBatch>("/live-batches", data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["live-batches"] }),
    });
}

export function useUpdateLiveBatch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; start_date?: string; daily_timing?: string }) =>
            api.put<LiveBatch>(`/live-batches/${id}`, data).then((r) => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ["live-batches"] });
            qc.invalidateQueries({ queryKey: ["live-batches", vars.id] });
        },
    });
}

export function useDeleteLiveBatch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/live-batches/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["live-batches"] }),
    });
}

export function useImportTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ batchId, templateCohortId }: { batchId: string; templateCohortId: string }) =>
            api
                .post<LiveBatchSession[]>(`/live-batches/${batchId}/import/${templateCohortId}`)
                .then((r) => r.data),
        onSuccess: (_data, vars) =>
            qc.invalidateQueries({ queryKey: ["live-batches", vars.batchId] }),
    });
}

export function useUpdateLiveBatchSession() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            batchId,
            sessionId,
            ...data
        }: {
            batchId: string;
            sessionId: string;
            title?: string;
            description?: string;
            day?: number;
            order?: number;
            daily_timing?: string;
        }) =>
            api
                .put<LiveBatchSession>(`/live-batches/${batchId}/sessions/${sessionId}`, data)
                .then((r) => r.data),
        onSuccess: (_data, vars) =>
            qc.invalidateQueries({ queryKey: ["live-batches", vars.batchId] }),
    });
}
