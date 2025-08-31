// Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePicture?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UserRole = {
  STUDENT: 'student',
  PROFESSOR: 'professor',
  ADMIN: 'admin',
  COMMUNITY_MODERATOR: 'community_moderator',
  REGULAR_MODERATOR: 'regular_moderator'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  agreedToTerms: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
  errors?: ValidationError[];
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
