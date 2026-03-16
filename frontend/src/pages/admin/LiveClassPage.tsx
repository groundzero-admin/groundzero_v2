/**
 * LiveClassPage — Teacher live class with 3-panel layout:
 *   Left: Video grid (pin/spotlight/screen share)
 *   Right: Tabbed sidebar (Activities | Live Feed | Chat)
 *   Bottom: Controls (mic, cam, screen share, end class)
 */
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router";
import {
    useHMSActions,
    useHMSStore,
    useVideo,
    selectPeers,
    selectIsConnectedToRoom,
    selectHMSMessages,
    selectIsLocalAudioEnabled,
    selectIsLocalVideoEnabled,
    selectIsLocalScreenShared,
} from "@100mslive/react-sdk";
import { api } from "@/api/client";
import {
    useSessionActivities,
    useLaunchActivity,
    usePauseActivity,
    useLivePulse,
    useSessionScores,
    useEndSession,
} from "@/api/hooks/useTeacher";
import {
    Flame, BookOpen, Wrench, Bot, Palette, Radio, Pause,
    CheckCircle2, Mic, MicOff, Camera, CameraOff, Monitor,
    MonitorOff, PhoneOff,
} from "lucide-react";

/* ── type meta for activity cards ── */
const TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    warmup: { icon: <Flame size={16} />, color: "#f59e0b", label: "Warm-up" },
    key_topic: { icon: <BookOpen size={16} />, color: "#6366f1", label: "Key Topic" },
    diy: { icon: <Wrench size={16} />, color: "#10b981", label: "DIY" },
    ai_lab: { icon: <Bot size={16} />, color: "#ec4899", label: "AI Lab" },
    artifact: { icon: <Palette size={16} />, color: "#8b5cf6", label: "Artifact" },
};

