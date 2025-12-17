import apiClient from "./client";
import type { User, LoginCredentials, RegisterCredentials } from "@/types";
import { TEST_ACCOUNTS } from "@/constants";

interface AuthResponse {
  user: User;
  token: string;
}

// Mock users for development/testing
const MOCK_USERS: Record<string, User> = {
  [TEST_ACCOUNTS.TEACHER.username]: {
    id: "teacher-001",
    username: TEST_ACCOUNTS.TEACHER.username,
    email: TEST_ACCOUNTS.TEACHER.email,
    name: "Minh Nguyen",
    role: "teacher",
    createdAt: new Date().toISOString(),
  },
  [TEST_ACCOUNTS.LEARNER.username]: {
    id: "learner-001",
    username: TEST_ACCOUNTS.LEARNER.username,
    email: TEST_ACCOUNTS.LEARNER.email,
    name: "Duy Pham",
    role: "learner",
    createdAt: new Date().toISOString(),
  },
};

// Set to true to use mock authentication (no backend required)
const USE_MOCK_AUTH = false;

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Mock authentication for testing
    if (USE_MOCK_AUTH) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

      // Normalize inputs (trim whitespace, lowercase email)
      const email = credentials.email.trim().toLowerCase();
      const password = credentials.password;

      console.log("Login attempt:", { email, password });
      console.log("Expected teacher:", TEST_ACCOUNTS.TEACHER);
      console.log("Expected learner:", TEST_ACCOUNTS.LEARNER);

      // Check teacher credentials
      if (
        email === TEST_ACCOUNTS.TEACHER.email.toLowerCase() &&
        password === TEST_ACCOUNTS.TEACHER.password
      ) {
        return {
          user: MOCK_USERS[TEST_ACCOUNTS.TEACHER.username],
          token: "mock-jwt-token-teacher-" + Date.now(),
        };
      }

      // Check learner credentials
      if (
        email === TEST_ACCOUNTS.LEARNER.email.toLowerCase() &&
        password === TEST_ACCOUNTS.LEARNER.password
      ) {
        return {
          user: MOCK_USERS[TEST_ACCOUNTS.LEARNER.username],
          token: "mock-jwt-token-learner-" + Date.now(),
        };
      }

      throw new Error("Invalid username, email, or password");
    }

    // Real API call
    const { data } = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials
    );
    return data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    // Mock registration for testing
    if (USE_MOCK_AUTH) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newUser: User = {
        id: "user-" + Date.now(),
        // username removed
        username: "temp-user", // Keep for type compat or refactor User type later
        email: credentials.email,
        name: `${credentials.firstName} ${credentials.lastName}`,
        role: credentials.role || "learner",
        createdAt: new Date().toISOString(),
      };

      return {
        user: newUser,
        token: "mock-jwt-token-" + Date.now(),
      };
    }

    // Real API call
    const { data } = await apiClient.post<AuthResponse>(
      "/auth/register",
      credentials
    );
    return data;
  },

  logout: async (): Promise<void> => {
    if (USE_MOCK_AUTH) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return;
    }
    await apiClient.post("/auth/logout");
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await apiClient.get<User>("/auth/me");
    return data;
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const { data } = await apiClient.post<{ token: string }>("/auth/refresh");
    return data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post("/auth/forgot-password", { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post("/auth/reset-password", { token, password });
  },
};
