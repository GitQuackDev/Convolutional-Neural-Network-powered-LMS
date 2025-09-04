/**
 * Analytics WebSocket Hook
 * Provides real-time analytics updates, progress tracking, and metrics streaming
 * Enhanced for Story 2.6: AI Progress Tracking and Results Display Enhancement
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  analyticsWebSocket, 
  type AnalyticsUpdateEvent, 
  type ProgressUpdateEvent, 
  type EngagementUpdateEvent, 
  type SignificantChangeEvent 
} from '@/services/websocket/analyticsWebSocket';
import { authStorage } from '@/utils/authStorage';
import type { 
  ModelProgressUpdate, 
  AnalysisProgressEvent,
  ModelPerformanceMetric,
  AnalysisCompletionEvent
} from '@/types/progressTracking';

interface AnalyticsWebSocketState {
  isConnected: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
  analyticsData: AnalyticsUpdateEvent | null;
  progressUpdates: Map<string, ProgressUpdateEvent>;
  engagementData: EngagementUpdateEvent | null;
  significantChanges: SignificantChangeEvent[];
  
  // Enhanced progress tracking for Story 2.6
  analysisProgress: Map<string, AnalysisProgressEvent>;
  modelProgress: Map<string, ModelProgressUpdate>;
  performanceMetrics: Map<string, ModelPerformanceMetric>;
  completedAnalyses: AnalysisCompletionEvent[];
}

interface UseAnalyticsWebSocketOptions {
  autoConnect?: boolean;
  trackProgress?: string[]; // jobIds to track
  significantChangeSeverity?: SignificantChangeEvent['severity'];
  
  // Enhanced options for Story 2.6
  trackAnalysisProgress?: boolean;
  trackModelMetrics?: boolean;
  maxCompletedHistorySize?: number;
}

export const useAnalyticsWebSocket = (options: UseAnalyticsWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    trackProgress = [],
    significantChangeSeverity,
    trackAnalysisProgress: enableAnalysisTracking = true,
    trackModelMetrics: enableModelMetrics = true,
    maxCompletedHistorySize = 50
  } = options;

  // Note: Parameters above are for future use with enhanced analytics tracking
  void enableAnalysisTracking;
  void enableModelMetrics;
  void maxCompletedHistorySize;

  const [state, setState] = useState<AnalyticsWebSocketState>({
    isConnected: false,
    connectionError: null,
    reconnectAttempts: 0,
    analyticsData: null,
    progressUpdates: new Map(),
    engagementData: null,
    significantChanges: [],
    analysisProgress: new Map(),
    modelProgress: new Map(),
    performanceMetrics: new Map(),
    completedAnalyses: []
  });

  const unsubscribeFunctionsRef = useRef<(() => void)[]>([]);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Connect to analytics WebSocket
   */
  const connect = useCallback(async (userId?: string) => {
    try {
      setState(prev => ({ ...prev, connectionError: null }));
      
      // Get user ID from auth storage if not provided
      const currentUser = userId || authStorage.getUser()?.id;
      if (!currentUser) {
        throw new Error('No user ID available for WebSocket connection');
      }

      await analyticsWebSocket.connect(currentUser);
      
      // Subscribe to analytics events
      const unsubscribeAnalytics = analyticsWebSocket.subscribeToAnalyticsUpdates((data) => {
        setState(prev => ({
          ...prev,
          analyticsData: data
        }));
      });

      // Subscribe to progress updates
      const unsubscribeProgress = analyticsWebSocket.subscribeToProgressUpdates((data) => {
        setState(prev => {
          const newProgressUpdates = new Map(prev.progressUpdates);
          newProgressUpdates.set(data.jobId, data);
          return {
            ...prev,
            progressUpdates: newProgressUpdates
          };
        });
      });

      // Subscribe to engagement updates
      const unsubscribeEngagement = analyticsWebSocket.subscribeToEngagementUpdates((data) => {
        setState(prev => ({
          ...prev,
          engagementData: data
        }));
      });

      // Subscribe to significant changes with optional severity filtering
      const unsubscribeSignificant = analyticsWebSocket.subscribeToSignificantChanges(
        (data) => {
          setState(prev => ({
            ...prev,
            significantChanges: [...prev.significantChanges.slice(-9), data] // Keep last 10
          }));
        },
        significantChangeSeverity
      );

      // Store unsubscribe functions
      unsubscribeFunctionsRef.current = [
        unsubscribeAnalytics,
        unsubscribeProgress,
        unsubscribeEngagement,
        unsubscribeSignificant
      ];

      // Update connection status
      const status = analyticsWebSocket.getConnectionStatus();
      setState(prev => ({
        ...prev,
        isConnected: status.isConnected,
        reconnectAttempts: status.reconnectAttempts
      }));

    } catch (error) {
      console.error('[useAnalyticsWebSocket] Connection failed:', error);
      setState(prev => ({
        ...prev,
        connectionError: error instanceof Error ? error.message : 'Connection failed',
        isConnected: false
      }));
    }
  }, [significantChangeSeverity]);

  /**
   * Disconnect from analytics WebSocket
   */
  const disconnect = useCallback(() => {
    // Clean up subscriptions
    unsubscribeFunctionsRef.current.forEach(unsubscribe => unsubscribe());
    unsubscribeFunctionsRef.current = [];

    // Clear connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    // Disconnect the service
    analyticsWebSocket.disconnect();

    // Reset state
    setState(prev => ({
      ...prev,
      isConnected: false,
      connectionError: null,
      reconnectAttempts: 0
    }));
  }, []);

  /**
   * Request specific analytics data
   */
  const requestAnalytics = useCallback((filters: {
    courseId?: string;
    userId?: string;
    timeRange?: 'hour' | 'day' | 'week';
    metrics?: string[];
  }) => {
    analyticsWebSocket.requestAnalytics(filters);
  }, []);

  /**
   * Start tracking progress for a specific job
   */
  const trackAnalysisProgress = useCallback((jobId: string, contentId: string) => {
    analyticsWebSocket.trackAnalysisProgress(jobId, contentId);
  }, []);

  /**
   * Stop tracking progress for a specific job
   */
  const stopTrackingProgress = useCallback((jobId: string) => {
    analyticsWebSocket.stopTrackingProgress(jobId);
    setState(prev => {
      const newProgressUpdates = new Map(prev.progressUpdates);
      newProgressUpdates.delete(jobId);
      return {
        ...prev,
        progressUpdates: newProgressUpdates
      };
    });
  }, []);

  /**
   * Clear significant changes history
   */
  const clearSignificantChanges = useCallback(() => {
    setState(prev => ({
      ...prev,
      significantChanges: []
    }));
  }, []);

  /**
   * Get progress for a specific job
   */
  const getProgressForJob = useCallback((jobId: string): ProgressUpdateEvent | undefined => {
    return state.progressUpdates.get(jobId);
  }, [state.progressUpdates]);

  /**
   * Get recent significant changes by severity
   */
  const getSignificantChangesBySeverity = useCallback((severity: SignificantChangeEvent['severity']) => {
    return state.significantChanges.filter(change => change.severity === severity);
  }, [state.significantChanges]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      const userId = authStorage.getUser()?.id;
      if (userId) {
        connect(userId);
      }
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Track specific progress jobs when trackProgress changes
  useEffect(() => {
    if (state.isConnected && trackProgress.length > 0) {
      trackProgress.forEach(jobId => {
        // Assume contentId can be derived or provide a default
        trackAnalysisProgress(jobId, `content-${jobId}`);
      });
    }
  }, [state.isConnected, trackProgress, trackAnalysisProgress]);

  // Monitor connection status changes
  useEffect(() => {
    const checkConnection = () => {
      if (state.isConnected) {
        const status = analyticsWebSocket.getConnectionStatus();
        setState(prev => ({
          ...prev,
          isConnected: status.isConnected,
          reconnectAttempts: status.reconnectAttempts
        }));
      }
    };

    const interval = setInterval(checkConnection, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [state.isConnected]);

  return {
    // Connection state
    isConnected: state.isConnected,
    connectionError: state.connectionError,
    reconnectAttempts: state.reconnectAttempts,

    // Data state
    analyticsData: state.analyticsData,
    progressUpdates: state.progressUpdates,
    engagementData: state.engagementData,
    significantChanges: state.significantChanges,

    // Connection methods
    connect,
    disconnect,

    // Data methods
    requestAnalytics,
    trackAnalysisProgress,
    stopTrackingProgress,
    clearSignificantChanges,

    // Utility methods
    getProgressForJob,
    getSignificantChangesBySeverity
  };
};
