import { Flame, BookOpen, Wrench, Bot, Palette, Radio, Pause, CheckCircle2, LayoutGrid } from "lucide-react";
import type { SessionActivity } from "@/api/types";

/** Default filter: show every activity in session order (avoids missing new activities that use a different type). */
const FILTER_ALL = "__all__";

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    warmup:    { icon: <Flame size={16} />,    color: "#f59e0b", label: "Warm-up" },
    key_topic: { icon: <BookOpen size={16} />, color: "#6366f1", label: "Key Topic" },
    diy:       { icon: <Wrench size={16} />,   color: "#10b981", label: "DIY" },
    ai_lab:    { icon: <Bot size={16} />,      color: "#ec4899", label: "AI Lab" },
    artifact:  { icon: <Palette size={16} />,  color: "#8b5cf6", label: "Artifact" },
};

export function ActivitiesTab({ activities, sessionId, activityInfoById, launchActivity, pauseActivity, activeType, setActiveType }: {
    activities: SessionActivity[];
    sessionId: string;
    activityInfoById: Map<string, { description?: string | null; questionCount?: number }>;
    launchActivity: { mutate: (p: { sessionId: string; activityId: string }) => void; isPending: boolean };
    pauseActivity: { mutate: (id: string) => void; isPending: boolean };
    activeType: string | null;
    setActiveType: (t: string | null) => void;
}) {
    const typeCounts: Record<string, number> = {};
    for (const a of activities) {
        const t = a.activity_type ?? "other";
        typeCounts[t] = (typeCounts[t] || 0) + 1;
    }
    const availableTypes = Object.keys(typeCounts);
    const selectedType = activeType ?? FILTER_ALL;
    const showAll = selectedType === FILTER_ALL;
    const filtered = showAll
        ? [...activities].sort((a, b) => a.order - b.order)
        : activities.filter((a) => (a.activity_type ?? "other") === selectedType);

    return (
        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: 1, minHeight: 0, overflowY: "auto" }}>
            {/* Type chips — "All" is default so mid-class additions always appear */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                    type="button"
                    onClick={() => setActiveType(null)}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 12px",
                        borderRadius: 999,
                        border: showAll ? "1px solid #6366f155" : "1px solid #e2e8f0",
                        background: showAll ? "#eef2ff" : "#f8fafc",
                        color: showAll ? "#0f172a" : "#334155",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 800,
                        boxShadow: showAll ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
                    }}
                >
                    <span style={{ width: 22, height: 22, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#6366f118", color: "#6366f1" }}>
                        <LayoutGrid size={14} />
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
                        All
                        <span style={{ fontSize: 10, fontWeight: 900, color: "#64748b" }}>{activities.length}</span>
                    </span>
                </button>
                {availableTypes.map(t => {
                    const meta = TYPE_META[t] ?? { icon: <BookOpen size={14} />, color: "#888", label: t };
                    const isActive = !showAll && t === selectedType;
                    const doneCount = activities.filter(a => (a.activity_type ?? "other") === t && a.status === "completed").length;
                    return (
                        <button key={t} onClick={() => setActiveType(t)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 999, border: isActive ? `1px solid ${meta.color}55` : "1px solid #e2e8f0", background: isActive ? `${meta.color}12` : "#f8fafc", color: isActive ? "#0f172a" : "#334155", cursor: "pointer", fontSize: 11, fontWeight: 800, boxShadow: isActive ? `0 0 0 3px ${meta.color}14` : "none" }}>
                            <span style={{ width: 22, height: 22, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: `${meta.color}18`, color: meta.color }}>{meta.icon}</span>
                            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
                                {meta.label}
                                <span style={{ fontSize: 10, fontWeight: 900, color: "#64748b" }}>{doneCount}/{typeCounts[t]}</span>
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Activity list */}
            {filtered.map(a => {
                const isLive = a.status === "active";
                const isDone = a.status === "completed";
                const isPaused = a.status === "paused";
                const info = activityInfoById.get(a.activity_id);
                return (
                    <div key={a.id} style={{ background: isLive ? "#dcfce7" : isPaused ? "#ffedd5" : "#f8fafc", border: isLive ? "1px solid #22c55e55" : isPaused ? "1px solid #f59e0b55" : "1px solid #e2e8f0", borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 900, fontSize: 12, color: isDone ? "#94a3b8" : "#0f172a" }}>
                                {isDone   && <CheckCircle2 size={12} color="#22c55e" style={{ marginRight: 4, verticalAlign: "middle" }} />}
                                {isLive   && <Radio        size={12} color="#22c55e" style={{ marginRight: 4, verticalAlign: "middle" }} />}
                                {isPaused && <Pause        size={12} color="#f59e0b" style={{ marginRight: 4, verticalAlign: "middle" }} />}
                                {a.activity_name ?? a.activity_id}
                            </div>
                            {(info?.description || info?.questionCount != null) && (
                                <div style={{ fontSize: 10, color: "#475569", marginTop: 4, lineHeight: 1.2 }}>
                                    {info?.description && <div style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{info.description}</div>}
                                    {info?.questionCount != null && <div style={{ marginTop: info?.description ? 3 : 0, fontWeight: 800, color: "#334155" }}>{info.questionCount} questions</div>}
                                </div>
                            )}
                            <div style={{ fontSize: 10, color: "#64748b", marginTop: 6 }}>
                                {a.duration_minutes ? `${a.duration_minutes} min` : ""}
                                {a.launched_at ? ` · ${new Date(a.launched_at).toLocaleTimeString()}` : ""}
                                {isPaused && <span style={{ color: "#b45309", marginLeft: 6, fontWeight: 800 }}>Paused</span>}
                            </div>
                        </div>
                        {!isDone && (
                            <div style={{ display: "flex", gap: 4 }}>
                                {isLive && <button onClick={() => pauseActivity.mutate(sessionId)} disabled={pauseActivity.isPending} style={{ padding: "6px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 900, fontSize: 11, color: "#fff", background: "#f59e0b" }}>Pause</button>}
                                {!isLive && <button onClick={() => launchActivity.mutate({ sessionId, activityId: a.activity_id })} disabled={launchActivity.isPending} style={{ padding: "6px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 900, fontSize: 11, color: "#fff", background: isPaused ? "#f59e0b" : "#6366f1" }}>{isPaused ? "Resume" : "Launch"}</button>}
                            </div>
                        )}
                    </div>
                );
            })}
            {!activities.length && <div style={{ textAlign: "center", padding: 20, opacity: 0.4, fontSize: 12 }}>No activities for this session</div>}
        </div>
    );
}
