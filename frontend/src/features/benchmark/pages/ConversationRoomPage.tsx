import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useStudent } from "@/context/StudentContext";
import { useStudentById } from "@/api/hooks/useStudents";
import { useBenchmarkSession } from "../context/BenchmarkSessionContext";
import useConversation from "../hooks/useConversation";
import useRealtimeConversation from "../hooks/useRealtimeConversation";
import useSarvamRealtimeConversation from "../hooks/useSarvamRealtimeConversation";
import useVoiceRecording from "../hooks/useVoiceRecording";
import TranscriptPanel from "../components/TranscriptPanel";
import VoiceVisualizer from "../components/VoiceVisualizer";
import { Mic, Type, Send, Phone } from "lucide-react";

const PROVIDER_LABELS: Record<string, string> = {
  sarvam_realtime: "Sarvam Conversational AI",
  sarvam: "Sarvam Turn-based",
  elevenlabs_realtime: "ElevenLabs Conversational AI",
  elevenlabs: "ElevenLabs Turn-based",
};

const STATUS_LABELS: Record<string, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Processing",
  speaking: "Speaking",
  connecting: "Connecting...",
  connected: "Live",
  disconnected: "Not connected",
  ended: "Ended",
};

const STATUS_COLORS: Record<string, string> = {
  idle: "#D4C9BD",
  listening: "#38A169",
  thinking: "#ED8936",
  speaking: "#3182CE",
  connecting: "#ED8936",
  connected: "#38A169",
  disconnected: "#D4C9BD",
  ended: "#D4C9BD",
};

