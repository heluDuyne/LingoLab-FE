import { apiClient } from "./client";

export interface AttemptReview {
  id: string;
  studentName: string;
  assignmentTitle: string;
  submittedAt: string;
  status: string;
}

export const attemptApi = {
  getPendingTeacherAttempts: async (limit: number = 10, offset: number = 0) => {
    const response = await apiClient.get(`/attempts/teacher/pending`, {
      params: { limit, offset },
    });
    return response.data;
  },

  createAttempt: async (data: any) => {
    const response = await apiClient.post(`/attempts`, data);
    return response.data;
  },

  submitAttempt: async (id: string, data: any) => {
    const response = await apiClient.put(`/attempts/${id}/submit`, data);
    return response.data;
  },

  getAttemptById: async (attemptId: string) => {
    const response = await apiClient.get(`/attempts/${attemptId}`);
    return response.data;
  },

  getAttemptsByLearner: async (learnerId: string, limit: number = 5, offset: number = 0) => {
    const response = await apiClient.get(`/attempts/learner/${learnerId}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  gradeAttempt: async (id: string, data: { 
      score: number; 
      feedback: string;
      fluency?: number;
      pronunciation?: number;
      lexical?: number;
      grammar?: number;
      coherence?: number;
      taskResponse?: number;
  }) => {
    const response = await apiClient.put(`/attempts/${id}/grade`, data);
    return response.data;
  },
};
