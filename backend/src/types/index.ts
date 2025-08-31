import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// User Types
export interface IUser {
  _id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  googleId?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  STUDENT = 'student',
  PROFESSOR = 'professor',
  ADMIN = 'admin',
  COMMUNITY_MODERATOR = 'community_moderator',
  REGULAR_MODERATOR = 'regular_moderator'
}

// Course Types
export interface ICourse {
  _id?: string;
  title: string;
  description: string;
  instructor: string; // User ID
  syllabus?: string;
  modules: ICourseModule[];
  enrolledStudents: string[]; // User IDs
  settings: ICourseSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourseModule {
  _id?: string;
  title: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  steps: ICourseStep[];
  isLocked: boolean;
  unlockConditions?: string[];
}

export interface ICourseStep {
  _id?: string;
  title: string;
  type: 'content' | 'video' | 'upload' | 'quiz' | 'assignment';
  content?: string;
  estimatedTime: number;
  order: number;
  isRequired: boolean;
  cnnAnalysisEnabled: boolean;
  uploadRequirements?: string[];
}

export interface ICourseSettings {
  isPublic: boolean;
  allowSelfEnrollment: boolean;
  maxStudents?: number;
  startDate?: Date;
  endDate?: Date;
}

// Assignment Types
export interface IAssignment {
  _id?: string;
  title: string;
  description: string;
  courseId: string;
  moduleId?: string;
  stepId?: string;
  requirements: IAssignmentRequirement[];
  dueDate: Date;
  pointsWorth: number;
  allowedAttempts: number;
  acceptedFileTypes: string[];
  rubric?: IRubric;
  submissions: IAssignmentSubmission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignmentRequirement {
  _id?: string;
  description: string;
  required: boolean;
  points: number;
}

export interface IAssignmentSubmission {
  _id?: string;
  studentId: string;
  assignmentId: string;
  files: ISubmissionFile[];
  textContent?: string;
  cnnAnalysis?: ICNNAnalysisResult[];
  grade?: IAssignmentGrade;
  attemptNumber: number;
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
}

export interface ISubmissionFile {
  _id?: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

// Grading Types
export interface IRubric {
  _id?: string;
  name: string;
  criteria: IRubricCriteria[];
  totalPoints: number;
}

export interface IRubricCriteria {
  _id?: string;
  name: string;
  description: string;
  levels: IRubricLevel[];
}

export interface IRubricLevel {
  _id?: string;
  name: string;
  description: string;
  points: number;
}

export interface IAssignmentGrade {
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  letterGrade?: string;
  feedback: string;
  rubricScores?: IRubricScore[];
  gradedBy: string; // User ID
  gradedAt: Date;
}

export interface IRubricScore {
  criteriaId: string;
  levelId: string;
  points: number;
  feedback?: string;
}

// CNN Analysis Types
export interface ICNNAnalysisResult {
  _id?: string;
  fileId: string;
  fileName: string;
  analysis: {
    objectDetection: IObjectDetection[];
    categorization: ICategorization[];
    hardwareIdentification: IHardwareIdentification[];
    confidence: number;
  };
  wikipediaInfo?: IWikipediaInfo;
  processedAt: Date;
  processingTime: number;
}

export interface IObjectDetection {
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ICategorization {
  category: string;
  subcategories: string[];
  confidence: number;
}

export interface IHardwareIdentification {
  deviceType: string;
  model?: string;
  manufacturer?: string;
  specifications?: Record<string, any>;
  confidence: number;
}

export interface IWikipediaInfo {
  title: string;
  summary: string;
  url: string;
  images?: string[];
  relatedTopics: string[];
}

// Discussion Types
export interface IDiscussion {
  _id?: string;
  title: string;
  content: string;
  author: string; // User ID
  courseId?: string;
  tags: string[];
  isAnonymous: boolean;
  replies: IDiscussionReply[];
  upvotes: string[]; // User IDs
  downvotes: string[]; // User IDs
  isPinned: boolean;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDiscussionReply {
  _id?: string;
  content: string;
  author: string; // User ID
  isAnonymous: boolean;
  upvotes: string[]; // User IDs
  downvotes: string[]; // User IDs
  createdAt: Date;
}

// Auth Types
export interface IAuthRequest extends Request {
  user?: IUser;
}

export interface IJWTPayload extends JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface ILoginResponse {
  user: Omit<IUser, 'password'>;
  accessToken: string;
  refreshToken: string;
}

// API Response Types
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// File Upload Types
export interface IFileUploadConfig {
  maxSize: number;
  allowedTypes: string[];
  destination: string;
}

// Service Types
export interface ICNNService {
  analyzeImage: (filePath: string) => Promise<ICNNAnalysisResult>;
  getWikipediaInfo: (query: string) => Promise<IWikipediaInfo | null>;
}

export interface IEmailService {
  sendPasswordResetEmail: (email: string, token: string) => Promise<void>;
  sendWelcomeEmail: (email: string, name: string) => Promise<void>;
  sendAssignmentNotification: (email: string, assignment: IAssignment) => Promise<void>;
}
