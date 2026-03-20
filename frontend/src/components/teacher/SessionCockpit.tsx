import { useState, useEffect, useRef } from "react";
import {
  useHMSActions,
  useHMSStore,
  useVideo,
  selectPeers,
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsLocalScreenShared,
} from "@100mslive/react-sdk";
import { CheckCircle, AlertTriangle, MessageCircle, PenLine } from "lucide-react";
import type { Session, SessionActivity, LivePulseEvent, StudentScore } from "@/api/types";
import LessonPlan from "./LessonPlan";
import * as s from "./SessionCockpit.css";

/* ── Small video tile ── */
function Tile({ trackId, label, style: extraStyle }: {
  trackId: string | undefined;
  label: string;
  style?: React.CSSProperties;
}) {
  const { videoRef } = useVideo({ trackId: trackId ?? "" });
  return (
    <div style={{ position: "relative", background: "#1a1a2e", borderRadius: 8, overflow: "hidden", ...extraStyle }}>
      {trackId ? (
        <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000" }} autoPlay muted playsInline />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", fontSize: 20, background: "linear-gradient(135deg,#1e1e2e,#252540)", color: "#555" }}>
          {label.charAt(0)?.toUpperCase() ?? "?"}
        </div>
      )}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "3px 6px", background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
        <span style={{ fontSize: 9, fontWeight: 500, color: "#fff" }}>{label}</span>
      </div>
    </div>
  );
}

