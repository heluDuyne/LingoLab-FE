import apiClient from "./client";
import type { AssignmentList, PaginatedResponse, CreateAssignmentData, Assignment } from "@/types";

export const assignmentApi = {
  createAssignment: async (data: CreateAssignmentData): Promise<Assignment> => {
    const response = await apiClient.post<Assignment>("/assignments", data);
    return response.data;
  },

  getAssignmentsByClass: async (classId: string, limit: number = 10, offset: number = 0): Promise<PaginatedResponse<AssignmentList>> => {
    const { data } = await apiClient.get<PaginatedResponse<AssignmentList>>(`/assignments/class/${classId}`, {
      params: { limit, offset }
    });
    return data;
  },

  getAssignmentById: async (id: string): Promise<Assignment> => {
    const { data } = await apiClient.get<Assignment>(`/assignments/${id}`);
    return data;
  },

  getMyAssignments: async (limit: number = 10, offset: number = 0): Promise<PaginatedResponse<AssignmentList>> => {
    const { data } = await apiClient.get<PaginatedResponse<AssignmentList>>("/assignments/my-assignments", {
      params: { limit, offset }
    });
    return data;
  },

  getTeacherAssignments: async (limit: number = 10, offset: number = 0): Promise<PaginatedResponse<AssignmentList>> => {
    const { data } = await apiClient.get<PaginatedResponse<AssignmentList>>("/assignments/teacher/my-created", {
      params: { limit, offset }
    });
    return data;
  },

  getStudentSubmissions: async (id: string): Promise<any[]> => {
    const { data } = await apiClient.get<any[]>(`/assignments/${id}/submissions`);
    return data;
  }
};
