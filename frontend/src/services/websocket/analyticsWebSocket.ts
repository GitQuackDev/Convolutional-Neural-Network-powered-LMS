/**
 * Analytics WebSocket Service
 * Handles real-time analytics updates, progress tracking, and metrics streaming
 */

import io from 'socket.io-client';
import { authStorage } from '@/utils/authStorage';
import type { 
  AnalyticsMetrics, 
  EngagementDataPoint
} from '@/types/analytics';

export interface AnalyticsUpdateEvent {
  type: 'metrics_update' | 'dashboard_refresh' | 'milestone_reached';
  metrics: Partial<AnalyticsMetrics>;
  timestamp: string;
  source: string;
}

export interface ProgressUpdateEvent {
  type: 'analysis_progress' | 'analysis_complete' | 'analysis_started';
  jobId: string;
  progress: number;
  data: {
    contentId?: string;
    userId?: string;
    analysisType?: string;
    estimatedTimeRemaining?: number;
    results?: Record<string, unknown>;
  };
  timestamp: string;
}

export interface EngagementUpdateEvent {
  type: 'engagement_update' | 'session_update' | 'user_activity';
  dataPoint: EngagementDataPoint;
  aggregatedData?: {
    totalSessions: number;
    averageSessionTime: number;
    activeUsers: number;
  };
  timestamp: string;
}

export interface SignificantChangeEvent {
  type: 'significant_change';
  changeType: 'threshold_exceeded' | 'anomaly_detected' | 'trend_change';
  metric: string;
  value: number;
  threshold?: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface AnalyticsWebSocketEvents {
  'analytics_update': (data: AnalyticsUpdateEvent) => void;
  'progress': (data: ProgressUpdateEvent) => void;
  'engagement_update': (data: EngagementUpdateEvent) => void;
  'significant_change': (data: SignificantChangeEvent) => void;
  'connect': () => void;
  'disconnect': () => void;
  'connect_error': (error: Error) => void;
  'reconnect': (attemptNumber: number) => void;
}

class AnalyticsWebSocketService {
  private socket: ReturnType<typeof io> | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventSubscriptions = new Map<string, Set<(...args: unknown[]) => void>>();

  /**
   * Connect to the analytics WebSocket namespace
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

        // Create new connection to analytics namespace
        this.socket = io('/analytics', {
          auth: {
            token,
            userId
          },
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000
        });

        // Connection event handlers
        this.socket.on('connect', () => {
          console.log('[AnalyticsWebSocket] Connected to analytics namespace');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('[AnalyticsWebSocket] Disconnected:', reason);
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error: Error) => {
          console.error('[AnalyticsWebSocket] Connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on('reconnect', (attemptNumber: number) => {
          console.log(`[AnalyticsWebSocket] Reconnected after ${attemptNumber} attempts`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
        });

        this.socket.on('reconnect_failed', () => {
          console.error('[AnalyticsWebSocket] Failed to reconnect after maximum attempts');
          this.isConnected = false;
        });

      } catch (error) {
        console.error('[AnalyticsWebSocket] Connection setup error:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the analytics WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[AnalyticsWebSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventSubscriptions.clear();
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { isConnected: boolean; reconnectAttempts: number } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Subscribe to analytics updates
   */
  subscribeToAnalyticsUpdates(callback: (data: AnalyticsUpdateEvent) => void): () => void {
    return this.subscribe('analytics_update', callback);
  }

  /**
   * Subscribe to progress updates for specific job or all jobs
   */
  subscribeToProgressUpdates(
    callback: (data: ProgressUpdateEvent) => void,
    jobId?: string
  ): () => void {
    const wrappedCallback = (data: ProgressUpdateEvent) => {
      // Filter by jobId if specified
      if (!jobId || data.jobId === jobId) {
        callback(data);
      }
    };

    return this.subscribe('progress', wrappedCallback);
  }

  /**
   * Subscribe to engagement updates
   */
  subscribeToEngagementUpdates(callback: (data: EngagementUpdateEvent) => void): () => void {
    return this.subscribe('engagement_update', callback);
  }

  /**
   * Subscribe to significant change notifications
   */
  subscribeToSignificantChanges(
    callback: (data: SignificantChangeEvent) => void,
    severity?: SignificantChangeEvent['severity']
  ): () => void {
    const wrappedCallback = (data: SignificantChangeEvent) => {
      // Filter by severity if specified
      if (!severity || data.severity === severity) {
        callback(data);
      }
    };

    return this.subscribe('significant_change', wrappedCallback);
  }

  /**
   * Request real-time analytics for specific filters
   */
  requestAnalytics(filters: {
    courseId?: string;
    userId?: string;
    timeRange?: 'hour' | 'day' | 'week';
    metrics?: string[];
  }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('request_analytics', filters);
    } else {
      console.warn('[AnalyticsWebSocket] Cannot request analytics - not connected');
    }
  }

  /**
   * Start tracking progress for a specific analysis job
   */
  trackAnalysisProgress(jobId: string, contentId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('track_progress', { jobId, contentId });
    } else {
      console.warn('[AnalyticsWebSocket] Cannot track progress - not connected');
    }
  }

  /**
   * Stop tracking progress for a specific analysis job
   */
  stopTrackingProgress(jobId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('stop_tracking', { jobId });
    } else {
      console.warn('[AnalyticsWebSocket] Cannot stop tracking - not connected');
    }
  }

  /**
   * Generic event subscription handler
   */
  private subscribe<K extends keyof AnalyticsWebSocketEvents>(
    event: K,
    callback: AnalyticsWebSocketEvents[K]
  ): () => void {
    if (!this.socket) {
      console.warn(`[AnalyticsWebSocket] Cannot subscribe to ${event} - not connected`);
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
   * Emit analytics event to server
   */
  emit(event: string, data: unknown): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`[AnalyticsWebSocket] Cannot emit ${event} - not connected`);
    }
  }
}

// Export singleton instance
export const analyticsWebSocket = new AnalyticsWebSocketService();
