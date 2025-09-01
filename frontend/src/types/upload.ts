export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface ObjectDetection {
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Categorization {
  category: string;
  confidence: number;
  subcategories: string[];
}

export interface HardwareIdentification {
  component: string;
  specifications: Record<string, string | number>;
  compatibility: string[];
}

export interface WikipediaArticle {
  title: string;
  excerpt: string;
  url: string;
  relevanceScore: number;
}

export interface CNNAnalysisResult {
  uploadId: string;
  status: 'processing' | 'completed' | 'error';
  analysis: {
    objectDetection: ObjectDetection[];
    categorization: Categorization[];
    hardwareIdentification: HardwareIdentification[];
    wikipediaData: {
      articles: WikipediaArticle[];
    };
  };
  processingTime: number;
  timestamp: string;
}

// New AI Model Types
export type AIModelType = 'gpt4' | 'claude' | 'gemini';
export type AnalysisModelType = 'cnn' | AIModelType;

export interface AIAnalysisResult {
  model: AIModelType;
  status: 'processing' | 'completed' | 'error';
  confidence: number;
  analysisType: 'content_analysis' | 'object_detection' | 'text_extraction';
  results: {
    description: string;
    insights: string[];
    entities: EntityExtraction[];
    recommendations: string[];
  };
  processingTime: number;
  timestamp: Date;
}

export interface EntityExtraction {
  entity: string;
  type: 'person' | 'organization' | 'location' | 'technology' | 'concept';
  confidence: number;
  context: string;
}

export interface ConsolidatedInsights {
  summary: string;
  commonFindings: string[];
  conflictingAnalyses: ConflictAnalysis[];
  confidenceScore: number;
  recommendedActions: string[];
}

export interface ConflictAnalysis {
  finding: string;
  models: AIModelType[];
  confidence: Record<AIModelType, number>;
  resolution: string;
}

export interface MultiAnalysisResult {
  uploadId: string;
  cnnResults?: CNNAnalysisResult;
  aiResults?: Record<AIModelType, AIAnalysisResult>;
  consolidatedInsights?: ConsolidatedInsights;
  overallStatus: 'processing' | 'completed' | 'error';
  timestamp: string;
}

export interface MultiAnalysisProgress {
  uploadId: string;
  overallProgress: number;
  modelProgress: Record<AnalysisModelType, {
    progress: number;
    status: 'pending' | 'processing' | 'completed' | 'error';
    estimatedCompletion?: Date;
  }>;
}

export interface AIModelInfo {
  id: AIModelType;
  name: string;
  description: string;
  estimatedTime: string;
  capabilities: string[];
  icon: string;
  provider?: string;
  cost?: 'FREE' | 'Premium';
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ContentUploadProps {
  courseId: string;
  assignmentId?: string;
  onUploadComplete: (result: CNNAnalysisResult) => void;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  aiModelsEnabled?: boolean;
  defaultModels?: AnalysisModelType[];
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface AnalysisSection {
  id: string;
  title: string;
  data: ObjectDetection[] | Categorization[] | HardwareIdentification[] | WikipediaArticle[];
  expanded: boolean;
}