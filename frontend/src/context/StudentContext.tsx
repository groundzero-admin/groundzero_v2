import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { api } from "@/api/client";

interface StudentContextValue {
  studentId: string | null;
  isLoading: boolean;
  setStudentId: (id: string) => void;
  clearStudent: () => void;
}

const StudentContext = createContext<StudentContextValue | null>(null);

export function StudentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [studentId, setStudentIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "student") {
      setIsLoading(true);
      api
        .get("/auth/me/student")
        .then(({ data }) => setStudentIdState(data.id))
        .catch(() => setStudentIdState(null))
        .finally(() => setIsLoading(false));
    } else {
      setStudentIdState(null);
      setIsLoading(false);
    }
  }, [user]);

  const setStudentId = useCallback((id: string) => {
    setStudentIdState(id);
  }, []);

  const clearStudent = useCallback(() => {
    setStudentIdState(null);
  }, []);

  return (
    <StudentContext.Provider value={{ studentId, isLoading, setStudentId, clearStudent }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used within StudentProvider");
  return ctx;
}
