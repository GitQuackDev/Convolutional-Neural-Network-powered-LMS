/**
 * Collaboration WebSocket Service
 * Handles real-time collaboration, annotations, and document editing
 */

import io from 'socket.io-client';
import { authStorage } from '@/utils/authStorage';

export interface Annotation {
  id: string;
  contentId: string;
  contentType: 'document' | 'video' | 'image' | 'code';
  authorId: string;
  authorName: string;
  text: string;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    page?: number;
    timestamp?: number; // for video annotations
  };
  annotationType: 'comment' | 'highlight' | 'question' | 'suggestion' | 'correction';
  visibility: 'public' | 'private' | 'course' | 'group';
  courseId?: string;
  groupId?: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  replies?: AnnotationReply[];
  reactions?: { emoji: string; users: string[] }[];
}

export interface AnnotationReply {
  id: string;
  annotationId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CollaborativeSession {
  id: string;
  contentId: string;
  contentType: string;
  participants: SessionParticipant[];
  createdAt: string;
  isActive: boolean;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canResolve: boolean;
  };
}

export interface SessionParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  joinedAt: string;
  isActive: boolean;
  cursor?: {
    x: number;
    y: number;
    color: string;
  };
  selection?: {
    start: number;
    end: number;
    text: string;
  };
}

export interface DocumentEdit {
  id: string;
  sessionId: string;
  authorId: string;
  authorName: string;
  operation: 'insert' | 'delete' | 'replace';
  position: {
    start: number;
    end: number;
  };
  content: string;
  timestamp: string;
  version: number;
}

export interface CursorUpdate {
  userId: string;
  userName: string;
  sessionId: string;
  position: {
    x: number;
    y: number;
  };
  color: string;
  timestamp: string;
}

interface CollaborationWebSocketEvents {
  'annotation_created': (data: Annotation) => void;
  'annotation_updated': (data: Annotation) => void;
  'annotation_deleted': (data: { annotationId: string; contentId: string }) => void;
  'annotation_resolved': (data: { annotationId: string; resolvedBy: string; resolvedAt: string }) => void;
  'annotation_reply': (data: AnnotationReply) => void;
  'session_started': (data: CollaborativeSession) => void;
  'session_ended': (data: { sessionId: string }) => void;
  'user_joined_session': (data: { sessionId: string; participant: SessionParticipant }) => void;
  'user_left_session': (data: { sessionId: string; userId: string }) => void;
  'document_edit': (data: DocumentEdit) => void;
  'cursor_update': (data: CursorUpdate) => void;
  'selection_update': (data: { userId: string; sessionId: string; selection: SessionParticipant['selection'] }) => void;
  'conflict_detected': (data: { sessionId: string; conflicts: DocumentEdit[] }) => void;
  'sync_required': (data: { sessionId: string; version: number }) => void;
  'connect': () => void;
  'disconnect': () => void;
  'connect_error': (error: Error) => void;
  'reconnect': (attemptNumber: number) => void;
}

class CollaborationWebSocketService {
  private socket: ReturnType<typeof io> | null = null;
  private isConnected = false;
  private activeSessions = new Set<string>();
  private cursorUpdateTimeout: NodeJS.Timeout | null = null;
  private eventSubscriptions = new Map<string, Set<(...args: unknown[]) => void>>();

