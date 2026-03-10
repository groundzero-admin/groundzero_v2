/**
 * StudentLiveClassPage — Student live class with smart video layout.
 *
 * Layout:
 *  No screen share:  Video grid fills the main area
 *  Screen sharing:   Main = screen share, Right strip = participant cameras (always visible)
 *  Pinning:          Pin any camera/screen to make it the main spotlight
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

/* ───────── Video Tile ───────── */
function VideoTile({
    trackId,
    label,
    isPinned,
    isLarge,
    onPin,
    style,
}: {
    trackId: string | undefined;
    label: string;
    isPinned: boolean;
    isLarge?: boolean;
    onPin: () => void;
    style?: React.CSSProperties;
}) {
    const { videoRef } = useVideo({ trackId: trackId ?? "" });
    return (
        <div
            onClick={onPin}
            style={{
                position: "relative",
                background: "#1a1a2e",
                borderRadius: isLarge ? 12 : 8,
                overflow: "hidden",
                cursor: "pointer",
                border: isPinned ? "2px solid #fbbf24" : "2px solid transparent",
                transition: "border-color 0.2s",
                ...style,
            }}
        >
            {trackId ? (
                <video
                    ref={videoRef}
                    style={{ width: "100%", height: "100%", objectFit: isLarge ? "contain" : "cover", background: "#000" }}
                    autoPlay muted playsInline
                />
            ) : (
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "100%", height: "100%", fontSize: isLarge ? 56 : 24,
                    background: "linear-gradient(135deg,#1e1e2e,#252540)", color: "#555",
                }}>
                    {label.replace("🖥️ ", "").charAt(0)?.toUpperCase() ?? "?"}
                </div>
            )}
            {/* Name + Pin badge */}
            <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: isLarge ? "8px 12px" : "4px 6px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
                display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
                <span style={{ fontSize: isLarge ? 12 : 10, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
                {isPinned && <span style={{ fontSize: 10, color: "#fbbf24" }}>📌</span>}
            </div>
        </div>
    );
}

