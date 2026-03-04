import { api } from "@/api/client";

export const benchmarkApi = {
  createSession: (data: {
    student_name: string;
    student_age: number;
    student_grade: string;
    character: string;
    voice_provider: string;
  }) => api.post("/benchmark/sessions", data),

  getSession: (id: string) => api.get(`/benchmark/sessions/${id}`),

  endSession: (session_id: string) =>
    api.post("/benchmark/conversation/end", { session_id }),

  getResult: (sessionId: string) =>
    api.get(`/benchmark/results/${sessionId}`, { validateStatus: (s: number) => s < 600 }),

  listResults: (params?: { limit?: number; offset?: number; search?: string }) =>
    api.get("/benchmark/results", { params }),
};
