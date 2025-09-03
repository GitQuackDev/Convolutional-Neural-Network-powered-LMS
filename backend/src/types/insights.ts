/**
 * Advanced Insights Type Definitions
 * Story 1.9: Advanced Reporting and Insights
 */

// Additional insight-specific types
export interface InsightFilters {
  userId?: string;
  courseId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  courses: string[];
  students: string[];
  contentTypes: string[];
  aiModels: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  confidenceThreshold: number;
  includeAI: boolean;
}

export interface GeneratedInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  summary?: string;
  confidence: number;
  priority: InsightPriority;
  targetUserId?: string;
  targetCourseId?: string;
  aiModel: string;
  sourceData: any;
  visualizations: any[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface PredictiveInsight {
  id: string;
  type: PredictionType;
  title: string;
  description: string;
  prediction: any;
  confidence: number;
  targetUserId?: string;
  targetCourseId?: string;
  aiModel: string;
  sourceData: any;
  validUntil: Date;
  createdAt: Date;
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: RecommendationPriority;
  targetUserId?: string;
  targetCourseId?: string;
  aiModel: string;
  actionItems: RecommendationAction[];
  confidence: number;
  expectedImpact: string;
  timeToImplement: number;
  resourcesRequired: string[];
  validUntil: Date;
  createdAt: Date;
}

export interface RecommendationAction {
  id: string;
  title: string;
  description: string;
  actionType: string;
  priority: number;
  estimatedTime: number;
  resources: string[];
  dependencies: string[];
}

// Enums
export enum InsightType {
  PERFORMANCE_TREND = 'PERFORMANCE_TREND',
  CONTENT_EFFECTIVENESS = 'CONTENT_EFFECTIVENESS',
  ENGAGEMENT_PATTERN = 'ENGAGEMENT_PATTERN',
  PREDICTIVE_ALERT = 'PREDICTIVE_ALERT',
  RECOMMENDATION = 'RECOMMENDATION',
  LEARNING_OUTCOME = 'LEARNING_OUTCOME',
  BEHAVIORAL_PATTERN = 'BEHAVIORAL_PATTERN',
  INTERVENTION_NEEDED = 'INTERVENTION_NEEDED'
}

export enum PredictionType {
  STUDENT_PERFORMANCE = 'STUDENT_PERFORMANCE',
  CONTENT_ENGAGEMENT = 'CONTENT_ENGAGEMENT',
  COURSE_COMPLETION = 'COURSE_COMPLETION',
  LEARNING_DIFFICULTY = 'LEARNING_DIFFICULTY',
  INTERVENTION_NEEDED = 'INTERVENTION_NEEDED',
  DROPOUT_RISK = 'DROPOUT_RISK',
  SUCCESS_PROBABILITY = 'SUCCESS_PROBABILITY'
}

export enum RecommendationType {
  CONTENT_IMPROVEMENT = 'CONTENT_IMPROVEMENT',
  TEACHING_STRATEGY = 'TEACHING_STRATEGY',
  STUDENT_INTERVENTION = 'STUDENT_INTERVENTION',
  RESOURCE_ALLOCATION = 'RESOURCE_ALLOCATION',
  ASSESSMENT_ADJUSTMENT = 'ASSESSMENT_ADJUSTMENT',
  ENGAGEMENT_BOOST = 'ENGAGEMENT_BOOST',
  LEARNING_PATH = 'LEARNING_PATH'
}

export enum InsightPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum RecommendationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum ReportFormat {
  PDF = 'PDF',
  CSV = 'CSV',
  JSON = 'JSON',
  EXCEL = 'EXCEL'
}

// Report types
export interface ReportSection {
  id: string;
  title: string;
  description: string;
  type: string;
  aiEnhanced: boolean;
  dataQueries: any[];
  visualizations: any[];
  order: number;
}

export interface ReportSectionResult {
  sectionId: string;
  title: string;
  content: any;
  aiSummary: string;
  visualizations: any[];
}

export interface ExecutiveSummary {
  overview: string;
  keyFindings: string[];
  recommendations: string[];
  nextSteps: string[];
  generatedBy: string;
  generatedAt: Date;
}

export interface ReportRequest {
  title: string;
  templateId: string;
  filters: InsightFilters;
  sections: ReportSection[];
  format: ReportFormat;
  includeExecutiveSummary: boolean;
  includeRecommendations: boolean;
  generatedBy: string;
  deliveryOptions?: {
    email?: string[];
    webhook?: string;
    schedule?: ScheduleConfiguration;
  };
}

export interface ScheduleConfiguration {
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  timezone: string;
  endDate?: Date;
}

export interface ReportMetadata {
  id: string;
  name: string;
  templateId: string;
  format: ReportFormat;
  generatedBy: string;
  generatedAt: Date;
  downloadUrl?: string;
  isScheduled: boolean;
  scheduleConfig?: ScheduleConfiguration;
  filters: InsightFilters;
  sections: ReportSection[];
  executiveSummary: ExecutiveSummary;
  recommendations: Recommendation[];
}