/* ───────── Video Tile ───────── */
function VideoTile({
    trackId, label, isPinned, isLarge, onPin, onMute, style,
}: {
    trackId: string | undefined;
    label: string;
    isPinned: boolean;
    isLarge?: boolean;
    onPin: () => void;
    onMute?: () => void;
    style?: React.CSSProperties;
}) {
    const { videoRef } = useVideo({ trackId: trackId ?? "" });
    return (
        <div
            onClick={onPin}
            style={{
                position: "relative", background: "#1a1a2e", borderRadius: isLarge ? 12 : 8,
                overflow: "hidden", cursor: "pointer",
                border: isPinned ? "2px solid #fbbf24" : "2px solid transparent",
                transition: "border-color 0.2s", ...style,
            }}
        >
            {trackId ? (
                <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: isLarge ? "contain" : "cover", background: "#000" }} autoPlay muted playsInline />
            ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", fontSize: isLarge ? 56 : 28, background: "linear-gradient(135deg,#1e1e2e,#252540)", color: "#555" }}>
                    {label.replace("🖥️ ", "").charAt(0)?.toUpperCase() ?? "?"}
                </div>
            )}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: isLarge ? "8px 12px" : "4px 6px", background: "linear-gradient(transparent, rgba(0,0,0,0.75))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: isLarge ? 12 : 10, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
                <div style={{ display: "flex", gap: 3, alignItems: "center", flexShrink: 0 }}>
                    {isPinned && <span style={{ fontSize: 10, color: "#fbbf24" }}>📌</span>}
                    {onMute && (
                        <button onClick={(e) => { e.stopPropagation(); onMute(); }} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 4, padding: "1px 5px", color: "#fff", cursor: "pointer", fontSize: 9 }}>
                            🔇
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ───────── Main Page ───────── */
export default function LiveClassPage() {
    const [params] = useSearchParams();
    const roomCode = params.get("roomCode") || "";
    const userName = params.get("userName") || "Teacher";
    const cohortId = params.get("cohortId") || "";
    const sessionId = params.get("sessionId") || "";

    const hmsActions = useHMSActions();
    const isConnected = useHMSStore(selectIsConnectedToRoom);
    const peers: any[] = (useHMSStore(selectPeers) as any[]) || [];
    const messages: any[] = (useHMSStore(selectHMSMessages) as any[]) || [];
    const isAudioOn = useHMSStore(selectIsLocalAudioEnabled);
    const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
    const isScreenShared = useHMSStore(selectIsLocalScreenShared);

    const [pinnedId, setPinnedId] = useState<string | null>(null);
    const [chatText, setChatText] = useState("");
    const [activeTab, setActiveTab] = useState<"activities" | "feed" | "chat">("activities");
    const [activeType, setActiveType] = useState<string | null>(null);
    const [joinError, setJoinError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // ── Data hooks ──
    const { data: sessionActivities } = useSessionActivities(sessionId || undefined);
    const { data: pulseEvents } = useLivePulse(cohortId || undefined, sessionId || undefined);
    const { data: sessionScores } = useSessionScores(cohortId || undefined, sessionId || undefined);
    const launchActivity = useLaunchActivity();
    const pauseActivity = usePauseActivity();
    const endSession = useEndSession();

    // ── Join HMS room ──
    useEffect(() => {
        if (!roomCode) return;
        (async () => {
            try {
                const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode });
                await hmsActions.join({ userName, authToken });
            } catch (err: any) {
                const msg = err?.message || err?.description || String(err);
                setJoinError(msg.includes("not active") || msg.includes("403")
                    ? "This class has not started yet."
                    : `Failed to join: ${msg}`);
            }
        })();
        return () => { hmsActions.leave(); };
    }, [roomCode]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
    useEffect(() => {
        const h = () => hmsActions.leave();
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, [hmsActions]);

    // ── End class ──
    async function handleEndClass() {
        if (!sessionId || !cohortId) return;
        endSession.mutate(sessionId);
        try {
            await api.post(`/cohorts/${cohortId}/sessions/${sessionId}/end-class`);
        } catch { }
        await hmsActions.endRoom(false, "Class ended by teacher");
        window.close();
    }

    // ── Error / Loading ──
    if (joinError) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0b0b1a", color: "#fff", fontFamily: "'Inter',sans-serif", gap: 16 }}>
                <div style={{ fontSize: 48 }}>📡</div>
                <div style={{ fontSize: 18, fontWeight: 600, textAlign: "center", maxWidth: 380 }}>{joinError}</div>
                <button onClick={() => window.close()} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Close Tab</button>
            </div>
        );
    }
    if (!isConnected && roomCode) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0b0b1a", color: "#fff", fontFamily: "'Inter',sans-serif", fontSize: 16 }}>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <div style={{ width: 24, height: 24, border: "3px solid #222", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin .7s linear infinite", marginRight: 10 }} />
                Joining class…
            </div>
        );
    }

    /* ── Build tile data ── */
    interface TileData { id: string; trackId: string | undefined; label: string; isScreen: boolean; peerId: string; isLocal: boolean; audioTrack?: string; }
    const tiles: TileData[] = [];
    for (const p of peers) {
        if (p.auxiliaryTracks?.length) {
            tiles.push({ id: `screen-${p.id}`, trackId: p.auxiliaryTracks[0], label: `🖥️ ${p.name || "?"}`, isScreen: true, peerId: p.id, isLocal: p.isLocal });
        }
    }
    for (const p of peers) {
        tiles.push({ id: p.id, trackId: p.videoTrack, label: `${p.name || "?"}${p.isLocal ? " (You)" : ""}`, isScreen: false, peerId: p.id, isLocal: p.isLocal, audioTrack: p.audioTrack });
    }

    const hasScreenShare = tiles.some((t) => t.isScreen);
    let spotlightTile: TileData | null = null;
    if (pinnedId) spotlightTile = tiles.find((t) => t.id === pinnedId) || null;
    else if (hasScreenShare) spotlightTile = tiles.find((t) => t.isScreen) || null;
    else spotlightTile = tiles.find((t) => !t.isScreen && !t.isLocal) ?? tiles[0] ?? null;

    async function sendMessage() {
        if (!chatText.trim()) return;
        await hmsActions.sendBroadcastMessage(chatText.trim());
        setChatText("");
    }
    function makeMuteHandler(tile: TileData) {
        if (tile.isLocal || tile.isScreen || !tile.audioTrack) return undefined;
        return async () => {
            try { await hmsActions.setRemoteTrackEnabled(tile.audioTrack!, false); } catch { }
        };
    }

    // ── Activity data ──
    const activities = sessionActivities ?? [];
    const typeCounts: Record<string, number> = {};
    for (const a of activities) {
        const t = a.activity_type ?? "other";
        typeCounts[t] = (typeCounts[t] || 0) + 1;
    }
    const availableTypes = Object.keys(typeCounts);
    const selectedType = activeType ?? availableTypes[0] ?? null;
    const filteredActivities = activities.filter((a) => (a.activity_type ?? "other") === selectedType);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0b0b1a", color: "#fff", fontFamily: "'Inter',sans-serif" }}>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}} ::-webkit-scrollbar{width:4px;height:4px} ::-webkit-scrollbar-thumb{background:#333;border-radius:4px}`}</style>

            {/* ═══ HEADER ═══ */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px", background: "#101020", borderBottom: "1px solid #1c1c30", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>🎥 Live Class</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#4ade80" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse 1.5s infinite" }} />
                        {peers.length} joined
                    </div>
                    {hasScreenShare && <span style={{ fontSize: 9, background: "#f59e0b18", color: "#f59e0b", padding: "1px 6px", borderRadius: 6, fontWeight: 600 }}>🖥️ Screen shared</span>}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                    {pinnedId && <button onClick={() => setPinnedId(null)} style={{ background: "#fbbf2420", border: "1px solid #fbbf2440", borderRadius: 6, padding: "2px 10px", color: "#fbbf24", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Unpin</button>}
                </div>
            </div>

            {/* ═══ BODY ═══ */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

                {/* ── VIDEO AREA ── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

                    {/* Spotlight */}
                    <div style={{ flex: 1, minHeight: 0, padding: 6, paddingBottom: 4, position: "relative" }}>
                        {spotlightTile ? (() => {
                            // Does the spotlighted peer also have a screen share?
                            const peerScreenTile = tiles.find(t => t.isScreen && t.peerId === spotlightTile!.peerId);
                            // Camera tile for the same peer (used for PiP when screen is in spotlight)
                            const peerCamTile = tiles.find(t => !t.isScreen && t.peerId === spotlightTile!.peerId);
                            // Resolve what goes in the big area
                            const bigTile = peerScreenTile ?? (spotlightTile.isScreen ? spotlightTile : null);
                            const pipTile = bigTile ? (peerScreenTile ? peerCamTile : null) : null;

                            return bigTile ? (
                                /* ── Screen share mode: screen big + camera PiP ── */
                                <div style={{ width: "100%", height: "100%", position: "relative" }}>
                                    <VideoTile
                                        trackId={bigTile.trackId}
                                        label={bigTile.label}
                                        isPinned={false} isLarge onPin={() => { }}
                                        style={{ width: "100%", height: "100%", borderRadius: 12 }}
                                    />
                                    {pipTile && (
                                        <div style={{
                                            position: "absolute", bottom: 10, right: 10,
                                            width: 140, height: 96, borderRadius: 10, overflow: "hidden",
                                            border: "2px solid rgba(99,102,241,0.7)",
                                            boxShadow: "0 4px 20px rgba(0,0,0,0.5)", zIndex: 5,
                                        }}>
                                            <VideoTile
                                                trackId={pipTile.trackId} label={pipTile.label}
                                                isPinned={false} onPin={() => { }}
                                                style={{ width: "100%", height: "100%", borderRadius: 0 }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* ── Camera-only mode ── */
                                <VideoTile
                                    trackId={spotlightTile.trackId}
                                    label={spotlightTile.label}
                                    isPinned={!!pinnedId} isLarge
                                    onPin={() => setPinnedId(null)}
                                    onMute={makeMuteHandler(spotlightTile)}
                                    style={{ width: "100%", height: "100%", borderRadius: 12 }}
                                />
                            );
                        })() : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 14, background: "#0d0d1a", borderRadius: 12 }}>
                                Waiting for participants…
                            </div>
                        )}
                    </div>

                    {/* Participant strip — horizontal row */}
                    {tiles.length > 0 && (
                        <div style={{
                            display: "flex", gap: 6, padding: "5px 8px",
                            overflowX: "auto", flexShrink: 0,
                            background: "rgba(0,0,0,0.3)",
                            scrollbarWidth: "none",
                        }}>
                            {tiles.filter(t => !t.isScreen).map(t => {
                                const isSelected = t.id === (pinnedId ?? tiles.find(x => !x.isScreen && !x.isLocal)?.id ?? tiles[0]?.id);
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setPinnedId(pinnedId === t.id ? null : t.id)}
                                        style={{
                                            position: "relative",
                                            width: 80, height: 56,
                                            flexShrink: 0, padding: 0, background: "transparent", outline: "none",
                                            border: isSelected ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.08)",
                                            borderRadius: 9, overflow: "hidden", cursor: "pointer",
                                            boxShadow: isSelected ? "0 0 10px rgba(34,197,94,0.35)" : "none",
                                            transition: "border-color 0.15s, box-shadow 0.15s, transform 0.12s",
                                            transform: isSelected ? "scale(1.06)" : "scale(1)",
                                        }}
                                    >
                                        <VideoTile
                                            trackId={t.trackId} label={t.label}
                                            isPinned={false} onPin={() => { }}
                                            style={{ width: "100%", height: "100%", borderRadius: 0 }}
                                        />
                                        {isSelected && (
                                            <div style={{
                                                position: "absolute", top: 3, right: 3,
                                                width: 7, height: 7, borderRadius: "50%",
                                                background: "#22c55e", boxShadow: "0 0 5px #22c55e",
                                            }} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── RIGHT SIDEBAR — Tabs ── */}
                <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", borderLeft: "1px solid #1c1c30", background: "#0e0e1e" }}>
                    {/* Tab header */}
                    <div style={{ display: "flex", borderBottom: "1px solid #1c1c30", flexShrink: 0 }}>
                        {(["activities", "feed", "chat"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    flex: 1, padding: "8px 0", border: "none", cursor: "pointer",
                                    background: activeTab === tab ? "#161628" : "transparent",
                                    color: activeTab === tab ? "#fff" : "#666",
                                    fontWeight: 600, fontSize: 11,
                                    borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent",
                                }}
                            >
                                {tab === "activities" ? "📝 Activities" : tab === "feed" ? "📊 Feed" : "💬 Chat"}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>

                        {/* ── ACTIVITIES TAB ── */}
                        {activeTab === "activities" && (
                            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                                {/* Type chips */}
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                    {availableTypes.map((t) => {
                                        const meta = TYPE_META[t] ?? { icon: <BookOpen size={14} />, color: "#888", label: t };
                                        const isActive = t === selectedType;
                                        const doneCount = activities.filter((a) => (a.activity_type ?? "other") === t && a.status === "completed").length;
                                        return (
                                            <button
                                                key={t}
                                                onClick={() => setActiveType(t)}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 4,
                                                    padding: "4px 10px", borderRadius: 20,
                                                    border: isActive ? `1px solid ${meta.color}` : "1px solid #2a2a3e",
                                                    background: isActive ? `${meta.color}18` : "transparent",
                                                    color: isActive ? meta.color : "#888",
                                                    cursor: "pointer", fontSize: 10, fontWeight: 600,
                                                }}
                                            >
                                                {meta.icon} {meta.label} ({doneCount}/{typeCounts[t]})
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Activity list */}
                                {filteredActivities.map((a) => {
                                    const isLive = a.status === "active";
                                    const isDone = a.status === "completed";
                                    const isPaused = a.status === "paused";
                                    return (
                                        <div
                                            key={a.id}
                                            style={{
                                                background: isLive ? "#22c55e12" : isPaused ? "#f59e0b12" : "#161628",
                                                border: isLive ? "1px solid #22c55e40" : isPaused ? "1px solid #f59e0b40" : "1px solid #1c1c30",
                                                borderRadius: 10, padding: "8px 10px",
                                                display: "flex", alignItems: "center", gap: 8,
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: 11, color: isDone ? "#9ca3af" : "#fff" }}>
                                                    {isDone && <CheckCircle2 size={12} color="#22c55e" style={{ marginRight: 4, verticalAlign: "middle" }} />}
                                                    {isLive && <Radio size={12} color="#22c55e" style={{ marginRight: 4, verticalAlign: "middle" }} />}
                                                    {isPaused && <Pause size={12} color="#f59e0b" style={{ marginRight: 4, verticalAlign: "middle" }} />}
                                                    {a.activity_name ?? a.activity_id}
                                                </div>
                                                <div style={{ fontSize: 9, opacity: 0.5, marginTop: 2 }}>
                                                    {a.duration_minutes ? `${a.duration_minutes} min` : ""}
                                                    {a.launched_at ? ` · ${new Date(a.launched_at).toLocaleTimeString()}` : ""}
                                                    {isPaused && <span style={{ color: "#f59e0b", marginLeft: 4 }}>Paused</span>}
                                                </div>
                                            </div>
                                            {!isDone && (
                                                <div style={{ display: "flex", gap: 4 }}>
                                                    {isLive && (
                                                        <button
                                                            onClick={() => sessionId && pauseActivity.mutate(sessionId)}
                                                            disabled={pauseActivity.isPending}
                                                            style={{
                                                                padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                                                                fontWeight: 600, fontSize: 10, color: "#fff", background: "#f59e0b",
                                                            }}
                                                        >
                                                            Pause
                                                        </button>
                                                    )}
                                                    {!isLive && (
                                                        <button
                                                            onClick={() => sessionId && launchActivity.mutate({ sessionId, activityId: a.activity_id })}
                                                            disabled={launchActivity.isPending}
                                                            style={{
                                                                padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                                                                fontWeight: 600, fontSize: 10, color: "#fff",
                                                                background: isPaused ? "#f59e0b" : "#6366f1",
                                                            }}
                                                        >
                                                            {isPaused ? "Resume" : "Launch"}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {!activities.length && (
                                    <div style={{ textAlign: "center", padding: 20, opacity: 0.4, fontSize: 12 }}>
                                        No activities for this session
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── FEED TAB ── */}
                        {activeTab === "feed" && (() => {
                            // Parse confidence_pulse messages from HMS
                            const confidenceMsgs = (messages ?? [])
                                .filter((m: any) => {
                                    try { return JSON.parse(m.message)?.type === "confidence_pulse"; } catch { return false; }
                                })
                                .map((m: any) => {
                                    const data = JSON.parse(m.message) as { type: string; value: "got_it" | "kinda" | "lost"; studentName: string };
                                    return { id: m.id as string, studentName: data.studentName, value: data.value, time: m.time as number };
                                })
                                .reverse(); // newest first

                            const moodEmoji: Record<"got_it" | "kinda" | "lost", string> = { got_it: "🟢", kinda: "🟡", lost: "🔴" };
                            const moodLabel: Record<"got_it" | "kinda" | "lost", string> = { got_it: "Got it!", kinda: "Kinda...", lost: "Lost!" };
                            const moodColor: Record<"got_it" | "kinda" | "lost", string> = { got_it: "#22c55e", kinda: "#f59e0b", lost: "#ef4444" };

                            return (
                                <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                                    {/* Confidence pulse from HMS */}
                                    <div style={{ background: "#161628", borderRadius: 8, padding: 10 }}>
                                        <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 6, color: "#fff" }}>💬 How Students Feel</div>
                                        {confidenceMsgs.length > 0 ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                {confidenceMsgs.slice(0, 15).map((msg) => (
                                                    <div key={msg.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, padding: "3px 0" }}>
                                                        <span style={{ fontSize: 13 }}>{moodEmoji[msg.value]}</span>
                                                        <span style={{ fontWeight: 600, color: "#ccc" }}>{msg.studentName}</span>
                                                        <span style={{ color: moodColor[msg.value] }}>{moodLabel[msg.value]}</span>
                                                        <span style={{ marginLeft: "auto", opacity: 0.4, fontSize: 9 }}>
                                                            {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: "center", padding: 8, opacity: 0.4, fontSize: 10 }}>No responses yet</div>
                                        )}
                                    </div>

                                    {/* Scores */}
                                    {sessionScores && sessionScores.some((sc) => sc.total > 0) && (
                                        <div style={{ background: "#161628", borderRadius: 8, padding: 10 }}>
                                            <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 6, color: "#fff" }}>📊 Scores</div>
                                            {sessionScores.filter((sc) => sc.total > 0).map((sc) => {
                                                const pct = Math.round((sc.correct / sc.total) * 100);
                                                return (
                                                    <div key={sc.student_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 10 }}>
                                                        <span style={{ color: "#ccc" }}>{sc.student_name}</span>
                                                        <span style={{
                                                            fontWeight: 700,
                                                            color: pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444",
                                                        }}>
                                                            {sc.correct}/{sc.total} ({pct}%)
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {/* Pulse events */}
                                    <div style={{ background: "#161628", borderRadius: 8, padding: 10 }}>
                                        <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 6, color: "#fff" }}>📡 Live Pulse</div>
                                        {pulseEvents && pulseEvents.length > 0 ? (
                                            pulseEvents.slice(0, 10).map((e) => (
                                                <div key={e.id} style={{ fontSize: 10, padding: "3px 0", color: "#ccc", display: "flex", gap: 6 }}>
                                                    <span style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{e.student_name.split(" ")[0]}</span>
                                                    <span style={{ color: e.outcome >= 0.7 ? "#22c55e" : e.outcome < 0.4 ? "#ef4444" : "#f59e0b" }}>
                                                        {e.outcome >= 0.7 ? "✓" : e.outcome < 0.4 ? "✗" : "~"}
                                                    </span>
                                                    <span style={{ opacity: 0.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.competency_name ?? ""}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: "center", padding: 10, opacity: 0.4, fontSize: 10 }}>No events yet</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ── CHAT TAB ── */}
                        {activeTab === "chat" && (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                <div style={{ flex: 1, overflow: "auto", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
                                    {messages
                                        .filter((m: any) => {
                                            try { return !JSON.parse(m.message)?.type; } catch { return true; }
                                        })
                                        .map((m: any, i: number) => (
                                            <div key={i} style={{ background: "#161628", borderRadius: 6, padding: "4px 7px", fontSize: 10 }}>
                                                <div style={{ fontWeight: 600, fontSize: 8, opacity: 0.5, marginBottom: 1 }}>{m.senderName}</div>
                                                {m.message}
                                            </div>
                                        ))}
                                    {!messages.filter((m: any) => { try { return !JSON.parse(m.message)?.type; } catch { return true; } }).length && <div style={{ textAlign: "center", padding: 20, opacity: 0.3, fontSize: 11 }}>No messages yet</div>}
                                    <div ref={chatEndRef} />
                                </div>
                                <div style={{ display: "flex", padding: 6, gap: 4, borderTop: "1px solid #1c1c30" }}>
                                    <input style={{ flex: 1, background: "#161628", border: "none", borderRadius: 6, padding: "6px 8px", color: "#fff", fontSize: 11, outline: "none" }} value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Message…" />
                                    <button onClick={sendMessage} style={{ background: "#6366f1", border: "none", borderRadius: 6, padding: "6px 10px", color: "#fff", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>↑</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ CONTROLS ═══ */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, padding: "8px 14px", background: "#101020", borderTop: "1px solid #1c1c30", flexShrink: 0 }}>
                {[
                    { icon: isAudioOn ? <Mic size={16} /> : <MicOff size={16} />, label: "Mic", on: isAudioOn as boolean, danger: !(isAudioOn as boolean), fn: () => hmsActions.setLocalAudioEnabled(!isAudioOn) },
                    { icon: isVideoOn ? <Camera size={16} /> : <CameraOff size={16} />, label: "Cam", on: isVideoOn as boolean, danger: !(isVideoOn as boolean), fn: () => hmsActions.setLocalVideoEnabled(!isVideoOn) },
                    { icon: isScreenShared ? <MonitorOff size={16} /> : <Monitor size={16} />, label: isScreenShared ? "Stop" : "Share", on: isScreenShared as boolean, warn: isScreenShared as boolean, fn: () => hmsActions.setScreenShareEnabled(!isScreenShared) },
                ].map((b, i) => (
                    <button key={i} onClick={b.fn} style={{
                        display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 10,
                        border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, color: "#fff",
                        background: b.danger ? "#ef4444" : b.warn ? "#f59e0b" : b.on ? "#6366f1" : "#1c1c30",
                    }}>
                        {b.icon} {b.label}
                    </button>
                ))}
                <div style={{ width: 1, height: 24, background: "#2a2a3e", margin: "0 4px" }} />
                <button onClick={handleEndClass} disabled={endSession.isPending} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, color: "#fff", background: "#ef4444" }}>
                    <PhoneOff size={16} /> {endSession.isPending ? "Ending..." : "End Class"}
                </button>
            </div>
        </div>
    );
}
