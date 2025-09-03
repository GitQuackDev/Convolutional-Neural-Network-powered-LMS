import io from 'socket.io-client';

// Define WebSocket event types for annotations
export interface AnnotationEvent {
  type: 'annotation_created' | 'annotation_updated' | 'annotation_deleted' | 'annotation_resolved';
  annotationId: string;
  contentId: string;
  contentType: string;
  authorId: string;
  courseId?: string;
  text?: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
    page?: number;
  };
  annotationType?: string;
  visibility?: string;
  isResolved?: boolean;
  timestamp: Date;
}

export interface ConnectionEvent {
  userId: string;
  timestamp: Date;
}

// Define client-to-server events for annotations
export interface ClientToServerEvents {
  join_content: (data: { contentId: string; contentType: string }) => void;
  leave_content: (data: { contentId: string; contentType: string }) => void;
  create_annotation: (data: Omit<AnnotationEvent, 'annotationId' | 'timestamp'>) => void;
  update_annotation: (data: { annotationId: string; text: string }) => void;
  delete_annotation: (annotationId: string) => void;
  resolve_annotation: (annotationId: string) => void;
}

// Define server-to-client events for annotations
export interface ServerToClientEvents {
  connected: (data: ConnectionEvent) => void;
  disconnected: (data: ConnectionEvent) => void;
  annotation: (data: AnnotationEvent) => void;
  error: (message: string) => void;
}

// Union type for all possible event data
export type WebSocketEventData = AnnotationEvent | ConnectionEvent | string;

class WebSocketService {
  private collaborationSocket: ReturnType<typeof io> | null = null;
  private eventListeners: Map<string, Set<(data: WebSocketEventData) => void>> = new Map();

  /**
   * Connect to the collaboration namespace for real-time annotation features
   */
  connectToCollaboration(token?: string): void {
    if (this.collaborationSocket?.connected) {
      console.log('🤝 Already connected to collaboration namespace');
      return;
    }

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    this.collaborationSocket = io(`${baseURL}/collaboration`, {
      auth: {
        token: token || localStorage.getItem('authToken')
      },
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    this.setupCollaborationEventHandlers();
  }

  /**
   * Setup event handlers for collaboration namespace
   */
  private setupCollaborationEventHandlers(): void {
    if (!this.collaborationSocket) return;

    this.collaborationSocket.on('connect', () => {
      console.log('🤝 Connected to collaboration namespace');
    });

    this.collaborationSocket.on('connected', (data: ConnectionEvent) => {
      console.log('👥 User connected to collaboration:', data);
      this.emitToListeners('user_connected', data);
    });

    this.collaborationSocket.on('disconnected', (data: ConnectionEvent) => {
      console.log('👋 User disconnected from collaboration:', data);
      this.emitToListeners('user_disconnected', data);
    });

    this.collaborationSocket.on('annotation', (data: AnnotationEvent) => {
      console.log('📝 Received annotation event:', data);
      this.emitToListeners('annotation_event', data);
    });

    this.collaborationSocket.on('error', (message: string) => {
      console.error('❌ Collaboration error:', message);
      this.emitToListeners('collaboration_error', message);
    });

    this.collaborationSocket.on('disconnect', (reason: string) => {
      console.log('🔌 Disconnected from collaboration namespace:', reason);
      this.emitToListeners('collaboration_disconnected', reason);
    });
  }

  /**
   * Join a content room for real-time annotation collaboration
   */
  joinContent(contentId: string, contentType: string): void {
    if (!this.collaborationSocket?.connected) {
      console.warn('⚠️ Not connected to collaboration namespace');
      return;
    }

    this.collaborationSocket.emit('join_content', { contentId, contentType });
    console.log(`👥 Joining content room: ${contentId}:${contentType}`);
  }

  /**
   * Leave a content room
   */
  leaveContent(contentId: string, contentType: string): void {
    if (!this.collaborationSocket?.connected) {
      console.warn('⚠️ Not connected to collaboration namespace');
      return;
    }

    this.collaborationSocket.emit('leave_content', { contentId, contentType });
    console.log(`👋 Leaving content room: ${contentId}:${contentType}`);
  }

  /**
   * Create annotation via WebSocket (real-time)
   */
  createAnnotationRealTime(data: Omit<AnnotationEvent, 'annotationId' | 'timestamp'>): void {
    if (!this.collaborationSocket?.connected) {
      console.warn('⚠️ Not connected to collaboration namespace');
      return;
    }

    this.collaborationSocket.emit('create_annotation', data);
  }

  /**
   * Update annotation via WebSocket (real-time)
   */
  updateAnnotationRealTime(annotationId: string, text: string): void {
    if (!this.collaborationSocket?.connected) {
      console.warn('⚠️ Not connected to collaboration namespace');
      return;
    }

    this.collaborationSocket.emit('update_annotation', { annotationId, text });
  }

  /**
   * Delete annotation via WebSocket (real-time)
   */
  deleteAnnotationRealTime(annotationId: string): void {
    if (!this.collaborationSocket?.connected) {
      console.warn('⚠️ Not connected to collaboration namespace');
      return;
    }

    this.collaborationSocket.emit('delete_annotation', annotationId);
  }

  /**
   * Resolve annotation via WebSocket (real-time)
   */
  resolveAnnotationRealTime(annotationId: string): void {
    if (!this.collaborationSocket?.connected) {
      console.warn('⚠️ Not connected to collaboration namespace');
      return;
    }

    this.collaborationSocket.emit('resolve_annotation', annotationId);
  }

  /**
   * Add event listener for WebSocket events
   */
  addEventListener(event: string, callback: (data: WebSocketEventData) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: (data: WebSocketEventData) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event to all registered listeners
   */
  private emitToListeners(event: string, data: WebSocketEventData): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Disconnect from collaboration namespace
   */
  disconnectFromCollaboration(): void {
    if (this.collaborationSocket) {
      this.collaborationSocket.disconnect();
      this.collaborationSocket = null;
      console.log('🔌 Disconnected from collaboration namespace');
    }
  }

  /**
   * Check if connected to collaboration namespace
   */
  isConnectedToCollaboration(): boolean {
    return this.collaborationSocket?.connected || false;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// For backwards compatibility, also export as default
export default websocketService;
