import { useCallback, useRef, useState } from "react";
import { benchmarkApi } from "../api";

interface TranscriptEntry {
  speaker: "user" | "agent";
  text: string;
}

export type SarvamRealtimeStatus = "disconnected" | "connecting" | "connected" | "ended";

export default function useSarvamRealtimeConversation() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<SarvamRealtimeStatus>("disconnected");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const agentTextBufferRef = useRef("");

  const playNextChunk = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    setIsSpeaking(true);

    while (audioQueueRef.current.length > 0) {
      const b64 = audioQueueRef.current.shift()!;
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      await new Promise<void>((resolve) => {
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        audio.play().catch(() => resolve());
      });
    }

    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const startConversation = useCallback(
    async (character: string, studentName: string, studentAge: number, studentGrade: string, benchmarkSessionId: string) => {
      setStatus("connecting");
      setTranscript([]);
      transcriptRef.current = [];
      agentTextBufferRef.current = "";

      setSessionId(benchmarkSessionId);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      mediaStreamRef.current = stream;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/v1/benchmark/voice/ws/realtime`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            character,
            student_name: studentName,
            student_age: studentAge,
            student_grade: studentGrade,
            session_id: benchmarkSessionId,
          }),
        );
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "ready") {
          setStatus("connected");
          startAudioStream(ws, stream);
        } else if (data.type === "user_transcript") {
          const entry: TranscriptEntry = { speaker: "user", text: data.text };
          setTranscript((prev) => [...prev, entry]);
          transcriptRef.current = [...transcriptRef.current, entry];
        } else if (data.type === "agent_text") {
          agentTextBufferRef.current = "";
          const entry: TranscriptEntry = { speaker: "agent", text: data.text };
          setTranscript((prev) => [...prev, entry]);
          transcriptRef.current = [...transcriptRef.current, entry];
        } else if (data.type === "agent_text_delta") {
          agentTextBufferRef.current += data.text;
        } else if (data.type === "agent_audio") {
          audioQueueRef.current.push(data.audio);
          playNextChunk();
        } else if (data.type === "turn_complete") {
          setTurnCount(data.turn_count);
          if (agentTextBufferRef.current.trim()) {
            const entry: TranscriptEntry = { speaker: "agent", text: agentTextBufferRef.current.trim() };
            setTranscript((prev) => [...prev, entry]);
            transcriptRef.current = [...transcriptRef.current, entry];
            agentTextBufferRef.current = "";
          }
        } else if (data.type === "ended") {
          setStatus("ended");
        } else if (data.type === "error") {
          console.error("Sarvam realtime error:", data.detail);
        }
      };

      ws.onerror = () => setStatus("disconnected");
      ws.onclose = () => {
        setStatus((prev) => (prev === "ended" ? prev : "disconnected"));
        cleanup();
      };

      return benchmarkSessionId;
    },
    [playNextChunk],
  );

  const startAudioStream = (ws: WebSocket, stream: MediaStream) => {
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const nativeSampleRate = audioContext.sampleRate;

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const resampled = nativeSampleRate === 16000 ? inputData : downsampleBuffer(inputData, nativeSampleRate, 16000);
      const pcm16 = float32ToPcm16(resampled);
      ws.send(pcm16.buffer);
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  };

  const endConversation = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsSaving(true);
      wsRef.current.send(JSON.stringify({ action: "end" }));

      await new Promise<void>((resolve) => {
        const origOnMessage = wsRef.current!.onmessage;
        wsRef.current!.onmessage = (event) => {
          if (origOnMessage) (origOnMessage as any).call(wsRef.current, event);
          const data = JSON.parse(event.data);
          if (data.type === "ended" || data.type === "agent_audio") {
            if (data.type === "agent_audio") {
              audioQueueRef.current.push(data.audio);
              playNextChunk();
            }
            if (data.type === "ended") {
              resolve();
            }
          }
        };
        setTimeout(resolve, 30000);
      });

      while (isPlayingRef.current || audioQueueRef.current.length > 0) {
        await new Promise((r) => setTimeout(r, 200));
      }

      const sid = sessionId;
      if (sid) {
        const turns = transcriptRef.current;
        if (turns.length > 0) {
          await benchmarkApi.saveTranscript({
            session_id: sid,
            transcript: turns.map((t) => ({
              speaker: t.speaker === "user" ? "user" : "assistant",
              text: t.text,
            })),
          });
        } else {
          await benchmarkApi.endSession(sid);
        }
      }

      cleanup();
      setIsSaving(false);
      setStatus("ended");
      return sid;
    }
    return sessionId;
  }, [sessionId, playNextChunk]);

  const cleanup = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  return {
    startConversation,
    endConversation,
    transcript,
    status,
    isSaving,
    isSpeaking,
    sessionId,
    turnCount,
  };
}

function float32ToPcm16(float32: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16;
}

function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number): Float32Array {
  if (inputRate === outputRate) return buffer;
  const ratio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIndex = Math.round(i * ratio);
    result[i] = buffer[Math.min(srcIndex, buffer.length - 1)];
  }
  return result;
}
