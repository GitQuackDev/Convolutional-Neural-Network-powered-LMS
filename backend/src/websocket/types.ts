/**
 * WebSocket Event Types and Interfaces
 * Based on Story 1.3 requirements and database schema from Story 1.1
 */

// Real-time message events
export interface MessageEvent {
  type: 'message_sent' | 'message_edited' | 'message_deleted';
  messageId: string;
  courseId?: string;
  channelId?: string;
  senderId: string;
  content?: string;
  timestamp: Date;
}

// Notification events
export interface NotificationEvent {
  type: 'notification_new' | 'notification_read';
  notificationId: string;
  userId: string;
  notificationType: 'CNN_ANALYSIS_COMPLETE' | 'PEER_CONNECTION' | 'ASSIGNMENT_DUE' | 'NEW_MESSAGE' | 'SYSTEM_UPDATE';
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

// Analytics and progress events
export interface ProgressEvent {
  type: 'analysis_progress' | 'analysis_complete' | 'session_update';
  userId: string;
  analysisId?: string;
  progress?: number;
  modelType?: string | undefined;
  status?: string | undefined;
  data: Record<string, any>;
}

// Collaboration annotation events
export interface AnnotationEvent {
  type: 'annotation_created' | 'annotation_updated' | 'annotation_deleted' | 'annotation_resolved';
  annotationId: string;
  contentId: string;
  contentType: string;
  authorId: string;
  courseId?: string;
  text?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    page?: number;
  };
  annotationType: 'COMMENT' | 'QUESTION' | 'SUGGESTION' | 'HIGHLIGHT' | 'DRAWING' | 'BOOKMARK';
  visibility: 'PRIVATE' | 'COURSE' | 'INSTRUCTORS' | 'STUDY_GROUP' | 'PUBLIC';
  isResolved?: boolean;
  timestamp: Date;
}

// WebSocket connection authentication data
export interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: 'STUDENT' | 'PROFESSOR' | 'ADMIN';
  courseIds: string[];
}

// WebSocket server events
export type ServerToClientEvents = {
  message: (data: MessageEvent) => void;
  notification: (data: NotificationEvent) => void;
  progress: (data: ProgressEvent) => void;
  annotation: (data: AnnotationEvent) => void;
  error: (message: string) => void;
  connected: (data: { userId: string; timestamp: Date }) => void;
  disconnected: (data: { userId: string; timestamp: Date }) => void;
};

// Client to server events
export type ClientToServerEvents = {
  join_room: (room: string) => void;
  leave_room: (room: string) => void;
  send_message: (data: Omit<MessageEvent, 'messageId' | 'timestamp'>) => void;
  mark_notification_read: (notificationId: string) => void;
  join_content: (data: { contentId: string; contentType: string }) => void;
  leave_content: (data: { contentId: string; contentType: string }) => void;
  create_annotation: (data: Omit<AnnotationEvent, 'annotationId' | 'timestamp'>) => void;
  update_annotation: (data: { annotationId: string; text: string }) => void;
  delete_annotation: (annotationId: string) => void;
  resolve_annotation: (annotationId: string) => void;
  heartbeat: () => void;
};

// Inter-server events (for scaling)
export type InterServerEvents = {
  ping: () => void;
};

// Socket data
export type SocketData = {
  userId: string;
  userRole: 'STUDENT' | 'PROFESSOR' | 'ADMIN';
  courseIds: string[];
};

import { Socket } from 'socket.io';
