// ============================================
// TYPES
// ============================================

export type TaskType = "WRITING" | "SPEAKING" | "READING";
export type SubmissionStatus = "PENDING" | "SUBMITTED" | "GRADED" | "NOT_STARTED";

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface ClassGroup {
  id: string;
  name: string;
  studentIds: string[];
  image?: string;
  progress?: number;
}

export interface Assignment {
  id: string;
  title: string;
  type: TaskType;
  classId: string;
  className: string;
  dueDate: string;
  description?: string;
  instructions?: string;
  image?: string;
}

export interface AIFeedback {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  submittedAt?: string;
  mediaType?: string;
  aiFeedback?: AIFeedback;
}

export interface PendingReview {
  id: string;
  studentId: string;
  studentName: string;
  assignmentTitle: string;
  submittedAt: string;
}

// ============================================
// MOCK DATA - STUDENTS
// ============================================

export const mockStudents: Student[] = [
  { id: "s1", name: "Duy Pham", email: "duy.pham@email.com", avatar: null },
  { id: "s2", name: "Linh Tran", email: "linh.tran@email.com", avatar: null },
  { id: "s3", name: "Huy Nguyen", email: "huy.nguyen@email.com", avatar: null },
  { id: "s4", name: "Mai Le", email: "mai.le@email.com", avatar: null },
  { id: "s5", name: "Tuan Vo", email: "tuan.vo@email.com", avatar: null },
  { id: "s6", name: "Lan Hoang", email: "lan.hoang@email.com", avatar: null },
];

// ============================================
// MOCK DATA - CLASSES
// ============================================

export const mockClasses: ClassGroup[] = [
  {
    id: "c1",
    name: "English Grammar 101",
    studentIds: ["s1", "s2", "s3"],
    image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=60",
    progress: 75,
  },
  {
    id: "c2",
    name: "Advanced Writing",
    studentIds: ["s2", "s4", "s5"],
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60",
    progress: 45,
  },
  {
    id: "c3",
    name: "Speaking Practice",
    studentIds: ["s1", "s3", "s6"],
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=60",
    progress: 60,
  },
  {
    id: "c4",
    name: "IELTS Evening Group A",
    studentIds: ["s1", "s2"],
    image:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60",
    progress: 30,
  },
];

// ============================================
// MOCK DATA - ASSIGNMENTS
// ============================================

export const mockAssignments: Assignment[] = [
  {
    id: "a1",
    title: "IELTS Writing Task 1 - Graph Analysis",
    type: "WRITING",
    classId: "c1",
    className: "IELTS Writing",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    image:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "a2",
    title: "Speaking Practice - Part 2",
    type: "SPEAKING",
    classId: "c3",
    className: "IELTS Speaking",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: "a3",
    title: "Grammar Quiz - Tenses",
    type: "WRITING",
    classId: "c1",
    className: "IELTS Writing",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: "a4",
    title: "Essay: Climate Change",
    type: "WRITING",
    classId: "c2",
    className: "Advanced Writing",
    dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    image:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500&auto=format&fit=crop&q=60",
  },
];

// ============================================
// MOCK DATA - SUBMISSIONS
// ============================================

export const mockSubmissions: Submission[] = [
  {
    id: "sub1",
    assignmentId: "a3",
    studentId: "s1",
    status: "GRADED",
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    mediaType: "text",
    aiFeedback: {
      score: 7.5,
      summary:
        "Good overall structure and coherent arguments. Some grammatical errors need attention.",
      strengths: [
        "Clear introduction with a well-defined thesis statement",
        "Good use of linking words and cohesive devices",
      ],
      weaknesses: [
        "Some subject-verb agreement errors",
        "Limited range of vocabulary in certain sections",
      ],
    },
  },
  {
    id: "sub2",
    assignmentId: "a1",
    studentId: "s1",
    status: "SUBMITTED",
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sub3",
    assignmentId: "a2",
    studentId: "s1",
    status: "GRADED",
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    mediaType: "audio",
    aiFeedback: {
      score: 6.5,
      summary: "Good pronunciation and fluency with room for improvement in vocabulary.",
      strengths: [
        "Clear pronunciation and good pace",
        "Natural intonation patterns",
      ],
      weaknesses: [
        "Limited vocabulary range",
        "Some hesitation when expressing complex ideas",
      ],
    },
  },
];

// ============================================
// MOCK DATA - PENDING REVIEWS (for Teacher Dashboard)
// ============================================

export const mockPendingReviews: PendingReview[] = [
  {
    id: "r1",
    studentId: "s1",
    studentName: "Duy Pham",
    assignmentTitle: "Essay Assignment",
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "r2",
    studentId: "s2",
    studentName: "Linh Tran",
    assignmentTitle: "Quiz Results",
    submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "r3",
    studentId: "s3",
    studentName: "Huy Nguyen",
    assignmentTitle: "Project Submission",
    submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getStudentById = (id: string): Student | undefined => {
  return mockStudents.find((s) => s.id === id);
};

export const getClassById = (id: string): ClassGroup | undefined => {
  return mockClasses.find((c) => c.id === id);
};

export const getAssignmentById = (id: string): Assignment | undefined => {
  return mockAssignments.find((a) => a.id === id);
};

export const getSubmissionById = (id: string): Submission | undefined => {
  return mockSubmissions.find((s) => s.id === id);
};

export const getStudentClasses = (studentId: string): ClassGroup[] => {
  return mockClasses.filter((c) => c.studentIds.includes(studentId));
};

export const getClassStudents = (classId: string): Student[] => {
  const classGroup = mockClasses.find((c) => c.id === classId);
  if (!classGroup) return [];
  return mockStudents.filter((s) => classGroup.studentIds.includes(s.id));
};

export const getStudentSubmissions = (studentId: string): Submission[] => {
  return mockSubmissions.filter((s) => s.studentId === studentId);
};

export const getAssignmentSubmissions = (assignmentId: string): Submission[] => {
  return mockSubmissions.filter((s) => s.assignmentId === assignmentId);
};

