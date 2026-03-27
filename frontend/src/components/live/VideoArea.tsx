import { useEffect, useState } from "react";
import { Users, X, UserRoundCheck, MoreVertical } from "lucide-react";
import { VideoTile } from "./VideoTile";

export interface TileData {
    id: string;
    trackId: string | undefined;
    label: string;
    isScreen: boolean;
    peerId: string;
    isLocal: boolean;
    audioTrack?: string;
}

export function VideoArea({ tiles = [], pinnedId, setPinnedId, onMute, onStopCamera, canModerateParticipants = false, preferredMainPeerId, isCompactViewport = false }: {
    tiles: TileData[];
    pinnedId: string | null;
    setPinnedId: (id: string | null) => void;
    onMute?: (tile: TileData) => (() => void) | undefined;
    onStopCamera?: (tile: TileData) => (() => void) | undefined;
    canModerateParticipants?: boolean;
    preferredMainPeerId?: string | null;
    isCompactViewport?: boolean;
}) {
    // On mobile (compact) start hidden; on laptop start visible.
    const [showParticipants, setShowParticipants] = useState(() => !isCompactViewport);
    const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

    useEffect(() => {
        setShowParticipants(!isCompactViewport);
    }, [isCompactViewport]);

    const hasScreenShare = tiles.some(t => t.isScreen);
    // If pinnedId points at a peer who left (or stale id), fall back — otherwise spotlight stays null while tiles exist.
    let spotlightTile: TileData | null = null;
    if (pinnedId) spotlightTile = tiles.find(t => t.id === pinnedId) ?? null;
    if (!spotlightTile) {
        if (hasScreenShare) spotlightTile = tiles.find(t => t.isScreen) || null;
        else {
            spotlightTile =
                (preferredMainPeerId ? tiles.find(t => !t.isScreen && t.peerId === preferredMainPeerId) : null)
                ?? tiles.find(t => !t.isScreen && !t.isLocal)
                ?? tiles[0]
                ?? null;
        }
    }

    const peerScreenTile = spotlightTile ? tiles.find(t => t.isScreen && t.peerId === spotlightTile!.peerId) : null;
    const peerCamTile = spotlightTile ? tiles.find(t => !t.isScreen && t.peerId === spotlightTile!.peerId) : null;
    const bigTile = peerScreenTile ?? (spotlightTile?.isScreen ? spotlightTile : null);
    const pipTile = bigTile && peerScreenTile ? peerCamTile : null;

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, background: "#0b0b1a" }}>
            <style>{`
              .participantStripScroll::-webkit-scrollbar { height: 9px; }
              .participantStripScroll::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.18); border-radius: 999px; }
              .participantStripScroll::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.75); border-radius: 999px; border: 2px solid rgba(0,0,0,0.25); }
              .participantStripScroll::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.95); }
            `}</style>
            {/* Spotlight */}
            <div style={{ flex: 1, minHeight: 0, padding: 6, paddingBottom: 4 }}>
                {spotlightTile ? (
                    bigTile ? (
                        <div style={{ width: "100%", height: "100%", position: "relative" }}>
                            <VideoTile trackId={bigTile.trackId} label={bigTile.label} isPinned={false} isLarge onPin={() => { }} style={{ width: "100%", height: "100%", borderRadius: 12 }} />
                            {pipTile && (
                                <div style={{ position: "absolute", bottom: 10, right: 10, width: 140, height: 96, borderRadius: 10, overflow: "hidden", border: "2px solid rgba(99,102,241,0.7)", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", zIndex: 5 }}>
                                    <VideoTile trackId={pipTile.trackId} label={pipTile.label} isPinned={false} onPin={() => { }} style={{ width: "100%", height: "100%", borderRadius: 0 }} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <VideoTile trackId={spotlightTile.trackId} label={spotlightTile.label} isPinned={!!pinnedId} isLarge onPin={() => setPinnedId(null)} style={{ width: "100%", height: "100%", borderRadius: 12 }} />
                    )
                ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 14, background: "#0d0d1a", borderRadius: 12 }}>
                        {tiles.length === 0 ? "Connecting video…" : "Waiting for participants…"}
                    </div>
                )}
            </div>

            {/* Participant strip controls */}
            {tiles.length > 0 && (
                <div
                    style={{
                        padding: isCompactViewport ? "6px 8px 0" : "0 8px 6px",
                        background: isCompactViewport ? "rgba(0,0,0,0.3)" : "transparent",
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={() => setShowParticipants(v => !v)}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "7px 10px",
                                borderRadius: 9,
                                border: "1px solid rgba(148,163,184,0.35)",
                                background: "rgba(15,23,42,0.85)",
                                color: "#e2e8f0",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 700,
                            }}
                        >
                            {showParticipants ? <X size={14} /> : <Users size={14} />}
                            {showParticipants ? "Hide participants" : "Show participants"}
                        </button>
                        {isCompactViewport && (
                            <button
                                type="button"
                                onClick={() => {
                                    const teacherLike = tiles.find(t => t.peerId === preferredMainPeerId)
                                        ?? tiles.find(t => !t.isScreen && !t.isLocal)
                                        ?? null;
                                    if (teacherLike) setPinnedId(teacherLike.id);
                                }}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "7px 10px",
                                    borderRadius: 9,
                                    border: "1px solid rgba(34,197,94,0.45)",
                                    background: "rgba(20,83,45,0.6)",
                                    color: "#dcfce7",
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}
                            >
                                <UserRoundCheck size={14} />
                                Select teacher
                            </button>
                        )}
                    </div>
                </div>
            )}
            {tiles.length > 0 && showParticipants && (
                <div className="participantStripScroll" style={{ display: "flex", gap: 6, padding: isCompactViewport ? "10px 8px" : "14px 8px", overflowX: "auto", flexShrink: 0, background: "rgba(0,0,0,0.3)", scrollbarWidth: "thin", alignItems: "center" }}>
                    {tiles.filter(t => !t.isScreen).map(t => {
                        const isSelected = t.id === (pinnedId ?? tiles.find(x => !x.isScreen && !x.isLocal)?.id ?? tiles[0]?.id);
                        const cardW = isCompactViewport ? 200 : 280;
                        const cardH = isCompactViewport ? 140 : 200;
                        const muteAction = onMute?.(t);
                        const stopCameraAction = onStopCamera?.(t);
                        const canShowMenu = canModerateParticipants && (!!muteAction || !!stopCameraAction);
                        return (
                            <button key={t.id} onClick={() => setPinnedId(pinnedId === t.id ? null : t.id)} style={{ position: "relative", width: cardW, height: cardH, flexShrink: 0, padding: 0, background: "transparent", outline: "none", border: isSelected ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", cursor: "pointer", boxShadow: isSelected ? "0 0 14px rgba(34,197,94,0.35)" : "none", transition: "border-color 0.15s, box-shadow 0.15s, transform 0.12s", transform: isSelected ? "scale(1.06)" : "scale(1)" }}>
                                <VideoTile
                                    trackId={t.trackId}
                                    label={t.label}
                                    isPinned={false}
                                    onPin={() => { }}
                                    style={{ width: "100%", height: "100%", borderRadius: 0 }}
                                />
                                {canShowMenu && (
                                    <div style={{ position: "absolute", top: 6, right: 6, zIndex: 6 }}>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpenFor((prev) => (prev === t.id ? null : t.id));
                                            }}
                                            aria-label="Participant actions"
                                            style={{ width: 24, height: 24, borderRadius: 999, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(15,23,42,0.72)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                        >
                                            <MoreVertical size={14} />
                                        </button>
                                        {menuOpenFor === t.id && (
                                            <div style={{ marginTop: 4, minWidth: 110, borderRadius: 8, background: "rgba(15,23,42,0.94)", border: "1px solid rgba(148,163,184,0.32)", boxShadow: "0 8px 20px rgba(0,0,0,0.35)", overflow: "hidden" }}>
                                                {muteAction && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            muteAction();
                                                            setMenuOpenFor(null);
                                                        }}
                                                        style={{ width: "100%", border: "none", background: "transparent", color: "#f1f5f9", fontSize: 12, fontWeight: 700, padding: "8px 10px", textAlign: "left", cursor: "pointer" }}
                                                    >
                                                        Mute
                                                    </button>
                                                )}
                                                {stopCameraAction && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            stopCameraAction();
                                                            setMenuOpenFor(null);
                                                        }}
                                                        style={{ width: "100%", border: "none", background: "transparent", color: "#f1f5f9", fontSize: 12, fontWeight: 700, padding: "8px 10px", textAlign: "left", cursor: "pointer", borderTop: muteAction ? "1px solid rgba(148,163,184,0.2)" : "none" }}
                                                    >
                                                        Stop camera
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {isSelected && <div style={{ position: "absolute", top: 3, right: 3, width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e" }} />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
