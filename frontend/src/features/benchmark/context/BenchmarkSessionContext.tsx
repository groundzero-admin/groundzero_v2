import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Character } from "../constants/characters";
import { CHARACTERS } from "../constants/characters";

const STORAGE_KEY = "gz_benchmark_session";

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

function loadFromStorage(): { sessionId: string | null; characterId: string | null } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { sessionId: null, characterId: null };
}

export function BenchmarkSessionProvider({ children }: { children: ReactNode }) {
  const stored = loadFromStorage();
  const restoredChar = stored.characterId ? CHARACTERS.find(c => c.id === stored.characterId) ?? null : null;

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(restoredChar);
  const [sessionId, setSessionId] = useState<string | null>(stored.sessionId);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        sessionId,
        characterId: selectedCharacter?.id ?? null,
      }));
    } catch { /* ignore */ }
  }, [sessionId, selectedCharacter]);

  const reset = () => {
    setSelectedCharacter(null);
    setSessionId(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
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
