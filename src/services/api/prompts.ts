import apiClient from "./client";
import type { CreatePromptData, Prompt } from "@/types";

export const promptApi = {
  createPrompt: async (data: CreatePromptData): Promise<Prompt> => {
    const response = await apiClient.post<Prompt>("/prompts", data);
    return response.data;
  }
};
