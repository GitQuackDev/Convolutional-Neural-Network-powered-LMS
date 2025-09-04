/**
 * Notifications WebSocket Service
 * Handles real-time notifications, alerts, and system messages
 */

import io from 'socket.io-client';
import { authStorage } from '@/utils/authStorage';

export interface Notification {
  id: string;
  type: 'assignment' | 'grade' | 'message' | 'system' | 'achievement' | 'deadline' | 'announcement';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'academic' | 'social' | 'system' | 'personal';
  userId: string;
  courseId?: string;
  relatedId?: string; // ID of related object (assignment, message, etc.)
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  categories: {
    academic: boolean;
    social: boolean;
    system: boolean;
    personal: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    urgent: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
}

export interface NotificationBatch {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
}

interface NotificationsWebSocketEvents {
  'notification': (data: Notification) => void;
  'notification_read': (data: { notificationId: string; isRead: boolean }) => void;
  'notification_deleted': (data: { notificationId: string }) => void;
  'batch_update': (data: NotificationBatch) => void;
  'preferences_updated': (data: NotificationPreferences) => void;
  'connect': () => void;
  'disconnect': () => void;
  'connect_error': (error: Error) => void;
  'reconnect': (attemptNumber: number) => void;
}

class NotificationsWebSocketService {
  private socket: ReturnType<typeof io> | null = null;
  private isConnected = false;
  private currentUserId: string | null = null;
  private eventSubscriptions = new Map<string, Set<(...args: unknown[]) => void>>();

  /**
   * Connect to the notifications WebSocket namespace
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

        this.currentUserId = userId;

        // Create new connection to notifications namespace
        this.socket = io('/notifications', {
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
          console.log('[NotificationsWebSocket] Connected to notifications namespace');
          this.isConnected = true;
          resolve();
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('[NotificationsWebSocket] Disconnected:', reason);
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error: Error) => {
          console.error('[NotificationsWebSocket] Connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on('reconnect', (attemptNumber: number) => {
          console.log(`[NotificationsWebSocket] Reconnected after ${attemptNumber} attempts`);
          this.isConnected = true;
        });

      } catch (error) {
        console.error('[NotificationsWebSocket] Connection setup error:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the notifications WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[NotificationsWebSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentUserId = null;
      this.eventSubscriptions.clear();
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { isConnected: boolean; userId: string | null } {
    return {
      isConnected: this.isConnected,
      userId: this.currentUserId
    };
  }

  /**
   * Subscribe to new notifications
   */
  subscribeToNotifications(
    callback: (notification: Notification) => void,
    filters?: {
      types?: Notification['type'][];
      priorities?: Notification['priority'][];
      categories?: Notification['category'][];
    }
  ): () => void {
    const wrappedCallback = (notification: Notification) => {
      // Apply filters if specified
      if (filters) {
        if (filters.types && !filters.types.includes(notification.type)) return;
        if (filters.priorities && !filters.priorities.includes(notification.priority)) return;
        if (filters.categories && !filters.categories.includes(notification.category)) return;
      }
      callback(notification);
    };

    return this.subscribe('notification', wrappedCallback);
  }

  /**
   * Subscribe to notification read status changes
   */
  subscribeToReadStatus(callback: (data: { notificationId: string; isRead: boolean }) => void): () => void {
    return this.subscribe('notification_read', callback);
  }

  /**
   * Subscribe to notification deletions
   */
  subscribeToDeleted(callback: (data: { notificationId: string }) => void): () => void {
    return this.subscribe('notification_deleted', callback);
  }

  /**
   * Subscribe to batch updates (useful for initial load and bulk operations)
   */
  subscribeToBatchUpdates(callback: (batch: NotificationBatch) => void): () => void {
    return this.subscribe('batch_update', callback);
  }

  /**
   * Subscribe to preference updates
   */
  subscribeToPreferences(callback: (preferences: NotificationPreferences) => void): () => void {
    return this.subscribe('preferences_updated', callback);
  }

  /**
   * Mark a notification as read/unread
   */
  markAsRead(notificationId: string, isRead = true): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_read', { notificationId, isRead });
    } else {
      console.warn('[NotificationsWebSocket] Cannot mark as read - not connected');
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_all_read');
    } else {
      console.warn('[NotificationsWebSocket] Cannot mark all as read - not connected');
    }
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('delete_notification', { notificationId });
    } else {
      console.warn('[NotificationsWebSocket] Cannot delete notification - not connected');
    }
  }

  /**
   * Delete all read notifications
   */
  deleteAllRead(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('delete_all_read');
    } else {
      console.warn('[NotificationsWebSocket] Cannot delete all read - not connected');
    }
  }

  /**
   * Request notifications with pagination
   */
  getNotifications(options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    types?: Notification['type'][];
    categories?: Notification['category'][];
  } = {}): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('get_notifications', options);
    } else {
      console.warn('[NotificationsWebSocket] Cannot get notifications - not connected');
    }
  }

  /**
   * Update notification preferences
   */
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('update_preferences', preferences);
    } else {
      console.warn('[NotificationsWebSocket] Cannot update preferences - not connected');
    }
  }

  /**
   * Get current notification preferences
   */
  getPreferences(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('get_preferences');
    } else {
      console.warn('[NotificationsWebSocket] Cannot get preferences - not connected');
    }
  }

  /**
   * Test notification (for debugging/admin purposes)
   */
  sendTestNotification(notification: Partial<Notification>): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('test_notification', notification);
    } else {
      console.warn('[NotificationsWebSocket] Cannot send test notification - not connected');
    }
  }

  /**
   * Request unread count
   */
  getUnreadCount(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('get_unread_count');
    } else {
      console.warn('[NotificationsWebSocket] Cannot get unread count - not connected');
    }
  }

  /**
   * Clear expired notifications
   */
  clearExpiredNotifications(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('clear_expired');
    } else {
      console.warn('[NotificationsWebSocket] Cannot clear expired - not connected');
    }
  }

  /**
   * Generic event subscription handler
   */
  private subscribe<K extends keyof NotificationsWebSocketEvents>(
    event: K,
    callback: NotificationsWebSocketEvents[K]
  ): () => void {
    if (!this.socket) {
      console.warn(`[NotificationsWebSocket] Cannot subscribe to ${event} - not connected`);
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
   * Emit notification event to server
   */
  emit(event: string, data: unknown): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`[NotificationsWebSocket] Cannot emit ${event} - not connected`);
    }
  }
}

// Export singleton instance
export const notificationsWebSocket = new NotificationsWebSocketService();
