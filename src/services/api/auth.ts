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
  [TEST_ACCOUNTS.STUDENT.username]: {
    id: "student-001",
    username: TEST_ACCOUNTS.STUDENT.username,
    email: TEST_ACCOUNTS.STUDENT.email,
    name: "Duy Pham",
    role: "student",
    createdAt: new Date().toISOString(),
  },
};

// Set to true to use mock authentication (no backend required)
const USE_MOCK_AUTH = true;

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Mock authentication for testing
    if (USE_MOCK_AUTH) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

      // Normalize inputs (trim whitespace, lowercase email)
      const username = credentials.username.trim();
      const email = credentials.email.trim().toLowerCase();
      const password = credentials.password;

      console.log("Login attempt:", { username, email, password });
      console.log("Expected teacher:", TEST_ACCOUNTS.TEACHER);
      console.log("Expected student:", TEST_ACCOUNTS.STUDENT);

      // Check teacher credentials
      if (
        username === TEST_ACCOUNTS.TEACHER.username &&
        email === TEST_ACCOUNTS.TEACHER.email.toLowerCase() &&
        password === TEST_ACCOUNTS.TEACHER.password
      ) {
        return {
          user: MOCK_USERS[TEST_ACCOUNTS.TEACHER.username],
          token: "mock-jwt-token-teacher-" + Date.now(),
        };
      }

      // Check student credentials
      if (
        username === TEST_ACCOUNTS.STUDENT.username &&
        email === TEST_ACCOUNTS.STUDENT.email.toLowerCase() &&
        password === TEST_ACCOUNTS.STUDENT.password
      ) {
        return {
          user: MOCK_USERS[TEST_ACCOUNTS.STUDENT.username],
          token: "mock-jwt-token-student-" + Date.now(),
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
        username: credentials.username,
        email: credentials.email,
        name: credentials.name,
        role: credentials.role,
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
