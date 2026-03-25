import { useVideo } from "@100mslive/react-sdk";

export function VideoTile({
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", fontSize: isLarge ? 56 : 40, background: "linear-gradient(135deg,#1e1e2e,#252540)", color: "#555" }}>
                    {label.replace("🖥️ ", "").charAt(0)?.toUpperCase() ?? "?"}
                </div>
            )}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: isLarge ? "8px 12px" : "7px 9px", background: "linear-gradient(transparent, rgba(0,0,0,0.75))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: isLarge ? 12 : 12, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
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
