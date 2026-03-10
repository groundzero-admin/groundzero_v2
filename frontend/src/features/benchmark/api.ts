import { api } from "@/api/client";

export interface BenchmarkQuestion {
  id: string;
  grade_band: string;
  question_number: number;
  text: string;
  curriculum_anchor: string | null;
  pillars: string[];
  image_url: string | null;
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

const S3_AUDIO_BASE = "https://groundzero-static-ap.s3.ap-southeast-2.amazonaws.com/question-audio";

export function getQuestionAudioUrl(characterId: string, gradeBand: string, questionNumber: number): string {
  return `${S3_AUDIO_BASE}/${characterId}/${gradeBand}_${questionNumber}.wav`;
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
    is_retry?: boolean;
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

  fetchFeedback: (data: {
    question_text: string;
    answer_text: string;
    question_number: number;
    character: string;
    is_retry?: boolean;
  }) => {
    const formData = new FormData();
    formData.append("question_text", data.question_text);
    formData.append("answer_text", data.answer_text);
    formData.append("question_number", String(data.question_number));
    formData.append("character", data.character);
    if (data.is_retry) formData.append("is_retry", "true");
    return api.post<{
      feedback_text: string;
      audio_base64: string | null;
      needs_retry: boolean;
      hint: string | null;
    }>(
      "/benchmark/feedback",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },
};

export default benchmarkApi;
