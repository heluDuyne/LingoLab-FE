import apiClient from "./client";
import type { User, CreateUserData, UserSearchParams, ApiResponse, UpdateUserData } from "@/types";

export const userApi = {
  createUser: async (userData: CreateUserData): Promise<User> => { 
    const { data } = await apiClient.post<any>("/auth/register", userData);
    return data.user;
  },

  searchUsers: async (params: UserSearchParams): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>(`/users/search/${params.query}`, {
      params: { limit: params.limit },
    });
    return data;
  },
  
  getLearners: async (): Promise<any> => {
     const { data } = await apiClient.get("/users/role/learners");
     return data;
  },

  updateUser: async (id: string, userData: UpdateUserData): Promise<User> => {
    const { data } = await apiClient.put<User>(`/users/${id}`, userData);
    return data;
  }
};
