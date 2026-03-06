import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { StudentProvider, useStudent } from "@/context/StudentContext";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import LivePage from "@/pages/LivePage";
import PracticePage from "@/pages/PracticePage";
import FunPage from "@/pages/FunPage";
import HomePage from "@/pages/HomePage";
import StudioLayout from "@/components/studio/StudioLayout";
import StudioPage from "@/pages/StudioPage";
import StudioPlayerPage from "@/pages/StudioPlayerPage";
import TeacherShell from "@/components/layout/TeacherShell";
import TeacherDashboardPage from "@/pages/teacher/TeacherDashboardPage";
import AdminShell from "@/components/layout/AdminShell";
import TemplateCohortListPage from "@/pages/admin/TemplateCohortListPage";
import TemplateCohortDetailPage from "@/pages/admin/TemplateCohortDetailPage";
import LiveBatchListPage from "@/pages/admin/LiveBatchListPage";
import LiveBatchDetailPage from "@/pages/admin/LiveBatchDetailPage";
import AdminStudentsPage from "@/pages/admin/AdminStudentsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

/** Requires a linked studentId before showing child content */
function RequireStudent({ children }: { children: React.ReactNode }) {
  const { studentId } = useStudent();
  if (!studentId) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

/** Root "/" — sends user to the right place based on role */
function RootRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === "teacher") return <Navigate to="/teacher" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* ── Public routes ── */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* ── Student routes ── */}
              <Route
                element={
                  <RequireAuth allowedRoles={["student"]}>
                    <StudentProvider>
                      <AppShell />
                    </StudentProvider>
                  </RequireAuth>
                }
              >
                <Route path="/home" element={<HomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/live" element={<LivePage />} />
                <Route path="/practice" element={<PracticePage />} />
              </Route>

              <Route
                element={
                  <RequireAuth allowedRoles={["student"]}>
                    <StudentProvider>
                      <StudioLayout />
                    </StudentProvider>
                  </RequireAuth>
                }
              >
                <Route
                  path="/studio"
                  element={
                    <RequireStudent>
                      <StudioPage />
                    </RequireStudent>
                  }
                />
                <Route
                  path="/studio/:projectId"
                  element={
                    <RequireStudent>
                      <StudioPlayerPage />
                    </RequireStudent>
                  }
                />
              </Route>

              <Route
                path="/fun"
                element={
                  <RequireAuth allowedRoles={["student"]}>
                    <StudentProvider>
                      <RequireStudent>
                        <FunPage />
                      </RequireStudent>
                    </StudentProvider>
                  </RequireAuth>
                }
              />

              {/* ── Teacher routes ── */}
              <Route
                element={
                  <RequireAuth allowedRoles={["teacher"]}>
                    <TeacherShell />
                  </RequireAuth>
                }
              >
                <Route path="/teacher" element={<TeacherDashboardPage />} />
              </Route>

              {/* ── Admin routes ── */}
              <Route
                element={
                  <RequireAuth allowedRoles={["admin"]}>
                    <AdminShell />
                  </RequireAuth>
                }
              >
                <Route path="/admin" element={<Navigate to="/admin/templates" replace />} />
                <Route path="/admin/templates" element={<TemplateCohortListPage />} />
                <Route path="/admin/templates/:id" element={<TemplateCohortDetailPage />} />
                <Route path="/admin/batches" element={<LiveBatchListPage />} />
                <Route path="/admin/batches/:id" element={<LiveBatchDetailPage />} />
                <Route path="/admin/students" element={<AdminStudentsPage />} />
              </Route>

              {/* ── Root redirect ── */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
