import { useState } from "react";
import { Mic, MicOff, Video, VideoOff, Monitor, Hand, CheckCircle, AlertTriangle, MessageCircle, PenLine } from "lucide-react";
import type { Session, SessionActivity, LivePulseEvent, StudentScore } from "@/api/types";
import LessonPlan from "./LessonPlan";
import * as s from "./SessionCockpit.css";

// Reuse the same mock data from VideoArea
const MOCK_STUDENTS = ["A", "R", "S", "M", "P"];
const STUDENT_COLORS = [
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
];

// Inline the video styles to keep it self-contained
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
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    color: "#fff",
    fontWeight: 700,
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  },
  name: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: 700,
    textShadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 12px",
    borderRadius: "999px",
    backgroundColor: "rgba(229, 62, 62, 0.9)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },
  thumbnails: {
    display: "flex",
    gap: "8px",
    padding: "0 24px 12px",
    background: "rgba(0,0,0,0.15)",
  },
  thumb: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "2px solid rgba(255,255,255,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 700,
    color: "#fff",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "10px 24px",
    background: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(8px)",
  },
  controlBtn: {
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
}: SessionCockpitProps) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const currentActivity = activities.find((a) => a.status === "active");

  return (
    <div className={s.root}>
      {/* Left: Video + Session info + Lesson plan (combined) */}
      <div className={s.mainCol}>
        {/* Video strip */}
        <div style={videoStyles.root}>
          <div style={videoStyles.main}>
            <div style={videoStyles.badge}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#fff" }} />
              LIVE
            </div>
            <div style={videoStyles.avatar}>T</div>
            <div style={videoStyles.name}>Teacher</div>
          </div>
          <div style={videoStyles.thumbnails}>
            {MOCK_STUDENTS.map((initial, i) => (
              <div key={i} style={{ ...videoStyles.thumb, background: STUDENT_COLORS[i] }}>
                {initial}
              </div>
            ))}
          </div>
          <div style={videoStyles.controls}>
            <button style={videoStyles.controlBtn} onClick={() => setMicOn(!micOn)}>
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button style={videoStyles.controlBtn} onClick={() => setCamOn(!camOn)}>
              {camOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
            <button style={videoStyles.controlBtn}><Monitor size={18} /></button>
            <button style={videoStyles.controlBtn}><Hand size={18} /></button>
          </div>
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
              Started {new Date(session.started_at).toLocaleTimeString()}
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
