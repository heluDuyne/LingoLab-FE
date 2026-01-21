// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Route paths
export const ROUTES = {
  // Public routes
  HOME: "/",
  SIGNIN: "/signin",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",

  // Teacher routes
  TEACHER: {
    DASHBOARD: "/teacher",
    CREATE_TASK: "/teacher/create-task",
    COURSES: "/teacher/courses",
    COURSE_DETAIL: "/teacher/courses/:id",
    STUDENTS: "/teacher/students",
    STUDENT_DETAIL: "/teacher/students/:studentId",
    ADD_STUDENT: "/teacher/students/add",
    CLASSES: "/teacher/classes",
    CLASS_DETAIL: "/teacher/classes/:id", // Added for clarity, though currently managed by state
    TASK_DETAIL: "/teacher/classes/:classId/assignments/:assignmentId",
    REPORTS: "/teacher/reports",
    PROFILE: "/teacher/profile",
    SETTINGS: "/teacher/settings",
    GRADING: "/teacher/grading/:attemptId",
  },

  // Student routes
  LEARNER: {
    DASHBOARD: "/learner",
    COURSES: "/learner/courses",
    COURSE_DETAIL: "/learner/courses/:id",
    ASSIGNMENTS: "/learner/assignments",
    WRITING_SUBMISSION: "/learner/submit/writing/:assignmentId",
    SPEAKING_SUBMISSION: "/learner/submit/speaking/:assignmentId",
    PROGRESS: "/learner/progress",
    PROFILE: "/learner/profile",
    REPORT_DETAIL: "/learner/report/:submissionId",
    SPEAKING_EVALUATION: "/learner/speaking-evaluation/:assignmentId",
    WRITING_EVALUATION: "/learner/writing-evaluation/:assignmentId",
    SETTINGS: "/learner/settings",
  },
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: "lingolab_token",
  USER: "lingolab_user",
  THEME: "lingolab_theme",
} as const;

// User roles
export const USER_ROLES = {
  TEACHER: "teacher",
  LEARNER: "learner",
  ADMIN: "admin",
} as const;

// Test accounts for development
export const TEST_ACCOUNTS = {
  TEACHER: {
    username: "teacher",
    email: "teacher@test.com",
    password: "teacher123",
  },
  LEARNER: {
    username: "student",
    email: "student@test.com",
    password: "student123",
  },
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
