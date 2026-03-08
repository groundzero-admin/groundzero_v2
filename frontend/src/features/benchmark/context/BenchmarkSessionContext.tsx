import { createContext, useContext, useState, type ReactNode } from "react";
import type { Character } from "../constants/characters";

interface BenchmarkSessionState {
  selectedCharacter: Character | null;
  sessionId: string | null;
  setCharacter: (c: Character) => void;
  setSessionId: (id: string) => void;
  reset: () => void;
}

const BenchmarkSessionContext = createContext<BenchmarkSessionState>({
  selectedCharacter: null,
  sessionId: null,
  setCharacter: () => {},
  setSessionId: () => {},
  reset: () => {},
});

export function BenchmarkSessionProvider({ children }: { children: ReactNode }) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const reset = () => {
    setSelectedCharacter(null);
    setSessionId(null);
  };

  return (
    <BenchmarkSessionContext.Provider
      value={{
        selectedCharacter,
        sessionId,
        setCharacter: setSelectedCharacter,
        setSessionId,
        reset,
      }}
    >
      {children}
    </BenchmarkSessionContext.Provider>
  );
}

export const useBenchmarkSession = () => useContext(BenchmarkSessionContext);
