/**
 * Notifications WebSocket React Hook - Simplified Version
 * Provides basic notification functionality without complex service dependencies
 */

import { useState, useCallback } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  timestamp: string;
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  enableSound: boolean;
  enableDesktop: boolean;
  types: string[];
  priorities: ('low' | 'medium' | 'high' | 'urgent')[];
}

interface UseNotificationsWebSocketState {
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  connectionError: string | null;
  isLoading: boolean;
}

interface UseNotificationsWebSocketActions {
  connect: (userId: string) => void;
  disconnect: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  getNotifications: (filters?: {
    type?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    read?: boolean;
    limit?: number;
    offset?: number;
  }) => void;
  clearError: () => void;
  refreshNotifications: () => void;
}

export function useNotificationsWebSocket(): [UseNotificationsWebSocketState, UseNotificationsWebSocketActions] {
  // State management
  const [state, setState] = useState<UseNotificationsWebSocketState>({
    isConnected: false,
    notifications: [],
    unreadCount: 0,
    preferences: null,
    connectionError: null,
    isLoading: false
  });

  // Connection management
  const connect = useCallback((userId: string) => {
    console.log('Connecting notifications for user:', userId);
    setState(prev => ({ ...prev, isConnected: true, connectionError: null }));
  }, []);

  const disconnect = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      notifications: [],
      unreadCount: 0,
      preferences: null
    }));
  }, []);

  // Notification management
  const markAsRead = useCallback((notificationId: string) => {
    console.log('Marking as read:', notificationId);
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1)
    }));
  }, []);

  const markAllAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0
    }));
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== notificationId),
      unreadCount: prev.notifications.some(n => n.id === notificationId && !n.isRead) 
        ? prev.unreadCount - 1 
        : prev.unreadCount
    }));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: [],
      unreadCount: 0
    }));
  }, []);

  const updatePreferences = useCallback((preferences: Partial<NotificationPreferences>) => {
    setState(prev => ({
      ...prev,
      preferences: prev.preferences ? { ...prev.preferences, ...preferences } : null
    }));
  }, []);

  const getNotifications = useCallback((filters?: {
    type?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    read?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    console.log('Getting notifications with filters:', filters);
    setState(prev => ({ ...prev, isLoading: true }));
    
    setTimeout(() => {
      setState(prev => ({ ...prev, isLoading: false }));
    }, 1000);
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, connectionError: null }));
  }, []);

  const refreshNotifications = useCallback(() => {
    getNotifications();
  }, [getNotifications]);

  const actions: UseNotificationsWebSocketActions = {
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updatePreferences,
    getNotifications,
    clearError,
    refreshNotifications
  };

  return [state, actions];
}
