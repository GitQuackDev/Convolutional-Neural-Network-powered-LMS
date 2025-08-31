import React, { useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthState, AuthContextType, LoginCredentials, RegisterData } from '@/types/auth';
import { AuthContext } from '@/contexts/AuthContextDefinition';
import { authAPI } from '@/services/authAPI';
import { authStorage } from '@/utils/authStorage';
import { useToast } from '@/hooks/use-toast';

// Auth Actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        loading: false,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { toast } = useToast();

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const { token, user } = authStorage.initializeAuthState();
        
        if (token && user) {
          // Verify token is still valid
          try {
            const response = await authAPI.getCurrentUser();
            if (response.success) {
              dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user: response.data.user, token },
              });
            } else {
              throw new Error('Token validation failed');
            }
          } catch {
            // Token is invalid, clear storage
            authStorage.clearAll();
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authStorage.clearAll();
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const response = await authAPI.login(credentials);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store auth data
        authStorage.setToken(token, credentials.rememberMe || false);
        authStorage.setUser(user);
        
        // Update state
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        
        // Success toast
        toast(`Welcome back, ${user.firstName}! You're successfully logged in.`, { type: 'success' });
        
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast(errorMessage, { type: 'error' });
      
      throw error;
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const response = await authAPI.register(userData);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store auth data
        authStorage.setToken(token, false); // Don't auto-remember new registrations
        authStorage.setUser(user);
        
        // Update state
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        
        // Success toast
        toast(`Welcome to LMS CNN, ${user.firstName}! Your account has been created successfully.`, { type: 'success' });
        
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast(errorMessage, { type: 'error' });
      
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Call logout API (to invalidate token on server)
      await authAPI.logout();
    } catch {
      // Continue with logout even if API call fails
      console.error('Logout API error');
    } finally {
      // Clear local storage and state
      authStorage.clearAll();
      dispatch({ type: 'LOGOUT' });
      
      toast("You have been successfully logged out.", { type: 'success' });
    }
  };

  // Update profile function
  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    if (!state.user) throw new Error('No user logged in');

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const response = await authAPI.updateProfile(userData);
      
      if (response.success && response.data) {
        const updatedUser = response.data.user;
        
        // Update storage
        authStorage.setUser(updatedUser);
        
        // Update state
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
        
        toast("Your profile has been updated successfully.", { type: 'success' });
        
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast(errorMessage, { type: 'error' });
      
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Check auth function (for manual auth checks)
  const checkAuth = async (): Promise<void> => {
    if (!state.token) return;

    try {
      const response = await authAPI.getCurrentUser();
      if (response.success) {
        dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      } else {
        throw new Error('Auth check failed');
      }
    } catch {
      // Token is invalid, logout
      await logout();
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
