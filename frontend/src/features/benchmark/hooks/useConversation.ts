import { useCallback, useRef, useState } from "react";
import { benchmarkApi } from "../api";

function playBase64Audio(base64: string, audioRef: React.MutableRefObject<HTMLAudioElement | null>) {
  return new Promise<void>((resolve) => {
    try {
      const raw = atob(base64);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      const isWav = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
      const blob = new Blob([bytes], { type: isWav ? "audio/wav" : "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      if (audioRef) audioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      audio.play().catch(() => resolve());
    } catch {
      resolve();
    }
  });
}

export type ConversationStatus = "idle" | "listening" | "thinking" | "speaking";

interface HistoryEntry {
  speaker: "student" | "ai";
  text: string;
  turn_number: number;
}

export default function useConversation() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [status, setStatus] = useState<ConversationStatus>("idle");
  const [turnCount, setTurnCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sendTurnStream = useCallback(
    async (sessionId: string, studentText: string, turnNumber: number) => {
      setStatus("thinking");
      setIsLoading(true);

      if (studentText !== "[START]" && studentText !== "[END]") {
        setHistory((prev) => [...prev, { speaker: "student", text: studentText, turn_number: turnNumber }]);
      }
      setHistory((prev) => [...prev, { speaker: "ai", text: "", turn_number: 0 }]);

      const audioChunks: Record<number, string> = {};
      let streamDone = false;
      let resultData: { turn_number: number; session_id: string; ai_text: string } | null = null;

      const playAudioQueue = async () => {
        let playIdx = 0;
        while (true) {
          if (audioChunks[playIdx] !== undefined) {
            setStatus("speaking");
            await playBase64Audio(audioChunks[playIdx], audioRef);
            playIdx++;
          } else if (streamDone) {
            break;
          } else {
            await new Promise((r) => setTimeout(r, 80));
          }
        }
      };

      const audioPromise = playAudioQueue();

      try {
        const response = await fetch("/api/v1/benchmark/conversation/turn/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, student_text: studentText, turn_number: turnNumber }),
        });

        if (!response.ok) throw new Error(`Stream request failed: ${response.status}`);

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop()!;

          for (const part of parts) {
            if (!part.trim()) continue;
            let eventType = "";
            let data = "";
            for (const line of part.split("\n")) {
              if (line.startsWith("event: ")) eventType = line.slice(7);
              if (line.startsWith("data: ")) data = line.slice(6);
            }

            if (eventType === "text_delta") {
              const { token } = JSON.parse(data);
              setHistory((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.speaker === "ai") {
                  updated[updated.length - 1] = { ...last, text: last.text + token };
                }
                return updated;
              });
            } else if (eventType === "audio") {
              const { audio_base64, index } = JSON.parse(data);
              audioChunks[index] = audio_base64;
            } else if (eventType === "done") {
              resultData = JSON.parse(data);
            }
          }
        }

        streamDone = true;
        setIsLoading(false);
        await audioPromise;

        if (resultData) {
          setTurnCount(resultData.turn_number);
          setHistory((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.speaker === "ai") {
              updated[updated.length - 1] = { ...last, turn_number: resultData!.turn_number };
            }
            return updated;
          });
        }

        setStatus("idle");
        return resultData;
      } catch (err) {
        streamDone = true;
        setIsLoading(false);
        setStatus("idle");
        throw err;
      }
    },
    []
  );

  const endSession = useCallback(async (sessionId: string) => {
    const { data } = await benchmarkApi.endSession(sessionId);
    return data;
  }, []);

  return { sendTurnStream, endSession, history, setHistory, status, setStatus, turnCount, isLoading };
}
