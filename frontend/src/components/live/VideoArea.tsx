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

export function VideoArea({ tiles = [], pinnedId, setPinnedId, onMute }: {
    tiles: TileData[];
    pinnedId: string | null;
    setPinnedId: (id: string | null) => void;
    onMute: (tile: TileData) => (() => void) | undefined;
}) {
    const hasScreenShare = tiles.some(t => t.isScreen);
    let spotlightTile: TileData | null = null;
    if (pinnedId) spotlightTile = tiles.find(t => t.id === pinnedId) || null;
    else if (hasScreenShare) spotlightTile = tiles.find(t => t.isScreen) || null;
    else spotlightTile = tiles.find(t => !t.isScreen && !t.isLocal) ?? tiles[0] ?? null;

    const peerScreenTile = spotlightTile ? tiles.find(t => t.isScreen && t.peerId === spotlightTile!.peerId) : null;
    const peerCamTile = spotlightTile ? tiles.find(t => !t.isScreen && t.peerId === spotlightTile!.peerId) : null;
    const bigTile = peerScreenTile ?? (spotlightTile?.isScreen ? spotlightTile : null);
    const pipTile = bigTile && peerScreenTile ? peerCamTile : null;

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, background: "#0b0b1a" }}>
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
                        <VideoTile trackId={spotlightTile.trackId} label={spotlightTile.label} isPinned={!!pinnedId} isLarge onPin={() => setPinnedId(null)} onMute={onMute(spotlightTile)} style={{ width: "100%", height: "100%", borderRadius: 12 }} />
                    )
                ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 14, background: "#0d0d1a", borderRadius: 12 }}>
                        Waiting for participants…
                    </div>
                )}
            </div>

            {/* Participant strip */}
            {tiles.length > 0 && (
                <div style={{ display: "flex", gap: 6, padding: "5px 8px", overflowX: "auto", flexShrink: 0, background: "rgba(0,0,0,0.3)", scrollbarWidth: "none" }}>
                    {tiles.filter(t => !t.isScreen).map(t => {
                        const isSelected = t.id === (pinnedId ?? tiles.find(x => !x.isScreen && !x.isLocal)?.id ?? tiles[0]?.id);
                        return (
                            <button key={t.id} onClick={() => setPinnedId(pinnedId === t.id ? null : t.id)} style={{ position: "relative", width: 80, height: 56, flexShrink: 0, padding: 0, background: "transparent", outline: "none", border: isSelected ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.08)", borderRadius: 9, overflow: "hidden", cursor: "pointer", boxShadow: isSelected ? "0 0 10px rgba(34,197,94,0.35)" : "none", transition: "border-color 0.15s, box-shadow 0.15s, transform 0.12s", transform: isSelected ? "scale(1.06)" : "scale(1)" }}>
                                <VideoTile trackId={t.trackId} label={t.label} isPinned={false} onPin={() => { }} style={{ width: "100%", height: "100%", borderRadius: 0 }} />
                                {isSelected && <div style={{ position: "absolute", top: 3, right: 3, width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e" }} />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
