// Student Dashboard Types
export interface CourseProgress {
  id: string;
  name: string;
  completion: number; // 0-1
  modulesCompleted: number;
  totalModules: number;
  nextDeadline?: string;
  color: 'green' | 'yellow' | 'red';
}

export interface Assignment {
  id: string;
  title: string;
  courseName: string;
  dueDate: string;
  status: 'not_started' | 'in_progress' | 'ready_to_submit' | 'submitted';
  progress: number; // 0-1
  urgency: 'overdue' | 'due_today' | 'due_week' | 'future';
}

export interface CNNAnalysisResult {
  id: string;
  fileName: string;
  confidence: number;
  insights: string[];
  timestamp: string;
  thumbnail?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  color: string;
}

// Course Module Types
export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  instructor: string;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  estimatedHours: number;
  modules: CourseModule[];
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
  isCompleted: boolean;
  isLocked: boolean;
  steps: CourseStep[];
  estimatedMinutes: number;
  completion: number; // 0-1
  isExpanded?: boolean;
}

export interface CourseStep {
  id: string;
  title: string;
  type: 'content' | 'video' | 'upload' | 'quiz' | 'assignment';
  estimatedTime: number; // minutes
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  content?: string;
  cnnAnalysisEnabled?: boolean;
}

export interface CourseData {
  id: string;
  title: string;
  description: string;
  modules: CourseModule[];
  overallProgress: number;
}

// Assignment Types
export interface AssignmentRequirement {
  id: string;
  description: string;
  required: boolean;
  met?: boolean;
  feedback?: string;
}

export interface AssignmentData {
  id: string;
  title: string;
  courseName: string;
  description: string;
  requirements: AssignmentRequirement[];
  dueDate: string;
  pointsWorth: number;
  allowedAttempts: number;
  acceptedFileTypes: string[];
  rubric?: RubricCriteria[];
}

export interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  id: string;
  name: string;
  description: string;
  points: number;
}

export interface SubmissionHistory {
  id: string;
  attemptNumber: number;
  submittedAt: string;
  files: SubmissionFile[];
  grade?: number;
  feedback?: string;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
}

export interface SubmissionFile {
  id: string;
  fileName: string;
  uploadedAt: string;
  cnnAnalysis?: CNNAnalysisResult;
  version: number;
}
