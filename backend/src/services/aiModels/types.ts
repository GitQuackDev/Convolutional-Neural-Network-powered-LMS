/**
 * Type definitions for AI Model Service Infrastructure
 * Story 1.2: AI Model Service Infrastructure
 */

// Core AI Service Types
export type AIServiceType = 'gpt4' | 'claude' | 'gemini' | 'cnn' | 'openrouter';

export interface AIServiceConfig {
  type?: AIServiceType;
  serviceName?: string;
  apiKey: string;
  endpoint?: string;
  maxRetries?: number;
  timeout?: number;
  maxContentLength?: number;
  models?: string[];
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  circuitBreaker?: {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
  };
}

export interface AIServiceMetrics {
  serviceName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: Date | null;
  isHealthy: boolean;
  circuitBreakerState?: 'closed' | 'open' | 'half-open';
}

export interface AIServiceInfo {
  name: string;
  type: AIServiceType;
  version: string;
  description: string;
  capabilities: string[];
  status: 'available' | 'unavailable' | 'degraded';
  lastHealthCheck: Date;
}

export interface AIAnalysisResponse {
  success: boolean;
  content: string;
  confidence: number;
  processingTime: number;
  metadata: {
    serviceName: string;
    model: string;
    tokens?: {
      input: number;
      output: number;
    };
    reasoning?: string;
    suggestions?: string[];
    categories?: string[];
    sentimentScore?: number;
    complexity?: 'low' | 'medium' | 'high';
  };
  error?: string;
}

// Progress callback for long-running analysis
export type ProgressCallback = (progress: {
  stage: string;
  percentage: number;
  message: string;
}) => void;

// Multi-service analysis request
export interface MultiAIAnalysisRequest {
  content: string;
  contentType: string;
  services: AIServiceType[];
  options?: {
    requireConsensus?: boolean;
    confidenceThreshold?: number;
    maxParallelRequests?: number;
    progressCallback?: ProgressCallback;
  };
}

export interface MultiAIAnalysisResponse {
  success: boolean;
  results: Map<AIServiceType, AIAnalysisResponse>;
  consensus?: {
    agreed: boolean;
    confidence: number;
    summary: string;
  };
  processingTime: number;
  metadata: {
    servicesUsed: AIServiceType[];
    failedServices: AIServiceType[];
    bestResult?: AIServiceType;
  };
}

// Configuration for AI service manager
export interface AIServiceManagerConfig {
  services: AIServiceConfig[];
  defaultService: AIServiceType;
  fallbackChain: AIServiceType[];
  globalSettings: {
    defaultTimeout: number;
    maxConcurrentRequests: number;
    enableCircuitBreaker: boolean;
    enableRetries: boolean;
    enableMetrics: boolean;
  };
}
