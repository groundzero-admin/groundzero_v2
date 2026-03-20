import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useHMSActions, useHMSStore, selectHMSMessages } from "@100mslive/react-sdk";
import { useStudent } from "@/context/StudentContext";
import { useStudentState } from "@/api/hooks/useStudentState";
import { useActiveSession } from "@/api/hooks/useActiveSession";
import { useActivity } from "@/api/hooks/useActivities";
import { useSessionActivities } from "@/api/hooks/useTeacher";
import { useSessionScore } from "@/api/hooks/useSessionScore";
import { useSubmitEvidence } from "@/api/hooks/useSubmitEvidence";
import { api } from "@/api/client";
import type { BKTUpdate, EvidenceCreate, Question } from "@/api/types";
import type { SparkTriggerData } from "@/components/live/AICompanionShell";
import { AICompanionShell } from "@/components/live/AICompanionShell";
import { VideoArea } from "@/components/live/VideoArea";
import { ActivityPanel } from "@/components/live/ActivityPanel";
import { ConfidenceChips } from "@/components/live/ConfidenceChips";
import { BKTUpdateToast } from "@/components/live/BKTUpdateToast";
import * as s from "./LivePage.css";

export default function LivePage() {
  const { studentId } = useStudent();
  const { data: studentState, isLoading: loadingState } = useStudentState(studentId);
  const student = studentState?.student ?? null;

  // HMS chat
  const hmsActions = useHMSActions();
  const rawMessages: any[] = (useHMSStore(selectHMSMessages) as any[]) || [];
  const chatMessages = rawMessages.filter((m: any) => {
    try { return !JSON.parse(m.message)?.type; } catch { return true; }
  });
  const [chatText, setChatText] = useState("");
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingEmojiCursorPos = useRef<number | null>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [sideTab, setSideTab] = useState<"activity" | "chat">("activity");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatImageError, setChatImageError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number>(390);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages.length]);

  // ── Sidebar resizing ──
  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const rightPadding = 16;
      const minW = 320;
      const maxW = Math.min(560, window.innerWidth - rightPadding);
      const next = Math.max(minW, Math.min(maxW, window.innerWidth - e.clientX));
      setSidebarWidth(next);
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

  const sendChat = useCallback(async () => {
    const txt = chatText.trim();
    if (!txt && pendingImages.length === 0) return;

    // Send text first (if any), then each pending image.
    if (txt) await hmsActions.sendBroadcastMessage(txt);
    for (const img of pendingImages) {
      await hmsActions.sendBroadcastMessage(`[img]${img}`);
    }

    setChatText("");
    setPendingImages([]);
    requestAnimationFrame(() => chatInputRef.current?.focus());
  }, [chatText, pendingImages, hmsActions]);

  function appendEmoji(emoji: string) {
    const el = chatInputRef.current;
    const start = el?.selectionStart ?? chatText.length;
    const end = el?.selectionEnd ?? chatText.length;

    pendingEmojiCursorPos.current = start + emoji.length;
    setChatText((prev) => prev.slice(0, start) + emoji + prev.slice(end));
  }

  // Keep caret position after emoji insertion.
  useEffect(() => {
    if (pendingEmojiCursorPos.current == null) return;
    if (!chatInputRef.current) return;
    const pos = pendingEmojiCursorPos.current;
    chatInputRef.current.setSelectionRange(pos, pos);
    pendingEmojiCursorPos.current = null;
  }, [chatText]);

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  const sendImageToChat = useCallback(
    async (dataUrl: string) => {
      // Add to pending tray; user can still type and add more images.
      setPendingImages((prev) => [...prev, dataUrl]);
      requestAnimationFrame(() => chatInputRef.current?.focus());
    },
    [],
  );

  function removePendingImage(idx: number) {
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));
  }

  // Fetch student's live sessions to get HMS room code
  const { data: liveSessions } = useQuery<
    {
      room_code_guest: string | null;
      student_name: string;
      is_live: boolean;
      cohort_id?: string;
    }[]
  >({
    queryKey: ["my-live-sessions"],
    queryFn: () => api.get("/students/me/live-sessions").then(r => r.data),
    enabled: !!studentId,
  });
  const activeLiveSession = liveSessions?.find(s => s.is_live) ?? null;

  // Session-driven flow: find active session for student's cohort
  const { data: session, isLoading: loadingSession } = useActiveSession(activeLiveSession?.cohort_id ?? student?.cohort_id);
  const { data: activity, isLoading: loadingActivity } = useActivity(session?.current_activity_id);
  const { data: sessionActivities } = useSessionActivities(session?.id);

  const isTimedMcq = activity?.mode === "timed_mcq";

  // Find the active SessionActivity to get server-side launched_at
  const activeSessionActivity = useMemo(
    () => sessionActivities?.find((sa) => sa.activity_id === session?.current_activity_id && sa.status === "active"),
    [sessionActivities, session?.current_activity_id],
  );

  // Load launched activity questions + student's attempt progress.
  const {
    data: questionFlow,
    isLoading: questionLoading,
  } = useQuery<{
    questions: Question[];
    attempted_question_ids: string[];
    attempted_results: Record<string, boolean>;
    next_question_index: number;
  }>({
    queryKey: ["session-activity-question-flow", session?.id, activity?.id, studentId],
    queryFn: async () =>
      (
        await api.get(`/sessions/${session?.id}/activities/${activity?.id}/question-flow`, {
          params: studentId ? { student_id: studentId } : undefined,
        })
      ).data,
    enabled: !!session?.id && !!activity?.id && !!session?.current_activity_id,
    refetchInterval: 3_000,
    refetchOnWindowFocus: true,
  });
  const activityQuestions = questionFlow?.questions ?? [];
  const attemptedResults = questionFlow?.attempted_results ?? {};
  const [questionIndex, setQuestionIndex] = useState(0);
  const question = activityQuestions[questionIndex] ?? null;
  const allAttempted =
    activityQuestions.length > 0 &&
    (questionFlow?.next_question_index ?? 0) >= activityQuestions.length;

  // Answer state
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [widgetAnswer, setWidgetAnswer] = useState<unknown>(null);
  const [confidence, setConfidence] = useState<"got_it" | "kinda" | "lost" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const questionShownAt = useRef<number>(new Date().getTime());

  // BKT toast
  const [toastUpdates, setToastUpdates] = useState<BKTUpdate[] | null>(null);

  // SPARK AI Companion — manual hint only
  const [sparkTrigger, setSparkTrigger] = useState<SparkTriggerData | null>(null);
  const [aiInteraction, setAiInteraction] = useState<"none" | "hint" | "conversation">("none");
  const [wantHint, setWantHint] = useState(false); // shown after wrong answer

  // ── Stateful countdown timer — derived from server launched_at ──
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate time remaining from server's launched_at + duration
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!isTimedMcq || !activity?.duration_minutes || !activeSessionActivity?.launched_at) {
      setTimeLeft(null);
      return;
    }

    const raw = activeSessionActivity.launched_at;
    const launchedAt = new Date(raw.endsWith("Z") ? raw : raw + "Z").getTime();
    const durationMs = activity.duration_minutes * 60 * 1000;
    const endTime = launchedAt + durationMs;

    const calcRemaining = () => Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    setTimeLeft(calcRemaining());

    timerRef.current = setInterval(() => {
      const remaining = calcRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimedMcq, activity?.duration_minutes, activeSessionActivity?.launched_at]);

  // ── Stateful score tracking — seeded from server, incremented locally ──
  const { data: serverScore } = useSessionScore(studentId, session?.id);
  const [localScoreDelta, setLocalScoreDelta] = useState({ total: 0, correct: 0 });
  const lastActivityRef = useRef<string | null>(null);

  // Reset local delta when activity changes
  useEffect(() => {
    if (activity?.id && activity.id !== lastActivityRef.current) {
      setLocalScoreDelta({ total: 0, correct: 0 });
      lastActivityRef.current = activity.id;
    }
  }, [activity?.id]);

  const totalAnswered = (serverScore?.total ?? 0) + localScoreDelta.total;
  const correctCount = (serverScore?.correct ?? 0) + localScoreDelta.correct;

  // Submit mutation
  const { mutateAsync: submitEvidence, isPending: submitting } =
    useSubmitEvidence(studentId);

  // Reset question state when current question changes
  useEffect(() => {
    setSelectedOptions([]);
    setWidgetAnswer(null);
    setConfidence(null);
    setSubmitted(false);
    setSparkTrigger(null);
    setAiInteraction("none");
    setWantHint(false);
    questionShownAt.current = Date.now();
  }, [question?.id]);

  // Start from the first unanswered question whenever activity changes/resumes.
  useEffect(() => {
    if (!session?.current_activity_id) {
      setQuestionIndex(0);
      return;
    }
    setQuestionIndex(questionFlow?.next_question_index ?? 0);
  }, [activity?.id, session?.current_activity_id, questionFlow?.next_question_index]);

  const isWidgetQuestion =
    !!question?.template_slug && !String(question.template_slug).startsWith("mcq_");

  const deriveWidgetOutcome = useCallback((
    templateSlug: string | null | undefined,
    answer: unknown,
  ): number => {
    if (typeof answer === "object" && answer !== null) {
      const obj = answer as Record<string, unknown>;
      if (typeof obj.correct === "boolean") return obj.correct ? 1.0 : 0.0;
      if (typeof obj.score === "number") return Math.max(0, Math.min(1, obj.score));
    }

    const subjective = new Set([
      "short_answer",
      "image_response",
      "audio_response",
      "debate_opinion",
      "ai_conversation",
      "draw_scribble",
      "reflection_rating",
    ]);
    if (templateSlug && subjective.has(templateSlug)) {
      // Non-deterministic responses get completion credit instead of hard zero.
      return 0.65;
    }
    return 0.5;
  }, []);

  const handleSubmit = useCallback(async (widgetAnswerOverride?: unknown) => {
    if (!studentId || !question) return;
    if (!isWidgetQuestion && selectedOptions.length === 0) return;
    const effectiveWidgetAnswer = widgetAnswerOverride ?? widgetAnswer;
    if (isWidgetQuestion && !effectiveWidgetAnswer) return;

    let isCorrect = false;
    let derivedOutcome = 0.0;
    if (!isWidgetQuestion) {
      const correctLabels = (question.options ?? []).filter((o) => o.is_correct).map((o) => o.label);
      isCorrect =
        selectedOptions.length === correctLabels.length &&
        selectedOptions.every((label) => correctLabels.includes(label));
      derivedOutcome = isCorrect ? 1.0 : 0.0;
    } else if (typeof effectiveWidgetAnswer === "object" && effectiveWidgetAnswer !== null) {
      derivedOutcome = deriveWidgetOutcome(question.template_slug, effectiveWidgetAnswer);
      isCorrect = derivedOutcome >= 0.5;
    } else {
      derivedOutcome = deriveWidgetOutcome(question.template_slug, effectiveWidgetAnswer);
      isCorrect = derivedOutcome >= 0.5;
    }
    const responseTimeMs = Date.now() - questionShownAt.current;

    const evidence: EvidenceCreate = {
      student_id: studentId,
      competency_id: question.competency_id,
      outcome: derivedOutcome,
      source: isWidgetQuestion ? "artifact" : "mcq",
      question_id: question.id,
      module_id: question.module_id,
      session_id: session?.id,
      response_time_ms: responseTimeMs,
      confidence_report: confidence ?? undefined,
      ai_interaction: aiInteraction,
    };

    try {
      const result = await submitEvidence(evidence);
      setSubmitted(true);
      setLocalScoreDelta((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (derivedOutcome >= 0.5 ? 1 : 0),
      }));
      if (result.updates.length > 0) {
        setToastUpdates(result.updates);
      }

      // Show hint button on wrong answer (don't auto-open Spark)
      if (!isCorrect || confidence === "lost") {
        setWantHint(true);
      }
    } catch {
      // Mutation error handled by TanStack Query
    }
  }, [
    studentId,
    question,
    isWidgetQuestion,
    selectedOptions,
    widgetAnswer,
    confidence,
    session?.id,
    submitEvidence,
    aiInteraction,
    deriveWidgetOutcome,
  ]);

  const handleNext = useCallback(() => {
    setQuestionIndex((prev) => prev + 1);
  }, []);
  const handlePrev = useCallback(() => {
    setQuestionIndex((prev) => Math.max(0, prev - 1));
  }, []);
  const handleRestartReview = useCallback(() => {
    setQuestionIndex(0);
  }, []);

  const dismissToast = useCallback(() => setToastUpdates(null), []);

  // Loading state
  if (loadingState || loadingSession) {
    return (
      <div className={s.loading}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "#6366f1" }} />
      </div>
    );
  }


  return (
    <>
      <div className={s.page}>
        {/* ── Left: Video (full height) ── */}
        <div className={s.leftCol}>
          <VideoArea
            confidence={confidence}
            onConfidenceChange={setConfidence}
            questionActive={!!question && !submitted}
            roomCode={activeLiveSession?.room_code_guest}
            userName={activeLiveSession?.student_name ?? student?.name ?? "Student"}
          />
        </div>

        {/* ── Drag resizer (desktop only) ── */}
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={() => setIsResizing(true)}
          className={s.resizer}
          style={{
            background: isResizing ? "rgba(99,102,241,0.20)" : "rgba(148,163,184,0.25)",
            borderLeft: "1px solid rgba(148,163,184,0.35)",
            borderRight: "1px solid rgba(148,163,184,0.35)",
          }}
          title="Drag to resize"
        />

        {/* ── Right: Sidebar ── */}
        <div className={s.rightCol} style={{ width: sidebarWidth }}>

          {/* ── Tab bar ── */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid #e2e8f0",
            flexShrink: 0,
          }}>
            {(["activity", "chat"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSideTab(tab)}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  background: sideTab === tab ? "#eef2ff" : "transparent",
                  border: "none",
                  borderBottom: sideTab === tab ? "2px solid #6366f1" : "2px solid transparent",
                  color: sideTab === tab ? "#0f172a" : "#64748b",
                  fontWeight: sideTab === tab ? 800 : 700,
                  fontSize: 12,
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {tab === "activity" ? "Activity" : "Chat"}
              </button>
            ))}
          </div>

          {/* ── Activity panel ── */}
          {sideTab === "activity" && (
            <>
              {/* Scrollable activity content */}
              <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                <ActivityPanel
                  session={session ?? null}
                  activity={activity ?? null}
                  activityLoading={loadingActivity}
                  question={question}
                  questionsLoading={questionLoading}
                  questionIndex={questionIndex}
                  totalQuestions={activityQuestions.length}
                  attemptedResult={question ? (question.id in attemptedResults ? attemptedResults[question.id] : null) : null}
                  allAttempted={allAttempted}
                  onRestartReview={handleRestartReview}
                  selectedOptions={selectedOptions}
                  onSelectOption={(label) => {
                    const allowMultiple =
                      !!question &&
                      (
                        (Array.isArray(question.options) && question.options.filter((o) => o.is_correct).length > 1) ||
                        !!(question.data && typeof question.data === "object" && (question.data as Record<string, unknown>).multiple)
                      );
                    if (allowMultiple) {
                      setSelectedOptions((prev) =>
                        prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
                      );
                    } else {
                      setSelectedOptions([label]);
                    }
                  }}
                  onWidgetAnswer={(ans) => {
                    setWidgetAnswer(ans);
                    if (!submitted && !submitting) {
                      void handleSubmit(ans);
                    }
                  }}
                  widgetAnswered={widgetAnswer != null}
                  submitted={submitted}
                  onSubmit={handleSubmit}
                  onPrev={handlePrev}
                  onNext={handleNext}
                  submitting={submitting}
                  timeLeft={isTimedMcq ? timeLeft : undefined}
                  totalAnswered={totalAnswered}
                  correctCount={correctCount}
                />
                {question && selectedOptions.length > 0 && !submitted && (
                  <div style={{ padding: "0 14px 10px 14px" }}>
                    <ConfidenceChips
                      value={confidence}
                      onChange={setConfidence}
                      variant="light"
                    />
                  </div>
                )}
              </div>

              {/* ── Hint button — always at bottom, no scroll needed ── */}
              {wantHint && !sparkTrigger && question && studentId && (
                <div style={{ padding: "10px 14px", flexShrink: 0, borderTop: "1px solid #e2e8f0", background: "#fff" }}>
                  <button
                    onClick={() => {
                      setSparkTrigger({
                        studentId,
                        questionId: question.id,
                        trigger: "wrong_answer",
                        competencyId: question.competency_id,
                        selectedOption: selectedOptions.join(", ") || undefined,
                        confidenceReport: confidence ?? undefined,
                      });
                      setAiInteraction("hint");
                      setWantHint(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      border: "none",
                      borderRadius: 12,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
                    }}
                  >
                    ✨ Want a hint?
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Chat panel ── */}
          {sideTab === "chat" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                {chatMessages.length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: 12, textAlign: "center", padding: 24 }}>No messages yet — say hi!</div>
                ) : chatMessages.map((m: any) => {
                  const isMe = m.senderName === (activeLiveSession?.student_name ?? student?.name ?? "Student");
                  const msg: string = String(m.message ?? "");
                  const normalized = msg.trim();
                  const imgPrefix = "[img]";
                  const imageUrl = normalized.startsWith(imgPrefix) ? normalized.slice(imgPrefix.length) : null;
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2, paddingLeft: 4, paddingRight: 4, fontWeight: 800 }}>{m.senderName}</div>
                      <div style={{
                        maxWidth: "80%", padding: "7px 11px", borderRadius: isMe ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                        background: isMe ? "#4f46e5" : "#f1f5f9",
                        color: isMe ? "#fff" : "#0f172a",
                        fontSize: 12, lineHeight: 1.4,
                      }}>
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="Shared"
                            style={{ maxWidth: 220, borderRadius: 10, display: "block" }}
                          />
                        ) : (
                          msg
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div style={{ display: "flex", gap: 8, padding: "10px 10px 12px", borderTop: "1px solid #e2e8f0", background: "#fff" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {["👍", "😂", "❤️", "🎉"].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => appendEmoji(emoji)}
                        style={{
                          border: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          borderRadius: 10,
                          padding: "7px 9px",
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                        title={`Insert ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {chatImageError && (
                    <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 700 }}>{chatImageError}</div>
                  )}

                  {pendingImages.length > 0 && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {pendingImages.map((url, idx) => (
                        <div key={idx} style={{ position: "relative" }}>
                          <img
                            src={url}
                            alt={`Pending ${idx + 1}`}
                            style={{
                              width: 46,
                              height: 46,
                              objectFit: "cover",
                              borderRadius: 10,
                              border: "1px solid #e2e8f0",
                              display: "block",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removePendingImage(idx)}
                            style={{
                              position: "absolute",
                              top: -8,
                              right: -8,
                              width: 22,
                              height: 22,
                              borderRadius: 999,
                              border: "1px solid #e2e8f0",
                              background: "#fff",
                              cursor: "pointer",
                              fontWeight: 900,
                              fontSize: 12,
                              color: "#ef4444",
                              boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
                            }}
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <input
                    ref={chatInputRef}
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void sendChat()}
                    onPaste={async (e) => {
                      const items = e.clipboardData?.items;
                      if (!items) return;
                      const files: File[] = [];
                      for (const item of Array.from(items)) {
                        if (item.kind !== "file") continue;
                        const file = item.getAsFile();
                        if (!file) continue;
                        if (file.type.startsWith("image/")) files.push(file);
                      }

                      if (!files.length) return;
                      e.preventDefault();
                      setChatImageError(null);

                      for (const file of files) {
                        if (file.size > 1_000_000) {
                          setChatImageError("Image too large (max ~1MB for chat).");
                          return;
                        }
                        const dataUrl = await readFileAsDataUrl(file);
                        await sendImageToChat(dataUrl);
                      }
                    }}
                    placeholder="Type a message or paste an image..."
                    style={{
                      flex: 1,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: "10px 12px",
                      color: "#0f172a",
                      fontSize: 12,
                      outline: "none",
                    }}
                  />
                </div>

                <input
                  ref={chatFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (!files.length) return;
                    setChatImageError(null);
                    for (const file of files) {
                      if (!file.type.startsWith("image/")) continue;
                      if (file.size > 1_000_000) {
                        setChatImageError("Image too large (max ~1MB for chat).");
                        return;
                      }
                      const dataUrl = await readFileAsDataUrl(file);
                      await sendImageToChat(dataUrl);
                    }
                    // allow selecting same file again
                    e.currentTarget.value = "";
                  }}
                />

                <button
                  onClick={() => chatFileInputRef.current?.click()}
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "10px 12px",
                    color: "#0f172a",
                    fontWeight: 900,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Upload image"
                >
                  📎
                </button>

                <button
                  onClick={() => void sendChat()}
                  style={{
                    background: "#4f46e5", border: "none", borderRadius: 12, padding: "10px 14px",
                    color: "#fff", fontWeight: 900, fontSize: 12, cursor: "pointer",
                  }}
                >
                  ↑
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AICompanionShell
        triggerData={sparkTrigger}
        onEvidenceSubmitted={() => setAiInteraction("conversation")}
        onConversationEnd={() => { }}
      />

      {toastUpdates && (
        <BKTUpdateToast updates={toastUpdates} onDone={dismissToast} />
      )}
    </>
  );
}
