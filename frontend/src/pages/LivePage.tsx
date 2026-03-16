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
import { useNextQuestion } from "@/api/hooks/useNextQuestion";
import { useSubmitEvidence } from "@/api/hooks/useSubmitEvidence";
import { api } from "@/api/client";
import type { BKTUpdate, EvidenceCreate } from "@/api/types";
import type { SparkTriggerData } from "@/components/live/AICompanionShell";
import { AICompanionShell } from "@/components/live/AICompanionShell";
import { VideoArea } from "@/components/live/VideoArea";
import { ActivityPanel } from "@/components/live/ActivityPanel";
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
  const [sideTab, setSideTab] = useState<"activity" | "chat">("activity");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages.length]);

  const sendChat = useCallback(() => {
    const txt = chatText.trim();
    if (!txt) return;
    hmsActions.sendBroadcastMessage(txt);
    setChatText("");
  }, [chatText, hmsActions]);

  // Fetch student's live sessions to get HMS room code
  const { data: liveSessions } = useQuery<{ room_code_guest: string | null; student_name: string; is_live: boolean }[]>({
    queryKey: ["my-live-sessions"],
    queryFn: () => api.get("/students/me/live-sessions").then(r => r.data),
    enabled: !!studentId,
    refetchInterval: 15_000,
  });
  const activeLiveSession = liveSessions?.find(s => s.is_live) ?? null;

  // Session-driven flow: find active session for student's cohort
  const { data: session, isLoading: loadingSession } = useActiveSession(student?.cohort_id);
  const { data: activity, isLoading: loadingActivity } = useActivity(session?.current_activity_id);
  const { data: sessionActivities } = useSessionActivities(session?.id);

  const isTimedMcq = activity?.mode === "timed_mcq";

  // Find the active SessionActivity to get server-side launched_at
  const activeSessionActivity = useMemo(
    () => sessionActivities?.find((sa) => sa.activity_id === session?.current_activity_id && sa.status === "active"),
    [sessionActivities, session?.current_activity_id],
  );

  // Backend picks the best competency + question for this activity
  const {
    data: nextQ,
    isLoading: questionLoading,
    refetch: refetchQuestion,
  } = useNextQuestion(studentId, activity?.id ?? null);

  const question = nextQ?.question ?? null;

  // Answer state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"got_it" | "kinda" | "lost" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const questionShownAt = useRef<number>(Date.now());

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

  // Reset question state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setConfidence(null);
    setSubmitted(false);
    setSparkTrigger(null);
    setAiInteraction("none");
    setWantHint(false);
    questionShownAt.current = Date.now();
  }, [nextQ?.question?.id]);

  const handleSubmit = useCallback(async () => {
    if (!studentId || !selectedOption || !question || !nextQ) return;

    const correctLabel =
      question.options?.find((o) => o.is_correct)?.label ?? null;
    const isCorrect = selectedOption === correctLabel;
    const responseTimeMs = Date.now() - questionShownAt.current;

    const evidence: EvidenceCreate = {
      student_id: studentId,
      competency_id: nextQ.competency_id,
      outcome: isCorrect ? 1.0 : 0.0,
      source: "mcq",
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
        correct: prev.correct + (isCorrect ? 1 : 0),
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
  }, [studentId, selectedOption, question, nextQ, confidence, session?.id, submitEvidence, aiInteraction]);

  const handleNext = useCallback(() => {
    refetchQuestion();
  }, [refetchQuestion]);

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

        {/* ── Right: Sidebar ── */}
        <div className={s.rightCol}>

          {/* ── Tab bar ── */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}>
            {(["activity", "chat"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSideTab(tab)}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  background: "transparent",
                  border: "none",
                  borderBottom: sideTab === tab ? "2px solid #6366f1" : "2px solid transparent",
                  color: sideTab === tab ? "#fff" : "rgba(255,255,255,0.35)",
                  fontWeight: sideTab === tab ? 700 : 500,
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
                {tab === "activity" ? "📋 Activity" : "💬 Chat"}
                {tab === "chat" && chatMessages.length > 0 && sideTab !== "chat" && (
                  <span style={{
                    background: "#6366f1", borderRadius: "50%", width: 16, height: 16,
                    fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{chatMessages.length > 9 ? "9+" : chatMessages.length}</span>
                )}
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
                  selectedOption={selectedOption}
                  onSelectOption={setSelectedOption}
                  submitted={submitted}
                  onSubmit={handleSubmit}
                  onNext={handleNext}
                  submitting={submitting}
                  timeLeft={isTimedMcq ? timeLeft : undefined}
                  totalAnswered={totalAnswered}
                  correctCount={correctCount}
                />
              </div>

              {/* ── Hint button — always at bottom, no scroll needed ── */}
              {wantHint && !sparkTrigger && question && nextQ && studentId && (
                <div style={{ padding: "10px 14px", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button
                    onClick={() => {
                      setSparkTrigger({
                        studentId,
                        questionId: question.id,
                        trigger: "wrong_answer",
                        competencyId: nextQ.competency_id,
                        selectedOption: selectedOption ?? undefined,
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
                  <div style={{ color: "#555", fontSize: 11, textAlign: "center", padding: 24 }}>No messages yet — say hi! 👋</div>
                ) : chatMessages.map((m: any) => {
                  const isMe = m.senderName === (activeLiveSession?.student_name ?? student?.name ?? "Student");
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      <div style={{ fontSize: 9, color: "#555", marginBottom: 2, paddingLeft: 4, paddingRight: 4 }}>{m.senderName}</div>
                      <div style={{
                        maxWidth: "80%", padding: "7px 11px", borderRadius: isMe ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                        background: isMe ? "#4f46e5" : "rgba(255,255,255,0.08)",
                        color: isMe ? "#fff" : "#ccc",
                        fontSize: 12, lineHeight: 1.4,
                      }}>{m.message}</div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div style={{ display: "flex", gap: 6, padding: "8px 10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Type a message..."
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 12, outline: "none",
                  }}
                />
                <button
                  onClick={sendChat}
                  style={{
                    background: "#4f46e5", border: "none", borderRadius: 10, padding: "8px 14px",
                    color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer",
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
