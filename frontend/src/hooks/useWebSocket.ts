/**
 * WebSocket Hook for Real-time Communication
 * Provides connection to WebSocket server and event handling
 */

import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

interface ProgressEvent {
  type: 'analysis_progress' | 'analysis_complete' | 'session_update';
  userId: string;
  analysisId?: string;
  progress?: number;
  data: Record<string, unknown>;
}

interface WebSocketEvents {
  'progress': (data: ProgressEvent) => void;
  'error': (message: string) => void;
  'connected': (data: { userId: string; timestamp: Date }) => void;
  'disconnected': () => void;
}

type SocketType = ReturnType<typeof io>;

export const useWebSocket = (namespace = '/analytics') => {
  const socketRef = useRef<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Don't connect if no auth token
    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    try {
      // Create WebSocket connection
      const serverUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      socketRef.current = io(serverUrl + namespace, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      const socket = socketRef.current;

      // Connection event handlers
      socket.on('connect', () => {
        console.log(`🔗 Connected to WebSocket ${namespace}`);
        setIsConnected(true);
        setConnectionError(null);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Disconnected from WebSocket ${namespace}`);
        setIsConnected(false);
      });

      socket.on('connect_error', (error: Error) => {
        console.error(`❌ WebSocket connection error:`, error);
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
  }, [namespace]);

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
