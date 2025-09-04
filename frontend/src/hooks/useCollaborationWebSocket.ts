/**
 * Collaboration WebSocket React Hook
 * Provides React integration for real-time collaboration features
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { collaborationWebSocket } from '@/services/websocket/collaborationWebSocket';
import type { 
  Annotation, 
  AnnotationReply, 
  CollaborativeSession, 
  SessionParticipant, 
  DocumentEdit, 
  CursorUpdate 
} from '@/services/websocket/collaborationWebSocket';

interface UseCollaborationWebSocketState {
  isConnected: boolean;
  activeSessions: CollaborativeSession[];
  currentSession: CollaborativeSession | null;
  annotations: Annotation[];
  cursors: Map<string, CursorUpdate>;
  participants: SessionParticipant[];
  documentEdits: DocumentEdit[];
  connectionError: string | null;
  isLoading: boolean;
  conflicts: DocumentEdit[];
  syncVersion: number;
}

interface UseCollaborationWebSocketActions {
  // Connection management
  connect: (userId: string) => Promise<void>;
  disconnect: () => void;
  
  // Session management
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  setCurrentSession: (session: CollaborativeSession | null) => void;
  
  // Annotation management
  createAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt' | 'isResolved'>) => void;
  updateAnnotation: (annotationId: string, updates: Partial<Pick<Annotation, 'text' | 'annotationType' | 'visibility'>>) => void;
  deleteAnnotation: (annotationId: string) => void;
  resolveAnnotation: (annotationId: string) => void;
  replyToAnnotation: (annotationId: string, text: string) => void;
  getAnnotations: (contentId: string, filters?: {
    authorId?: string;
    annotationType?: Annotation['annotationType'];
    visibility?: Annotation['visibility'];
    resolved?: boolean;
  }) => void;
  
  // Document editing
  applyEdit: (sessionId: string, edit: Omit<DocumentEdit, 'id' | 'timestamp' | 'version'>) => void;
  updateCursor: (sessionId: string, position: { x: number; y: number }, color: string) => void;
  updateSelection: (sessionId: string, selection: SessionParticipant['selection']) => void;
  requestSync: (sessionId: string) => void;
  
  // Utilities
  clearError: () => void;
  clearConflicts: () => void;
  getParticipantCursor: (userId: string) => CursorUpdate | undefined;
  isUserTyping: (userId: string) => boolean;
}

interface UseCollaborationWebSocketOptions {
  autoConnect?: boolean;
  userId?: string;
  enableCursorTracking?: boolean;
  enableConflictDetection?: boolean;
  maxAnnotations?: number;
  maxEdits?: number;
}

export function useCollaborationWebSocket(options: UseCollaborationWebSocketOptions = {}): [UseCollaborationWebSocketState, UseCollaborationWebSocketActions] {
  const {
    autoConnect = true,
    userId,
    enableCursorTracking = true,
    enableConflictDetection = true,
    maxAnnotations = 500,
    maxEdits = 100
  } = options;

  // State management
  const [state, setState] = useState<UseCollaborationWebSocketState>({
    isConnected: false,
    activeSessions: [],
    currentSession: null,
    annotations: [],
    cursors: new Map(),
    participants: [],
    documentEdits: [],
    connectionError: null,
    isLoading: false,
    conflicts: [],
    syncVersion: 0
  });

  // Refs for stable references
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorCleanupTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Connection management
  const connect = useCallback(async (connectUserId?: string): Promise<void> => {
    const targetUserId = connectUserId || userId;
    if (!targetUserId) {
      setState(prev => ({ ...prev, connectionError: 'User ID is required' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, connectionError: null, isLoading: true }));
      await collaborationWebSocket.connect(targetUserId);

      // Subscribe to collaboration events
      const annotationUnsubscribe = collaborationWebSocket.subscribeToAnnotations({
        onCreated: (annotation: Annotation) => {
          setState(prev => ({
            ...prev,
            annotations: [annotation, ...prev.annotations].slice(0, maxAnnotations)
          }));
        },

        onUpdated: (annotation: Annotation) => {
          setState(prev => ({
            ...prev,
            annotations: prev.annotations.map(a => a.id === annotation.id ? annotation : a)
          }));
        },

        onDeleted: (data: { annotationId: string; contentId: string }) => {
          setState(prev => ({
            ...prev,
            annotations: prev.annotations.filter(a => a.id !== data.annotationId)
          }));
        },

        onResolved: (data: { annotationId: string; resolvedBy: string; resolvedAt: string }) => {
          setState(prev => ({
            ...prev,
            annotations: prev.annotations.map(a => 
              a.id === data.annotationId 
                ? { ...a, isResolved: true, resolvedBy: data.resolvedBy, resolvedAt: data.resolvedAt }
                : a
            )
          }));
        },

        onReply: (reply: AnnotationReply) => {
          setState(prev => ({
            ...prev,
            annotations: prev.annotations.map(a => 
              a.id === reply.annotationId 
                ? { ...a, replies: [...(a.replies || []), reply] }
                : a
            )
          }));
        }
      });

      const sessionUnsubscribe = collaborationWebSocket.subscribeToSessions({
        onSessionStarted: (session: CollaborativeSession) => {
          setState(prev => ({
            ...prev,
            activeSessions: [...prev.activeSessions.filter(s => s.id !== session.id), session]
          }));
        },

        onSessionEnded: (data: { sessionId: string }) => {
          setState(prev => ({
            ...prev,
            activeSessions: prev.activeSessions.filter(s => s.id !== data.sessionId),
            currentSession: prev.currentSession?.id === data.sessionId ? null : prev.currentSession
          }));
        },

        onUserJoined: (data: { sessionId: string; participant: SessionParticipant }) => {
          setState(prev => ({
            ...prev,
            participants: prev.currentSession?.id === data.sessionId 
              ? [...prev.participants.filter(p => p.userId !== data.participant.userId), data.participant]
              : prev.participants,
            activeSessions: prev.activeSessions.map(s => 
              s.id === data.sessionId 
                ? { ...s, participants: [...s.participants.filter(p => p.userId !== data.participant.userId), data.participant] }
                : s
            )
          }));
        },

        onUserLeft: (data: { sessionId: string; userId: string }) => {
          setState(prev => ({
            ...prev,
            participants: prev.currentSession?.id === data.sessionId 
              ? prev.participants.filter(p => p.userId !== data.userId)
              : prev.participants,
            activeSessions: prev.activeSessions.map(s => 
              s.id === data.sessionId 
                ? { ...s, participants: s.participants.filter(p => p.userId !== data.userId) }
                : s
            )
          }));

          // Clean up cursor for departed user
          if (enableCursorTracking) {
            setState(prev => {
              const newCursors = new Map(prev.cursors);
              newCursors.delete(data.userId);
              return { ...prev, cursors: newCursors };
            });
          }
        }
      });

      const editingUnsubscribe = collaborationWebSocket.subscribeToDocumentEditing({
        onEdit: (edit: DocumentEdit) => {
          setState(prev => ({
            ...prev,
            documentEdits: [edit, ...prev.documentEdits].slice(0, maxEdits),
            syncVersion: Math.max(prev.syncVersion, edit.version)
          }));
        },

        onCursorUpdate: (cursor: CursorUpdate) => {
          if (enableCursorTracking) {
            setState(prev => {
              const newCursors = new Map(prev.cursors);
              newCursors.set(cursor.userId, cursor);
              return { ...prev, cursors: newCursors };
            });

            // Auto-remove cursor after inactivity
            const existingTimeout = cursorCleanupTimeoutRef.current.get(cursor.userId);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }

            const timeout = setTimeout(() => {
              setState(prev => {
                const newCursors = new Map(prev.cursors);
                newCursors.delete(cursor.userId);
                return { ...prev, cursors: newCursors };
              });
              cursorCleanupTimeoutRef.current.delete(cursor.userId);
            }, 10000); // Remove cursor after 10 seconds of inactivity

            cursorCleanupTimeoutRef.current.set(cursor.userId, timeout);
          }
        },

        onSelectionUpdate: (data: { userId: string; sessionId: string; selection: SessionParticipant['selection'] }) => {
          setState(prev => ({
            ...prev,
            participants: prev.participants.map(p => 
              p.userId === data.userId ? { ...p, selection: data.selection } : p
            )
          }));
        },

        onConflict: (data: { sessionId: string; conflicts: DocumentEdit[] }) => {
          if (enableConflictDetection) {
            setState(prev => ({
              ...prev,
              conflicts: [...prev.conflicts, ...data.conflicts]
            }));
          }
        },

        onSyncRequired: (data: { sessionId: string; version: number }) => {
          setState(prev => ({
            ...prev,
            syncVersion: data.version
          }));
        }
      });

      // Combine all unsubscribe functions
      unsubscribeRef.current = () => {
        annotationUnsubscribe();
        sessionUnsubscribe();
        editingUnsubscribe();
      };

      setState(prev => ({ ...prev, isConnected: true, connectionError: null, isLoading: false }));

    } catch (error) {
      console.error('[useCollaborationWebSocket] Connection error:', error);
      setState(prev => ({ 
        ...prev, 
        connectionError: error instanceof Error ? error.message : 'Connection failed',
        isConnected: false,
        isLoading: false
      }));

      // Schedule reconnection attempt
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        if (autoConnect) {
          connect(targetUserId);
        }
      }, 5000);
    }
  }, [userId, enableCursorTracking, enableConflictDetection, maxAnnotations, maxEdits, autoConnect]);

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Clear timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    cursorCleanupTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    cursorCleanupTimeoutRef.current.clear();

    collaborationWebSocket.disconnect();

    setState({
      isConnected: false,
      activeSessions: [],
      currentSession: null,
      annotations: [],
      cursors: new Map(),
      participants: [],
      documentEdits: [],
      connectionError: null,
      isLoading: false,
      conflicts: [],
      syncVersion: 0
    });
  }, []);

  // Session management actions
  const joinSession = useCallback((sessionId: string) => {
    collaborationWebSocket.joinSession(sessionId);
  }, []);

  const leaveSession = useCallback((sessionId: string) => {
    collaborationWebSocket.leaveSession(sessionId);
  }, []);

  const setCurrentSession = useCallback((session: CollaborativeSession | null) => {
    setState(prev => {
      if (session) {
        return {
          ...prev,
          currentSession: session,
          participants: session.participants,
          // Clear previous session data
          annotations: [],
          documentEdits: [],
          conflicts: [],
          cursors: new Map(),
          syncVersion: 0
        };
      } else {
        return {
          ...prev,
          currentSession: null,
          participants: [],
          annotations: [],
          documentEdits: [],
          conflicts: [],
          cursors: new Map(),
          syncVersion: 0
        };
      }
    });
  }, []);

  // Annotation management actions
  const createAnnotation = useCallback((annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt' | 'isResolved'>) => {
    collaborationWebSocket.createAnnotation(annotation);
  }, []);

  const updateAnnotation = useCallback((annotationId: string, updates: Partial<Pick<Annotation, 'text' | 'annotationType' | 'visibility'>>) => {
    collaborationWebSocket.updateAnnotation(annotationId, updates);
  }, []);

  const deleteAnnotation = useCallback((annotationId: string) => {
    collaborationWebSocket.deleteAnnotation(annotationId);
  }, []);

  const resolveAnnotation = useCallback((annotationId: string) => {
    collaborationWebSocket.resolveAnnotation(annotationId);
  }, []);

  const replyToAnnotation = useCallback((annotationId: string, text: string) => {
    collaborationWebSocket.replyToAnnotation(annotationId, text);
  }, []);

  const getAnnotations = useCallback((contentId: string, filters?: {
    authorId?: string;
    annotationType?: Annotation['annotationType'];
    visibility?: Annotation['visibility'];
    resolved?: boolean;
  }) => {
    setState(prev => ({ ...prev, isLoading: true }));
    collaborationWebSocket.getAnnotations(contentId, filters);
    
    // Reset loading state after timeout
    setTimeout(() => {
      setState(prev => ({ ...prev, isLoading: false }));
    }, 2000);
  }, []);

  // Document editing actions
  const applyEdit = useCallback((sessionId: string, edit: Omit<DocumentEdit, 'id' | 'timestamp' | 'version'>) => {
    collaborationWebSocket.applyEdit(sessionId, edit);
  }, []);

  const updateCursor = useCallback((sessionId: string, position: { x: number; y: number }, color: string) => {
    if (enableCursorTracking) {
      collaborationWebSocket.updateCursor(sessionId, position, color);
    }
  }, [enableCursorTracking]);

  const updateSelection = useCallback((sessionId: string, selection: SessionParticipant['selection']) => {
    collaborationWebSocket.updateSelection(sessionId, selection);
  }, []);

  const requestSync = useCallback((sessionId: string) => {
    collaborationWebSocket.requestSync(sessionId);
  }, []);

  // Utility actions
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, connectionError: null }));
  }, []);

  const clearConflicts = useCallback(() => {
    setState(prev => ({ ...prev, conflicts: [] }));
  }, []);

  const getParticipantCursor = useCallback((userId: string): CursorUpdate | undefined => {
    return state.cursors.get(userId);
  }, [state.cursors]);

  const isUserTyping = useCallback((userId: string): boolean => {
    const participant = state.participants.find(p => p.userId === userId);
    return participant?.selection !== undefined;
  }, [state.participants]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && userId && !state.isConnected) {
      connect(userId);
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, userId, connect, disconnect]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      cursorCleanupTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Actions object
  const actions: UseCollaborationWebSocketActions = {
    connect,
    disconnect,
    joinSession,
    leaveSession,
    setCurrentSession,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    resolveAnnotation,
    replyToAnnotation,
    getAnnotations,
    applyEdit,
    updateCursor,
    updateSelection,
    requestSync,
    clearError,
    clearConflicts,
    getParticipantCursor,
    isUserTyping
  };

  return [state, actions];
}
