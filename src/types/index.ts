// User types
export type UserRole = 'teacher' | 'learner' | 'admin';

export interface User {
  id: string;
  username?: string; // Made optional as backend might not use it
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  bio?: string;
  enrolledClass?: string;
}

// ...

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  bio?: string;
  email?: string;
  avatar?: string;
}

export interface ClassLearner {
  id: string;
  email: string;
  enrolledAt?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string;
}

export interface UpdateClassData {
  name?: string;
  description?: string;
  code?: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Class types
export interface Class {
  id: string;
  teacherId: string;
  name: string;
  description?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassList {
  id: string;
  name: string;
  code?: string;
  createdAt: string;
  learnerCount?: number;
}

export interface ClassDetail extends Class {
  teacherEmail?: string;
  teacherName?: string;
  learnerCount?: number;
  learners?: ClassLearner[];
}

export interface ClassLearner {
  id: string;
  email: string;
  enrolledAt?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string;
}

export interface CreateClassData {
  teacherId: string;
  name: string;
  description?: string;
  code?: string;
}

// Common entity types (extend as needed)
export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses: string[];
}

export interface CreateUserData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}

export interface UserSearchParams {
  query: string;
  limit?: number;
}

export interface UpdateClassData {
  name?: string;
  description?: string;
  code?: string;
}
export type AssignmentStatus = 'draft' | 'active' | 'archived';

export interface Assignment {
  id: string;
  classId: string;
  promptId: string;
  title: string;
  description?: string;
  deadline: string;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    name: string;
  };
  type?: string;
  skillType?: string;
  prompt?: {
    id: string;
    title: string;
    skillType: string;
    content?: string;
  };
  attemptId?: string;
  totalEnrolled?: number;
  totalSubmitted?: number;
  totalScored?: number;
  averageScore?: number;
  allowLateSubmission?: boolean;
  lateDeadline?: string;
}

export interface AssignmentList {
  id: string;
  title: string;
  deadline: string;
  status: AssignmentStatus;
  totalEnrolled: number;
  totalSubmitted: number;
  totalScored: number;
  createdAt: string;

  className?: string; // Added from backend update
  submissionStatus?: string;
  score?: number;
  averageScore?: number;
  type?: string;
}

export interface AssignmentStudentSubmissionDTO {
  learnerId: string;
  learnerEmail: string;
  learnerName?: string;
  status: string;
  submittedAt?: string;
  score?: number;
}

export interface CreateAssignmentData {
  classId: string;
  promptId: string;
  title: string;
  description?: string;
  deadline: string;
  status?: AssignmentStatus;
  allowLateSubmission?: boolean;
}

export type SkillType = 'LISTENING' | 'SPEAKING' | 'READING' | 'WRITING';
export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface CreatePromptData {
  skillType: SkillType;
  content: string;
  difficulty: DifficultyLevel;
  prepTime: number;
  responseTime: number;
  description?: string;
  followUpQuestions?: string;
}

export interface AttemptScore {
  id: string;
  fluency: number;
  pronunciation: number;
  lexical: number;
  grammar: number;
  overallBand: number;
  feedback: string;
  detailedFeedback?: any;
}

export interface AttemptList {
  id: string;
  promptId: string;
  skillType: SkillType;
  status: string; // 'SUBMITTED', 'SCORED', etc.
  createdAt: string;
  submittedAt?: string;
  deadline?: string;
  title?: string;
  score?: AttemptScore;
}

