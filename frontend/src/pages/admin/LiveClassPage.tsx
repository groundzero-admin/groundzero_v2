import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useHMSActions, useHMSStore, selectPeers, selectIsConnectedToRoom, selectHMSMessages, selectIsLocalAudioEnabled, selectIsLocalVideoEnabled, selectIsLocalScreenShared } from "@100mslive/react-sdk";
import { Mic, MicOff, Camera, CameraOff, Monitor, MonitorOff, PhoneOff } from "lucide-react";
import { useSessionActivities, useLaunchActivity, usePauseActivity, useLivePulse, useSessionScores, useSessionActivityScores, useCohortStudents, useTeacherSessionView } from "@/api/hooks/useTeacher";
import { VideoArea, type TileData } from "@/components/live/VideoArea";
import { ActivitiesTab } from "@/components/live/ActivitiesTab";
import { FeedTab } from "@/components/live/FeedTab";
import { LiveQuestionAnswersTab } from "@/components/live/LiveQuestionAnswersTab";
import { ChatTab } from "@/components/live/ChatTab";

export default function LiveClassPage() {
    const [params] = useSearchParams();
    const roomCode  = params.get("roomCode")  || "";
    const userName  = params.get("userName")  || "Teacher";
    const cohortId  = params.get("cohortId")  || "";
    const sessionId = params.get("sessionId") || "";

    const hmsActions    = useHMSActions();
    const isConnected   = useHMSStore(selectIsConnectedToRoom);
    const peers: any[]  = (useHMSStore(selectPeers) as any[]) || [];
    const messages: any[] = (useHMSStore(selectHMSMessages) as any[]) || [];
    const isAudioOn     = useHMSStore(selectIsLocalAudioEnabled);
    const isVideoOn     = useHMSStore(selectIsLocalVideoEnabled);
    const isScreenShared = useHMSStore(selectIsLocalScreenShared);

    const [pinnedId, setPinnedId]         = useState<string | null>(null);
    const [chatText, setChatText]         = useState("");
    const [activeTab, setActiveTab]       = useState<"activities" | "feed" | "preview" | "chat">("activities");
    const [activeType, setActiveType]     = useState<string | null>(null);
    const [feedActivityId, setFeedActivityId] = useState<string | null>(null);
    const [joinError, setJoinError]       = useState<string | null>(null);

    /** Teacher right panel (Activities / Feed / Preview / Chat): fixed at max width */
    const SIDEBAR_WIDTH_PX = 560;

    const { data: sessionActivities } = useSessionActivities(sessionId || undefined);
    const { data: pulseEvents }       = useLivePulse(cohortId || undefined, sessionId || undefined);
    const { data: _scores }           = useSessionScores(cohortId || undefined, sessionId || undefined);
    const { data: activityScores }    = useSessionActivityScores(cohortId || undefined, sessionId || undefined);
    const { data: cohortStudents }    = useCohortStudents(cohortId || undefined);
    const { data: sessionView }       = useTeacherSessionView(cohortId || undefined, sessionId || undefined);
    const launchActivity = useLaunchActivity();
    const pauseActivity  = usePauseActivity();

    // Join HMS
    useEffect(() => {
        if (!roomCode) return;
        (async () => {
            try {
                const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode });
                await hmsActions.join({ userName, authToken });
            } catch (err: any) {
                const msg = err?.message || err?.description || String(err);
                setJoinError(msg.includes("not active") || msg.includes("403") ? "This class has not started yet." : `Failed to join: ${msg}`);
            }
        })();
        return () => { hmsActions.leave(); };
    }, [roomCode]);

    useEffect(() => {
        const h = () => hmsActions.leave();
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, [hmsActions]);

    async function handleLeaveClass() {
        try { await hmsActions.leave(); } catch { }
        window.close();
    }

    if (joinError) return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0b0b1a", color: "#fff", fontFamily: "'Inter',sans-serif", gap: 16 }}>
            <div style={{ fontSize: 48 }}>📡</div>
            <div style={{ fontSize: 18, fontWeight: 600, textAlign: "center", maxWidth: 380 }}>{joinError}</div>
            <button onClick={() => window.close()} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Close Tab</button>
        </div>
    );

    if (!roomCode) return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0b0b1a", color: "#cbd5e1", fontFamily: "'Inter',sans-serif", gap: 16, padding: 24 }}>
            <div style={{ fontSize: 48 }}>🔗</div>
            <div style={{ fontSize: 16, fontWeight: 600, textAlign: "center", maxWidth: 420 }}>
                Missing room link. Open Live Class from the teacher dashboard (Go Live or Rejoin) so the video room code is included.
            </div>
            <button type="button" onClick={() => window.close()} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Close Tab</button>
        </div>
    );

    if (!isConnected && roomCode) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0b0b1a", color: "#fff", fontFamily: "'Inter',sans-serif", fontSize: 16 }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width: 24, height: 24, border: "3px solid #222", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin .7s linear infinite", marginRight: 10 }} />
            Joining class…
        </div>
    );

    // Build tiles
    const tiles: TileData[] = [];
    for (const p of peers) {
        if (p.auxiliaryTracks?.length) tiles.push({ id: `screen-${p.id}`, trackId: p.auxiliaryTracks[0], label: `🖥️ ${p.name || "?"}`, isScreen: true, peerId: p.id, isLocal: p.isLocal });
    }
    for (const p of peers) {
        tiles.push({ id: p.id, trackId: p.videoTrack, label: `${p.name || "?"}${p.isLocal ? " (You)" : ""}`, isScreen: false, peerId: p.id, isLocal: p.isLocal, audioTrack: p.audioTrack });
    }

    function makeMuteHandler(tile: TileData) {
        if (tile.isLocal || tile.isScreen || !tile.audioTrack) return undefined;
        return async () => { try { await hmsActions.setRemoteTrackEnabled(tile.audioTrack!, false); } catch { } };
    }

    const activityInfoById = new Map<string, { description?: string | null; questionCount?: number }>();
    for (const a of (sessionView?.activities ?? [])) {
        activityInfoById.set(a.activity_id, { description: a.description, questionCount: a.questions?.length ?? 0 });
    }

    const hasScreenShare = tiles.some(t => t.isScreen);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "'Inter',sans-serif" }}>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}} ::-webkit-scrollbar{width:6px;height:6px} ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:6px}`}</style>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fff", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>Live Class</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#16a34a", fontWeight: 700 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse 1.5s infinite" }} />
                        {peers.length} joined
                    </div>
                    {hasScreenShare && <span style={{ fontSize: 10, background: "#f59e0b18", color: "#b45309", padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>Screen shared</span>}
                </div>
                {pinnedId && <button onClick={() => setPinnedId(null)} style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 999, padding: "6px 10px", color: "#9a3412", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>Unpin</button>}
            </div>

            {/* Body */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                <VideoArea tiles={tiles} pinnedId={pinnedId} setPinnedId={setPinnedId} onMute={makeMuteHandler} />

                {/* Sidebar — fixed max width (not resizable) */}
                <div style={{ width: SIDEBAR_WIDTH_PX, flexShrink: 0, display: "flex", flexDirection: "column", borderLeft: "1px solid #e2e8f0", background: "#fff" }}>
                    <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
                        {(["activities", "feed", "preview", "chat"] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "10px 0", border: "none", cursor: "pointer", background: activeTab === tab ? "#eef2ff" : "transparent", color: activeTab === tab ? "#1e293b" : "#64748b", fontWeight: 800, fontSize: 10, borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent" }}>
                                {tab === "activities" ? "Activities" : tab === "feed" ? "Feed" : tab === "preview" ? "Preview" : "Chat"}
                            </button>
                        ))}
                    </div>
                    <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        {activeTab === "activities" && (
                            <ActivitiesTab activities={sessionActivities ?? []} sessionId={sessionId} activityInfoById={activityInfoById} launchActivity={launchActivity} pauseActivity={pauseActivity} activeType={activeType} setActiveType={setActiveType} />
                        )}
                        {activeTab === "feed" && (
                            <FeedTab sessionActivities={sessionActivities} activityScores={activityScores} cohortStudents={cohortStudents} pulseEvents={pulseEvents} messages={messages} feedActivityId={feedActivityId} setFeedActivityId={setFeedActivityId} activityInfoById={activityInfoById} />
                        )}
                        {activeTab === "preview" && cohortId && sessionId && (
                            <LiveQuestionAnswersTab
                                cohortId={cohortId}
                                sessionId={sessionId}
                                sessionActivities={sessionActivities}
                                sessionView={sessionView}
                                cohortStudents={cohortStudents}
                            />
                        )}
                        {activeTab === "chat" && (
                            <ChatTab messages={messages} chatText={chatText} setChatText={setChatText} sendMessage={async () => { if (!chatText.trim()) return; await hmsActions.sendBroadcastMessage(chatText.trim()); setChatText(""); }} />
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, padding: "8px 14px", background: "#101020", borderTop: "1px solid #1c1c30", flexShrink: 0 }}>
                {[
                    { icon: isAudioOn ? <Mic size={16} /> : <MicOff size={16} />, label: "Mic", on: isAudioOn as boolean, danger: !isAudioOn, fn: () => hmsActions.setLocalAudioEnabled(!isAudioOn) },
                    { icon: isVideoOn ? <Camera size={16} /> : <CameraOff size={16} />, label: "Cam", on: isVideoOn as boolean, danger: !isVideoOn, fn: () => hmsActions.setLocalVideoEnabled(!isVideoOn) },
                    { icon: isScreenShared ? <MonitorOff size={16} /> : <Monitor size={16} />, label: isScreenShared ? "Stop" : "Share", on: isScreenShared as boolean, warn: isScreenShared, fn: () => hmsActions.setScreenShareEnabled(!isScreenShared) },
                ].map((b, i) => (
                    <button key={i} onClick={b.fn} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, color: "#fff", background: b.danger ? "#ef4444" : (b as any).warn ? "#f59e0b" : b.on ? "#6366f1" : "#1c1c30" }}>
                        {b.icon} {b.label}
                    </button>
                ))}
                <div style={{ width: 1, height: 24, background: "#2a2a3e", margin: "0 4px" }} />
                <button onClick={handleLeaveClass} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, color: "#fff", background: "#64748b" }}>
                    <PhoneOff size={16} /> Leave
                </button>
            </div>
        </div>
    );
}