  /**
   * Connect to the collaboration WebSocket namespace
   */
  connect(userId: string, authToken?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = authToken || authStorage.getToken();
        
        if (!token) {
          reject(new Error('No authentication token available'));
          return;
        }

        // Close existing connection if any
        if (this.socket) {
          this.disconnect();
        }

        // Create new connection to collaboration namespace
        this.socket = io('/collaboration', {
          auth: {
            token,
            userId
          },
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000
        });

        // Connection event handlers
        this.socket.on('connect', () => {
          console.log('[CollaborationWebSocket] Connected to collaboration namespace');
          this.isConnected = true;
          resolve();
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('[CollaborationWebSocket] Disconnected:', reason);
          this.isConnected = false;
          this.activeSessions.clear();
        });

        this.socket.on('connect_error', (error: Error) => {
          console.error('[CollaborationWebSocket] Connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on('reconnect', (attemptNumber: number) => {
          console.log(`[CollaborationWebSocket] Reconnected after ${attemptNumber} attempts`);
          this.isConnected = true;
          
          // Rejoin active sessions after reconnection
          this.activeSessions.forEach(sessionId => {
            this.joinSession(sessionId);
          });
        });

      } catch (error) {
        console.error('[CollaborationWebSocket] Connection setup error:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the collaboration WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[CollaborationWebSocket] Disconnecting...');
      
      // Leave all active sessions
      this.activeSessions.forEach(sessionId => {
        this.leaveSession(sessionId);
      });

      // Clear cursor update timeout
      if (this.cursorUpdateTimeout) {
        clearTimeout(this.cursorUpdateTimeout);
        this.cursorUpdateTimeout = null;
      }

      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.activeSessions.clear();
      this.eventSubscriptions.clear();
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { isConnected: boolean; activeSessions: string[] } {
    return {
      isConnected: this.isConnected,
      activeSessions: Array.from(this.activeSessions)
    };
  }

  /**
   * Join a collaborative session
   */
  joinSession(sessionId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_session', { sessionId });
      this.activeSessions.add(sessionId);
      console.log(`[CollaborationWebSocket] Joined session: ${sessionId}`);
    } else {
      console.warn('[CollaborationWebSocket] Cannot join session - not connected');
    }
  }

  /**
   * Leave a collaborative session
   */
  leaveSession(sessionId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_session', { sessionId });
      this.activeSessions.delete(sessionId);
      console.log(`[CollaborationWebSocket] Left session: ${sessionId}`);
    } else {
      console.warn('[CollaborationWebSocket] Cannot leave session - not connected');
    }
  }

