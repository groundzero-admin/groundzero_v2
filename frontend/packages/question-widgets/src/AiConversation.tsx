import { useEffect, useRef, useState } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, BUBBLE, BUBBLE_USER, str } from "./shared";
import { api } from "../../../src/api/client";

export default function AiConversation({ data, onAnswer, resetKey }: QuestionProps) {
  const opening = str(data.opening_message);
  const goal = str(data.goal);

  const sparkStudentId = typeof data.__spark_student_id === "string" ? (data.__spark_student_id as string) : null;
  const sparkQuestionId = typeof data.__spark_question_id === "string" ? (data.__spark_question_id as string) : null;
  const sparkCompetencyId = typeof data.__spark_competency_id === "string" ? (data.__spark_competency_id as string) : null;

  const canUseSpark = !!sparkStudentId && !!sparkCompetencyId;

  // Template-provided turn limit (used for teacher preview too, where we may not have an activity_question_id).
  const localMaxTurns = (() => {
    const raw = data.max_turns;
    if (typeof raw === "number") return raw > 0 ? raw : null;
    if (typeof raw === "string") {
      const n = Number.parseInt(raw, 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    return null;
  })();

  const [msgs, setMsgs] = useState<{ role: "ai" | "user"; text: string }[]>([
    { role: "ai", text: opening || "Hi! Let's explore this topic together." },
  ]);
  const [input, setInput] = useState("");

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const msgsRef = useRef(msgs);
  const userTurnCountRef = useRef(0);
  const startTokenRef = useRef(0);
  const turnTokenRef = useRef(0);
  useEffect(() => {
    msgsRef.current = msgs;
  }, [msgs]);

  useEffect(() => {
    if (resetKey === undefined) return;
    // Invalidate any in-flight async responses for previous question/reset.
    startTokenRef.current += 1;
    turnTokenRef.current += 1;
    setConversationId(null);
    setIsComplete(false);
    setIsLoading(false);
    setMsgs([{ role: "ai", text: opening || "Hi! Let's explore this topic together." }]);
    setInput("");
    userTurnCountRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // NOTE: We intentionally do NOT auto-start SPARK on mount.
  // Conversation is created lazily on first "Send" (see sendToSpark()).

  // Intentionally NOT auto-starting on mount:
  // this prevents the backend opening message from overwriting the widget greeting.

  const sendToSpark = async () => {
    if (!sparkStudentId || !sparkCompetencyId) return;
    if (isLoading || isComplete) return;

    const token = ++turnTokenRef.current;
    const text = input.trim();
    if (!text) return;

    const nextUserTurns = userTurnCountRef.current + 1;
    userTurnCountRef.current = nextUserTurns;
    const willReachLocalLimit = localMaxTurns != null && nextUserTurns >= localMaxTurns;

    setIsLoading(true);
    setInput("");

    try {
      const current = msgsRef.current;
      // Show the user's message immediately (even if we still need to start SPARK).
      // This removes the "wait → then violet bubble appears" feel.
      const nextAfterUser = [...current, { role: "user" as const, text }];
      setMsgs(nextAfterUser);

      if (token !== turnTokenRef.current) return;

      let convId = conversationId;
      if (!convId) {
        const startResp = await api.post("/spark/conversations", {
          student_id: sparkStudentId,
          trigger: "free_chat",
          competency_id: sparkCompetencyId,
          ...(sparkQuestionId ? { question_id: sparkQuestionId } : {}),
        });
        if (token !== turnTokenRef.current) return;

        convId = (startResp.data?.conversation_id as string | undefined) ?? null;
        setConversationId(convId);
        setIsComplete(false);
        if (!convId) throw new Error("Missing conversation_id from SPARK start");
      }

      const turnResp = await api.post(`/spark/conversations/${convId}/turn`, { content: text });
      if (token !== turnTokenRef.current) return;

      const aiText = turnResp.data?.message?.content as string | undefined;
      const next = [...nextAfterUser, { role: "ai" as const, text: aiText || "Got it — tell me more!" }];
      setMsgs(next);
      onAnswer?.({ messages: next });

      if (turnResp.data?.is_complete || willReachLocalLimit) {
        setIsComplete(true);
        try {
          await api.post(`/spark/conversations/${convId}/end`);
        } catch {
          // ignore end errors
        }
      }
    } catch {
      if (token !== turnTokenRef.current) return;
      const current = msgsRef.current;
      // User bubble is already shown optimistically; append only AI message.
      const next = [...current, { role: "ai" as const, text: "I couldn't reach SPARK right now. Try again!" }];
      setMsgs(next);
      onAnswer?.({ messages: next });
      if (willReachLocalLimit) setIsComplete(true);
    } finally {
      if (token === turnTokenRef.current) setIsLoading(false);
    }
  };

  const isStandalonePreview = !onAnswer;

  const resetConversation = () => {
    startTokenRef.current += 1;
    turnTokenRef.current += 1;
    userTurnCountRef.current = 0;
    setConversationId(null);
    setIsComplete(false);
    setIsLoading(false);
    setMsgs([{ role: "ai", text: opening || "Hi! Let's explore this topic together." }]);
    setInput("");
  };

  if (!opening && !str(data.system_prompt) && !goal && !canUseSpark) return null;

  return (
    <>
      <div style={{ ...CARD, minHeight: 420, overflow: "visible" }}>
        <div style={HEADING}>{goal || "AI Conversation"}</div>
        <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 12,
          minHeight: 260,
        }}
      >
        {msgs.map((m, i) => (
          <div key={i} style={m.role === "ai" ? BUBBLE : BUBBLE_USER}>
            {m.role === "ai" ? `\uD83E\uDD16 ${m.text}` : m.text}
          </div>
        ))}
      </div>
        <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canUseSpark && sendToSpark()}
          placeholder={canUseSpark ? "Ask SPARK..." : "SPARK not available"}
          disabled={isComplete}
          style={{
            flex: 1,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 20,
            padding: "8px 14px",
            fontSize: 12,
            outline: "none",
            opacity: isComplete ? 0.7 : 1,
          }}
        />
        <button
          style={{
            ...BTN,
            borderRadius: 20,
            padding: "8px 16px",
            cursor: isLoading || isComplete ? "not-allowed" : "pointer",
            opacity: 1,
          }}
          onClick={() => canUseSpark && sendToSpark()}
          disabled={isLoading || isComplete}
        >
          {isLoading ? "Thinking..." : "Send"}
        </button>
        </div>
      </div>
      {isComplete && (
        <div
          style={{
            margin: "10px 0 14px",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(99,102,241,0.25)",
            background: "rgba(99,102,241,0.10)",
            color: "#3730a3",
            fontWeight: 700,
            fontSize: 12,
            lineHeight: 1.4,
          }}
        >
          Conversation limit reached. You can use <span style={{ fontWeight: 900 }}>Try Again</span> or{" "}
          <span style={{ fontWeight: 900 }}>Next Question</span>.
        </div>
      )}

      {isStandalonePreview && isComplete && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            style={{
              ...BTN,
              background: "#F1F5F9",
              color: "#475569",
              boxShadow: "none",
              borderRadius: 12,
              flex: 1,
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 900,
            }}
            onClick={resetConversation}
          >
            Try Again
          </button>
          <button
            type="button"
            style={{
              ...BTN,
              borderRadius: 12,
              flex: 1,
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 900,
            }}
            onClick={resetConversation}
          >
            Next Question
          </button>
        </div>
      )}
    </>
  );
}
