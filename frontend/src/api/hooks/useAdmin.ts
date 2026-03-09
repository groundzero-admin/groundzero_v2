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
    Activity,
    Question,
    Pillar,
    Capability,
    Competency,
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


// ──────────────── Activity hooks ────────────────

export function useActivities(filters?: { module_id?: string; type?: string }) {
    return useQuery<Activity[]>({
        queryKey: ["activities", filters],
        queryFn: () => api.get("/activities", { params: filters }).then((r) => r.data),
    });
}

export function useActivity(id: string | undefined) {
    return useQuery<Activity>({
        queryKey: ["activities", id],
        queryFn: () => api.get(`/activities/${id}`).then((r) => r.data),
        enabled: !!id,
    });
}

export function useCreateActivity() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Activity> & { id: string; module_id: string; name: string; type: string }) =>
            api.post<Activity>("/activities", data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
    });
}

export function useUpdateActivity() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string } & Partial<Activity>) =>
            api.put<Activity>(`/activities/${id}`, data).then((r) => r.data),
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


// ──────────────── Question hooks ────────────────

export function useQuestions(filters?: { competency_id?: string; module_id?: string; grade_band?: string }) {
    return useQuery<Question[]>({
        queryKey: ["questions", filters],
        queryFn: () => api.get("/questions", { params: { ...filters, limit: 200 } }).then((r) => r.data),
    });
}

export function useCreateQuestion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<Question, "id">) =>
            api.post<Question>("/questions", data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
    });
}

export function useUpdateQuestion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string } & Partial<Question>) =>
            api.put<Question>(`/questions/${id}`, data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
    });
}

export function useDeleteQuestion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/questions/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
    });
}


// ──────────────── Competency hooks ────────────────

export function usePillars() {
    return useQuery<Pillar[]>({
        queryKey: ["pillars"],
        queryFn: () => api.get("/competencies/pillars").then((r) => r.data),
    });
}

export function useCreatePillar() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Pillar) =>
            api.post<Pillar>("/competencies/pillars", data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["pillars"] }),
    });
}

export function useCapabilities() {
    return useQuery<Capability[]>({
        queryKey: ["capabilities"],
        queryFn: () => api.get("/competencies/capabilities").then((r) => r.data),
    });
}

export function useCreateCapability() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Capability) =>
            api.post<Capability>("/competencies/capabilities", data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["capabilities"] }),
    });
}

export function useCompetencies() {
    return useQuery<Competency[]>({
        queryKey: ["competencies"],
        queryFn: () => api.get("/competencies").then((r) => r.data),
    });
}

export function useCreateCompetency() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { id: string; capability_id: string; name: string; description: string; assessment_method: string; default_params?: Record<string, number> }) =>
            api.post<Competency>("/competencies", data).then((r) => r.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["competencies"] }),
    });
}
