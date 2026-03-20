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
import {
    useSessionActivities,
    useLaunchActivity,
    usePauseActivity,
    useLivePulse,
    useSessionScores,
    useStudentQuestionResponses,
    useTeacherSessionView,
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
                <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000" }} autoPlay muted playsInline />
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
    const [pendingImages, setPendingImages] = useState<string[]>([]);
    const [chatImageError, setChatImageError] = useState<string | null>(null);
    const chatFileInputRef = useRef<HTMLInputElement | null>(null);
    const [activeTab, setActiveTab] = useState<"activities" | "feed" | "chat">("activities");
    const [activeType, setActiveType] = useState<string | null>(null);
    const [joinError, setJoinError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [sidebarWidth, setSidebarWidth] = useState<number>(350);
    const [isResizing, setIsResizing] = useState(false);
    const [showTopControls, setShowTopControls] = useState(true);
    const [controlsPos, setControlsPos] = useState({ x: 14, y: 14 });
    const [draggingControls, setDraggingControls] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });

    // Activities dropdown: Activity (row) -> Questions (list) -> Student responses (list)
    const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

    // ── Data hooks ──
    const { data: sessionActivities } = useSessionActivities(sessionId || undefined);
    const { data: pulseEvents } = useLivePulse(cohortId || undefined, sessionId || undefined);
    const { data: sessionScores } = useSessionScores(cohortId || undefined, sessionId || undefined);
    const { data: sessionView } = useTeacherSessionView(cohortId || undefined, sessionId || undefined);
    const {
        data: studentQuestionResponses,
        isFetching: studentQuestionResponsesFetching,
    } = useStudentQuestionResponses(cohortId || undefined, sessionId || undefined, expandedQuestionId);
    const launchActivity = useLaunchActivity();
    const pauseActivity = usePauseActivity();

    // ── Sidebar resizing ──
    useEffect(() => {
        if (!isResizing) return;
        const onMove = (e: MouseEvent) => {
            const rightPadding = 24;
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

    useEffect(() => {
        if (!draggingControls) return;
        const onMove = (e: MouseEvent) => {
            const maxX = Math.max(8, window.innerWidth - 420);
            const maxY = Math.max(8, window.innerHeight - 120);
            const nextX = Math.max(8, Math.min(maxX, e.clientX - dragOffsetRef.current.x));
            const nextY = Math.max(8, Math.min(maxY, e.clientY - dragOffsetRef.current.y));
            setControlsPos({ x: nextX, y: nextY });
        };
        const onUp = () => setDraggingControls(false);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [draggingControls]);

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

    // ── Leave class (teacher only) ──
    async function handleLeaveClass() {
        try {
            await hmsActions.leave();
        } finally {
            window.close();
        }
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

    function readFileAsDataUrl(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });
    }

    function removePendingImage(idx: number) {
        setPendingImages((prev) => prev.filter((_, i) => i !== idx));
    }

    async function sendMessage() {
        const txt = chatText.trim();
        if (!txt && pendingImages.length === 0) return;

        if (txt) {
            await hmsActions.sendBroadcastMessage(txt);
        }

        for (const img of pendingImages) {
            await hmsActions.sendBroadcastMessage(`[img]${img}`);
        }

        setChatText("");
        setPendingImages([]);
        setChatImageError(null);
    }
    function makeMuteHandler(tile: TileData) {
        if (tile.isLocal || tile.isScreen || !tile.audioTrack) return undefined;
        return async () => {
            try { await hmsActions.setRemoteTrackEnabled(tile.audioTrack!, false); } catch { }
        };
    }

    // ── Activity data ──
    const activities = sessionActivities ?? [];
    const activityInfoById = new Map<string, { description?: string | null; questionCount?: number }>();
    for (const a of (sessionView?.activities ?? [])) {
        activityInfoById.set(a.activity_id, { description: a.description, questionCount: a.questions?.length ?? 0 });
    }
    const typeCounts: Record<string, number> = {};
    for (const a of activities) {
        const t = a.activity_type ?? "other";
        typeCounts[t] = (typeCounts[t] || 0) + 1;
    }
    const availableTypes = Object.keys(typeCounts);
    const selectedType = activeType ?? availableTypes[0] ?? null;
    const filteredActivities = activities.filter((a) => (a.activity_type ?? "other") === selectedType);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "'Inter',sans-serif" }}>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}} ::-webkit-scrollbar{width:6px;height:6px} ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:6px}`}</style>

            {/* ═══ BODY ═══ */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

                {/* ── VIDEO AREA ── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, background: "#0b0b1a" }}>

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

                    {showTopControls && (
                        <div
                            style={{
                                position: "absolute",
                                    left: controlsPos.x,
                                    top: controlsPos.y,
                                zIndex: 30,
                                display: "flex",
                                gap: 8,
                                padding: "8px",
                                borderRadius: 14,
                                background: "rgba(15,23,42,0.62)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                backdropFilter: "blur(8px)",
                            }}
                        >
                                <button
                                    title="Drag controls"
                                    onMouseDown={(e) => {
                                        const target = e.currentTarget.parentElement as HTMLDivElement | null;
                                        const rect = target?.getBoundingClientRect();
                                        if (!rect) return;
                                        dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                                        setDraggingControls(true);
                                    }}
                                    style={{
                                        width: 32,
                                        height: 40,
                                        borderRadius: 10,
                                        border: "1px solid rgba(255,255,255,0.18)",
                                        background: "rgba(255,255,255,0.12)",
                                        color: "#fff",
                                        cursor: "grab",
                                        fontWeight: 900,
                                    }}
                                >
                                    ⋮⋮
                                </button>
                            <button
                                title={isAudioOn ? "Mute" : "Unmute"}
                                onClick={() => hmsActions.setLocalAudioEnabled(!isAudioOn)}
                                style={{
                                    width: 40, height: 40, borderRadius: 999, border: "none",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", color: "#fff",
                                    background: !isAudioOn ? "rgba(229,62,62,0.85)" : "rgba(255,255,255,0.15)",
                                }}
                            >
                                {isAudioOn ? <Mic size={18} /> : <MicOff size={18} />}
                            </button>
                            <button
                                title={isVideoOn ? "Camera off" : "Camera on"}
                                onClick={() => hmsActions.setLocalVideoEnabled(!isVideoOn)}
                                style={{
                                    width: 40, height: 40, borderRadius: 999, border: "none",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", color: "#fff",
                                    background: !isVideoOn ? "rgba(229,62,62,0.85)" : "rgba(255,255,255,0.15)",
                                }}
                            >
                                {isVideoOn ? <Camera size={18} /> : <CameraOff size={18} />}
                            </button>
                            <button
                                title={isScreenShared ? "Stop sharing" : "Share screen"}
                                onClick={() => hmsActions.setScreenShareEnabled(!isScreenShared)}
                                style={{
                                    width: 40, height: 40, borderRadius: 999, border: "none",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", color: "#fff",
                                    background: isScreenShared ? "rgba(245,158,11,0.85)" : "rgba(255,255,255,0.15)",
                                }}
                            >
                                {isScreenShared ? <MonitorOff size={18} /> : <Monitor size={18} />}
                            </button>
                                <button
                                    title="Leave class"
                                    onClick={handleLeaveClass}
                                style={{
                                    border: "none",
                                    padding: "10px 14px",
                                    borderRadius: 999,
                                    cursor: "pointer",
                                    color: "#fff",
                                    fontWeight: 800,
                                    fontSize: 12,
                                    background: "linear-gradient(135deg, rgba(239,68,68,0.95), rgba(244,63,94,0.85))",
                                    boxShadow: "0 8px 24px rgba(239,68,68,0.25)",
                                }}
                            >
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                    <PhoneOff size={16} />
                                        Leave
                                </span>
                            </button>
                        </div>
                    )}

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

                {/* ── DRAG RESIZER ── */}
                <div
                    role="separator"
                    aria-orientation="vertical"
                    onMouseDown={() => setIsResizing(true)}
                    style={{
                        width: 8,
                        cursor: "col-resize",
                        background: isResizing ? "rgba(99,102,241,0.20)" : "rgba(148,163,184,0.25)",
                        borderLeft: "1px solid rgba(148,163,184,0.35)",
                        borderRight: "1px solid rgba(148,163,184,0.35)",
                    }}
                    title="Drag to resize"
                />

                {/* ── RIGHT SIDEBAR — Tabs ── */}
                <div style={{ width: sidebarWidth, flexShrink: 0, display: "flex", flexDirection: "column", borderLeft: "1px solid #e2e8f0", background: "#ffffff" }}>
                    {/* Tab header */}
                    <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
                        <button
                            onClick={() => setShowTopControls((v) => !v)}
                            style={{
                                margin: "6px 8px",
                                background: showTopControls ? "#eef2ff" : "#f8fafc",
                                border: "1px solid #c7d2fe",
                                borderRadius: 999,
                                padding: "4px 8px",
                                color: "#3730a3",
                                cursor: "pointer",
                                fontSize: 10,
                                fontWeight: 800,
                            }}
                        >
                            {showTopControls ? "Hide Controls" : "Show Controls"}
                        </button>
                        {(["activities", "feed", "chat"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                                    background: activeTab === tab ? "#eef2ff" : "transparent",
                                    color: activeTab === tab ? "#1e293b" : "#64748b",
                                    fontWeight: 800, fontSize: 11,
                                    borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent",
                                }}
                            >
                                {tab === "activities" ? "Activities" : tab === "feed" ? "Feed" : "Chat"}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>

                        {/* ── ACTIVITIES TAB ── */}
                        {activeTab === "activities" && (
                            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: 1, overflow: "auto", minHeight: 0 }}>
                                {/* Type chips */}
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {availableTypes.map((t) => {
                                        const meta = TYPE_META[t] ?? { icon: <BookOpen size={14} />, color: "#888", label: t };
                                        const isActive = t === selectedType;
                                        const doneCount = activities.filter((a) => (a.activity_type ?? "other") === t && a.status === "completed").length;
                                        return (
                                            <button
                                                key={t}
                                                onClick={() => setActiveType(t)}
                                                style={{
                                                    display: "inline-flex", alignItems: "center", gap: 8,
                                                    padding: "7px 12px", borderRadius: 999,
                                                    border: isActive ? `1px solid ${meta.color}55` : "1px solid #e2e8f0",
                                                    background: isActive ? `${meta.color}12` : "#f8fafc",
                                                    color: isActive ? "#0f172a" : "#334155",
                                                    cursor: "pointer", fontSize: 11, fontWeight: 800,
                                                    boxShadow: isActive ? `0 0 0 3px ${meta.color}14` : "none",
                                                }}
                                            >
                                                <span style={{
                                                    width: 22, height: 22, borderRadius: 999,
                                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                                    background: `${meta.color}18`, color: meta.color,
                                                }}>
                                                    {meta.icon}
                                                </span>
                                                <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
                                                    {meta.label}
                                                    <span style={{ fontSize: 10, fontWeight: 900, color: "#64748b" }}>
                                                        {doneCount}/{typeCounts[t]}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Activity list */}
                                {filteredActivities.map((a) => {
                                    const isLive = a.status === "active";
                                    const isDone = a.status === "completed";
                                    const isPaused = a.status === "paused";
                                    const info = activityInfoById.get(a.activity_id);
                                    const viewActivity = (sessionView?.activities ?? []).find((v) => v.session_activity_id === a.id) ?? null;
                                    const questions = viewActivity?.questions ?? [];

                                    const isActivityExpanded = expandedActivityId === a.id;

                                    return (
                                        <div key={a.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            <div
                                                style={{
                                                    background: isLive ? "#dcfce7" : isPaused ? "#ffedd5" : "#f8fafc",
                                                    border: isLive ? "1px solid #22c55e55" : isPaused ? "1px solid #f59e0b55" : "1px solid #e2e8f0",
                                                    borderRadius: 14, padding: "10px 12px",
                                                    display: "flex", alignItems: "center", gap: 8,
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 900, fontSize: 12, color: isDone ? "#94a3b8" : "#0f172a" }}>
                                                        {isDone && <CheckCircle2 size={12} color="#22c55e" style={{ marginRight: 4, verticalAlign: "middle" }} />}
                                                        {isLive && <Radio size={12} color="#22c55e" style={{ marginRight: 4, verticalAlign: "middle" }} />}
                                                        {isPaused && <Pause size={12} color="#f59e0b" style={{ marginRight: 4, verticalAlign: "middle" }} />}
                                                        {a.activity_name ?? a.activity_id}
                                                    </div>
                                                    {(info?.description || info?.questionCount != null) && (
                                                        <div style={{ fontSize: 10, color: "#475569", marginTop: 4, lineHeight: 1.2 }}>
                                                            {info?.description ? (
                                                                <div style={{
                                                                    display: "-webkit-box",
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: "vertical",
                                                                    overflow: "hidden",
                                                                }}>
                                                                    {info.description}
                                                                </div>
                                                            ) : null}
                                                            {info?.questionCount != null ? (
                                                                <div style={{ marginTop: info?.description ? 3 : 0, fontWeight: 800, color: "#334155" }}>
                                                                    {info.questionCount} questions
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 6 }}>
                                                        {a.duration_minutes ? `${a.duration_minutes} min` : ""}
                                                        {a.launched_at ? ` · ${new Date(a.launched_at).toLocaleTimeString()}` : ""}
                                                        {isPaused && <span style={{ color: "#b45309", marginLeft: 6, fontWeight: 800 }}>Paused</span>}
                                                    </div>
                                                </div>

                                                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setExpandedActivityId(isActivityExpanded ? null : a.id);
                                                            setExpandedQuestionId(null);
                                                        }}
                                                        style={{
                                                            padding: "6px 10px",
                                                            borderRadius: 10,
                                                            border: "1px solid #e2e8f0",
                                                            cursor: "pointer",
                                                            fontWeight: 900,
                                                            fontSize: 11,
                                                            background: isActivityExpanded ? "#eef2ff" : "#fff",
                                                            color: "#0f172a",
                                                        }}
                                                        title="View questions + responses"
                                                    >
                                                        {isActivityExpanded ? "Hide" : "Questions"} {isActivityExpanded ? "▴" : "▾"}
                                                    </button>

                                                    {!isDone && (
                                                        <div style={{ display: "flex", gap: 4 }}>
                                                            {isLive && (
                                                                <button
                                                                    onClick={() => sessionId && pauseActivity.mutate(sessionId)}
                                                                    disabled={pauseActivity.isPending}
                                                                    style={{
                                                                        padding: "6px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                                                                        fontWeight: 900, fontSize: 11, color: "#fff", background: "#f59e0b",
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
                                                                        padding: "6px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                                                                        fontWeight: 900, fontSize: 11, color: "#fff",
                                                                        background: isPaused ? "#f59e0b" : "#6366f1",
                                                                    }}
                                                                >
                                                                    {isPaused ? "Resume" : "Launch"}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {isActivityExpanded && (
                                                <div style={{
                                                    marginLeft: 12,
                                                    padding: "10px 12px",
                                                    borderRadius: 12,
                                                    background: "#ffffff",
                                                    border: "1px solid #e2e8f0",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 8,
                                                }}>
                                                    {questions.length === 0 ? (
                                                        <div style={{ textAlign: "center", padding: 10, color: "#94a3b8", fontSize: 12 }}>
                                                            No questions in this activity
                                                        </div>
                                                    ) : (
                                                        questions.map((q, idx) => {
                                                            const isQuestionExpanded = expandedQuestionId === q.id;
                                                            return (
                                                                <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setExpandedQuestionId(isQuestionExpanded ? null : q.id)}
                                                                        style={{
                                                                            width: "100%",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: 10,
                                                                            padding: "8px 10px",
                                                                            borderRadius: 12,
                                                                            border: "1px solid #e2e8f0",
                                                                            background: isQuestionExpanded ? "#eef2ff" : "#f8fafc",
                                                                            cursor: "pointer",
                                                                        }}
                                                                    >
                                                                        <span style={{ width: 22, height: 22, borderRadius: 999, background: "#6366f1", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>
                                                                            {idx + 1}
                                                                        </span>
                                                                        <span style={{ fontWeight: 900, fontSize: 12, color: "#0f172a", textAlign: "left", flex: 1 }}>
                                                                            {q.title}
                                                                        </span>
                                                                        <span style={{ fontWeight: 900, fontSize: 11, color: "#6366f1" }}>
                                                                            {isQuestionExpanded ? "Hide" : "Show"} ▾
                                                                        </span>
                                                                    </button>

                                                                    {isQuestionExpanded && (
                                                                        <div style={{
                                                                            marginLeft: 10,
                                                                            padding: "10px 12px",
                                                                            borderRadius: 12,
                                                                            background: "#fff",
                                                                            border: "1px solid #e2e8f0",
                                                                        }}>
                                                                            {studentQuestionResponsesFetching && (
                                                                                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                                                                                    Loading student responses...
                                                                                </div>
                                                                            )}

                                                                            {!studentQuestionResponsesFetching && studentQuestionResponses && studentQuestionResponses.length === 0 && (
                                                                                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800 }}>
                                                                                    No responses yet
                                                                                </div>
                                                                            )}

                                                                            {!studentQuestionResponsesFetching && studentQuestionResponses && studentQuestionResponses.length > 0 && (
                                                                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                                                    {studentQuestionResponses.map((r) => (
                                                                                        <div key={r.student_id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                                                <div style={{ fontWeight: 900, fontSize: 12, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                                                    {r.student_name}
                                                                                                </div>
                                                                                                {r.confidence && (
                                                                                                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 800 }}>
                                                                                                        Confidence: {r.confidence}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                            {(() => {
                                                                                                const pct = Math.max(0, Math.min(100, Math.round((r.outcome ?? 0) * 100)));
                                                                                                const tone =
                                                                                                    pct >= 85 ? { bg: "#dcfce7", fg: "#14532d" } :
                                                                                                    pct <= 20 ? { bg: "#fee2e2", fg: "#7f1d1d" } :
                                                                                                    { bg: "#fef3c7", fg: "#92400e" };
                                                                                                return (
                                                                                                    <div style={{
                                                                                                        fontWeight: 900,
                                                                                                        fontSize: 11,
                                                                                                        padding: "6px 10px",
                                                                                                        borderRadius: 999,
                                                                                                        background: tone.bg,
                                                                                                        color: tone.fg,
                                                                                                        flexShrink: 0,
                                                                                                    }}>
                                                                                                        {pct}%
                                                                                                    </div>
                                                                                                );
                                                                                            })()}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
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
                                <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 10, flex: 1, overflow: "auto", minHeight: 0 }}>
                                    {/* Confidence pulse from HMS */}
                                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                                        <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 8, color: "#0f172a" }}>💬 How Students Feel</div>
                                        {confidenceMsgs.length > 0 ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                {confidenceMsgs.slice(0, 15).map((msg) => (
                                                    <div key={msg.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, padding: "3px 0" }}>
                                                        <span style={{ fontSize: 13 }}>{moodEmoji[msg.value]}</span>
                                                        <span style={{ fontWeight: 800, color: "#334155" }}>{msg.studentName}</span>
                                                        <span style={{ color: moodColor[msg.value] }}>{moodLabel[msg.value]}</span>
                                                        <span style={{ marginLeft: "auto", opacity: 0.4, fontSize: 9 }}>
                                                            {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: "center", padding: 8, color: "#64748b", fontSize: 10 }}>No responses yet</div>
                                        )}
                                    </div>

                                    {/* Scores */}
                                    {sessionScores && sessionScores.some((sc) => sc.total > 0) && (
                                        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                                            <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 8, color: "#0f172a" }}>📊 Scores</div>
                                            {sessionScores.filter((sc) => sc.total > 0).map((sc) => {
                                                const pct = Math.round((sc.correct / sc.total) * 100);
                                                return (
                                                    <div key={sc.student_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 10 }}>
                                                        <span style={{ color: "#334155", fontWeight: 700 }}>{sc.student_name}</span>
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
                                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                                        <div style={{ fontWeight: 900, fontSize: 11, marginBottom: 8, color: "#0f172a" }}>📡 Live Pulse</div>
                                        {pulseEvents && pulseEvents.length > 0 ? (
                                            pulseEvents.slice(0, 10).map((e) => (
                                                <div key={e.id} style={{ fontSize: 10, padding: "3px 0", color: "#334155", display: "flex", gap: 6 }}>
                                                    <span style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{e.student_name.split(" ")[0]}</span>
                                                    <span style={{ color: e.outcome >= 0.7 ? "#22c55e" : e.outcome < 0.4 ? "#ef4444" : "#f59e0b" }}>
                                                        {e.outcome >= 0.7 ? "✓" : e.outcome < 0.4 ? "✗" : "~"}
                                                    </span>
                                                    <span style={{ opacity: 0.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.competency_name ?? ""}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: "center", padding: 10, color: "#64748b", fontSize: 10 }}>No events yet</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ── CHAT TAB ── */}
                        {activeTab === "chat" && (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                                <div style={{ flex: 1, overflow: "auto", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4, minHeight: 0 }}>
                                    {messages
                                        .filter((m: any) => {
                                            try { return !JSON.parse(m.message)?.type; } catch { return true; }
                                        })
                                        .map((m: any, i: number) => (
                                            <div key={i} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "8px 10px", fontSize: 10 }}>
                                                <div style={{ fontWeight: 900, fontSize: 9, color: "#64748b", marginBottom: 2 }}>{m.senderName}</div>
                                                {(() => {
                                                    const raw = String(m.message ?? "");
                                                    const normalized = raw.trim();
                                                    const imgPrefix = "[img]";
                                                    const imageUrl = normalized.startsWith(imgPrefix) ? normalized.slice(imgPrefix.length) : null;
                                                    return (
                                                        <div style={{ color: "#0f172a" }}>
                                                            {imageUrl ? (
                                                                <img src={imageUrl} alt="Shared" style={{ maxWidth: 220, borderRadius: 10, display: "block" }} />
                                                            ) : (
                                                                raw
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ))}
                                    {!messages.filter((m: any) => { try { return !JSON.parse(m.message)?.type; } catch { return true; } }).length && <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 11 }}>No messages yet</div>}
                                    <div ref={chatEndRef} />
                                </div>
                                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", padding: 10, gap: 8, borderTop: "1px solid #e2e8f0", background: "#ffffff" }}>
                                    {pendingImages.length > 0 && (
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

                                    {chatImageError && (
                                        <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 700 }}>
                                            {chatImageError}
                                        </div>
                                    )}

                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                        {["👍", "😂", "❤️", "🎉"].map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => setChatText((prev) => prev + emoji)}
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

                                        <button
                                            type="button"
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
                                            }}
                                            title="Upload image"
                                        >
                                            📎
                                        </button>

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
                                                    setPendingImages((prev) => [...prev, dataUrl]);
                                                }
                                                // allow selecting same file again
                                                e.currentTarget.value = "";
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: "flex", gap: 8 }}>
                                        <input
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
                                            value={chatText}
                                            onChange={(e) => setChatText(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && void sendMessage()}
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
                                                    setPendingImages((prev) => [...prev, dataUrl]);
                                                }
                                            }}
                                            placeholder="Message…"
                                        />
                                        <button
                                            onClick={() => void sendMessage()}
                                            style={{
                                                background: "#6366f1",
                                                border: "none",
                                                borderRadius: 12,
                                                padding: "10px 12px",
                                                color: "#fff",
                                                fontWeight: 900,
                                                fontSize: 12,
                                                cursor: "pointer",
                                            }}
                                            type="button"
                                        >
                                            ↑
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
