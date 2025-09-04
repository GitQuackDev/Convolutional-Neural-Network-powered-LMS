// API Response Types for LMS CNN System
// Generated for Story 2.1: API Integration Foundation Enhancement

// ===== ANALYTICS TYPES =====
export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  courseId?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export interface AnalyticsOverview {
  totalStudents: number;
  activeStudents: number;
  completionRate: number;
  avgScore: number;
  courseCount: number;
  assignmentCount: number;
}

export interface EngagementParams {
  startDate?: string;
  endDate?: string;
  courseId?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export interface EngagementData {
  loginFrequency: number;
  sessionDuration: number;
  contentInteractionRate: number;
  discussionParticipation: number;
  timeOnTask: number;
  engagementTrends: Array<{
    date: string;
    engagement: number;
    activeUsers: number;
  }>;
}

export interface ProgressData {
  overallProgress: number;
  courseProgress: Array<{
    courseId: string;
    courseName: string;
    completionRate: number;
    averageScore: number;
    studentCount: number;
  }>;
  assignmentProgress: Array<{
    assignmentId: string;
    assignmentName: string;
    submissionRate: number;
    averageScore: number;
  }>;
}

export interface AIModelsUsage {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  costTracking: {
    totalCost: number;
    costByModel: Array<{
      model: string;
      cost: number;
      requestCount: number;
    }>;
  };
  modelHealth: Array<{
    model: string;
    status: 'healthy' | 'degraded' | 'down';
    availability: number;
    lastUpdated: string;
  }>;
}

export interface ExportFormat {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  dateRange: {
    start: string;
    end: string;
  };
  includeCharts?: boolean;
  courseIds?: string[];
}

export interface ExportResult {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  expiresAt: string;
}

// ===== ANNOTATION TYPES =====
export interface Annotation {
  id: string;
  contentId: string;
  userId: string;
  userName: string;
  text: string;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  type: 'highlight' | 'comment' | 'suggestion' | 'question';
  createdAt: string;
  updatedAt: string;
  replies?: AnnotationReply[];
  tags?: string[];
}

export interface AnnotationReply {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface CreateAnnotationData {
  contentId: string;
  text: string;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  type: 'highlight' | 'comment' | 'suggestion' | 'question';
  tags?: string[];
}

export interface UpdateAnnotationData {
  text?: string;
  position?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  tags?: string[];
}

// ===== AI ANALYSIS TYPES =====
export interface MultiAnalysisRequest {
  content: string | File;
  models: string[];
  parameters: AnalysisParameters;
  goals: AnalysisGoal[];
  priority: AnalysisPriority;
}

export interface AnalysisParameters {
  analysisType: 'content_quality' | 'engagement_prediction' | 'learning_effectiveness' | 'accessibility_check';
  detailLevel: 'basic' | 'detailed' | 'comprehensive';
  includeRecommendations: boolean;
  customPrompts?: string[];
}

export interface AnalysisGoal {
  type: 'improvement' | 'assessment' | 'optimization' | 'validation';
  focus: string;
  weight: number;
}

export type AnalysisPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AnalysisJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  models: string[];
  createdAt: string;
  estimatedCompletionTime?: string;
}

export interface AnalysisProgress {
  jobId: string;
  overallProgress: number;
  modelProgress: Array<{
    model: string;
    progress: number;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    stage: 'initialization' | 'analysis' | 'consolidation' | 'completed';
    estimatedTimeRemaining?: number;
  }>;
  currentStage: string;
  processingStartTime: string;
  lastUpdated: string;
}

export interface ConsolidatedResults {
  jobId: string;
  synthesis: AnalysisSynthesis;
  modelResults: ModelResult[];
  comparison: ModelComparisonData;
  consensus: ConsensusAnalysis;
  recommendations: AggregatedRecommendations;
  confidence: OverallConfidenceScore;
  completedAt: string;
}

export interface AnalysisSynthesis {
  summary: string;
  keyInsights: string[];
  overallScore: number;
  categories: Array<{
    category: string;
    score: number;
    insights: string[];
  }>;
}

export interface ModelResult {
  model: string;
  result: {
    score: number;
    insights: string[];
    recommendations: string[];
    confidence: number;
    processingTime: number;
  };
  rawResponse: Record<string, unknown>;
}

export interface ModelComparisonData {
  agreements: string[];
  disagreements: Array<{
    aspect: string;
    models: Array<{
      model: string;
      position: string;
      confidence: number;
    }>;
  }>;
  consensusScore: number;
}

export interface ConsensusAnalysis {
  overallConsensus: number;
  areas: Array<{
    aspect: string;
    consensus: number;
    majorityView: string;
    minorityViews: string[];
  }>;
}

export interface AggregatedRecommendations {
  priority: 'high' | 'medium' | 'low';
  recommendations: Array<{
    category: string;
    action: string;
    impact: string;
    effort: string;
    supportingModels: string[];
  }>;
}

export interface OverallConfidenceScore {
  score: number;
  factors: Array<{
    factor: string;
    contribution: number;
    explanation: string;
  }>;
}

// ===== COURSES AND CONTENT TYPES =====
export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  submissionCount: number;
  averageScore?: number;
  status: 'draft' | 'published' | 'closed';
}

// ===== ERROR HANDLING TYPES =====
export interface APIError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// ===== LOADING STATE TYPES =====
export interface LoadingState {
  isLoading: boolean;
  error?: APIError | null;
  lastUpdated?: string;
}
