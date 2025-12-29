import apiClient from "./client";
import type { ClassList, ClassDetail, CreateClassData, PaginatedResponse } from "@/types";

export const classApi = {
  getClassesByTeacher: async (
    teacherId: string,
    limit = 10,
    offset = 0
  ): Promise<PaginatedResponse<ClassList>> => {
    const { data } = await apiClient.get<PaginatedResponse<ClassList>>(
      `/classes/teacher/${teacherId}`,
      {
        params: { limit, offset },
      }
    );
    return data;
  },

  getAllClasses: async (
    limit = 10,
    offset = 0
  ): Promise<PaginatedResponse<ClassList>> => {
    const { data } = await apiClient.get<PaginatedResponse<ClassList>>(
      "/classes",
      {
        params: { limit, offset },
      }
    );
    return data;
  },

  createClass: async (classData: CreateClassData): Promise<ClassDetail> => {
    const { data } = await apiClient.post<ClassDetail>("/classes", classData);
    return data;
  },

  getClassDetails: async (id: string): Promise<ClassDetail> => {
    const { data } = await apiClient.get<ClassDetail>(`/classes/${id}`);
    return data;
  },

  getClassByCode: async (code: string): Promise<ClassDetail> => {
    const { data } = await apiClient.get<ClassDetail>(`/classes/code/${code}`);
    return data;
  },

  enrollLearner: async (classId: string, learnerId: string): Promise<ClassDetail> => {
    const { data } = await apiClient.post<ClassDetail>(`/classes/${classId}/enroll`, {
      learnerId,
    });
    return data;
  },

  removeLearner: async (classId: string, learnerId: string): Promise<ClassDetail> => {
    const { data } = await apiClient.post<ClassDetail>(`/classes/${classId}/remove-learner`, {
      learnerId,
    });
    return data;
  },

  updateClass: async (id: string, updates: Partial<CreateClassData>): Promise<ClassDetail> => {
    const { data } = await apiClient.put<ClassDetail>(`/classes/${id}`, updates);
    return data;
  },
  
  // Additional methods can be added as needed (update, delete, enroll etc.)
};
