import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useBenchmarkSession } from "../context/BenchmarkSessionContext";
import useConversation from "../hooks/useConversation";
import useVoiceRecording from "../hooks/useVoiceRecording";
import TranscriptPanel from "../components/TranscriptPanel";
import VoiceVisualizer from "../components/VoiceVisualizer";
import { Mic, Type, Send } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Processing",
  speaking: "Speaking",
};

const STATUS_COLORS: Record<string, string> = {
  idle: "#D4C9BD",
  listening: "#38A169",
  thinking: "#ED8936",
  speaking: "#3182CE",
};

export default function ConversationRoomPage() {
  const navigate = useNavigate();
  const { studentName, selectedCharacter, sessionId } = useBenchmarkSession();
  const { sendTurnStream, endSession, history, status, setStatus, turnCount, isLoading } = useConversation();
  const { startRecording, stopRecording, isRecording, isSupported, interimTranscript } = useVoiceRecording();

  const [useTextInput, setUseTextInput] = useState(!isSupported);
  const [textValue, setTextValue] = useState("");
  const [initialized, setInitialized] = useState(false);
  const initRef = useRef(false);

  const character = selectedCharacter || { initial: "AI", name: "Guide", color: "#805AD5", accent: "#B794F4", tagline: "" };
  const progress = Math.round((turnCount / 20) * 100);

  useEffect(() => {
    if (!sessionId || initRef.current) return;
    initRef.current = true;
    sendTurnStream(sessionId, "[START]", 1).then(() => setInitialized(true)).catch(() => alert("Failed to start"));
  }, [sessionId, sendTurnStream]);

  const handleSendText = useCallback(async () => {
    if (!textValue.trim() || isLoading || !sessionId) return;
    const text = textValue.trim();
    setTextValue("");
    try {
      const data = await sendTurnStream(sessionId, text, turnCount + 1);
      if (data && data.turn_number >= 20) { await endSession(sessionId); navigate(`/benchmark/report/${sessionId}`); }
    } catch { alert("Failed to send message"); }
  }, [textValue, isLoading, sessionId, turnCount, sendTurnStream, endSession, navigate]);

  const handleMicToggle = useCallback(async () => {
    if (isRecording) { stopRecording(); return; }
    if (isLoading || (status !== "idle" && status !== "listening")) return;
    try {
      setStatus("listening");
      const transcript = await startRecording();
      if (!transcript) { setStatus("idle"); return; }
      const data = await sendTurnStream(sessionId!, transcript, turnCount + 1);
      if (data && data.turn_number >= 20) { await endSession(sessionId!); navigate(`/benchmark/report/${sessionId}`); }
    } catch { setStatus("idle"); }
  }, [isRecording, isLoading, status, sessionId, turnCount, stopRecording, startRecording, sendTurnStream, endSession, navigate, setStatus]);

  const handleEnd = useCallback(async () => {
    if (!sessionId) return;
    try { await endSession(sessionId); navigate(`/benchmark/report/${sessionId}`); } catch { alert("Failed to end session"); }
  }, [endSession, sessionId, navigate]);

  return (
    <div style={{ height: "100vh", display: "flex", backgroundColor: "#FAF7F4" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 260,
          minWidth: 240,
          borderRight: "1px solid #E8E0D8",
          display: "flex",
          flexDirection: "column",
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
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3D3730" }}>{studentName}</div>
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
            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: STATUS_COLORS[status] || "#D4C9BD" }} />
            <span style={{ fontSize: 12, color: "#7A7168", fontWeight: 500 }}>{STATUS_LABELS[status] || "Ready"}</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <VoiceVisualizer isActive={status === "speaking"} color={character.color} />
          </div>
        </div>

        <div style={{ marginTop: "auto", padding: 16, borderTop: "1px solid #E8E0D8" }}>
          <div style={{ fontSize: 10, color: "#A89E94", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, marginBottom: 8 }}>Voice Provider</div>
          <div style={{ display: "flex", gap: 4 }}>
            {["sarvam", "elevenlabs"].map((p) => (
              <button
                key={p}
                style={{
                  flex: 1, padding: "4px 8px", fontSize: 11, fontWeight: 500, borderRadius: 6,
                  border: "1px solid #E8E0D8", cursor: "pointer",
                  backgroundColor: "#FAF7F4", color: "#7A7168",
                  textTransform: "capitalize",
                }}
              >
                {p === "sarvam" ? "Sarvam" : "ElevenLabs"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        {isLoading && !initialized && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 50, backgroundColor: "rgba(250,247,244,0.95)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 32, height: 32, border: "3px solid #E8E0D8", borderTopColor: "#805AD5", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#A89E94", marginTop: 16, fontSize: 14 }}>Starting conversation...</p>
          </div>
        )}

        <TranscriptPanel history={history} characterInitial={character.initial} characterColor={character.color} />

        {/* Input bar */}
        <div style={{ borderTop: "1px solid #E8E0D8", padding: "12px 24px", backgroundColor: "#FFFFFF", display: "flex", alignItems: "center", gap: 12 }}>
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
                disabled={isLoading || status !== "idle"}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid #E8E0D8",
                  fontSize: 14, outline: "none", backgroundColor: "#FAF7F4", color: "#26221D",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <button
                onClick={handleSendText}
                disabled={isLoading || !textValue.trim()}
                style={{
                  width: 40, height: 40, borderRadius: 10, border: "none",
                  backgroundColor: character.color, color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: isLoading || !textValue.trim() ? 0.4 : 1,
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
                disabled={isLoading || (status !== "idle" && status !== "listening" && !isRecording)}
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

          {turnCount >= 5 && (
            <button
              onClick={handleEnd}
              disabled={isLoading}
              style={{
                padding: "6px 16px", borderRadius: 8, border: "1px solid #E8E0D8",
                backgroundColor: "transparent", color: "#7A7168", fontSize: 13, fontWeight: 500,
                cursor: "pointer", opacity: isLoading ? 0.4 : 1,
              }}
            >
              End
            </button>
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
