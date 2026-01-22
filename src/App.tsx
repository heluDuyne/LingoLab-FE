import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";

// Auth components
import { ProtectedRoute, GuestRoute } from "@/components/auth";
import { DashboardLayout } from "@/components/layout";

// Public pages
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";

// Teacher pages
import {
  TeacherDashboard,
  CreateTaskPage,
  StudentManagementPage,
  StudentDetailPage,
  AddNewStudentPage,
  ClassManagementPage,
  TaskDetailPage,
  ReportPage,
  TeacherProfilePage,
  GradingPage,
  SpeakingGradingPage,
  WritingGradedTaskPage,
  SpeakingGradedTaskPage,
} from "@/pages/teacher";

// Student pages
import { StudentDashboard, ProgressPage, ProfilePage as StudentProfilePage, ReportDetailPage, WritingSubmissionPage, SpeakingSubmissionPage, SpeakingEvaluationPage, WritingEvaluationPage } from "@/pages/student";

// Route constants
import { ROUTES } from "@/constants";

function App() {
  return (
    <div>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* Public routes - accessible only when NOT logged in */}
          <Route
            path={ROUTES.SIGNIN}
            element={
              <GuestRoute>
                <SignInPage />
              </GuestRoute>
            }
          />
          <Route
            path={ROUTES.SIGNUP}
            element={
              <GuestRoute>
                <SignUpPage />
              </GuestRoute>
            }
          />

          {/* Teacher routes */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherDashboard />} />
            <Route path="create-task" element={<CreateTaskPage />} />
            <Route path="students" element={<StudentManagementPage />} />
            <Route path="students/add" element={<AddNewStudentPage />} />
            <Route path="students/:studentId" element={<StudentDetailPage />} />
            <Route path="classes" element={<ClassManagementPage />} />
            <Route path="classes/:classId/assignments/:assignmentId" element={<TaskDetailPage />} />
            <Route path="reports" element={<ReportPage />} />
            <Route path="profile" element={<TeacherProfilePage />} />
            <Route path="grading/:attemptId" element={<GradingPage />} />
            <Route path="grading/speaking/:attemptId" element={<SpeakingGradingPage />} />
            <Route path="graded/:attemptId" element={<WritingGradedTaskPage />} />
            <Route path="graded/speaking/:attemptId" element={<SpeakingGradedTaskPage />} />
            {/* Add more teacher routes here:
            <Route path="settings" element={<TeacherSettings />} />
            */}
          </Route>

          {/* Student routes */}
          <Route
            path="/learner"
            element={
              <ProtectedRoute allowedRoles={["learner"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
            <Route path="report/:submissionId" element={<ReportDetailPage />} />
            <Route path="submit/writing/:assignmentId" element={<WritingSubmissionPage />} />
            <Route path="submit/speaking/:assignmentId" element={<SpeakingSubmissionPage />} />
            <Route path="speaking-evaluation/:assignmentId" element={<SpeakingEvaluationPage />} />
            <Route path="writing-evaluation/:assignmentId" element={<WritingEvaluationPage />} />
            {/* Add more student routes here:
            <Route path="courses" element={<StudentCourses />} />
            <Route path="courses/:id" element={<StudentCourseDetail />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="settings" element={<StudentSettings />} />
            */}
          </Route>

          {/* Root redirect - will be handled by auth state */}
          <Route
            path={ROUTES.HOME}
            element={<Navigate to={ROUTES.SIGNIN} replace />}
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
