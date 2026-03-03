import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type Phase = "warmup" | "key_topic" | "diy" | "ai_lab";

interface TeacherContextValue {
  selectedCohortId: string | null;
  selectCohort: (id: string) => void;
  activePhase: Phase;
  setActivePhase: (phase: Phase) => void;
}

const TeacherContext = createContext<TeacherContextValue | null>(null);

export function TeacherProvider({ children }: { children: ReactNode }) {
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<Phase>("warmup");

  const selectCohort = useCallback((id: string) => {
    setSelectedCohortId(id);
  }, []);

  return (
    <TeacherContext.Provider
      value={{ selectedCohortId, selectCohort, activePhase, setActivePhase }}
    >
      {children}
    </TeacherContext.Provider>
  );
}

export function useTeacherContext() {
  const ctx = useContext(TeacherContext);
  if (!ctx)
    throw new Error("useTeacherContext must be used within TeacherProvider");
  return ctx;
}
