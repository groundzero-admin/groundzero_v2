import { useEffect, useLayoutEffect, useMemo, useState, useCallback, useRef, type CSSProperties } from "react";
import { useSearchParams } from "react-router";
import {
  useHMSActions,
  useHMSStore,
  useVideo,
  selectPeers,
  selectIsConnectedToRoom,
  selectTracksMap,
} from "@100mslive/react-sdk";

function FullTile({
  trackId,
  label,
  onVideoReady,
  objectFit = "contain",
  fillContainer,
}: {
  trackId?: string;
  label: string;
  onVideoReady?: () => void;
  objectFit?: "contain" | "cover";
  fillContainer?: boolean;
}) {
  const { videoRef } = useVideo({ trackId: trackId ?? "" });
  const [visible, setVisible] = useState(false);
  const elRef = useRef<HTMLVideoElement | null>(null);

  const mergedVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      elRef.current = node;
      videoRef(node);
    },
    [videoRef],
  );

  useLayoutEffect(() => {
    setVisible(false);
    const el = elRef.current;
    if (!el || !trackId) return;
    const show = () => {
      setVisible(true);
      onVideoReady?.();
    };
    el.addEventListener("playing", show);
    el.addEventListener("loadeddata", show);
    return () => {
      el.removeEventListener("playing", show);
      el.removeEventListener("loadeddata", show);
    };
  }, [trackId, onVideoReady]);

  const base: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit,
    objectPosition: "center center",
    backgroundColor: "#000",
    opacity: visible ? 1 : 0,
    transition: "opacity 0.2s ease-out",
  };
  const videoStyle: CSSProperties = fillContainer ? { ...base, position: "absolute", inset: 0 } : base;

  return (
    <div style={{ width: "100%", height: "100%", background: "#000", position: "relative" }}>
      {trackId ? (
        <video ref={mergedVideoRef} autoPlay muted playsInline style={videoStyle} />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#cbd5e1",
            fontSize: 28,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

function isRecorderPeer(p: { name?: string }) {
  return String(p.name || "")
    .toLowerCase()
    .includes("recorder");
}

function findScreenTrackId(
  peer: { auxiliaryTracks?: string[] } | null,
  tracks: Record<string, { type?: string; source?: string }>,
): string | null {
  if (!peer?.auxiliaryTracks?.length) return null;
  for (const tid of peer.auxiliaryTracks) {
    const t = tracks[tid];
    if (t?.type === "video" && t?.source === "screen") return tid;
  }
  return null;
}

function scorePeer(
  p: { name?: string; videoTrack?: string; auxiliaryTracks?: string[] },
  tokens: string[],
  tracks: Record<string, { type?: string; source?: string }>,
) {
  const name = String(p.name || "").toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (t && name.includes(t)) score += 100;
  }
  if (findScreenTrackId(p, tracks)) score += 50;
  else if (p.auxiliaryTracks?.length) score += 25;
  if (p.videoTrack) score += 20;
  return score;
}

export default function RecordingRendererPage() {
  const [params] = useSearchParams();
  const roomCode = params.get("roomCode") || "";
  const focusRaw = params.get("focusName") || "Teacher";
  const focusTokens = useMemo(
    () =>
      focusRaw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    [focusRaw],
  );
  const recorderName = params.get("recorderName") || "Class Recorder";

  const hmsActions = useHMSActions();
  const peers: any[] = (useHMSStore(selectPeers) as any[]) || [];
  const tracksMap = useHMSStore(selectTracksMap) as Record<string, { type?: string; source?: string }>;
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const [mainReady, setMainReady] = useState(false);

  const bumpReady = useCallback(() => setMainReady(true), []);

  useEffect(() => {
    if (!roomCode) return;
    (async () => {
      try {
        const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode });
        await hmsActions.join({
          userName: recorderName,
          authToken,
          settings: { isAudioMuted: true, isVideoMuted: true },
        });
      } catch {
        /* beam join */
      }
    })();
    return () => {
      hmsActions.leave();
    };
  }, [hmsActions, recorderName, roomCode]);

  const teacherPeer = useMemo(() => {
    const remote = peers.filter((p) => !p.isLocal && !isRecorderPeer(p));
    if (remote.length === 0) return null;
    const tokens = focusTokens.length ? focusTokens : ["teacher"];
    let best = remote[0];
    let bestScore = scorePeer(best, tokens, tracksMap);
    for (let i = 1; i < remote.length; i++) {
      const p = remote[i];
      const s = scorePeer(p, tokens, tracksMap);
      if (s > bestScore) {
        best = p;
        bestScore = s;
      }
    }
    return best;
  }, [focusTokens, peers, tracksMap]);

  const teacherScreen = findScreenTrackId(teacherPeer, tracksMap);
  const teacherCam = teacherPeer?.videoTrack ?? null;

  useEffect(() => {
    setMainReady(false);
  }, [roomCode, teacherScreen, teacherCam]);

  const pipStyle: CSSProperties = {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 280,
    height: 158,
    zIndex: 2,
    border: "2px solid rgba(255,255,255,0.25)",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 10px 28px rgba(0,0,0,0.55)",
  };

  const overlayStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(2,6,23,0.75)",
    color: "#e2e8f0",
    fontSize: 18,
    pointerEvents: "none",
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#020617", overflow: "hidden" }}>
      {!roomCode ? (
        <div
          style={{
            color: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          Missing room code
        </div>
      ) : !isConnected ? (
        <div
          style={{
            color: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          Joining room...
        </div>
      ) : teacherScreen ? (
        <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "100%" }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <FullTile
              trackId={teacherScreen}
              label="Screen share"
              onVideoReady={bumpReady}
              objectFit="cover"
              fillContainer
            />
          </div>
          {teacherCam && teacherCam !== teacherScreen ? (
            <div style={pipStyle}>
              <FullTile trackId={teacherCam} label="Camera" objectFit="cover" />
            </div>
          ) : null}
          {!mainReady && (
            <div style={{ ...overlayStyle, zIndex: 1 }}>Waiting for screen share frames…</div>
          )}
        </div>
      ) : teacherCam ? (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <FullTile trackId={teacherCam} label="Teacher Camera" onVideoReady={bumpReady} />
          {!mainReady && <div style={overlayStyle}>Waiting for camera frames…</div>}
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            color: "#e2e8f0",
            fontSize: 18,
            padding: 24,
            textAlign: "center",
          }}
        >
          <div>{teacherPeer ? "Waiting for teacher camera or screen share…" : "Waiting for teacher to join…"}</div>
          <div style={{ fontSize: 14, color: "#94a3b8", maxWidth: 480 }}>
            Use Share screen in the live class to record slides; the teacher camera appears in the corner when both are on.
          </div>
        </div>
      )}
    </div>
  );
}
