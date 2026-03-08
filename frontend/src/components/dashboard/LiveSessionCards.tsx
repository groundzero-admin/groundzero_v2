/**
 * LiveSessionCards — "Next Session" card + "Your Journey" timeline for student dashboard.
 *
 * Fetches sessions from the student's enrolled live batch and shows:
 * 1. The next upcoming session as a hero card (live/locked state)
 * 2. A vertical timeline of all sessions (past = completed, future = upcoming)
 */
import { useEffect, useState } from "react";
import { api } from "@/api/client";

interface LiveSession {
    id: string;
    title: string;
    description: string | null;
    day: number;
    order: number;
    scheduled_date: string | null;
    daily_timing: string | null;
    is_live: boolean;
    hms_room_code_host: string | null;
    hms_room_code_guest: string | null;
    batch_name: string;
    batch_id: string;
    student_name: string;
}

function useMyLiveSessions() {
    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/students/me/live-sessions")
            .then(({ data }) => setSessions(data))
            .catch(() => setSessions([]))
            .finally(() => setLoading(false));
    }, []);

    return { sessions, loading };
}

// ─── Helpers ───

/** Parse "2026-03-06" as a LOCAL date (not UTC) */
function parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d); // months are 0-indexed
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
    const target = parseLocalDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    return target.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(timing: string | null): string {
    if (!timing) return "";
    const start = timing.split("-")[0]?.trim();
    if (!start) return timing;
    const [h, m] = start.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function isPast(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parseLocalDate(dateStr) < today;
}

function timeUntil(dateStr: string | null, timing: string | null): string {
    if (!dateStr) return "";
    const now = new Date();
    const target = new Date(dateStr);
    if (timing) {
        const start = timing.split("-")[0]?.trim();
        if (start) {
            const [h, m] = start.split(":").map(Number);
            target.setHours(h, m, 0, 0);
        }
    }
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
    const { sessions, loading } = useMyLiveSessions();

    if (loading) return null;
    if (!sessions.length) return null;

    // Find the next upcoming session (not past)
    const upcoming = sessions.filter((s) => !isPast(s.scheduled_date));
    const next = upcoming[0];
    if (!next) return null;

    const dateLabel = formatDate(next.scheduled_date);
    const timeLabel = formatTime(next.daily_timing);
    const unlockIn = timeUntil(next.scheduled_date, next.daily_timing);

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
                            Live Session
                        </span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1f2937", margin: "0 0 4px" }}>
                        Session {next.day}: {next.title}
                    </h3>
                    {next.description && (
                        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 12px", lineHeight: 1.4 }}>
                            {next.description}
                        </p>
                    )}

                    {next.is_live ? (
                        <button
                            onClick={() => {
                                const code = next.hms_room_code_host || next.hms_room_code_guest;
                                if (code) {
                                    window.open(
                                        `/student/live-class?roomCode=${encodeURIComponent(code)}&userName=${encodeURIComponent(next.student_name)}`,
                                        "_blank"
                                    );
                                }
                            }}
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
                            🔒 {unlockIn ? `Class unlocks in ${unlockIn}` : "Class not started yet"}
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
    const { sessions, loading } = useMyLiveSessions();

    // Split into past + at most 2 upcoming, then reverse (newest first)
    const pastSessions = sessions.filter((s) => isPast(s.scheduled_date));
    const upcomingSessions = sessions.filter((s) => !isPast(s.scheduled_date)).slice(0, 2);
    const sorted = [...pastSessions, ...upcomingSessions].reverse();

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

            <div style={{ position: "relative", paddingLeft: 20 }}>
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
                    const past = isPast(sess.scheduled_date);
                    const isNext = !past && (i === sorted.length - 1 || isPast(sorted[i + 1]?.scheduled_date));

                    // Dot color: blue for next/current, green for past, gray for future
                    let dotColor = "#d1d5db"; // gray — future
                    if (isNext || sess.is_live) dotColor = "#6366f1"; // indigo — current
                    else if (past) dotColor = "#10b981"; // green — done

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
                                Session {sess.day}: {sess.title}
                            </div>
                            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                                {past
                                    ? `Completed ${formatDate(sess.scheduled_date)}`
                                    : `${formatDate(sess.scheduled_date)}${sess.daily_timing ? ", " + formatTime(sess.daily_timing) : ""}`}
                            </div>

                            {/* Action buttons for past sessions */}
                            {past && (
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
