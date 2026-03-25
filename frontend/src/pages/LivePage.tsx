import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Loader2, Mic, MicOff, Camera, CameraOff, Monitor, MonitorOff, PhoneOff, Menu, X, UserRoundCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  useHMSActions,
  useHMSStore,
  selectHMSMessages,
  selectPeers,
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsLocalScreenShared,
} from "@100mslive/react-sdk";
import { useStudent } from "@/context/StudentContext";
import { useStudentState } from "@/api/hooks/useStudentState";
import { useActiveSession } from "@/api/hooks/useActiveSession";
import { useActivity } from "@/api/hooks/useActivities";
import { useSessionActivities } from "@/api/hooks/useTeacher";
import { useSessionScore } from "@/api/hooks/useSessionScore";
import { useNextActivityQuestion } from "@/api/hooks/useNextActivityQuestion";
import { useSubmitEvidence } from "@/api/hooks/useSubmitEvidence";
import { api } from "@/api/client";
import type { BKTUpdate, EvidenceCreate } from "@/api/types";
import type { SparkTriggerData } from "@/components/live/AICompanionShell";
import { AICompanionShell } from "@/components/live/AICompanionShell";
import { VideoArea, type TileData } from "@/components/live/VideoArea";
import { ActivityPanel } from "@/components/live/ActivityPanel";
import { StudentConfidenceBar } from "@/components/live/StudentConfidenceBar/StudentConfidenceBar";
import { BKTUpdateToast } from "@/components/live/BKTUpdateToast";
import * as s from "./LivePage.css";