const videoStyles = {
  root: {
    position: "relative" as const,
    borderRadius: "16px",
    overflow: "hidden",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "300px",
  },
  controls: {
    position: "relative" as const,
    zIndex: 20,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "12px 16px",
    background: "rgba(0,0,0,0.5)",
  },
  controlBtn: {
    position: "relative" as const,
    zIndex: 21,
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  controlBtnDanger: {
    backgroundColor: "rgba(229, 62, 62, 0.8)",
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function eventToFeed(e: LivePulseEvent) {
  const name = e.student_name.split(" ")[0]; // first name only
  const comp = e.competency_name ?? e.competency_id;

  if (e.source === "llm_spark") {
    return { icon: "chat" as const, text: `${name} chatted with SPARK`, detail: comp };
  }
  if (e.source === "facilitator") {
    return { icon: "note" as const, text: `Teacher noted ${name}`, detail: comp };
  }
  if (e.outcome >= 0.7) {
    return { icon: "success" as const, text: `${name} answered correctly`, detail: comp };
  }
  if (e.outcome < 0.4) {
    return { icon: "struggle" as const, text: `${name} struggling`, detail: comp };
  }
  return { icon: "success" as const, text: `${name} responded`, detail: comp };
}

interface SessionCockpitProps {
  session: Session;
  activities: SessionActivity[];
  pulseEvents?: LivePulseEvent[];
  sessionScores: StudentScore[];
  onLaunch: (activityId: string) => void;
  onEndSession: () => void;
  isLaunching?: boolean;
  isEnding?: boolean;
  roomCodeHost?: string | null;
  onStartHms?: (sessionId: string) => void;
}

export default function SessionCockpit({
  session,
  activities,
  pulseEvents,
  sessionScores,
  onLaunch,
  onEndSession,
  isLaunching,
  isEnding,
  roomCodeHost,
  onStartHms,
}: SessionCockpitProps) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers: any[] = (useHMSStore(selectPeers) as any[]) || [];
  const isAudioOn = useHMSStore(selectIsLocalAudioEnabled);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const isScreenShared = useHMSStore(selectIsLocalScreenShared);
  const joinedRef = useRef(false);
  const [hmsStarting, setHmsStarting] = useState(false);

  // Auto-join HMS when roomCodeHost is available
  useEffect(() => {
    if (!roomCodeHost || joinedRef.current) return;
    joinedRef.current = true;
    (async () => {
      try {
        const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode: roomCodeHost });
        await hmsActions.join({
          userName: "Teacher",
          authToken,
          settings: { isAudioMuted: false, isVideoMuted: false },
        });
      } catch {
        // HMS join failed — video just won't show
      }
    })();
    return () => { hmsActions.leave(); joinedRef.current = false; };
  }, [roomCodeHost]);

  useEffect(() => {
    const h = () => hmsActions.leave();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [hmsActions]);

  // Build tiles
  const tiles: { id: string; trackId: string | undefined; label: string; isScreen: boolean }[] = [];
  for (const p of peers) {
    if (p.auxiliaryTracks?.length) {
      tiles.push({ id: `screen-${p.id}`, trackId: p.auxiliaryTracks[0], label: `🖥️ ${p.name || "?"}`, isScreen: true });
    }
  }
  for (const p of peers) {
    tiles.push({ id: p.id, trackId: p.videoTrack, label: `${p.name || "?"}${p.isLocal ? " (You)" : ""}`, isScreen: false });
  }

  const currentActivity = activities.find((a) => a.status === "active");

  return (
    <div className={s.root}>
      {/* Left: Video + Session info + Lesson plan (combined) */}
      <div className={s.mainCol}>
        {/* Video area */}
        <div style={videoStyles.root}>
          {isConnected ? (
            <>
              {/* Live badge */}
              <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10, display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 999, backgroundColor: "rgba(229,62,62,0.9)", color: "#fff", fontSize: 10, fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                LIVE · {peers.length}
              </div>
              {/* Grid */}
              <div style={{ flex: 1, display: "grid", gap: 4, padding: 6, alignContent: "start", gridTemplateColumns: tiles.length <= 1 ? "1fr" : tiles.length <= 4 ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {tiles.map(t => (
                  <Tile key={t.id} trackId={t.trackId} label={t.label} style={{ width: "100%", aspectRatio: "16/9" }} />
                ))}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 10,
                  transform: "translateX(-50%)",
                  zIndex: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <button
                  type="button"
                  style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", color: "#fff", fontWeight: 600, fontSize: 13, background: isAudioOn ? "#4a5568" : "#e53e3e" }}
                  onClick={() => { hmsActions.setLocalAudioEnabled(!isAudioOn); }}
                >
                  {isAudioOn ? "Mute" : "Unmute"}
                </button>
                <button
                  type="button"
                  style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", color: "#fff", fontWeight: 600, fontSize: 13, background: isVideoOn ? "#4a5568" : "#e53e3e" }}
                  onClick={() => { hmsActions.setLocalVideoEnabled(!isVideoOn); }}
                >
                  {isVideoOn ? "Cam Off" : "Cam On"}
                </button>
                <button
                  type="button"
                  style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", color: "#fff", fontWeight: 600, fontSize: 13, background: isScreenShared ? "#d69e2e" : "#4a5568" }}
                  onClick={() => { hmsActions.setScreenShareEnabled(!isScreenShared); }}
                >
                  {isScreenShared ? "Stop Share" : "Share Screen"}
                </button>
              </div>
            </>
          ) : (
            /* Not connected — show start button or connecting */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              {roomCodeHost ? (
                <div style={{ color: "#999", fontSize: 14 }}>Connecting to video...</div>
              ) : onStartHms ? (
                <button
                  onClick={async () => { setHmsStarting(true); onStartHms(session.id); }}
                  disabled={hmsStarting}
                  style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                >
                  {hmsStarting ? "Starting Video..." : "Start Video Call"}
                </button>
              ) : (
                <div style={{ color: "#666", fontSize: 14 }}>Video not available</div>
              )}
            </div>
          )}
        </div>

        {/* Session header */}
        <div className={s.sessionHeader}>
          <div className={s.sessionInfo}>
            <div className={s.sessionTitle}>
              Session {session.session_number}
              <span className={s.liveBadge}>
                <span className={s.liveDot} /> Live
              </span>
            </div>
            <div className={s.sessionMeta}>
              {currentActivity
                ? `Active: ${currentActivity.activity_name ?? currentActivity.activity_id}`
                : "No activity launched yet"}
              {" · "}
              Started {session.started_at ? new Date(session.started_at).toLocaleTimeString() : ""}
            </div>
          </div>
        </div>

        <div className={s.sectionLabel}>Lesson Plan</div>

        <div className={s.planScroll}>
          <LessonPlan
            activities={activities}
            onLaunch={onLaunch}
            isLaunching={isLaunching}
          />
        </div>

        <button
          className={s.endBtn}
          onClick={onEndSession}
          disabled={isEnding}
        >
          {isEnding ? "Ending..." : "End Session"}
        </button>
      </div>

      {/* Right: Scoreboard + Live Feed */}
      <div className={s.pulseCol}>
        {/* Student Scores */}
        <div className={s.pulseTitle}>Student Scores</div>
        <div className={s.scoreBoard}>
          {sessionScores.some((sc) => sc.total > 0) ? (
            sessionScores.map((sc) => {
              const pct = sc.total > 0 ? Math.round((sc.correct / sc.total) * 100) : 0;
              const firstName = sc.student_name.split(" ")[0];
              return (
                <div key={sc.student_id} className={s.scoreRow}>
                  <span className={s.scoreName}>{firstName}</span>
                  {sc.total > 0 ? (
                    <>
                      <div className={s.scoreBarWrap}>
                        <div
                          className={s.scoreBar}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct >= 70 ? "#38A169" : pct >= 40 ? "#D69E2E" : "#E53E3E",
                          }}
                        />
                      </div>
                      <span className={s.scoreLabel}>{sc.correct}/{sc.total}</span>
                    </>
                  ) : (
                    <span className={s.pulseEmpty}>—</span>
                  )}
                </div>
              );
            })
          ) : (
            <p className={s.pulseEmpty}>Waiting for responses...</p>
          )}
        </div>

        {/* Live Feed */}
        <div className={s.pulseTitle}>Live Feed</div>
        <div className={s.pulseFeed}>
          {pulseEvents?.length ? (
            pulseEvents.slice(0, 10).map((e) => {
              const feed = eventToFeed(e);
              return (
                <div key={e.id} className={s.pulseEvent}>
                  <span className={s.pulseIcon}>
                    {feed.icon === "success" && <CheckCircle size={14} color="#38A169" />}
                    {feed.icon === "struggle" && <AlertTriangle size={14} color="#E53E3E" />}
                    {feed.icon === "chat" && <MessageCircle size={14} color="#3182CE" />}
                    {feed.icon === "note" && <PenLine size={14} color="#805AD5" />}
                  </span>
                  <div className={s.pulseBody}>
                    <span className={s.pulseName}>{feed.text}</span>
                    {" "}
                    <span className={s.pulseDetail}>— {feed.detail}</span>
                  </div>
                  <span className={s.pulseTime}>{timeAgo(e.created_at)}</span>
                </div>
              );
            })
          ) : (
            <p className={s.pulseEmpty}>No activity yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
