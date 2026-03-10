/**
 * Simple STT hook: start/stop recording, send to Sarvam on stop.
 * Called via callbacks — no automatic silence detection.
 */

import { useCallback, useRef, useState } from "react";
import benchmarkApi from "../api";

interface UseAutoSTTReturn {
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => Promise<void>;
  /** Stop recording, send to Sarvam STT, return transcript */
  stopAndTranscribe: () => Promise<string>;
  /** Stop recording without transcribing */
  cancel: () => void;
}

export default function useAutoSTT(): UseAutoSTTReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access failed:", err);
    }
  }, []);

  const stopAndTranscribe = useCallback(async (): Promise<string> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      return "";
    }

    // Stop recorder and wait for final data
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    // Release mic
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    recorderRef.current = null;
    setIsRecording(false);

    const chunks = chunksRef.current;
    if (chunks.length === 0) return "";

    const blob = new Blob(chunks, { type: "audio/webm" });
    if (blob.size < 500) return "";

    setIsProcessing(true);
    try {
      const res = await benchmarkApi.stt(blob);
      return res.data.transcript?.trim() || "";
    } catch (err) {
      console.error("STT failed:", err);
      return "";
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
  }, []);

  return { isRecording, isProcessing, startRecording, stopAndTranscribe, cancel };
}