/* ───────── Main Page ───────── */
export default function StudentLiveClassPage() {
    const [params] = useSearchParams();
    const roomCode = params.get("roomCode") || "";
    const userName = params.get("userName") || "Student";

    const hmsActions = useHMSActions();
    const isConnected = useHMSStore(selectIsConnectedToRoom);
    const peers: any[] = (useHMSStore(selectPeers) as any[]) || [];
    const messages: any[] = (useHMSStore(selectHMSMessages) as any[]) || [];
    const isAudioOn = useHMSStore(selectIsLocalAudioEnabled);
    const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
    const isScreenShared = useHMSStore(selectIsLocalScreenShared);

    const [pinnedId, setPinnedId] = useState<string | null>(null);
    const [chatText, setChatText] = useState("");
    const [showChat, setShowChat] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Join
    useEffect(() => {
        if (!roomCode) return;
        (async () => {
            try {
                const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode });
                await hmsActions.join({ userName, authToken });
            } catch (err: any) {
                const msg = err?.message || err?.description || String(err);
                setJoinError(msg.includes("not active") || msg.includes("403")
                    ? "This class has not started yet. Please wait for your teacher to start the class."
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

    /* ── Error / Loading ── */
    if (joinError) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0b0b1a", color: "#fff", fontFamily: "'Inter',sans-serif", gap: 16 }}>
                <div style={{ fontSize: 48 }}>📡</div>
                <div style={{ fontSize: 18, fontWeight: 600, textAlign: "center", maxWidth: 380 }}>{joinError}</div>
                <button onClick={() => window.close()} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Close Tab</button>
            </div>
        );
    }
    if (!isConnected) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0b0b1a", color: "#fff", fontFamily: "'Inter',sans-serif", fontSize: 16 }}>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <div style={{ width: 24, height: 24, border: "3px solid #222", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin .7s linear infinite", marginRight: 10 }} />
                Joining class…
            </div>
        );
    }

    /* ── Build tile data ── */
    interface TileData { id: string; trackId: string | undefined; label: string; isScreen: boolean; }
    const tiles: TileData[] = [];

    // Screen share tiles
    for (const p of peers) {
        if (p.auxiliaryTracks?.length) {
            tiles.push({ id: `screen-${p.id}`, trackId: p.auxiliaryTracks[0], label: `🖥️ ${p.name || "?"}`, isScreen: true });
        }
    }
    // Camera tiles
    for (const p of peers) {
        tiles.push({ id: p.id, trackId: p.videoTrack, label: `${p.name || "?"}${p.isLocal ? " (You)" : ""}`, isScreen: false });
    }

    const hasScreenShare = tiles.some((t) => t.isScreen);

    // Determine spotlight: pinned tile, or first screen share, or null
    let spotlightTile: TileData | null = null;
    if (pinnedId) spotlightTile = tiles.find((t) => t.id === pinnedId) || null;
    else if (hasScreenShare) spotlightTile = tiles.find((t) => t.isScreen) || null;

    const showSpotlight = !!spotlightTile;
    const stripTiles = showSpotlight ? tiles.filter((t) => t.id !== spotlightTile!.id) : [];

    async function sendMessage() {
        if (!chatText.trim()) return;
        await hmsActions.sendBroadcastMessage(chatText.trim());
        setChatText("");
    }

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
                    <button onClick={() => setExpanded(!expanded)} style={{ background: "#1c1c30", border: "1px solid #2a2a3e", borderRadius: 6, padding: "2px 10px", color: "#ccc", cursor: "pointer", fontSize: 10 }}>
                        {expanded ? "◀ Panels" : "▶ Expand"}
                    </button>
                </div>
            </div>

            {/* ═══ BODY ═══ */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

                {/* ── VIDEO AREA ── */}
                <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

                    {showSpotlight ? (
                        /* ─── SPOTLIGHT + STRIP ─── */
                        <>
                            {/* Main spotlight */}
                            <div style={{ flex: 1, padding: 6, display: "flex", minWidth: 0 }}>
                                <VideoTile
                                    trackId={spotlightTile!.trackId}
                                    label={spotlightTile!.label}
                                    isPinned={!!pinnedId && pinnedId === spotlightTile!.id}
                                    isLarge
                                    onPin={() => setPinnedId(null)}
                                    style={{ width: "100%", height: "100%", aspectRatio: "auto" }}
                                />
                            </div>

                            {/* Participant strip — always visible */}
                            <div style={{
                                width: 140, flexShrink: 0, display: "flex", flexDirection: "column",
                                gap: 4, padding: "6px 4px", overflowY: "auto", background: "#0d0d1a",
                                borderLeft: "1px solid #1c1c30",
                            }}>
                                {stripTiles.map((t) => (
                                    <VideoTile
                                        key={t.id}
                                        trackId={t.trackId}
                                        label={t.label}
                                        isPinned={pinnedId === t.id}
                                        onPin={() => setPinnedId(pinnedId === t.id ? null : t.id)}
                                        style={{ width: "100%", aspectRatio: "4/3", flexShrink: 0 }}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        /* ─── GRID MODE ─── */
                        <div style={{
                            flex: 1, display: "grid", gap: 6, padding: 6, overflow: "auto", alignContent: "start",
                            gridTemplateColumns:
                                tiles.length <= 1 ? "1fr"
                                    : tiles.length <= 4 ? "repeat(2, 1fr)"
                                        : "repeat(auto-fill, minmax(240px, 1fr))",
                        }}>
                            {tiles
                                .sort((a, b) => {
                                    if (a.id === pinnedId) return -1;
                                    if (b.id === pinnedId) return 1;
                                    return 0;
                                })
                                .map((t) => (
                                    <VideoTile
                                        key={t.id}
                                        trackId={t.trackId}
                                        label={t.label}
                                        isPinned={pinnedId === t.id}
                                        onPin={() => setPinnedId(pinnedId === t.id ? null : t.id)}
                                        style={{
                                            aspectRatio: "16/9",
                                            ...(pinnedId === t.id ? { gridColumn: "1 / -1" } : {}),
                                        }}
                                    />
                                ))}
                        </div>
                    )}
                </div>

                {/* ── RIGHT SIDEBAR: Activity + Spark AI ── */}
                {!expanded && (
                    <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", borderLeft: "1px solid #1c1c30", background: "#0e0e1e", overflow: "hidden" }}>
                        {/* Activity */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", borderBottom: "1px solid #1c1c30", overflow: "auto" }}>
                            <div style={{ padding: "8px 12px", borderBottom: "1px solid #1c1c30", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                <span style={{ fontSize: 13 }}>📝</span>
                                <span style={{ fontWeight: 600, fontSize: 12 }}>Activity</span>
                                <span style={{ marginLeft: "auto", fontSize: 9, color: "#6366f1", background: "#6366f118", padding: "1px 6px", borderRadius: 8 }}>Session Task</span>
                            </div>
                            <div style={{ padding: 10, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ background: "#161628", borderRadius: 8, padding: 10 }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>🎯 Today's Challenge</div>
                                    <p style={{ fontSize: 10, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>Build a story generator using prompt engineering techniques discussed in class.</p>
                                </div>
                                <div style={{ background: "#161628", borderRadius: 8, padding: 10 }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>📋 Steps</div>
                                    {["Open Scratch editor", "Create characters", "Write prompts", "Test & share"].map((s, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", fontSize: 10, color: "#d1d5db" }}>
                                            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid #3a3a50", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#6b7280", flexShrink: 0 }}>{i + 1}</div>
                                            {s}
                                        </div>
                                    ))}
                                </div>
                                <button style={{ width: "100%", padding: 7, borderRadius: 7, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>▶ Open Activity</button>
                            </div>
                        </div>
                        {/* Spark AI */}
                        <div style={{ height: 160, flexShrink: 0, display: "flex", flexDirection: "column" }}>
                            <div style={{ padding: "6px 12px", borderBottom: "1px solid #1c1c30", display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 13 }}>✨</span>
                                <span style={{ fontWeight: 600, fontSize: 12 }}>Spark AI</span>
                            </div>
                            <div style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 6 }}>
                                <div style={{ fontSize: 20 }}>🤖</div>
                                <p style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", margin: 0 }}>Ask Spark AI for help!</p>
                                <div style={{ display: "flex", width: "100%", gap: 4 }}>
                                    <input placeholder="Ask me anything…" style={{ flex: 1, background: "#161628", border: "1px solid #1c1c30", borderRadius: 6, padding: "6px 8px", color: "#fff", fontSize: 10, outline: "none" }} />
                                    <button style={{ background: "#f59e0b", border: "none", borderRadius: 6, padding: "6px 10px", color: "#000", fontWeight: 600, fontSize: 10, cursor: "pointer" }}>Ask</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── CHAT SIDEBAR ── */}
                {showChat && (
                    <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", background: "#0e0e1e", borderLeft: "1px solid #1c1c30" }}>
                        <div style={{ padding: "6px 10px", fontWeight: 600, fontSize: 11, borderBottom: "1px solid #1c1c30", display: "flex", justifyContent: "space-between" }}>
                            <span>💬 Chat</span>
                            <button onClick={() => setShowChat(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 12 }}>✕</button>
                        </div>
                        <div style={{ flex: 1, overflow: "auto", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
                            {messages.map((m: any, i: number) => (
                                <div key={i} style={{ background: "#161628", borderRadius: 6, padding: "4px 7px", fontSize: 10 }}>
                                    <div style={{ fontWeight: 600, fontSize: 8, opacity: 0.5, marginBottom: 1 }}>{m.senderName}</div>
                                    {m.message}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div style={{ display: "flex", padding: 6, gap: 4, borderTop: "1px solid #1c1c30" }}>
                            <input style={{ flex: 1, background: "#161628", border: "none", borderRadius: 6, padding: "5px 7px", color: "#fff", fontSize: 10, outline: "none" }} value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Message…" />
                            <button onClick={sendMessage} style={{ background: "#6366f1", border: "none", borderRadius: 6, padding: "5px 8px", color: "#fff", fontWeight: 600, fontSize: 10, cursor: "pointer" }}>↑</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ CONTROLS ═══ */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, padding: "7px 14px", background: "#101020", borderTop: "1px solid #1c1c30", flexShrink: 0 }}>
                {[
                    { icon: isAudioOn ? "🎤" : "🔇", label: "Mic", on: isAudioOn as boolean, danger: !(isAudioOn as boolean), fn: () => hmsActions.setLocalAudioEnabled(!isAudioOn) },
                    { icon: isVideoOn ? "📹" : "📷", label: "Cam", on: isVideoOn as boolean, danger: !(isVideoOn as boolean), fn: () => hmsActions.setLocalVideoEnabled(!isVideoOn) },
                    { icon: "🖥️", label: isScreenShared ? "Stop" : "Share", on: isScreenShared as boolean, warn: isScreenShared as boolean, fn: () => hmsActions.setScreenShareEnabled(!isScreenShared) },
                    { icon: "💬", label: "Chat", on: showChat, fn: () => setShowChat(!showChat) },
                ].map((b, i) => (
                    <button key={i} onClick={b.fn} style={{
                        display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8,
                        border: "none", cursor: "pointer", fontWeight: 600, fontSize: 11, color: "#fff",
                        background: b.danger ? "#ef4444" : b.warn ? "#f59e0b" : b.on ? "#6366f1" : "#1c1c30",
                    }}>
                        {b.icon} {b.label}
                    </button>
                ))}
                <div style={{ width: 1, height: 20, background: "#2a2a3e", margin: "0 2px" }} />
                <button onClick={async () => { await hmsActions.leave(); window.close(); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 11, color: "#fff", background: "#ef4444" }}>
                    📞 Leave
                </button>
            </div>
        </div>
    );
}