export default function LivePage() {
  const navigate = useNavigate();
  const { studentId } = useStudent();
  const { data: studentState, isLoading: loadingState } = useStudentState(studentId);
  const student = studentState?.student ?? null;

  // HMS — video + chat (must join room; tiles come from peers)
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const isAudioOn = useHMSStore(selectIsLocalAudioEnabled);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const isScreenShared = useHMSStore(selectIsLocalScreenShared);
  const peers: any[] = (useHMSStore(selectPeers) as any[]) || [];
  const rawMessages: any[] = (useHMSStore(selectHMSMessages) as any[]) || [];
  const chatMessages = rawMessages.filter((m: any) => {
    try { return !JSON.parse(m.message)?.type; } catch { return true; }
  });
  const [chatText, setChatText] = useState("");
  const [sideTab, setSideTab] = useState<"activity" | "chat">("activity");
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [showCompactControls, setShowCompactControls] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages.length]);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    const sync = () => setIsCompactViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!isCompactViewport) setShowCompactControls(false);
  }, [isCompactViewport]);

  const sendChat = useCallback(() => {
    const txt = chatText.trim();
    if (!txt) return;
    hmsActions.sendBroadcastMessage(txt);
    setChatText("");
  }, [chatText, hmsActions]);

  // Fetch student's live sessions to get HMS room code
  const { data: liveSessions, isLoading: loadingLiveSessions } = useQuery<{ room_code_guest: string | null; student_name: string; is_live: boolean; cohort_id: string }[]>({
    queryKey: ["my-live-sessions"],
    queryFn: () => api.get("/students/me/live-sessions").then(r => r.data),
    enabled: !!studentId,
    staleTime: 10_000,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  });
  const activeLiveSession = liveSessions?.find(s => s.is_live) ?? null;
  const roomCode = activeLiveSession?.room_code_guest ?? "";
  const displayName = activeLiveSession?.student_name ?? student?.name ?? "Student";

  // Join 100ms room as guest (same pattern as admin/LiveClassPage)
  useEffect(() => {
    if (!roomCode) return;
    (async () => {
      try {
        setJoinError(null);
        const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode });
        await hmsActions.join({
          userName: displayName,
          authToken,
          settings: { isAudioMuted: false, isVideoMuted: false },
        });
      } catch (err: unknown) {
        const msg = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : String(err);
        const desc = err && typeof err === "object" && "description" in err ? String((err as { description?: string }).description) : "";
        const combined = msg || desc;
        setJoinError(
          combined.includes("not active") || combined.includes("403")
            ? "This class has not started yet."
            : `Failed to join: ${combined}`,
        );
      }
    })();
    return () => {
      hmsActions.leave();
    };
  }, [roomCode, displayName, hmsActions]);

  useEffect(() => {
    const h = () => hmsActions.leave();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [hmsActions]);

  // Session-driven flow: use cohort from live-sessions (checks all enrollments)
  // student.cohort_id is a legacy field and may point to the wrong cohort.
  const activeCohortId = activeLiveSession?.cohort_id ?? student?.cohort_id ?? null;
  const { data: session, isLoading: loadingSession } = useActiveSession(activeCohortId);
  const { data: activity, isLoading: loadingActivity } = useActivity(session?.current_activity_id);
  const { data: sessionActivities } = useSessionActivities(session?.id);

  const isTimedMcq = activity?.mode === "timed_mcq";

  // Find the active SessionActivity to get server-side launched_at
  const activeSessionActivity = useMemo(
    () => sessionActivities?.find((sa) => sa.activity_id === session?.current_activity_id && sa.status === "active"),
    [sessionActivities, session?.current_activity_id],
  );

  // Backend picks the best activity question for this activity
  const {
    data: activityQuestion,
    isLoading: questionLoading,
    refetch: refetchQuestion,
  } = useNextActivityQuestion(studentId, activity?.id ?? null);

  // Answer state
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [resetKey, setAttemptKey] = useState(0);
  const questionShownAt = useRef<number>(Date.now());

  // BKT toast
  const [toastUpdates, setToastUpdates] = useState<BKTUpdate[] | null>(null);

  // SPARK AI Companion — manual hint only
  const [sparkTrigger, setSparkTrigger] = useState<SparkTriggerData | null>(null);
  const [aiInteraction, setAiInteraction] = useState<"none" | "hint" | "conversation">("none");
  const [wantHint, setWantHint] = useState(false); // shown after wrong answer
  const lastAnswerRef = useRef<Record<string, unknown> | null>(null);

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
    setSubmitted(false);
    setIsCorrect(null);
    setAttemptKey(0);
    setSparkTrigger(null);
    setAiInteraction("none");
    setWantHint(false);
    lastAnswerRef.current = null;
    questionShownAt.current = Date.now();
  }, [activityQuestion?.activity_question_id]);

  // Called by QuestionRenderer's onAnswer — auto-submits evidence
  const handleAnswer = useCallback(async (answer: unknown) => {
    if (!studentId || !activityQuestion) return;
    lastAnswerRef.current = answer as Record<string, unknown>;

    const isScribble = activityQuestion.template_slug === "draw_scribble";
    const isAiConversation = activityQuestion.template_slug === "ai_conversation";

    if (isAiConversation) {
      // AI conversation is "free chat":
      // - submit evidence silently (so teacher preview can show the full chat)
      // - do not change correctness/judging UI
      // - count the question only once (first student message)
      const shouldCount = !submitted;
      if (shouldCount) {
        setSubmitted(true);
        setLocalScoreDelta((prev) => ({
          total: prev.total + 1,
          correct: prev.correct,
        }));
      }

      setIsCorrect(null);
      setWantHint(false);

      const responseTimeMs = Date.now() - questionShownAt.current;
      const evidence: EvidenceCreate = {
        student_id: studentId,
        competency_id: activityQuestion.competency_id,
        session_id: session?.id,
        response_time_ms: responseTimeMs,
        activity_question_id: activityQuestion.activity_question_id,
        activity_id: activity?.id,
        response: answer as Record<string, unknown>,
        ai_interaction: "conversation",
      };
      try {
        await submitEvidence(evidence);
      } catch {
        // Silently ignore evidence errors for chat UX.
      }
      return;
    }

    if (submitted) return;

    const responseTimeMs = Date.now() - questionShownAt.current;

    const evidence: EvidenceCreate = {
      student_id: studentId,
      competency_id: activityQuestion.competency_id,
      session_id: session?.id,
      response_time_ms: responseTimeMs,
      activity_question_id: activityQuestion.activity_question_id,
      activity_id: activity?.id,
      response: answer as Record<string, unknown>,
      ai_interaction: aiInteraction,
    };

    try {
      const result = await submitEvidence(evidence);
      if (isScribble) {
        // For scribble questions we always show "Answer submitted" UI.
        // Evidence is still created (so backend can store attempt), but we ignore outcome correctness.
        setSubmitted(true);
        setIsCorrect(null);
        setLocalScoreDelta((prev) => ({
          total: prev.total + 1,
          correct: prev.correct, // do not increment correct count
        }));
        setWantHint(false);
      } else {
        const correct = result.event.outcome >= 0.5;
        setSubmitted(true);
        setIsCorrect(correct);
        setLocalScoreDelta((prev) => ({
          total: prev.total + 1,
          correct: prev.correct + (correct ? 1 : 0),
        }));
        // BKT updates intentionally not shown to student
        if (!correct) {
          setWantHint(true);
        }
      }
    } catch {
      // handled by TanStack Query
    }
  }, [studentId, activityQuestion, submitted, session?.id, submitEvidence, aiInteraction]);

  const handleNext = useCallback(async () => {
    if (studentId && activity?.id) {
      await api.post(`/students/${studentId}/advance-activity-question`, null, {
        params: { activity_id: activity.id },
      });
    }
    refetchQuestion();
  }, [studentId, activity?.id, refetchQuestion]);

  const handleTryAgain = useCallback(() => {
    setSubmitted(false);
    setIsCorrect(null);
    setWantHint(false);
    lastAnswerRef.current = null;
    setAttemptKey((k) => k + 1);
  }, []);

  const dismissToast = useCallback(() => setToastUpdates(null), []);

  const handleLeaveClass = useCallback(async () => {
    try {
      await hmsActions.leave();
    } catch {
      /* ignore */
    }
    navigate("/dashboard");
  }, [hmsActions, navigate]);

  // Loading state
  if (loadingState || loadingSession) {
    return (
      <div className={s.loading}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "#6366f1" }} />
      </div>
    );
  }

  const tiles: TileData[] = [];
  const teacherPeerId = peers.find((p: any) => {
    const role = String(p?.roleName ?? p?.role?.name ?? "").toLowerCase();
    const name = String(p?.name ?? "").toLowerCase();
    return !p?.isLocal && (role.includes("teacher") || role.includes("facilitator") || role.includes("host") || name.includes("teacher"));
  })?.id ?? null;
  for (const p of peers) {
    if (p.auxiliaryTracks?.length) {
      tiles.push({
        id: `screen-${p.id}`,
        trackId: p.auxiliaryTracks[0],
        label: `🖥️ ${p.name || "?"}`,
        isScreen: true,
        peerId: p.id,
        isLocal: p.isLocal,
      });
    }
  }
  for (const p of peers) {
    tiles.push({
      id: p.id,
      trackId: p.videoTrack,
      label: `${p.name || "?"}${p.isLocal ? " (You)" : ""}`,
      isScreen: false,
      peerId: p.id,
      isLocal: p.isLocal,
      audioTrack: p.audioTrack,
    });
  }

  function makeMuteHandler(tile: TileData) {
    if (tile.isLocal || tile.isScreen || !tile.audioTrack) return undefined;
    return async () => {
      try {
        await hmsActions.setRemoteTrackEnabled(tile.audioTrack!, false);
      } catch {
        /* ignore */
      }
    };
  }

  const mediaButtons = [
    {
      icon: isAudioOn ? <Mic size={16} /> : <MicOff size={16} />,
      label: "Mic",
      on: isAudioOn as boolean,
      danger: !isAudioOn,
      fn: () => hmsActions.setLocalAudioEnabled(!isAudioOn),
    },
    {
      icon: isVideoOn ? <Camera size={16} /> : <CameraOff size={16} />,
      label: "Cam",
      on: isVideoOn as boolean,
      danger: !isVideoOn,
      fn: () => hmsActions.setLocalVideoEnabled(!isVideoOn),
    },
    {
      icon: isScreenShared ? <MonitorOff size={16} /> : <Monitor size={16} />,
      label: isScreenShared ? "Stop" : "Share",
      on: isScreenShared as boolean,
      warn: isScreenShared,
      fn: () => hmsActions.setScreenShareEnabled(!isScreenShared),
    },
  ];

  return (
    <>
      <div className={s.page}>
        {/* ── Left: Video (full height) ── */}
        <div className={s.leftCol}>
          {joinError ? (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: 24, textAlign: "center", color: "#fca5a5", fontSize: 14, background: "#0b0b1a",
            }}>
              {joinError}
            </div>
          ) : loadingLiveSessions ? (
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              color: "#94a3b8", fontSize: 14, background: "#0b0b1a",
            }}>
              <Loader2 size={22} style={{ animation: "spin 1s linear infinite", color: "#6366f1" }} />
              Loading live session…
            </div>
          ) : !roomCode ? (
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10,
              padding: 24, textAlign: "center", color: "#64748b", fontSize: 14, background: "#0b0b1a",
            }}>
              No live class right now. Join from your dashboard when your teacher starts the session.
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                style={{
                  marginTop: 4,
                  padding: "9px 14px",
                  borderRadius: 10,
                  border: "1px solid #334155",
                  background: "#111827",
                  color: "#e2e8f0",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                Go back to dashboard
              </button>
            </div>
          ) : !isConnected ? (
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              color: "#94a3b8", fontSize: 14, background: "#0b0b1a",
            }}>
              <Loader2 size={22} style={{ animation: "spin 1s linear infinite", color: "#6366f1" }} />
              Joining video…
            </div>
          ) : (
            <>
              <VideoArea
                tiles={tiles}
                pinnedId={pinnedId}
                setPinnedId={setPinnedId}
                onMute={makeMuteHandler}
                preferredMainPeerId={teacherPeerId}
                isCompactViewport={isCompactViewport}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 14px",
                  background: "#101020",
                  borderTop: "1px solid #1c1c30",
                  flexShrink: 0,
                  flexWrap: "wrap",
                  rowGap: 10,
                }}
              >
                <StudentConfidenceBar
                  studentName={displayName}
                  sendBroadcastMessage={(msg) => hmsActions.sendBroadcastMessage(msg)}
                  disabled={!isConnected}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                    justifyContent: isCompactViewport ? "flex-start" : "flex-end",
                    width: isCompactViewport ? "100%" : "auto",
                    flexBasis: isCompactViewport ? "100%" : "auto",
                    flex: isCompactViewport ? undefined : 1,
                    minWidth: 0,
                  }}
                >
                  {isCompactViewport ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowCompactControls((v) => !v)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: 12,
                          color: "#fff",
                          background: "#1f2937",
                        }}
                      >
                        {showCompactControls ? <X size={16} /> : <Menu size={16} />}
                        {showCompactControls ? "Hide controls" : "Show controls"}
                      </button>
                      {showCompactControls && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", width: "100%" }}>
                          {mediaButtons.map((b, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={b.fn}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: 12,
                                color: "#fff",
                                background: b.danger ? "#ef4444" : b.warn ? "#f59e0b" : b.on ? "#6366f1" : "#1c1c30",
                              }}
                            >
                              {b.icon} {b.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={handleLeaveClass}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "8px 12px",
                              borderRadius: 10,
                              border: "none",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontSize: 12,
                              color: "#fff",
                              background: "#64748b",
                            }}
                          >
                            <PhoneOff size={16} /> Leave
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {mediaButtons.map((b, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={b.fn}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: "clamp(12px, 2.8vw, 13px)",
                            color: "#fff",
                            background: b.danger ? "#ef4444" : b.warn ? "#f59e0b" : b.on ? "#6366f1" : "#1c1c30",
                          }}
                        >
                          {b.icon} {b.label}
                        </button>
                      ))}
                      {teacherPeerId && (
                        <button
                          type="button"
                          onClick={() => setPinnedId(teacherPeerId)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(34,197,94,0.45)",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: "clamp(12px, 2.8vw, 13px)",
                            color: "#dcfce7",
                            background: "rgba(20,83,45,0.6)",
                          }}
                        >
                          <UserRoundCheck size={16} /> Select teacher
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleLeaveClass}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "clamp(12px, 2.8vw, 13px)",
                          color: "#fff",
                          background: "#dc2626",
                        }}
                      >
                        <PhoneOff size={16} /> Leave
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Right: Activity / Chat (fixed max width, not resizable) ── */}
        <div className={s.rightCol}>

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
                  activityQuestion={activityQuestion ?? null}
                  questionsLoading={questionLoading}
                  submitted={submitted}
                  isCorrect={isCorrect}
                  resetKey={resetKey}
                  studentId={studentId}
                  onAnswer={handleAnswer}
                  onTryAgain={handleTryAgain}
                  onNext={handleNext}
                  submitting={submitting}
                  timeLeft={isTimedMcq ? timeLeft : undefined}
                  totalAnswered={totalAnswered}
                  correctCount={correctCount}
                />
              </div>

              {/* ── Hint button — always at bottom, no scroll needed ── */}
              {wantHint && !sparkTrigger && activityQuestion && studentId && (
                <div style={{ padding: "10px 14px", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button
                    onClick={() => {
                      const lastAnswer = lastAnswerRef.current as Record<string, unknown> | null;
                      const selectedIdx =
                        lastAnswer && typeof lastAnswer.selected === "number" ? (lastAnswer.selected as number) : null;

                      // Spark (backend) uses `selected_option` for MCQ diagnosis/hints.
                      // Our MCQ payload stores `selected` as a 0-based index into `data.options`,
                      // so we convert it to A/B/C... using the current question's option ordering.
                      const selectedOption =
                        activityQuestion?.template_slug === "mcq_single" || activityQuestion?.template_slug === "mcq_timed"
                          ? (() => {
                              const opts = activityQuestion?.data?.options;
                              if (!Array.isArray(opts) || selectedIdx === null) return undefined;
                              if (selectedIdx < 0 || selectedIdx >= opts.length) return undefined;
                              return String.fromCharCode("A".charCodeAt(0) + selectedIdx);
                            })()
                          : undefined;

                      setSparkTrigger({
                        studentId,
                        questionId: activityQuestion.activity_question_id,
                        trigger: "wrong_answer",
                        competencyId: activityQuestion.competency_id,
                        selectedOption,
                        studentResponse: lastAnswer ?? undefined,
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
                {!roomCode ? (
                  <div style={{ color: "#64748b", fontSize: 12, textAlign: "center", padding: 24 }}>No active session now.</div>
                ) : chatMessages.length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: 12, textAlign: "center", padding: 24 }}>No messages yet — say hi!</div>
                ) : chatMessages.map((m: any) => {
                  const isMe = m.senderName === (activeLiveSession?.student_name ?? student?.name ?? "Student");
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2, paddingLeft: 4, paddingRight: 4, fontWeight: 800 }}>{m.senderName}</div>
                      <div style={{
                        maxWidth: "80%", padding: "7px 11px", borderRadius: isMe ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                        background: isMe ? "#4f46e5" : "#f1f5f9",
                        color: isMe ? "#fff" : "#0f172a",
                        fontSize: 12, lineHeight: 1.4,
                      }}>{m.message}</div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div style={{ display: "flex", gap: 8, padding: "10px 10px 12px", borderTop: "1px solid #e2e8f0", background: "#fff" }}>
                <input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder={roomCode ? "Type a message..." : "No active session now"}
                  disabled={!roomCode}
                  style={{
                    flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0",
                    borderRadius: 12, padding: "10px 12px", color: "#0f172a", fontSize: 12, outline: "none",
                  }}
                />
                <button
                  onClick={sendChat}
                  disabled={!roomCode}
                  style={{
                    background: "#4f46e5", border: "none", borderRadius: 12, padding: "10px 14px",
                    color: "#fff", fontWeight: 900, fontSize: 12, cursor: roomCode ? "pointer" : "not-allowed", opacity: roomCode ? 1 : 0.5,
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
