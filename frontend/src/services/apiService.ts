import { authStorage } from '@/utils/authStorage';
import type {
  AnalyticsParams,
  AnalyticsOverview,
  EngagementParams,
  EngagementData,
  ProgressData,
  AIModelsUsage,
  ExportFormat,
  ExportResult,
  Annotation,
  CreateAnnotationData,
  UpdateAnnotationData,
  MultiAnalysisRequest,
  AnalysisJob,
  AnalysisProgress,
  ConsolidatedResults,
  Course,
  Assignment,
  APIError
} from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Enhanced API Service for LMS CNN System
// Story 2.1: API Integration Foundation Enhancement
class APIService {
  private retryAttempts = 3;
  private retryDelay = 1000;

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = authStorage.getToken();
    
    const config: RequestInit = {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: APIError = {
          message: errorData.message || `HTTP error! status: ${response.status} ${response.statusText}`,
          code: errorData.code || `HTTP_${response.status}`,
          details: errorData.details,
          timestamp: new Date().toISOString()
        };
        
        // Retry logic for transient failures (5xx errors)
        if (response.status >= 500 && retryCount < this.retryAttempts) {
          console.warn(`API request failed, retrying... (attempt ${retryCount + 1}/${this.retryAttempts})`);
          await this.delay(this.retryDelay * Math.pow(2, retryCount));
          return this.makeRequest<T>(endpoint, options, retryCount + 1);
        }
        
        throw apiError;
      }
      
      const data = await response.json();
      
      // Log successful API calls in development
      if (import.meta.env.DEV) {
        console.log(`✅ API Success: ${options.method || 'GET'} ${endpoint}`, data);
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Enhanced error logging with request details
      console.error('Request details:', {
        url,
        method: options.method || 'GET',
        headers: config.headers,
        retryCount
      });
      
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async post<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    const isFormData = data instanceof FormData;
    
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      ...(isFormData ? {} : { 
        headers: { 'Content-Type': 'application/json' } 
      }),
      body: isFormData ? data : JSON.stringify(data),
      ...options,
    });
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      ...options,
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  // ===== ANALYTICS API METHODS =====
  analytics = {
    getOverview: async (params?: AnalyticsParams): Promise<AnalyticsOverview> => {
      const queryParams = params ? '?' + new URLSearchParams({
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
        ...(params.courseId && { courseId: params.courseId }),
        ...(params.granularity && { granularity: params.granularity })
      }).toString() : '';
      
      return this.get<AnalyticsOverview>(`/api/analytics/overview${queryParams}`);
    },

    getEngagement: async (params?: EngagementParams): Promise<EngagementData> => {
      const queryParams = params ? '?' + new URLSearchParams({
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
        ...(params.courseId && { courseId: params.courseId }),
        ...(params.granularity && { granularity: params.granularity })
      }).toString() : '';
      
      return this.get<EngagementData>(`/api/analytics/engagement${queryParams}`);
    },

    getProgress: async (params?: AnalyticsParams): Promise<ProgressData> => {
      const queryParams = params ? '?' + new URLSearchParams({
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
        ...(params.courseId && { courseId: params.courseId })
      }).toString() : '';
      
      return this.get<ProgressData>(`/api/analytics/progress${queryParams}`);
    },

    getAIModelsUsage: async (params?: AnalyticsParams): Promise<AIModelsUsage> => {
      const queryParams = params ? '?' + new URLSearchParams({
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
        ...(params.courseId && { courseId: params.courseId })
      }).toString() : '';
      
      return this.get<AIModelsUsage>(`/api/analytics/ai-models/usage${queryParams}`);
    },

    exportData: async (format: ExportFormat): Promise<ExportResult> => {
      return this.post<ExportResult>('/api/analytics/export', format);
    },

    getRecentActivities: async (limit: number = 10): Promise<unknown[]> => {
      return this.get<unknown[]>(`/api/analytics/activities?limit=${limit}`);
    }
  };

  // ===== ANNOTATIONS API METHODS =====
  annotations = {
    getAnnotations: async (contentId: string): Promise<Annotation[]> => {
      return this.get<Annotation[]>(`/api/annotations?contentId=${contentId}`);
    },

    createAnnotation: async (data: CreateAnnotationData): Promise<Annotation> => {
      return this.post<Annotation>('/api/annotations', data);
    },

    updateAnnotation: async (id: string, data: UpdateAnnotationData): Promise<Annotation> => {
      return this.put<Annotation>(`/api/annotations/${id}`, data);
    },

    deleteAnnotation: async (id: string): Promise<void> => {
      return this.delete<void>(`/api/annotations/${id}`);
    }
  };

  // ===== AI ANALYSIS API METHODS =====
  aiAnalysis = {
    analyzeMulti: async (data: MultiAnalysisRequest): Promise<AnalysisJob> => {
      return this.post<AnalysisJob>('/api/ai-analysis/analyze-multi', data);
    },

    getProgress: async (jobId: string): Promise<AnalysisProgress> => {
      return this.get<AnalysisProgress>(`/api/ai-analysis/progress/${jobId}`);
    },

    getResults: async (jobId: string): Promise<ConsolidatedResults> => {
      return this.get<ConsolidatedResults>(`/api/ai-analysis/consolidated/${jobId}`);
    }
  };

  // ===== COURSES API METHODS =====
  courses = {
    getUserCourses: async (): Promise<Course[]> => {
      return this.get<Course[]>('/api/courses/user');
    },

    getCourse: async (courseId: string): Promise<Course> => {
      return this.get<Course>(`/api/courses/${courseId}`);
    },

    getAssignments: async (courseId?: string): Promise<Assignment[]> => {
      const endpoint = courseId ? `/api/assignments?courseId=${courseId}` : '/api/assignments';
      return this.get<Assignment[]>(endpoint);
    }
  };
}

export const apiService = new APIService();
