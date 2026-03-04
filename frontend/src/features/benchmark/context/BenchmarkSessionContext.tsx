import { createContext, useContext, useState, type ReactNode } from "react";
import type { Character } from "../constants/characters";

interface BenchmarkSessionState {
  studentName: string;
  studentAge: number;
  studentGrade: string;
  selectedCharacter: Character | null;
  sessionId: string | null;
  voiceProvider: string;
  setStudentInfo: (name: string, age: number, grade: string) => void;
  setCharacter: (c: Character) => void;
  setSession: (id: string) => void;
  setProvider: (p: string) => void;
  reset: () => void;
}

const BenchmarkSessionContext = createContext<BenchmarkSessionState | null>(null);

export function BenchmarkSessionProvider({ children }: { children: ReactNode }) {
  const [studentName, setStudentName] = useState("");
  const [studentAge, setStudentAge] = useState(10);
  const [studentGrade, setStudentGrade] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [voiceProvider, setVoiceProviderState] = useState(
    () => localStorage.getItem("bm_voiceProvider") || "sarvam"
  );

  const setProvider = (p: string) => {
    setVoiceProviderState(p);
    localStorage.setItem("bm_voiceProvider", p);
  };

  const reset = () => {
    setSelectedCharacter(null);
    setSessionId(null);
  };

  return (
    <BenchmarkSessionContext.Provider
      value={{
        studentName,
        studentAge,
        studentGrade,
        selectedCharacter,
        sessionId,
        voiceProvider,
        setStudentInfo: (name, age, grade) => {
          setStudentName(name);
          setStudentAge(age);
          setStudentGrade(grade);
        },
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
