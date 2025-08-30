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
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface AnalysisSection {
  id: string;
  title: string;
  data: ObjectDetection[] | Categorization[] | HardwareIdentification[] | WikipediaArticle[];
  expanded: boolean;
}