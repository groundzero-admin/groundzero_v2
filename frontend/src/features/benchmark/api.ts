import { api } from "@/api/client";

export interface BenchmarkQuestion {
  id: string;
  question_number: number;
  text: string;
  curriculum_anchor: string | null;
  pillars: string[];
}

export interface BenchmarkSessionResponse {
  id: string;
  student_id: string;
  student_name: string | null;
  student_grade: number | null;
  character: string;
  status: string;
  started_at: string;
  total_turns: number;
  total_questions: number;
}

const benchmarkApi = {
  createSession: (data: { character: string }) =>
    api.post("/benchmark/sessions", data),

  getSession: (sessionId: string) =>
    api.get(`/benchmark/sessions/${sessionId}`),

  listSessions: () => api.get("/benchmark/sessions"),

  getQuestions: () =>
    api.get<BenchmarkQuestion[]>("/benchmark/questions"),

  submitAnswer: (data: {
    session_id: string;
    question_id: string;
    question_number: number;
    answer_text: string;
  }) => api.post("/benchmark/answers", data),

  getAnswers: (sessionId: string) =>
    api.get(`/benchmark/answers/${sessionId}`),

  completeSession: (sessionId: string) =>
    api.post("/benchmark/complete", { session_id: sessionId }),

  getResult: (sessionId: string) =>
    api.get(`/benchmark/results/${sessionId}`),

  listResults: () => api.get("/benchmark/results"),

  seedQuestions: () => api.post("/benchmark/questions/seed"),

  tts: (text: string, character: string) => {
    const formData = new FormData();
    formData.append("text", text);
    formData.append("character", character);
    return api.post("/benchmark/voice/tts", formData, {
      responseType: "arraybuffer",
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  stt: (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");
    return api.post<{ transcript: string }>("/benchmark/voice/stt", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getVoiceProvider: () =>
    api.get<{ provider: string }>("/benchmark/voice/provider"),
};

export default benchmarkApi;