export default function ConversationRoomPage() {
  const navigate = useNavigate();
  const { studentId } = useStudent();
  const { data: student } = useStudentById(studentId);
  const { selectedCharacter, sessionId, voiceProvider } = useBenchmarkSession();

  const isRealtime = voiceProvider === "sarvam_realtime" || voiceProvider === "elevenlabs_realtime";
  const isElevenLabsRealtime = voiceProvider === "elevenlabs_realtime";
  const isSarvamRealtime = voiceProvider === "sarvam_realtime";

  // Hooks (all called unconditionally per React rules)
  const turnBased = useConversation();
  const elevenlabsRt = useRealtimeConversation();
  const sarvamRt = useSarvamRealtimeConversation();
  const { startRecording, stopRecording, isRecording, isSupported, interimTranscript } = useVoiceRecording();

  const [useTextInput, setUseTextInput] = useState(!isSupported);
  const [textValue, setTextValue] = useState("");
  const [initialized, setInitialized] = useState(false);
  const initRef = useRef(false);

  const character = selectedCharacter || { id: "", initial: "AI", name: "Guide", color: "#805AD5", accent: "#B794F4", tagline: "" };

  // ─── Derive unified state from active hook ───

  let currentStatus: string;
  let transcriptHistory: { speaker: "student" | "ai"; text: string }[];
  let turnCount: number;
  let isLoadingAny: boolean;
  let isSpeakingNow: boolean;

  if (isElevenLabsRealtime) {
    currentStatus = elevenlabsRt.status;
    transcriptHistory = elevenlabsRt.transcript.map((t) => ({
      speaker: t.speaker === "user" ? "student" as const : "ai" as const,
      text: t.text,
    }));
    turnCount = elevenlabsRt.transcript.length;
    isLoadingAny = elevenlabsRt.status === "connecting" || elevenlabsRt.isSaving;
    isSpeakingNow = elevenlabsRt.isSpeaking;
  } else if (isSarvamRealtime) {
    currentStatus = sarvamRt.status;
    transcriptHistory = sarvamRt.transcript.map((t) => ({
      speaker: t.speaker === "user" ? "student" as const : "ai" as const,
      text: t.text,
    }));
    turnCount = sarvamRt.turnCount;
    isLoadingAny = sarvamRt.status === "connecting" || sarvamRt.isSaving;
    isSpeakingNow = sarvamRt.isSpeaking;
  } else {
    currentStatus = turnBased.status;
    transcriptHistory = turnBased.history;
    turnCount = turnBased.turnCount;
    isLoadingAny = turnBased.isLoading;
    isSpeakingNow = turnBased.status === "speaking";
  }

  const progress = Math.round((turnCount / 20) * 100);

  // ─── ElevenLabs realtime init ───
  useEffect(() => {
    if (!isElevenLabsRealtime || initRef.current || !selectedCharacter) return;
    initRef.current = true;
    elevenlabsRt.startConversation(selectedCharacter.id).then(() => setInitialized(true)).catch(() => alert("Failed to start ElevenLabs conversation"));
  }, [isElevenLabsRealtime, selectedCharacter, elevenlabsRt.startConversation]);

  // ─── Sarvam realtime init ───
  useEffect(() => {
    if (!isSarvamRealtime || initRef.current || !selectedCharacter || !sessionId || !student) return;
    initRef.current = true;
    sarvamRt
      .startConversation(selectedCharacter.id, student.name || "Student", 10, String(student.grade || ""), sessionId)
      .then(() => setInitialized(true))
      .catch(() => alert("Failed to start Sarvam conversation"));
  }, [isSarvamRealtime, selectedCharacter, sessionId, student, sarvamRt.startConversation]);

  // ─── Turn-based init ───
  useEffect(() => {
    if (isRealtime || !sessionId || initRef.current) return;
    initRef.current = true;
    turnBased.sendTurnStream(sessionId, "[START]", 1).then(() => setInitialized(true)).catch(() => alert("Failed to start"));
  }, [sessionId, turnBased.sendTurnStream, isRealtime]);

  // ─── Turn-based: send text ───
  const handleSendText = useCallback(async () => {
    if (isRealtime || !textValue.trim() || turnBased.isLoading || !sessionId) return;
    const text = textValue.trim();
    setTextValue("");
    try {
      const data = await turnBased.sendTurnStream(sessionId, text, turnBased.turnCount + 1);
      if (data && data.turn_number >= 20) {
        await turnBased.sendTurnStream(sessionId, "[END]", data.turn_number + 1);
        await turnBased.endSession(sessionId);
        navigate(`/benchmark/report/${sessionId}`);
      }
    } catch { alert("Failed to send message"); }
  }, [isRealtime, textValue, turnBased, sessionId, navigate]);

  // ─── Turn-based: mic toggle ───
  const handleMicToggle = useCallback(async () => {
    if (isRealtime) return;
    if (isRecording) { stopRecording(); return; }
    if (turnBased.isLoading || (turnBased.status !== "idle" && turnBased.status !== "listening")) return;
    try {
      turnBased.setStatus("listening");
      const transcript = await startRecording();
      if (!transcript) { turnBased.setStatus("idle"); return; }
      const data = await turnBased.sendTurnStream(sessionId!, transcript, turnBased.turnCount + 1);
      if (data && data.turn_number >= 20) {
        await turnBased.sendTurnStream(sessionId!, "[END]", data.turn_number + 1);
        await turnBased.endSession(sessionId!);
        navigate(`/benchmark/report/${sessionId}`);
      }
    } catch { turnBased.setStatus("idle"); }
  }, [isRealtime, isRecording, turnBased, sessionId, stopRecording, startRecording, navigate]);

  // ─── End conversation (all modes) ───
  const handleEnd = useCallback(async () => {
    try {
      if (isElevenLabsRealtime) {
        const sid = await elevenlabsRt.endConversation();
        if (sid) navigate(`/benchmark/report/${sid}`);
      } else if (isSarvamRealtime) {
        const sid = await sarvamRt.endConversation();
        if (sid) navigate(`/benchmark/report/${sid}`);
      } else {
        if (!sessionId) return;
        await turnBased.sendTurnStream(sessionId, "[END]", turnBased.turnCount + 1);
        await turnBased.endSession(sessionId);
        navigate(`/benchmark/report/${sessionId}`);
      }
    } catch { alert("Failed to end session"); }
  }, [isElevenLabsRealtime, isSarvamRealtime, elevenlabsRt, sarvamRt, turnBased, sessionId, navigate]);

  return (
    <div style={{ height: "100vh", display: "flex", backgroundColor: "#FAF7F4" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 260, minWidth: 240,
          borderRight: "1px solid #E8E0D8",
          display: "flex", flexDirection: "column",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ padding: 20, borderBottom: "1px solid #E8E0D8" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                backgroundColor: character.color + "15", color: character.accent,
              }}
            >
              {character.initial}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#26221D", fontFamily: "'Nunito', sans-serif" }}>{character.name}</div>
              <div style={{ fontSize: 11, color: "#A89E94" }}>{character.tagline || "AI Guide"}</div>
            </div>
          </div>
          <div style={{ backgroundColor: "#FAF7F4", borderRadius: 10, padding: "10px 12px", border: "1px solid #E8E0D8" }}>
            <div style={{ fontSize: 10, color: "#A89E94", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, marginBottom: 4 }}>Student</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3D3730" }}>{student?.name || "Student"}</div>
          </div>
        </div>

        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E0D8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "#A89E94", fontWeight: 500 }}>Progress</span>
            <span style={{ fontSize: 12, color: "#7A7168", fontWeight: 600 }}>{turnCount}/20</span>
          </div>
          <div style={{ width: "100%", height: 6, backgroundColor: "#E8E0D8", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 999, transition: "width 500ms", width: `${progress}%`, backgroundColor: character.color }} />
          </div>
        </div>

        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E0D8" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: STATUS_COLORS[currentStatus] || "#D4C9BD" }} />
            <span style={{ fontSize: 12, color: "#7A7168", fontWeight: 500 }}>{STATUS_LABELS[currentStatus] || "Ready"}</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <VoiceVisualizer isActive={isSpeakingNow} color={character.color} />
          </div>
        </div>

        <div style={{ marginTop: "auto", padding: 16, borderTop: "1px solid #E8E0D8" }}>
          <div style={{ fontSize: 10, color: "#A89E94", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, marginBottom: 8 }}>
            Voice Mode
          </div>
          <div style={{
            padding: "6px 10px", borderRadius: 6, border: "1px solid #E8E0D8",
            backgroundColor: "#FAF7F4", fontSize: 11, color: "#7A7168", fontWeight: 500, textAlign: "center",
          }}>
            {PROVIDER_LABELS[voiceProvider] || voiceProvider}
          </div>
        </div>
      </div>

      {/* Main chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        {isLoadingAny && !initialized && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 50, backgroundColor: "rgba(250,247,244,0.95)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 32, height: 32, border: "3px solid #E8E0D8", borderTopColor: "#805AD5", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#A89E94", marginTop: 16, fontSize: 14 }}>
              {isRealtime ? "Connecting to voice agent..." : "Starting conversation..."}
            </p>
          </div>
        )}

        <TranscriptPanel history={transcriptHistory} characterInitial={character.initial} characterColor={character.color} />

        {/* Input bar */}
        <div style={{ borderTop: "1px solid #E8E0D8", padding: "12px 24px", backgroundColor: "#FFFFFF", display: "flex", alignItems: "center", gap: 12 }}>
          {isRealtime ? (
            /* ─── Realtime modes (Sarvam / ElevenLabs) ─── */
            <>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16, border: "none",
                  backgroundColor: currentStatus === "connected" ? character.color + "15" : "#FAF7F4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: isSpeakingNow ? `0 0 30px ${character.color}40` : "none",
                  transition: "box-shadow 300ms",
                }}>
                  {isSpeakingNow ? (
                    <VoiceVisualizer isActive color={character.color} />
                  ) : (
                    <Mic size={24} color={currentStatus === "connected" ? character.color : "#A89E94"} />
                  )}
                </div>
                <span style={{ fontSize: 11, color: "#A89E94" }}>
                  {currentStatus === "connected"
                    ? isSpeakingNow ? "Agent speaking..." : "Listening..."
                    : currentStatus === "connecting" ? "Connecting..." : "Disconnected"}
                </span>
              </div>
              {currentStatus === "connected" && (
                <button
                  onClick={handleEnd}
                  disabled={isLoadingAny}
                  style={{
                    padding: "8px 20px", borderRadius: 10, border: "none",
                    backgroundColor: "#E53E3E", color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                    opacity: isLoadingAny ? 0.4 : 1,
                  }}
                >
                  <Phone size={14} /> End Call
                </button>
              )}
            </>
          ) : (
            /* ─── Turn-based modes (Sarvam / ElevenLabs) ─── */
            <>
              <button
                onClick={() => setUseTextInput(!useTextInput)}
                style={{
                  width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: "transparent", border: "1px solid #E8E0D8", cursor: "pointer", color: "#A89E94",
                }}
                title={useTextInput ? "Switch to voice" : "Switch to text"}
              >
                {useTextInput ? <Mic size={16} /> : <Type size={16} />}
              </button>

              {useTextInput ? (
                <div style={{ flex: 1, display: "flex", gap: 8 }}>
                  <input
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                    placeholder="Type a message..."
                    disabled={turnBased.isLoading || turnBased.status !== "idle"}
                    style={{
                      flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid #E8E0D8",
                      fontSize: 14, outline: "none", backgroundColor: "#FAF7F4", color: "#26221D",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  />
                  <button
                    onClick={handleSendText}
                    disabled={turnBased.isLoading || !textValue.trim()}
                    style={{
                      width: 40, height: 40, borderRadius: 10, border: "none",
                      backgroundColor: character.color, color: "#fff", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: turnBased.isLoading || !textValue.trim() ? 0.4 : 1,
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  {interimTranscript && (
                    <div style={{ fontSize: 12, color: "#7A7168" }}>"{interimTranscript}"</div>
                  )}
                  <button
                    onClick={handleMicToggle}
                    disabled={turnBased.isLoading || (turnBased.status !== "idle" && turnBased.status !== "listening" && !isRecording)}
                    style={{
                      width: 48, height: 48, borderRadius: 12, border: "none",
                      backgroundColor: isRecording ? "#E53E3E" : character.color,
                      color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: isRecording ? "0 0 20px rgba(229,62,62,0.3)" : `0 0 15px ${character.color}30`,
                    }}
                  >
                    <Mic size={20} />
                  </button>
                  <span style={{ fontSize: 11, color: "#A89E94" }}>
                    {isRecording ? "Click to stop" : "Click to record"}
                  </span>
                </div>
              )}

              {turnBased.turnCount >= 5 && (
                <button
                  onClick={handleEnd}
                  disabled={turnBased.isLoading}
                  style={{
                    padding: "6px 16px", borderRadius: 8, border: "1px solid #E8E0D8",
                    backgroundColor: "transparent", color: "#7A7168", fontSize: 13, fontWeight: 500,
                    cursor: "pointer", opacity: turnBased.isLoading ? 0.4 : 1,
                  }}
                >
                  End
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bmWave { 0%,100% { height: 4px; } 50% { height: 24px; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
