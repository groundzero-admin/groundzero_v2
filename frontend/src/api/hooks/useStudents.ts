import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Student } from "@/api/types";

export function useStudents() {
  return useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => (await api.get("/students")).data,
  });
}

export function useStudentById(studentId: string | null) {
  return useQuery<Student>({
    queryKey: ["student", studentId],
    queryFn: async () => (await api.get(`/students/${studentId}`)).data,
    enabled: !!studentId,
  });
}
