import { apiService } from './apiService';
import { websocketService } from './websocketService'; 
import type { AnnotationData, AnnotationPosition } from '../components/annotations/AnnotationOverlay';

export interface CreateAnnotationRequest {
  contentId: string;
  contentType: string;
  text: string;
  position: AnnotationPosition;
  selectionData?: {
    start: number;
    end: number;
    selectedText: string;
  };
  annotationType?: string;
  visibility?: string;
  permissions?: Record<string, boolean>;
  metadata?: Record<string, unknown>;
  threadId?: string;
  parentId?: string;
}

export interface AnnotationFilter {
  contentId?: string;
  contentType?: string;
  authorId?: string;
  visibility?: string;
  isResolved?: boolean;
  threadId?: string;
  annotationType?: string;
  page?: number;
  limit?: number;
}

export interface AnnotationResponse {
  success: boolean;
  annotation?: AnnotationData;
  annotations?: AnnotationData[];
  totalCount?: number;
  page?: number;
  totalPages?: number;
  thread?: AnnotationData[];
  stats?: {
    totalAnnotations: number;
    resolvedAnnotations: number;
    annotationsByType: Record<string, number>;
    recentActivity: number;
  };
  error?: string;
  details?: string;
}

class AnnotationService {
  /**
   * Create a new annotation
   */
  async createAnnotation(data: CreateAnnotationRequest): Promise<AnnotationResponse> {
    try {
      const response = await apiService.post<AnnotationResponse>('/api/annotations', data);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create annotation';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get annotations with filtering
   */
  async getAnnotations(filter: AnnotationFilter = {}): Promise<AnnotationResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await apiService.get<AnnotationResponse>(`/api/annotations?${params.toString()}`);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch annotations';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update an annotation
   */
  async updateAnnotation(annotationId: string, data: Partial<CreateAnnotationRequest>): Promise<AnnotationResponse> {
    try {
      const response = await apiService.put<AnnotationResponse>(`/api/annotations/${annotationId}`, data);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update annotation';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete an annotation
   */
  async deleteAnnotation(annotationId: string): Promise<AnnotationResponse> {
    try {
      const response = await apiService.delete<AnnotationResponse>(`/api/annotations/${annotationId}`);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete annotation';
      throw new Error(errorMessage);
    }
  }

  /**
   * Resolve an annotation
   */
  async resolveAnnotation(annotationId: string): Promise<AnnotationResponse> {
    try {
      const response = await apiService.post<AnnotationResponse>(`/api/annotations/${annotationId}/resolve`);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve annotation';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get annotation thread
   */
  async getAnnotationThread(threadId: string): Promise<AnnotationResponse> {
    try {
      const response = await apiService.get<AnnotationResponse>(`/api/annotations/thread/${threadId}`);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch annotation thread';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get annotation statistics
   */
  async getAnnotationStats(contentId: string, contentType: string): Promise<AnnotationResponse> {
    try {
      const params = new URLSearchParams({ contentId, contentType });
      const response = await apiService.get<AnnotationResponse>(`/api/annotations/stats?${params.toString()}`);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch annotation statistics';
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a reply to an annotation
   */
  async createReply(parentId: string, data: CreateAnnotationRequest): Promise<AnnotationResponse> {
    try {
      const replyData = {
        ...data,
        parentId,
        threadId: parentId, // Use parent ID as thread ID for top-level annotations
      };
      
      const response = await apiService.post<AnnotationResponse>('/api/annotations', replyData);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create reply';
      throw new Error(errorMessage);
    }
  }

  // ===== Real-Time Collaboration Features =====

  /**
   * Initialize real-time annotation collaboration for content
   */
  initializeRealTimeCollaboration(contentId: string, contentType: string): void {
    // Connect to WebSocket collaboration namespace
    websocketService.connectToCollaboration();
    
    // Join the content room for real-time updates
    websocketService.joinContent(contentId, contentType);
  }

  /**
   * Stop real-time collaboration for content  
   */
  stopRealTimeCollaboration(contentId: string, contentType: string): void {
    // Leave the content room
    websocketService.leaveContent(contentId, contentType);
  }

  /**
   * Create annotation with real-time broadcasting
   */
  async createAnnotationRealTime(data: CreateAnnotationRequest): Promise<AnnotationResponse> {
    try {
      // Create annotation via REST API first
      const response = await this.createAnnotation(data);
      
      // If successful and WebSocket is connected, broadcast real-time event
      if (response.success && response.annotation && websocketService.isConnectedToCollaboration()) {
        websocketService.createAnnotationRealTime({
          type: 'annotation_created',
          contentId: data.contentId,
          contentType: data.contentType,
          authorId: response.annotation.author.id,
          text: data.text,
          position: data.position,
          annotationType: data.annotationType || 'COMMENT',
          visibility: data.visibility || 'PUBLIC',
        });
      }
      
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create annotation';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update annotation with real-time broadcasting
   */
  async updateAnnotationRealTime(id: string, updates: Partial<CreateAnnotationRequest>): Promise<AnnotationResponse> {
    try {
      // Update annotation via REST API first
      const response = await this.updateAnnotation(id, updates);
      
      // If successful and WebSocket is connected, broadcast real-time event
      if (response.success && updates.text && websocketService.isConnectedToCollaboration()) {
        websocketService.updateAnnotationRealTime(id, updates.text);
      }
      
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update annotation';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete annotation with real-time broadcasting
   */
  async deleteAnnotationRealTime(id: string): Promise<AnnotationResponse> {
    try {
      // Delete annotation via REST API first
      const response = await this.deleteAnnotation(id);
      
      // If successful and WebSocket is connected, broadcast real-time event
      if (response.success && websocketService.isConnectedToCollaboration()) {
        websocketService.deleteAnnotationRealTime(id);
      }
      
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete annotation';
      throw new Error(errorMessage);
    }
  }

  /**
   * Resolve annotation with real-time broadcasting
   */
  async resolveAnnotationRealTime(id: string): Promise<AnnotationResponse> {
    try {
      // Resolve annotation via REST API first
      const response = await this.resolveAnnotation(id);
      
      // If successful and WebSocket is connected, broadcast real-time event
      if (response.success && websocketService.isConnectedToCollaboration()) {
        websocketService.resolveAnnotationRealTime(id);
      }
      
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve annotation';
      throw new Error(errorMessage);
    }
  }

  /**
   * Add event listener for real-time annotation updates
   */
  addEventListener(event: string, callback: (data: unknown) => void): void {
    websocketService.addEventListener(event, callback);
  }

  /**
   * Remove event listener for real-time annotation updates
   */
  removeEventListener(event: string, callback: (data: unknown) => void): void {
    websocketService.removeEventListener(event, callback);
  }

  /**
   * Check if real-time collaboration is active
   */
  isRealTimeActive(): boolean {
    return websocketService.isConnectedToCollaboration();
  }
}

export const annotationService = new AnnotationService();
