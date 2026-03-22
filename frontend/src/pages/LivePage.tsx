import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Loader2, Mic, MicOff, Camera, CameraOff, Monitor, MonitorOff, PhoneOff } from "lucide-react";
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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number>(420);
  const [isResizing, setIsResizing] = useState(false);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

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

  const sendChat = useCallback(() => {
    const txt = chatText.trim();
    if (!txt) return;
    hmsActions.sendBroadcastMessage(txt);
    setChatText("");
  }, [chatText, hmsActions]);

  // Fetch student's live sessions to get HMS room code
  const { data: liveSessions, isLoading: loadingLiveSessions } = useQuery<{ room_code_guest: string | null; student_name: string; is_live: boolean }[]>({
    queryKey: ["my-live-sessions"],
    queryFn: () => api.get("/students/me/live-sessions").then(r => r.data),
    enabled: !!studentId,
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
  const [_aiInteraction, setAiInteraction] = useState<"none" | "hint" | "conversation">("none");
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
    setSubmitted(false);
    setIsCorrect(null);
    setAttemptKey(0);
    setSparkTrigger(null);
    setAiInteraction("none");
    setWantHint(false);
    questionShownAt.current = Date.now();
  }, [activityQuestion?.activity_question_id]);

  // Called by QuestionRenderer's onAnswer — auto-submits evidence
  const handleAnswer = useCallback(async (answer: unknown) => {
    if (!studentId || !activityQuestion || submitted) return;

    const responseTimeMs = Date.now() - questionShownAt.current;

    const evidence: EvidenceCreate = {
      student_id: studentId,
      competency_id: activityQuestion.competency_id,
      session_id: session?.id,
      response_time_ms: responseTimeMs,
      activity_question_id: activityQuestion.activity_question_id,
      response: answer as Record<string, unknown>,
    };

    try {
      const result = await submitEvidence(evidence);
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
    } catch {
      // handled by TanStack Query
    }
  }, [studentId, activityQuestion, submitted, session?.id, submitEvidence]);

  const handleNext = useCallback(() => {
    refetchQuestion();
  }, [refetchQuestion]);

  const handleTryAgain = useCallback(() => {
    setSubmitted(false);
    setIsCorrect(null);
    setWantHint(false);
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
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              padding: 24, textAlign: "center", color: "#64748b", fontSize: 14, background: "#0b0b1a",
            }}>
              No live class right now. Join from your dashboard when your teacher starts the session.
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
                    justifyContent: "flex-end",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {[
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
                  ].map((b, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={b.fn}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "7px 14px",
                        borderRadius: 10,
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 12,
                        color: "#fff",
                        background: b.danger ? "#ef4444" : (b as { warn?: boolean }).warn ? "#f59e0b" : b.on ? "#6366f1" : "#1c1c30",
                      }}
                    >
                      {b.icon} {b.label}
                    </button>
                  ))}
                  <div style={{ width: 1, height: 24, background: "#2a2a3e", margin: "0 4px" }} />
                  <button
                    type="button"
                    onClick={handleLeaveClass}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "7px 14px",
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
              </div>
            </>
          )}
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
                      setSparkTrigger({
                        studentId,
                        questionId: activityQuestion.activity_question_id,
                        trigger: "wrong_answer",
                        competencyId: activityQuestion.competency_id,
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
                  placeholder="Type a message..."
                  style={{
                    flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0",
                    borderRadius: 12, padding: "10px 12px", color: "#0f172a", fontSize: 12, outline: "none",
                  }}
                />
                <button
                  onClick={sendChat}
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
