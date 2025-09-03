/**
 * WebSocket Hook for Real-time Communication
 * Provides connection to WebSocket server and event handling
 */

import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { authStorage } from '@/utils/authStorage';
import type { 
  AnalyticsMetrics, 
  EngagementDataPoint, 
  LearningProgressData, 
  AIModelUsageData 
} from '@/types/analytics';

interface ProgressEvent {
  type: 'analysis_progress' | 'analysis_complete' | 'session_update';
  userId: string;
  analysisId?: string;
  progress?: number;
  data: Record<string, unknown>;
}

interface AnalyticsUpdateEvent {
  type: 'metrics';
  metrics: Partial<AnalyticsMetrics>;
  timestamp: Date;
}

interface EngagementUpdateEvent {
  type: 'engagement';
  dataPoint: EngagementDataPoint;
  timestamp: Date;
}

interface ProgressUpdateEvent {
  type: 'progress';
  dataPoint: LearningProgressData;
  timestamp: Date;
}

interface AIUsageUpdateEvent {
  type: 'ai_usage';
  dataPoint: AIModelUsageData;
  timestamp: Date;
}

interface WebSocketEvents {
  'progress': (data: ProgressEvent) => void;
  'analytics_update': (data: AnalyticsUpdateEvent) => void;
  'engagement_update': (data: EngagementUpdateEvent) => void;
  'progress_update': (data: ProgressUpdateEvent) => void;
  'ai_usage_update': (data: AIUsageUpdateEvent) => void;
  'significant_change': (data: {
    changeType: string;
    percentageIncrease?: number;
    milestone?: string;
    timestamp: Date;
  }) => void;
  'error': (message: string) => void;
  'connected': (data: { userId: string; timestamp: Date }) => void;
  'disconnected': () => void;
}

type SocketType = ReturnType<typeof io>;

export const useWebSocket = (namespace = '/analytics') => {
  const socketRef = useRef<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Monitor auth token changes
  useEffect(() => {
    const token = authStorage.getToken();
    setAuthToken(token);
    
    // Set up an interval to check for token changes (in case user logs in/out)
    const interval = setInterval(() => {
      const currentToken = authStorage.getToken();
      if (currentToken !== authToken) {
        setAuthToken(currentToken);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [authToken]);

  useEffect(() => {
    // Don't connect if no auth token
    if (!authToken) {
      setIsConnected(false);
      setConnectionError(null);
      return;
    }

    try {
      // Create WebSocket connection
      const serverUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const fullUrl = serverUrl + namespace;
      
      console.log('🚀 Attempting WebSocket connection:', { serverUrl, namespace, fullUrl });
      
      socketRef.current = io(fullUrl, {
        auth: {
          token: authToken
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      const socket = socketRef.current;

      // Connection event handlers
      socket.on('connect', () => {
        console.log(`🔗 Connected to WebSocket ${namespace} at ${fullUrl}`);
        setIsConnected(true);
        setConnectionError(null);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Disconnected from WebSocket ${namespace}`);
        setIsConnected(false);
      });

      socket.on('connect_error', (error: Error) => {
        console.error(`❌ WebSocket connection error for ${namespace}:`, error);
        setConnectionError(error.message || 'Connection failed');
        setIsConnected(false);
      });

      return () => {
        if (socket) {
          socket.disconnect();
          socketRef.current = null;
        }
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setConnectionError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [namespace, authToken]);

  const subscribe = <T extends keyof WebSocketEvents>(
    event: T,
    handler: WebSocketEvents[T]
  ) => {
    if (!socketRef.current) return;

    socketRef.current.on(event, handler);

    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
    };
  };

  const emit = (event: string, data: unknown) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  return {
    isConnected,
    connectionError,
    subscribe,
    emit,
    socket: socketRef.current
  };
};
