/**
 * LiveSessionCards — "Next Session" card + "Your Journey" timeline for student dashboard.
 *
 * Fetches sessions from the student's enrolled live batch and shows:
 * 1. The next upcoming session as a hero card (live/locked state)
 * 2. A vertical timeline of all sessions (past = completed, future = upcoming)
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "@/api/client";

interface LiveSession {
    id: string;
    title: string | null;
    description: string | null;
    order: number | null;
    scheduled_at: string | null;
    started_at: string | null;
    ended_at: string | null;
    is_live: boolean;
    room_code_guest: string | null;
    cohort_name: string;
    cohort_id: string;
    student_name: string;
}

function useMyLiveSessions() {
    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const fetchSessions = () => {
            api.get("/students/me/live-sessions")
                .then(({ data }) => { if (active) setSessions(data); })
                .catch(() => { if (active) setSessions([]); })
                .finally(() => { if (active) setLoading(false); });
        };
        fetchSessions();
        // No polling: we only fetch when this component mounts.
        return () => { active = false; };
    }, []);

    return { sessions, loading };
}

// ─── Helpers ───

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    return target.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

function formatTime(dateStr: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function timeUntil(dateStr: string | null): string {
    if (!dateStr) return "";
    const now = new Date();
    const target = new Date(dateStr);
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return "";
    const hours = Math.floor(diffMs / 3600000);
    if (hours < 1) return `${Math.ceil(diffMs / 60000)} min`;
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""}`;
}

// ─── Styles ───
const cardBase: React.CSSProperties = {
    borderRadius: 16,
    padding: "20px 24px",
    fontFamily: "'Inter', sans-serif",
};

// ─── Next Session Card ───
export function NextSessionCard() {
    const navigate = useNavigate();
    const { sessions, loading } = useMyLiveSessions();

    if (loading) return null;
    if (!sessions.length) {
        return (
            <div
                style={{
                    ...cardBase,
                    background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                    border: "1px solid #fdba74",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    background: "#ffedd5",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 18,
                                }}
                            >
                                📅
                            </div>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    color: "#6b7280",
                                    letterSpacing: 1,
                                }}
                            >
                                Live Class
                            </span>
                        </div>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1f2937", margin: "0 0 4px" }}>
                            No class
                        </h3>
                        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 12px", lineHeight: 1.4 }}>
                            No next class planned yet.
                        </p>
                    </div>
                    <div
                        style={{
                            textAlign: "center",
                            padding: "10px 16px",
                            borderRadius: 12,
                            background: "rgba(255,255,255,0.7)",
                            minWidth: 80,
                        }}
                    >
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                            Next
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1f2937" }}>—</div>
                    </div>
                </div>
            </div>
        );
    }

    const now = new Date();
    const nowTs = now.getTime();

    const live = sessions
        .filter((s) => s.is_live)
        .sort((a, b) => {
            const at = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
            const bt = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
            return at - bt;
        })[0];

    const next = live
        ? live
        : sessions
            .filter((s) => !s.is_live && !s.ended_at && s.scheduled_at)
            .filter((s) => new Date(s.scheduled_at!).getTime() >= nowTs)
            .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0];

    if (!next) {
        return (
            <div
                style={{
                    ...cardBase,
                    background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                    border: "1px solid #fdba74",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    background: "#ffedd5",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 18,
                                }}
                            >
                                📅
                            </div>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    color: "#6b7280",
                                    letterSpacing: 1,
                                }}
                            >
                                Live Class
                            </span>
                        </div>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1f2937", margin: "0 0 4px" }}>
                            No next class planned yet
                        </h3>
                    </div>
                </div>
            </div>
        );
    }

    const dateLabel = formatDate(next.scheduled_at);
    const timeLabel = formatTime(next.scheduled_at);
    const unlockIn = timeUntil(next.scheduled_at);

    return (
        <div
            style={{
                ...cardBase,
                background: next.is_live
                    ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                    : "linear-gradient(135deg, #fef2f2 0%, #fce4e4 100%)",
                border: next.is_live ? "1px solid #86efac" : "1px solid #fca5a5",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                background: next.is_live ? "#dcfce7" : "#fee2e2",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 18,
                            }}
                        >
                            ⚡
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#6b7280", letterSpacing: 1 }}>
                            {next.is_live ? "Live Session" : "Next Live Session"}
                        </span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1f2937", margin: "0 0 4px" }}>
                        {next.title ?? `Session ${next.order ?? ""}`}
                    </h3>
                    {next.description && (
                        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 12px", lineHeight: 1.4 }}>
                            {next.description}
                        </p>
                    )}

                    {next.is_live ? (
                        <button
                            onClick={() => navigate("/live")}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 18px",
                                borderRadius: 8,
                                border: "none",
                                background: "#16a34a",
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: "pointer",
                            }}
                        >
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
                            Join Live Class
                        </button>
                    ) : (
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 14px",
                                borderRadius: 8,
                                background: "#f3f4f6",
                                color: "#9ca3af",
                                fontSize: 12,
                                fontWeight: 500,
                            }}
                        >
                            🔒 {unlockIn ? `Starts in ${unlockIn}` : "Class not started yet"}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        textAlign: "center",
                        padding: "10px 16px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.7)",
                        minWidth: 80,
                    }}
                >
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                        {dateLabel}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1f2937" }}>{timeLabel}</div>
                </div>
            </div>
        </div>
    );
}

// ─── Your Journey Card ───
export function YourJourneyCard() {
    const { sessions } = useMyLiveSessions();

    if (!sessions.length) {
        return (
            <div
                style={{
                    ...cardBase,
                    background: "#faf9f6",
                    border: "1px solid #e5e7eb",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>🕐</span>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1f2937", margin: 0 }}>Your Journey</h3>
                </div>
                <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.4 }}>
                    No sessions yet. Your journey will appear here as you attend live sessions.
                </div>
            </div>
        );
    }

    const now = new Date();
    const nowTs = now.getTime();

    const liveSessions = sessions.filter((s) => s.is_live);
    const nextUpcoming = sessions
        .filter((s) => !s.is_live && !s.ended_at && s.scheduled_at)
        .filter((s) => new Date(s.scheduled_at!).getTime() >= nowTs)
        .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0];

    const currentOrNext =
        liveSessions.sort((a, b) => {
            const at = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
            const bt = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
            return at - bt;
        })[0] ?? nextUpcoming;

    const sorted = [...sessions]
        .filter((s) => s.scheduled_at)
        .sort((a, b) => (b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0) - (a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0));

    return (
        <div
            style={{
                ...cardBase,
                background: "#faf9f6",
                border: "1px solid #e5e7eb",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>🕐</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1f2937", margin: 0 }}>Your Journey</h3>
            </div>

            <div style={{ position: "relative", paddingLeft: 20, maxHeight: 420, overflowY: "auto", paddingRight: 8 }}>
                {/* Vertical line */}
                <div
                    style={{
                        position: "absolute",
                        left: 6,
                        top: 8,
                        bottom: 8,
                        width: 2,
                        background: "#e5e7eb",
                    }}
                />

                {sorted.map((sess, i) => {
                    const completed =
                        !!sess.ended_at ||
                        (!sess.is_live && sess.scheduled_at ? new Date(sess.scheduled_at).getTime() < nowTs : false);
                    const isCurrentOrNext = currentOrNext?.id === sess.id;

                    // Dot color: dark indigo for next/current, green for completed, gray for upcoming
                    let dotColor = "#d1d5db"; // gray — upcoming
                    if (sess.is_live || isCurrentOrNext) dotColor = "#6366f1";
                    else if (completed) dotColor = "#10b981";

                    return (
                        <div
                            key={sess.id}
                            style={{
                                position: "relative",
                                paddingBottom: i < sorted.length - 1 ? 16 : 0,
                                paddingLeft: 16,
                            }}
                        >
                            {/* Dot */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: -17,
                                    top: 4,
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    background: dotColor,
                                    border: "2px solid #faf9f6",
                                }}
                            />

                            <div style={{ fontWeight: 600, fontSize: 14, color: "#1f2937" }}>
                                {sess.title ?? `Session ${sess.order ?? ""}`}
                            </div>
                            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                                {sess.is_live
                                    ? "Happening now"
                                    : completed
                                        ? `Completed ${formatDate(sess.ended_at ?? sess.scheduled_at)}`
                                        : `${formatDate(sess.scheduled_at)}, ${formatTime(sess.scheduled_at)}`}
                            </div>

                            {/* Action buttons for past sessions */}
                            {completed && (
                                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                                    <span
                                        style={{
                                            display: "inline-block",
                                            padding: "3px 10px",
                                            borderRadius: 6,
                                            border: "1px solid #e5e7eb",
                                            fontSize: 11,
                                            color: "#6b7280",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Review &gt;
                                    </span>
                                </div>
                            )}

                            {/* Live badge */}
                            {sess.is_live && (
                                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                                    <span
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            background: "#4ade80",
                                            display: "inline-block",
                                        }}
                                    />
                                    <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>LIVE NOW</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
