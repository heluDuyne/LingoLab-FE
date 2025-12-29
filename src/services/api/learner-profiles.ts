import apiClient from "./client";
import type { ApiResponse } from "@/types";

export interface LearnerProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  targetBand?: number;
  currentBand?: number;
  nativeLanguage?: string;
  learningGoals?: string;
}

export interface UpdateLearnerProfileData {
  firstName?: string;
  lastName?: string;
  targetBand?: number;
  currentBand?: number;
  nativeLanguage?: string;
  learningGoals?: string;
}

export const learnerProfileApi = {
  getProfileByUserId: async (userId: string): Promise<LearnerProfile> => {
    const { data } = await apiClient.get<LearnerProfile>(`/learner-profiles/user/${userId}`);
    return data;
  },

  updateProfile: async (id: string, data: UpdateLearnerProfileData): Promise<LearnerProfile> => {
    const response = await apiClient.put<LearnerProfile>(`/learner-profiles/${id}`, data);
    return response.data;
  },
};
