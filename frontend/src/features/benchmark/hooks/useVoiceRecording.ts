import { useCallback, useEffect, useRef, useState } from "react";

export default function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const resolveRef = useRef<((val: string) => void) | null>(null);
  const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const cleanup = useCallback(() => {
    setIsRecording(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    return new Promise<string>(async (resolve, reject) => {
      resolveRef.current = resolve;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const ws = new WebSocket(`${protocol}//${window.location.host}/api/v1/benchmark/voice/ws/stt`);
        wsRef.current = ws;

        ws.onopen = () => {
          const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm";
          const mediaRecorder = new MediaRecorder(stream, { mimeType });
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              e.data.arrayBuffer().then((buffer) => ws.send(buffer));
            }
          };

          mediaRecorder.onerror = () => { setError("Recording failed"); cleanup(); resolve(""); };
          setError(null);
          setTranscript("");
          setInterimTranscript("");
          setIsRecording(true);
          mediaRecorder.start(300);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const text = data.transcript || "";
            if (data.error) setError(data.error);
            if (data.final) {
              setTranscript(text);
              setInterimTranscript("");
              if (resolveRef.current) { resolveRef.current(text); resolveRef.current = null; }
            } else {
              setInterimTranscript(text);
            }
          } catch { /* ignore */ }
        };

        ws.onerror = () => { setError("WebSocket connection failed"); cleanup(); resolve(""); };
        ws.onclose = () => {
          if (resolveRef.current) { resolveRef.current(""); resolveRef.current = null; }
        };
      } catch (err: any) {
        setIsRecording(false);
        setError(err.message);
        reject(err);
      }
    });
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "stop", language_code: "en-IN" }));
      }
    }, 400);
  }, []);

  return { startRecording, stopRecording, isRecording, isSupported, transcript, interimTranscript, error };
}
