import { useEffect, useState, useRef } from "react";
import {
  useHMSActions,
  useHMSStore,
  useVideo,
  selectPeers,
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsLocalScreenShared,
} from "@100mslive/react-sdk";
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff } from "lucide-react";
import { ConfidenceChips } from "../ConfidenceChips";
import * as s from "./VideoArea.css";

/* ── Single video tile ── */
function VideoTile({ trackId, label, isLarge, style: extra }: {
  trackId: string | undefined;
  label: string;
  isLarge?: boolean;
  style?: React.CSSProperties;
}) {
  const { videoRef } = useVideo({ trackId: trackId ?? "" });
  return (
    <div style={{ position: "relative", background: "#0d0d1a", borderRadius: isLarge ? 12 : 8, overflow: "hidden", ...extra }}>
      {trackId ? (
        <video
          ref={videoRef}
          style={{ width: "100%", height: "100%", objectFit: isLarge ? "contain" : "cover" }}
          autoPlay muted playsInline
        />
      ) : (
        <div style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg,#1a1a2e,#1e1e40)",
          color: isLarge ? "#4a4a7a" : "#444",
          fontSize: isLarge ? 56 : 18, fontWeight: 700,
        }}>
          {label.charAt(0)?.toUpperCase() ?? "?"}
        </div>
      )}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: isLarge ? "10px 14px" : "3px 6px",
        background: "linear-gradient(transparent, rgba(0,0,0,0.78))",
      }}>
        <span style={{ fontSize: isLarge ? 12 : 9, fontWeight: 600, color: "#fff" }}>{label}</span>
      </div>
    </div>
  );
}

/* ── Props ── */
interface VideoAreaProps {
  confidence: "got_it" | "kinda" | "lost" | null;
  onConfidenceChange: (v: "got_it" | "kinda" | "lost" | null) => void;
  questionActive: boolean;
  roomCode?: string | null;
  userName?: string;
}

