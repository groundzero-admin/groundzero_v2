import { useCallback, useRef, useState } from "react";

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  liveTranscript: string;
  error: string | null;
  startRecording: () => void;
  stopRecording: () => string;
  cancelRecording: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const finalTranscriptRef = useRef("");
  const isRecordingRef = useRef(false);
  const startedAtRef = useRef(0);
  const GRACE_PERIOD_MS = 5000;

  const startRecording = useCallback(() => {
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    setError(null);
    setLiveTranscript("");
    finalTranscriptRef.current = "";
    startedAtRef.current = Date.now();

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: { resultIndex: number; results: SpeechRecognitionResultList }) => {
      let interim = "";
      let finalText = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + " ";
          finalTranscriptRef.current = finalText;
        } else {
          interim += result[0].transcript;
        }
      }

      setLiveTranscript((finalText + interim).trim());
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone permission.");
        isRecordingRef.current = false;
        setIsRecording(false);
      } else if (event.error === "no-speech" || event.error === "aborted") {
        // Transient -- let onend restart recognition automatically
      } else {
        setError(`Speech recognition error: ${event.error}`);
        isRecordingRef.current = false;
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      if (!isRecordingRef.current) return;
      const elapsed = Date.now() - startedAtRef.current;
      if (elapsed < GRACE_PERIOD_MS) {
        setTimeout(() => {
          if (!isRecordingRef.current) return;
          try {
            recognition.start();
          } catch {
            isRecordingRef.current = false;
            setIsRecording(false);
          }
        }, GRACE_PERIOD_MS - elapsed);
      } else {
        try {
          recognition.start();
        } catch {
          isRecordingRef.current = false;
          setIsRecording(false);
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      isRecordingRef.current = true;
      setIsRecording(true);
    } catch {
      setError("Failed to start speech recognition.");
    }
  }, []);

  const stopRecording = useCallback((): string => {
    isRecordingRef.current = false;
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onend = null;
      recognition.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);

    const result = liveTranscript;
    return result;
  }, [liveTranscript]);

  const cancelRecording = useCallback(() => {
    isRecordingRef.current = false;
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setLiveTranscript("");
    finalTranscriptRef.current = "";
    setError(null);
  }, []);

  return { isRecording, liveTranscript, error, startRecording, stopRecording, cancelRecording };
}
