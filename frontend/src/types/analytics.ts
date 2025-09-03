// Analytics-related type definitions
export interface AnalyticsMetrics {
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  contentAnalysisCount: number;
  aiModelUsage: Record<string, number>;
  engagementScore: number;
  timestamp: Date;
  
  // Trend data for metric cards
  usersTrend?: 'up' | 'down' | 'stable';
  usersChange?: number;
  sessionTrend?: 'up' | 'down' | 'stable';
  sessionChange?: number;
  analysisTrend?: 'up' | 'down' | 'stable';
  analysisChange?: number;
  engagementTrend?: 'up' | 'down' | 'stable';
  engagementChange?: number;
}

export interface EngagementDataPoint {
  timestamp: Date;
  pageViews: number;
  uniqueUsers: number;
  analysisRequests: number;
  sessionDuration: number;
  courseId?: string;
}

export interface LearningProgressData {
  userId: string;
  userName?: string;
  courseId: string;
  courseName?: string;
  progressScore: number;
  completedActivities: number;
  timeSpent: number;
  lastActivity: Date;
  analysisCount: number;
}

export interface AIModelUsageData {
  modelName: string;
  usageCount: number;
  averageProcessingTime: number;
  successRate: number;
  timestamp: Date;
  costEfficiency?: number;
}

export interface AnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  courseId?: string;
  userId?: string;
  timeGranularity: 'hour' | 'day' | 'week';
  analysisType?: 'cnn' | 'gpt4' | 'claude' | 'gemini' | 'all';
}

export interface MetricCardData {
  title: string;
  value: number | string;
  change?: number;
  format?: 'number' | 'percentage' | 'duration';
  trend?: 'up' | 'down' | 'stable';
  realTimeUpdates?: boolean;
}

export interface RealtimeActivityEvent {
  id: string;
  type: 'user_joined' | 'analysis_started' | 'analysis_completed' | 'session_ended';
  userId: string;
  userName?: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, string | number | boolean>;
}

export interface ExportConfig {
  format: 'pdf' | 'csv';
  filters: AnalyticsFilters;
  reportType: 'overview' | 'engagement' | 'progress' | 'ai-usage' | 'comprehensive';
  includeCharts?: boolean;
  includeRawData?: boolean;
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface WebSocketAnalyticsEvents {
  'analytics-update': (metrics: AnalyticsMetrics) => void;
  'engagement-change': (data: EngagementDataPoint) => void;
  'progress-update': (data: LearningProgressData) => void;
  'activity-event': (event: RealtimeActivityEvent) => void;
  'session-metrics': (data: SessionMetrics) => void;
}

export interface SessionMetrics {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  analysisRequests: number;
  coursesAccessed: string[];
  isActive: boolean;
}
