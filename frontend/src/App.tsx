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
import SessionReviewPage from "@/pages/SessionReviewPage";
import LivePage from "@/pages/LivePage";
import PracticePage from "@/pages/PracticePage";
import FunPage from "@/pages/FunPage";
import StudioLayout from "@/components/studio/StudioLayout";
import StudioPage from "@/pages/StudioPage";
import StudioPlayerPage from "@/pages/StudioPlayerPage";
import TeacherShell from "@/components/layout/TeacherShell";
import TeacherDashboardPage from "@/pages/teacher/TeacherDashboardPage";
import TeacherSessionPreviewPage from "@/pages/teacher/TeacherSessionPreviewPage";
import SkillGraphPage from "@/pages/SkillGraphPage";

// Plugin: Benchmark (remove this block to disable)
import {
  BenchmarkSessionProvider,
  BenchmarkLandingPage,
  CharacterSelectPage,
  ConversationRoomPage,
  BenchmarkReportPage,
  BenchmarkHistoryPage,
} from "@/features/benchmark";
import SetPasswordPage from "@/pages/SetPasswordPage";
import AdminShell from "@/components/layout/AdminShell";
import TemplateListPage from "@/pages/admin/TemplateCohortListPage";
import CohortListPage from "@/pages/admin/LiveBatchListPage";
import CohortDetailPage from "@/pages/admin/LiveBatchDetailPage";
import AdminStudentsPage from "@/pages/admin/AdminStudentsPage";
import AdminActivitiesPage from "@/pages/admin/AdminActivitiesPage";
import LiveClassPage from "@/pages/admin/LiveClassPage";
import CreateQuestionPage from "@/pages/admin/CreateQuestionPage";
import QuestionBankPage from "@/pages/admin/QuestionBankPage";
import AdminStudentSkillGraphPage from "@/pages/admin/AdminStudentSkillGraphPage";
import ClassReportPage from "@/pages/admin/ClassReportPage";
import ClassRecordingDetailPage from "@/pages/ClassRecordingDetailPage";
import ClassRecordingsPage from "@/pages/admin/ClassRecordingsPage";
import RecordingRendererPage from "@/pages/RecordingRendererPage";

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
  const { studentId, isLoading } = useStudent();
  if (isLoading) return null;
  if (!studentId) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** Root "/" — sends user to the right place based on role */
function RootRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === "teacher") return <Navigate to="/teacher" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
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
              <Route path="/graph" element={<SkillGraphPage />} />
              <Route path="/invite/:token" element={<SetPasswordPage />} />
              <Route path="/recording-renderer" element={<RecordingRendererPage />} />

              {/* ── Student routes (with shell / navbar) ── */}
              <Route
                element={
                  <RequireAuth allowedRoles={["student"]}>
                    <StudentProvider>
                      <AppShell />
                    </StudentProvider>
                  </RequireAuth>
                }
              >
                <Route path="/home" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/practice" element={<PracticePage />} />
              </Route>

              {/* ── Student Live Class — fullscreen (no AppShell padding) ── */}
              <Route
                path="/live"
                element={
                  <RequireAuth allowedRoles={["student"]}>
                    <StudentProvider>
                      <LivePage />
                    </StudentProvider>
                  </RequireAuth>
                }
              />
              <Route
                path="/student/live-class"
                element={
                  <RequireAuth allowedRoles={["student"]}>
                    <StudentProvider>
                      <LivePage />
                    </StudentProvider>
                  </RequireAuth>
                }
              />

              <Route
                path="/session-review/:sessionId"
                element={
                  <RequireAuth allowedRoles={["student"]}>
                    <StudentProvider>
                      <SessionReviewPage />
                    </StudentProvider>
                  </RequireAuth>
                }
              />

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

              {/* ── Benchmark plugin routes (remove this block to disable) ── */}
              <Route
                element={
                  <RequireAuth allowedRoles={["student"]}>
                    <StudentProvider>
                      <BenchmarkSessionProvider>
                        <AppShell />
                      </BenchmarkSessionProvider>
                    </StudentProvider>
                  </RequireAuth>
                }
              >
                <Route path="/benchmark" element={<BenchmarkLandingPage />} />
                <Route path="/benchmark/select" element={<CharacterSelectPage />} />
                <Route path="/benchmark/history" element={<BenchmarkHistoryPage />} />
              </Route>

              <Route
                path="/benchmark/conversation"
                element={
                  <RequireAuth allowedRoles={["student"]}>
                    <StudentProvider>
                      <BenchmarkSessionProvider>
                        <ConversationRoomPage />
                      </BenchmarkSessionProvider>
                    </StudentProvider>
                  </RequireAuth>
                }
              />

              <Route
                path="/benchmark/report/:sessionId"
                element={
                  <RequireAuth allowedRoles={["student"]}>
                    <StudentProvider>
                      <BenchmarkSessionProvider>
                        <BenchmarkReportPage />
                      </BenchmarkSessionProvider>
                    </StudentProvider>
                  </RequireAuth>
                }
              />

              {/* ── Teacher routes (admin can also teach for MVP) ── */}
              <Route
                element={
                  <RequireAuth allowedRoles={["teacher", "admin"]}>
                    <TeacherShell />
                  </RequireAuth>
                }
              >
                <Route path="/teacher" element={<TeacherDashboardPage />} />
              </Route>

              {/* ── Teacher session preview (full-screen, no shell) ── */}
              <Route
                path="/teacher/session-preview"
                element={
                  <RequireAuth allowedRoles={["teacher", "admin"]}>
                    <TeacherSessionPreviewPage />
                  </RequireAuth>
                }
              />

              {/* ── Admin routes ── */}
              <Route
                element={
                  <RequireAuth allowedRoles={["admin"]}>
                    <AdminShell />
                  </RequireAuth>
                }
              >
                <Route path="/admin" element={<Navigate to="/admin/cohorts" replace />} />
                <Route path="/admin/templates" element={<TemplateListPage />} />
                <Route path="/admin/activities" element={<AdminActivitiesPage />} />
                <Route path="/admin/cohorts" element={<CohortListPage />} />
                <Route path="/admin/cohorts/:id" element={<CohortDetailPage />} />
                <Route path="/admin/students" element={<AdminStudentsPage />} />
                <Route path="/admin/students/:studentId/skill-graph" element={<AdminStudentSkillGraphPage />} />
                <Route path="/admin/sessions/:sessionId/class-report" element={<ClassReportPage />} />
                <Route path="/admin/question-bank" element={<QuestionBankPage />} />
                <Route path="/admin/create-question" element={<CreateQuestionPage />} />
                <Route path="/admin/class-recordings" element={<ClassRecordingsPage />} />
                <Route path="/admin/sessions/:sessionId/recordings" element={<ClassRecordingDetailPage />} />
              </Route>

              {/* ── Live Class (full-screen, no shell) — admin can also teach ── */}
              <Route
                path="/teacher/live-class"
                element={
                  <RequireAuth allowedRoles={["teacher", "admin"]}>
                    <LiveClassPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/teacher/sessions/:sessionId/recordings"
                element={
                  <RequireAuth allowedRoles={["teacher", "admin"]}>
                    <ClassRecordingDetailPage />
                  </RequireAuth>
                }
              />




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
