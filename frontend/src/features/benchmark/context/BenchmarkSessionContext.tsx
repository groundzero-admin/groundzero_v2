import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/api/client";
import type { Character } from "../constants/characters";

interface BenchmarkSessionState {
  selectedCharacter: Character | null;
  sessionId: string | null;
  voiceProvider: string;
  setCharacter: (c: Character) => void;
  setSession: (id: string) => void;
  setProvider: (p: string) => void;
  reset: () => void;
}

const BenchmarkSessionContext = createContext<BenchmarkSessionState | null>(null);

export function BenchmarkSessionProvider({ children }: { children: ReactNode }) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [voiceProvider, setVoiceProviderState] = useState("sarvam_realtime");

  useEffect(() => {
    api.get("/benchmark/voice/providers").then(({ data }) => {
      if (data?.default) setVoiceProviderState(data.default);
    }).catch(() => {});
  }, []);

  const setProvider = (p: string) => {
    setVoiceProviderState(p);
  };

  const reset = () => {
    setSelectedCharacter(null);
    setSessionId(null);
  };

  return (
    <BenchmarkSessionContext.Provider
      value={{
        selectedCharacter,
        sessionId,
        voiceProvider,
        setCharacter: setSelectedCharacter,
        setSession: setSessionId,
        setProvider,
        reset,
      }}
    >
      {children}
    </BenchmarkSessionContext.Provider>
  );
}

export function useBenchmarkSession() {
  const ctx = useContext(BenchmarkSessionContext);
  if (!ctx) throw new Error("useBenchmarkSession must be inside BenchmarkSessionProvider");
  return ctx;
}
