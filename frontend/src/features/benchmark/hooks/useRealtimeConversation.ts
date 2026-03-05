import { useCallback, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { benchmarkApi } from "../api";

interface TranscriptEntry {
  speaker: "user" | "agent";
  text: string;
}

export type RealtimeStatus = "disconnected" | "connecting" | "connected" | "ended";

export default function useRealtimeConversation() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("disconnected");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const transcriptRef = useRef<TranscriptEntry[]>([]);

  const conversation = useConversation({
    onConnect: () => setStatus("connected"),
    onDisconnect: () => setStatus("ended"),
    onError: (error: string) => console.error("ElevenLabs error:", error),
    onMessage: (message: any) => {
      if (message.type === "user_transcript" && message.user_transcription_event?.is_final) {
        const text = message.user_transcription_event.user_transcript;
        if (text?.trim()) {
          const entry: TranscriptEntry = { speaker: "user", text };
          setTranscript((prev) => [...prev, entry]);
          transcriptRef.current = [...transcriptRef.current, entry];
        }
      } else if (message.type === "agent_response") {
        const text = message.agent_response_event?.agent_response;
        if (text?.trim()) {
          const entry: TranscriptEntry = { speaker: "agent", text };
          setTranscript((prev) => [...prev, entry]);
          transcriptRef.current = [...transcriptRef.current, entry];
        }
      }
    },
  });

  const startConversation = useCallback(
    async (character: string) => {
      setStatus("connecting");
      setTranscript([]);
      transcriptRef.current = [];

      const { data } = await benchmarkApi.startRealtime({ character });
      setSessionId(data.session_id);

      await navigator.mediaDevices.getUserMedia({ audio: true });

      await conversation.startSession({
        signedUrl: data.signed_url,
        overrides: {
          agent: {
            prompt: { prompt: data.system_prompt },
            firstMessage: data.first_message,
          },
        },
      });

      return data.session_id;
    },
    [conversation],
  );

  const endConversation = useCallback(async () => {
    await conversation.endSession();
    setIsSaving(true);

    const sid = sessionId;
    if (!sid) return;

    const turns = transcriptRef.current;
    if (turns.length > 0) {
      await benchmarkApi.saveTranscript({
        session_id: sid,
        transcript: turns,
      });
    } else {
      await benchmarkApi.endSession(sid);
    }
    setIsSaving(false);
    return sid;
  }, [conversation, sessionId]);

  return {
    startConversation,
    endConversation,
    transcript,
    status,
    isSaving,
    isSpeaking: conversation.isSpeaking,
    sessionId,
  };
}
