import { useEffect, useState, useRef } from "react";
import {
  useHMSActions,
  useHMSStore,
  useVideo,
  selectPeers,
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
} from "@100mslive/react-sdk";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { ConfidenceChips } from "../ConfidenceChips";
import * as s from "./VideoArea.css";

/* ── Small video tile ── */
function Tile({ trackId, label, isLarge, style: extraStyle }: {
  trackId: string | undefined;
  label: string;
  isLarge?: boolean;
  style?: React.CSSProperties;
}) {
  const { videoRef } = useVideo({ trackId: trackId ?? "" });
  return (
    <div
      style={{
        position: "relative",
        background: "#1a1a2e",
        borderRadius: isLarge ? 12 : 8,
        overflow: "hidden",
        ...extraStyle,
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
          width: "100%", height: "100%", fontSize: isLarge ? 48 : 20,
          background: "linear-gradient(135deg,#1e1e2e,#252540)", color: "#555",
        }}>
          {label.charAt(0)?.toUpperCase() ?? "?"}
        </div>
      )}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: isLarge ? "6px 10px" : "3px 6px",
        background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
      }}>
        <span style={{ fontSize: isLarge ? 11 : 9, fontWeight: 500, color: "#fff" }}>{label}</span>
      </div>
    </div>
  );
}

/* ── Props ── */
interface VideoAreaProps {
  facilitatorName?: string;
  confidence: "got_it" | "kinda" | "lost" | null;
  onConfidenceChange: (value: "got_it" | "kinda" | "lost" | null) => void;
  questionActive: boolean;
  roomCode?: string | null;
  userName?: string;
}

export function VideoArea({
  confidence,
  onConfidenceChange,
  questionActive,
  roomCode,
  userName = "Student",
}: VideoAreaProps) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers: any[] = (useHMSStore(selectPeers) as any[]) || [];
  const isAudioOn = useHMSStore(selectIsLocalAudioEnabled);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const [joinError, setJoinError] = useState<string | null>(null);
  const joinedRef = useRef(false);

  // Join room when roomCode is available
  useEffect(() => {
    if (!roomCode || joinedRef.current) return;
    joinedRef.current = true;
    (async () => {
      try {
        const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode });
        await hmsActions.join({ userName, authToken });
      } catch (err: any) {
        const msg = err?.message || err?.description || String(err);
        if (msg.includes("not active") || msg.includes("403")) {
          setJoinError("Class not started yet");
        } else {
          setJoinError(`Failed to join: ${msg}`);
        }
      }
    })();
    return () => { hmsActions.leave(); joinedRef.current = false; };
  }, [roomCode]);

  // Leave on tab close
  useEffect(() => {
    const h = () => hmsActions.leave();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [hmsActions]);

  // Build tiles: screen shares first, then cameras
  const tiles: { id: string; trackId: string | undefined; label: string; isScreen: boolean }[] = [];
  for (const p of peers) {
    if (p.auxiliaryTracks?.length) {
      tiles.push({ id: `screen-${p.id}`, trackId: p.auxiliaryTracks[0], label: `🖥️ ${p.name || "?"}`, isScreen: true });
    }
  }
  for (const p of peers) {
    tiles.push({ id: p.id, trackId: p.videoTrack, label: `${p.name || "?"}${p.isLocal ? " (You)" : ""}`, isScreen: false });
  }

  const screenTile = tiles.find(t => t.isScreen);
  const cameraTiles = tiles.filter(t => !t.isScreen);

  // No room code — show placeholder
  if (!roomCode) {
    return (
      <div className={s.root}>
        <div className={s.main}>
          <div style={{ color: "#666", fontSize: 14 }}>No live class right now</div>
        </div>
        <div className={s.bottomArea}>
          <ConfidenceChips value={confidence} onChange={onConfidenceChange} disabled={!questionActive} />
        </div>
      </div>
    );
  }

  // Error state
  if (joinError) {
    return (
      <div className={s.root}>
        <div className={s.main}>
          <div style={{ color: "#f87171", fontSize: 14, textAlign: "center" }}>{joinError}</div>
        </div>
        <div className={s.bottomArea}>
          <ConfidenceChips value={confidence} onChange={onConfidenceChange} disabled={!questionActive} />
        </div>
      </div>
    );
  }

  // Connecting state
  if (!isConnected) {
    return (
      <div className={s.root}>
        <div className={s.main}>
          <div style={{ color: "#999", fontSize: 14 }}>Joining class…</div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.root}>
      {/* Live badge */}
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>
        <div className={s.liveBadge}>
          <span className={s.liveDot} />
          LIVE · {peers.length}
        </div>
      </div>

      {/* Main video area */}
      <div className={s.main} style={{ padding: 6, gap: 4 }}>
        {screenTile ? (
          /* Screen share mode: big screen + camera strip */
          <div style={{ display: "flex", width: "100%", height: "100%", gap: 4 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Tile trackId={screenTile.trackId} label={screenTile.label} isLarge style={{ width: "100%", height: "100%" }} />
            </div>
            <div style={{ width: 100, display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
              {cameraTiles.map(t => (
                <Tile key={t.id} trackId={t.trackId} label={t.label} style={{ width: "100%", aspectRatio: "4/3", flexShrink: 0 }} />
              ))}
            </div>
          </div>
        ) : (
          /* Grid mode */
          <div style={{
            display: "grid", width: "100%", height: "100%", gap: 4,
            gridTemplateColumns: tiles.length <= 1 ? "1fr" : tiles.length <= 4 ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(160px, 1fr))",
            alignContent: "start",
          }}>
            {tiles.map(t => (
              <Tile key={t.id} trackId={t.trackId} label={t.label} style={{ width: "100%", aspectRatio: "16/9" }} />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={s.controls}>
        <button
          className={`${s.controlBtn} ${!isAudioOn ? s.controlBtnActive : ""}`}
          onClick={() => hmsActions.setLocalAudioEnabled(!isAudioOn)}
        >
          {isAudioOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button
          className={`${s.controlBtn} ${!isVideoOn ? s.controlBtnActive : ""}`}
          onClick={() => hmsActions.setLocalVideoEnabled(!isVideoOn)}
        >
          {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
      </div>

      {/* Confidence chips */}
      <div className={s.bottomArea}>
        <ConfidenceChips value={confidence} onChange={onConfidenceChange} disabled={!questionActive} />
      </div>
    </div>
  );
}
