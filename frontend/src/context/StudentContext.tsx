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
  setStudentId: (id: string) => void;
  clearStudent: () => void;
}

const StudentContext = createContext<StudentContextValue | null>(null);

export function StudentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [studentId, setStudentIdState] = useState<string | null>(null);

  // When a student user logs in, fetch their linked Student record
  useEffect(() => {
    if (user?.role === "student") {
      api
        .get("/auth/me/student")
        .then(({ data }) => setStudentIdState(data.id))
        .catch(() => setStudentIdState(null));
    } else {
      setStudentIdState(null);
    }
  }, [user]);

  const setStudentId = useCallback((id: string) => {
    setStudentIdState(id);
  }, []);

  const clearStudent = useCallback(() => {
    setStudentIdState(null);
  }, []);

  return (
    <StudentContext.Provider value={{ studentId, setStudentId, clearStudent }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used within StudentProvider");
  return ctx;
}
