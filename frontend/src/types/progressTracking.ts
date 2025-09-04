/**
 * Enhanced AI Analysis Progress Tracking Types
 * Story 2.6: AI Progress Tracking and Results Display Enhancement
 * Task 2.6.1: Enhanced Progress Tracking Components
 */

// Enhanced AI Model Type (extending the basic strings)
export type AIModelType = 'gpt-4' | 'claude-3' | 'gemini-pro';

// Model Health Status for real-time monitoring
export interface ModelHealthStatus {
  status: 'healthy' | 'degraded' | 'unavailable' | 'maintenance';
  latency: number; // in milliseconds
  queueLength: number;
  errorRate: number; // percentage
  lastHealthCheck: Date;
  availabilityScore: number; // 0-100
}

// Detailed progress tracking per model
export interface ModelProgressDetail {
  progress: number; // 0-100
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
  startTime?: Date;
  completionTime?: Date;
  processingTime?: number; // in milliseconds
  errorMessage?: string;
  retryCount: number;
  health: ModelHealthStatus;
  stage: ProgressStage['stage'];
  metrics?: ProcessingMetrics;
}

// Analysis stage tracking
export interface ProgressStage {
  stage: 'validation' | 'preprocessing' | 'analysis' | 'consolidation' | 'completion';
  progress: number; // 0-100
  startTime: Date;
  completionTime?: Date;
  models: AIModelType[];
  description: string;
  estimatedDuration?: number; // in milliseconds
}

// Processing performance metrics
export interface ProcessingMetrics {
  tokensProcessed: number;
  averageLatency: number;
  peakMemoryUsage: number;
  cpuUtilization: number;
  networkLatency: number;
  throughputRate: number; // tokens per second
}

// Analysis error tracking
export interface AnalysisError {
  code: string;
  message: string;
  model?: AIModelType;
  stage?: ProgressStage['stage'];
  timestamp: Date;
  recoverable: boolean;
  retryCount: number;
  context?: Record<string, unknown>;
}

// Comprehensive analysis progress state
export interface AdvancedAnalysisProgress {
  analysisId: string;
  overallProgress: number; // 0-100
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
  startTime: Date;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  
  // Model-specific progress
  modelProgress: Record<AIModelType, ModelProgressDetail>;
  
  // Stage-based progress tracking
  stages: ProgressStage[];
  currentStage?: ProgressStage['stage'];
  
  // Error and retry management
  errorDetails?: AnalysisError[];
  totalRetries: number;
  maxRetries: number;
  
  // Performance tracking
  overallMetrics?: ProcessingMetrics;
  
  // Metadata
  fileInfo: {
    name: string;
    size: number;
    type: string;
    uploadTime: Date;
  };
  
  // Configuration
  selectedModels: AIModelType[];
  
  // Real-time tracking properties
  lastUpdated: Date;
  updateFrequency: number; // updates per second
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// Enhanced interfaces for WebSocket integration
export interface AnalysisProgressEvent {
  eventType: 'progress_update' | 'stage_change' | 'error_occurred' | 'completed';
  timestamp: Date;
  analysisId: string;
  progress: number;
  currentStage?: string;
  modelUpdates?: ModelProgressUpdate[];
}

export interface ModelProgressUpdate {
  analysisId: string;
  modelId: string;
  modelType: AIModelType;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep?: string;
  estimatedTimeRemaining?: number;
  performanceMetrics?: ProcessingMetrics;
  timestamp: Date;
}

export interface ModelPerformanceMetric {
  analysisId: string;
  modelId: string;
  modelType: AIModelType;
  metrics: ProcessingMetrics;
  timestamp: Date;
  healthStatus: 'healthy' | 'warning' | 'critical';
}

export interface AnalysisCompletionEvent {
  analysisId: string;
  completedAt: Date;
  status: 'success' | 'partial' | 'failed';
  resultsCount: number;
  totalProcessingTime: number;
  successfulModels: string[];
  failedModels: string[];
  insights?: number;
}

// Additional progress tracking configuration
export interface ProgressTrackingConfig {
  analysisType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Real-time updates
  lastUpdated: Date;
  updateFrequency: number; // updates per second
}

// Progress tracking preferences
export interface ProgressTrackingPreferences {
  showDetailedMetrics: boolean;
  enableSoundNotifications: boolean;
  autoRefreshInterval: number; // in milliseconds
  progressAnimationSpeed: 'slow' | 'normal' | 'fast';
  showEstimatedTimes: boolean;
  groupByStage: boolean;
  highlightErrors: boolean;
}

// Timeline entry for progress history
export interface ProgressTimelineEntry {
  timestamp: Date;
  event: 'started' | 'stage_change' | 'model_complete' | 'error' | 'retry' | 'completed';
  model?: AIModelType;
  stage?: ProgressStage['stage'];
  message: string;
  progress: number;
  metadata?: Record<string, unknown>;
}

// Enhanced progress tracking state
export interface ProgressTrackingState {
  analyses: Map<string, AdvancedAnalysisProgress>;
  timeline: ProgressTimelineEntry[];
  preferences: ProgressTrackingPreferences;
  modelHealthCache: Map<AIModelType, ModelHealthStatus>;
  
  // Real-time connection state
  isConnected: boolean;
  lastHeartbeat?: Date;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  
  // Performance tracking
  averageCompletionTime: Record<AIModelType, number>;
  successRates: Record<AIModelType, number>;
  recentAnalysisCount: number;
}

// WebSocket events for enhanced progress tracking
export interface DetailedProgressEvent {
  analysisId: string;
  modelType: AIModelType;
  stage: ProgressStage['stage'];
  progress: number;
  estimatedTimeRemaining?: number;
  processingMetrics?: ProcessingMetrics;
  error?: AnalysisError;
  health?: ModelHealthStatus;
  timestamp: Date;
}

export interface AnalysisStageChangeEvent {
  analysisId: string;
  previousStage?: ProgressStage['stage'];
  currentStage: ProgressStage['stage'];
  stageProgress: number;
  affectedModels: AIModelType[];
  timestamp: Date;
}

export interface ModelHealthUpdateEvent {
  model: AIModelType;
  health: ModelHealthStatus;
  previousHealth?: ModelHealthStatus;
  timestamp: Date;
}

// Component prop interfaces
export interface AdvancedAnalysisProgressTrackerProps {
  analysisId: string;
  className?: string;
  showTimeline?: boolean;
  showMetrics?: boolean;
  showModelHealth?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onComplete?: (analysisId: string, results: AdvancedAnalysisProgress) => void;
  onError?: (analysisId: string, error: AnalysisError) => void;
  onStageChange?: (analysisId: string, stage: ProgressStage['stage']) => void;
}

export interface ModelPerformanceIndicatorProps {
  model: AIModelType;
  health: ModelHealthStatus;
  progress?: ModelProgressDetail;
  showMetrics?: boolean;
  showHistory?: boolean;
  className?: string;
  onClick?: (model: AIModelType) => void;
}
