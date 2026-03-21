export interface AnsweredQuestion {
  questionNumber: number;
  questionText: string;
  answerText: string;
}

export type Phase =
  | "loading"
  | "intro"
  | "map"
  | "speaking"
  | "answering"
  | "filler"
  | "feedback"
  | "retry_prompt"
  | "celebration";

export interface StreakDisplay {
  count: number;
  message: string;
  emoji: string;
  level: "nice" | "fire" | "unstoppable";
}