  /**
   * Create a new annotation
   */
  createAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt' | 'isResolved'>): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('create_annotation', {
        ...annotation,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('[CollaborationWebSocket] Cannot create annotation - not connected');
    }
  }

  /**
   * Update an existing annotation
   */
  updateAnnotation(annotationId: string, updates: Partial<Pick<Annotation, 'text' | 'annotationType' | 'visibility'>>): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('update_annotation', {
        annotationId,
        updates,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('[CollaborationWebSocket] Cannot update annotation - not connected');
    }
  }

  /**
   * Delete an annotation
   */
  deleteAnnotation(annotationId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('delete_annotation', { annotationId });
    } else {
      console.warn('[CollaborationWebSocket] Cannot delete annotation - not connected');
    }
  }

  /**
   * Resolve an annotation
   */
  resolveAnnotation(annotationId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('resolve_annotation', { annotationId });
    } else {
      console.warn('[CollaborationWebSocket] Cannot resolve annotation - not connected');
    }
  }

  /**
   * Reply to an annotation
   */
  replyToAnnotation(annotationId: string, text: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('annotation_reply', {
        annotationId,
        text,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('[CollaborationWebSocket] Cannot reply to annotation - not connected');
    }
  }

  /**
   * Update cursor position (throttled)
   */
  updateCursor(sessionId: string, position: { x: number; y: number }, color: string): void {
    if (this.socket && this.isConnected) {
      // Throttle cursor updates to prevent flooding
      if (this.cursorUpdateTimeout) {
        clearTimeout(this.cursorUpdateTimeout);
      }

      this.cursorUpdateTimeout = setTimeout(() => {
        if (this.socket && this.isConnected) {
          this.socket.emit('cursor_update', {
            sessionId,
            position,
            color,
            timestamp: new Date().toISOString()
          });
        }
      }, 50); // 50ms throttle
    }
  }

  /**
   * Update text selection
   */
  updateSelection(sessionId: string, selection: SessionParticipant['selection']): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('selection_update', {
        sessionId,
        selection,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('[CollaborationWebSocket] Cannot update selection - not connected');
    }
  }

  /**
   * Apply document edit
   */
  applyEdit(sessionId: string, edit: Omit<DocumentEdit, 'id' | 'timestamp' | 'version'>): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('document_edit', {
        ...edit,
        sessionId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('[CollaborationWebSocket] Cannot apply edit - not connected');
    }
  }

  /**
   * Request document synchronization
   */
  requestSync(sessionId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('request_sync', { sessionId });
    } else {
      console.warn('[CollaborationWebSocket] Cannot request sync - not connected');
    }
  }

  /**
   * Subscribe to annotation events
   */
  subscribeToAnnotations(
    callbacks: {
      onCreated: (annotation: Annotation) => void;
      onUpdated: (annotation: Annotation) => void;
      onDeleted: (data: { annotationId: string; contentId: string }) => void;
      onResolved: (data: { annotationId: string; resolvedBy: string; resolvedAt: string }) => void;
      onReply: (reply: AnnotationReply) => void;
    }
  ): () => void {
    const unsubscribeFunctions = [
      this.subscribe('annotation_created', callbacks.onCreated),
      this.subscribe('annotation_updated', callbacks.onUpdated),
      this.subscribe('annotation_deleted', callbacks.onDeleted),
      this.subscribe('annotation_resolved', callbacks.onResolved),
      this.subscribe('annotation_reply', callbacks.onReply)
    ];

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Subscribe to collaboration session events
   */
  subscribeToSessions(
    callbacks: {
      onSessionStarted: (session: CollaborativeSession) => void;
      onSessionEnded: (data: { sessionId: string }) => void;
      onUserJoined: (data: { sessionId: string; participant: SessionParticipant }) => void;
      onUserLeft: (data: { sessionId: string; userId: string }) => void;
    }
  ): () => void {
    const unsubscribeFunctions = [
      this.subscribe('session_started', callbacks.onSessionStarted),
      this.subscribe('session_ended', callbacks.onSessionEnded),
      this.subscribe('user_joined_session', callbacks.onUserJoined),
      this.subscribe('user_left_session', callbacks.onUserLeft)
    ];

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Subscribe to document editing events
   */
  subscribeToDocumentEditing(
    callbacks: {
      onEdit: (edit: DocumentEdit) => void;
      onCursorUpdate: (cursor: CursorUpdate) => void;
      onSelectionUpdate: (data: { userId: string; sessionId: string; selection: SessionParticipant['selection'] }) => void;
      onConflict: (data: { sessionId: string; conflicts: DocumentEdit[] }) => void;
      onSyncRequired: (data: { sessionId: string; version: number }) => void;
    }
  ): () => void {
    const unsubscribeFunctions = [
      this.subscribe('document_edit', callbacks.onEdit),
      this.subscribe('cursor_update', callbacks.onCursorUpdate),
      this.subscribe('selection_update', callbacks.onSelectionUpdate),
      this.subscribe('conflict_detected', callbacks.onConflict),
      this.subscribe('sync_required', callbacks.onSyncRequired)
    ];

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Get annotations for content
   */
  getAnnotations(contentId: string, filters?: {
    authorId?: string;
    annotationType?: Annotation['annotationType'];
    visibility?: Annotation['visibility'];
    resolved?: boolean;
  }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('get_annotations', { contentId, filters });
    } else {
      console.warn('[CollaborationWebSocket] Cannot get annotations - not connected');
    }
  }

  /**
   * Generic event subscription handler
   */
  private subscribe<K extends keyof CollaborationWebSocketEvents>(
    event: K,
    callback: CollaborationWebSocketEvents[K]
  ): () => void {
    if (!this.socket) {
      console.warn(`[CollaborationWebSocket] Cannot subscribe to ${event} - not connected`);
      return () => {};
    }

    // Add callback to subscriptions map for cleanup tracking
    if (!this.eventSubscriptions.has(event)) {
      this.eventSubscriptions.set(event, new Set());
    }
    this.eventSubscriptions.get(event)!.add(callback as (...args: unknown[]) => void);

    // Subscribe to socket event
    this.socket.on(event, callback);

    // Return unsubscribe function
    return () => {
      if (this.socket) {
        this.socket.off(event, callback);
      }
      const subscriptions = this.eventSubscriptions.get(event);
      if (subscriptions) {
        subscriptions.delete(callback as (...args: unknown[]) => void);
      }
    };
  }

  /**
   * Emit collaboration event to server
   */
  emit(event: string, data: unknown): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`[CollaborationWebSocket] Cannot emit ${event} - not connected`);
    }
  }
}

// Export singleton instance
export const collaborationWebSocket = new CollaborationWebSocketService();