export function VideoArea({ confidence, onConfidenceChange, questionActive: _qa, roomCode, userName = "Student" }: VideoAreaProps) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers: any[] = (useHMSStore(selectPeers) as any[]) || [];
  const isAudioOn = useHMSStore(selectIsLocalAudioEnabled);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const isScreenShared = useHMSStore(selectIsLocalScreenShared);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);
  const joinedRef = useRef(false);

  // Join HMS room
  useEffect(() => {
    if (!roomCode || joinedRef.current) return;
    joinedRef.current = true;
    (async () => {
      try {
        const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode });
        await hmsActions.join({ userName, authToken });
      } catch (err: any) {
        const msg = err?.message || err?.description || String(err);
        setJoinError(msg.includes("not active") || msg.includes("403") ? "Class not started yet" : `Failed: ${msg}`);
      }
    })();
    return () => { hmsActions.leave(); joinedRef.current = false; };
  }, [roomCode]);

  useEffect(() => {
    const h = () => hmsActions.leave();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [hmsActions]);

  // Broadcast confidence to teacher
  const handleConfidenceChange = (val: "got_it" | "kinda" | "lost" | null) => {
    onConfidenceChange(val);
    if (val && isConnected) {
      hmsActions.sendBroadcastMessage(JSON.stringify({ type: "confidence_pulse", value: val, studentName: userName }));
    }
  };

  /* ── Build peer list ── */
  // spotlightPeer = pinned one, default to first non-local (teacher) else first
  const effectivePinnedId = pinnedPeerId ?? peers.find(p => !p.isLocal)?.id ?? peers[0]?.id ?? null;
  const spotlightPeer = peers.find(p => p.id === effectivePinnedId) ?? null;

  // Screen share from the spotlit peer (or any peer if none pinned)
  const spotlightScreen = spotlightPeer?.auxiliaryTracks?.[0] ?? null;

  // Participant strip = all peers
  const participantStrip = peers;

  /* ── Simple states ── */
  const loadingView = (msg: string) => (
    <div className={s.root}>
      <div className={s.main}><div style={{ color: "#666", fontSize: 14, textAlign: "center" }}>{msg}</div></div>
      <div className={s.bottomArea}><ConfidenceChips value={confidence} onChange={handleConfidenceChange} disabled={false} /></div>
    </div>
  );

  if (!roomCode) return loadingView("No live class right now");
  if (joinError) return (
    <div className={s.root}>
      <div className={s.main}><div style={{ color: "#f87171", fontSize: 14, textAlign: "center" }}>{joinError}</div></div>
      <div className={s.bottomArea}><ConfidenceChips value={confidence} onChange={handleConfidenceChange} disabled={false} /></div>
    </div>
  );
  if (!isConnected) return loadingView("Joining class…");

  return (
    <div className={s.root}>

      {/* Live badge */}
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>
        <div className={s.liveBadge}><span className={s.liveDot} />LIVE · {peers.length}</div>
      </div>

      {/* ━━ SPOTLIGHT ━━ */}
      <div className={s.main} style={{ padding: 6, paddingBottom: 4, position: "relative" }}>
        {spotlightScreen ? (
          /* ── Screen share active: screen fills area, camera as PiP ── */
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            {/* Big: screen share */}
            <VideoTile
              trackId={spotlightScreen}
              label={`🖥️ ${spotlightPeer?.name ?? "?"}'s screen`}
              isLarge
              style={{ width: "100%", height: "100%", borderRadius: 12 }}
            />
            {/* PiP: spotlit person's camera (bottom-right corner inside spotlight) */}
            <div style={{
              position: "absolute", bottom: 10, right: 10,
              width: 130, height: 90,
              borderRadius: 10,
              border: "2px solid rgba(99,102,241,0.7)",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              zIndex: 5,
            }}>
              <VideoTile
                trackId={spotlightPeer?.videoTrack}
                label={spotlightPeer?.name ?? "?"}
                style={{ width: "100%", height: "100%", borderRadius: 0 }}
              />
            </div>
          </div>
        ) : (
          /* ── No screen share: spotlit person's camera fills area ── */
          <VideoTile
            trackId={spotlightPeer?.videoTrack}
            label={spotlightPeer ? `${spotlightPeer.name}${spotlightPeer.isLocal ? " (You)" : ""}` : "Waiting…"}
            isLarge
            style={{ width: "100%", height: "100%", borderRadius: 12 }}
          />
        )}
      </div>

      {/* ━━ PARTICIPANT STRIP ━━ */}
      {participantStrip.length > 0 && (
        <div style={{
          display: "flex", gap: 6, padding: "5px 8px",
          overflowX: "auto", flexShrink: 0,
          background: "rgba(0,0,0,0.25)",
          scrollbarWidth: "none",
        }}>
          {participantStrip.map(p => {
            const isSelected = p.id === effectivePinnedId;
            return (
              <button
                key={p.id}
                onClick={() => setPinnedPeerId(p.id)}
                style={{
                  position: "relative",
                  width: 72, height: 52,
                  flexShrink: 0, flexGrow: 0,
                  border: isSelected ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.08)",
                  borderRadius: 9,
                  overflow: "hidden",
                  cursor: "pointer",
                  padding: 0,
                  background: "transparent",
                  outline: "none",
                  boxShadow: isSelected ? "0 0 10px rgba(34,197,94,0.35)" : "none",
                  transition: "border-color 0.15s, box-shadow 0.15s, transform 0.12s",
                  transform: isSelected ? "scale(1.06)" : "scale(1)",
                }}
              >
                <VideoTile trackId={p.videoTrack} label={p.name ?? "?"} style={{ width: "100%", height: "100%", borderRadius: 0 }} />
                {/* Green dot indicator for selected */}
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

      {/* ━━ CONTROLS ━━ */}
      <div className={s.controls}>
        <button className={`${s.controlBtn} ${!isAudioOn ? s.controlBtnActive : ""}`}
          onClick={() => hmsActions.setLocalAudioEnabled(!isAudioOn)} title={isAudioOn ? "Mute" : "Unmute"}>
          {isAudioOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button className={`${s.controlBtn} ${!isVideoOn ? s.controlBtnActive : ""}`}
          onClick={() => hmsActions.setLocalVideoEnabled(!isVideoOn)} title={isVideoOn ? "Camera off" : "Camera on"}>
          {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
        <button className={`${s.controlBtn} ${isScreenShared ? s.controlBtnActive : ""}`}
          onClick={() => hmsActions.setScreenShareEnabled(!isScreenShared)} title={isScreenShared ? "Stop sharing" : "Share screen"}>
          {isScreenShared ? <MonitorOff size={18} /> : <Monitor size={18} />}
        </button>
      </div>

      {/* ━━ CONFIDENCE CHIPS ━━ */}
      <div className={s.bottomArea}>
        <ConfidenceChips value={confidence} onChange={handleConfidenceChange} disabled={false} />
      </div>
    </div>
  );
}
