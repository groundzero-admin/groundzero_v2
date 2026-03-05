import { api } from "@/api/client";

export const benchmarkApi = {
  createSession: (data: {
    character: string;
    voice_provider: string;
  }) => api.post("/benchmark/sessions", data),

  getSession: (id: string) => api.get(`/benchmark/sessions/${id}`),

  endSession: (session_id: string) =>
    api.post("/benchmark/conversation/end", { session_id }),

  getResult: (sessionId: string) =>
    api.get(`/benchmark/results/${sessionId}`, { validateStatus: (s: number) => s !== 401 && s < 600 }),

  listResults: (params?: { limit?: number; offset?: number; search?: string }) =>
    api.get("/benchmark/results", { params }),

  startRealtime: (data: { character: string }) =>
    api.post("/benchmark/conversation/start-realtime", data),

  saveTranscript: (data: {
    session_id: string;
    transcript: { speaker: string; text: string }[];
  }) => api.post("/benchmark/conversation/save-transcript", data),
};
