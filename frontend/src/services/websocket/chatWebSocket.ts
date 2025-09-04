/**
 * Chat WebSocket Service
 * Handles real-time messaging, room management, and user presence
 */

import io from 'socket.io-client';
import { authStorage } from '@/utils/authStorage';

export interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: string;
  roomId: string;
  messageType: 'text' | 'file' | 'system';
  editedAt?: string;
  replyToId?: string;
  reactions?: { emoji: string; users: string[] }[];
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'course' | 'private' | 'group' | 'discussion';
  participants: string[];
  courseId?: string;
  createdAt: string;
  settings?: {
    isPrivate: boolean;
    allowFileSharing: boolean;
    moderationEnabled: boolean;
  };
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface UserPresence {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  currentRoom?: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  roomId: string;
  isTyping: boolean;
}

export interface ChatEvent {
  type: 'message_sent' | 'message_edited' | 'message_deleted' | 'user_joined' | 'user_left' | 'typing_start' | 'typing_stop';
  data: ChatMessage | UserPresence | TypingIndicator;
  timestamp: string;
  roomId: string;
}

interface ChatWebSocketEvents {
  'message': (data: ChatMessage) => void;
  'user_joined': (data: { userId: string; userName: string; roomId: string }) => void;
  'user_left': (data: { userId: string; roomId: string }) => void;
  'typing_start': (data: TypingIndicator) => void;
  'typing_stop': (data: TypingIndicator) => void;
  'presence_update': (data: UserPresence) => void;
  'room_update': (data: ChatRoom) => void;
  'connect': () => void;
  'disconnect': () => void;
  'connect_error': (error: Error) => void;
  'reconnect': (attemptNumber: number) => void;
}

class ChatWebSocketService {
  private socket: ReturnType<typeof io> | null = null;
  private isConnected = false;
  private currentUserId: string | null = null;
  private currentRooms = new Set<string>();
  private typingTimeouts = new Map<string, NodeJS.Timeout>();
  private eventSubscriptions = new Map<string, Set<(...args: unknown[]) => void>>();

  /**
   * Connect to the chat WebSocket namespace
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

        // Create new connection to chat namespace
        this.socket = io('/chat', {
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
          console.log('[ChatWebSocket] Connected to chat namespace');
          this.isConnected = true;
          resolve();
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('[ChatWebSocket] Disconnected:', reason);
          this.isConnected = false;
          this.currentRooms.clear();
        });

        this.socket.on('connect_error', (error: Error) => {
          console.error('[ChatWebSocket] Connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on('reconnect', (attemptNumber: number) => {
          console.log(`[ChatWebSocket] Reconnected after ${attemptNumber} attempts`);
          this.isConnected = true;
          
          // Rejoin rooms after reconnection
          this.currentRooms.forEach(roomId => {
            this.joinRoom(roomId);
          });
        });

      } catch (error) {
        console.error('[ChatWebSocket] Connection setup error:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the chat WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[ChatWebSocket] Disconnecting...');
      
      // Leave all rooms before disconnecting
      this.currentRooms.forEach(roomId => {
        this.leaveRoom(roomId);
      });

      // Clear typing timeouts
      this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
      this.typingTimeouts.clear();

      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentUserId = null;
      this.currentRooms.clear();
      this.eventSubscriptions.clear();
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { isConnected: boolean; currentRooms: string[] } {
    return {
      isConnected: this.isConnected,
      currentRooms: Array.from(this.currentRooms)
    };
  }

  /**
   * Join a chat room
   */
  joinRoom(roomId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_room', { roomId });
      this.currentRooms.add(roomId);
      console.log(`[ChatWebSocket] Joined room: ${roomId}`);
    } else {
      console.warn('[ChatWebSocket] Cannot join room - not connected');
    }
  }

  /**
   * Leave a chat room
   */
  leaveRoom(roomId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_room', { roomId });
      this.currentRooms.delete(roomId);
      console.log(`[ChatWebSocket] Left room: ${roomId}`);
    } else {
      console.warn('[ChatWebSocket] Cannot leave room - not connected');
    }
  }

  /**
   * Send a message to a room
   */
  sendMessage(roomId: string, content: string, messageType: 'text' | 'file' = 'text', replyToId?: string): void {
    if (this.socket && this.isConnected) {
      const messageData = {
        roomId,
        content,
        messageType,
        replyToId,
        timestamp: new Date().toISOString()
      };
      
      this.socket.emit('send_message', messageData);
    } else {
      console.warn('[ChatWebSocket] Cannot send message - not connected');
    }
  }

  /**
   * Edit a message
   */
  editMessage(messageId: string, newContent: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('edit_message', { messageId, content: newContent });
    } else {
      console.warn('[ChatWebSocket] Cannot edit message - not connected');
    }
  }

  /**
   * Delete a message
   */
  deleteMessage(messageId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('delete_message', { messageId });
    } else {
      console.warn('[ChatWebSocket] Cannot delete message - not connected');
    }
  }

  /**
   * Start typing indicator
   */
  startTyping(roomId: string): void {
    if (this.socket && this.isConnected && this.currentUserId) {
      this.socket.emit('typing_start', { roomId });
      
      // Clear existing timeout for this room
      const existingTimeout = this.typingTimeouts.get(roomId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set timeout to automatically stop typing after 3 seconds
      const timeout = setTimeout(() => {
        this.stopTyping(roomId);
      }, 3000);
      
      this.typingTimeouts.set(roomId, timeout);
    }
  }

  /**
   * Stop typing indicator
   */
  stopTyping(roomId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { roomId });
      
      // Clear timeout
      const timeout = this.typingTimeouts.get(roomId);
      if (timeout) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(roomId);
      }
    }
  }

  /**
   * Subscribe to messages in a room
   */
  subscribeToMessages(callback: (message: ChatMessage) => void): () => void {
    return this.subscribe('message', callback);
  }

  /**
   * Subscribe to user presence updates
   */
  subscribeToPresence(callback: (presence: UserPresence) => void): () => void {
    return this.subscribe('presence_update', callback);
  }

  /**
   * Subscribe to typing indicators
   */
  subscribeToTyping(
    callback: (typing: TypingIndicator) => void
  ): { unsubscribeStart: () => void; unsubscribeStop: () => void } {
    const unsubscribeStart = this.subscribe('typing_start', callback);
    const unsubscribeStop = this.subscribe('typing_stop', callback);
    
    return {
      unsubscribeStart,
      unsubscribeStop
    };
  }

  /**
   * Subscribe to room updates
   */
  subscribeToRoomUpdates(callback: (room: ChatRoom) => void): () => void {
    return this.subscribe('room_update', callback);
  }

  /**
   * Subscribe to user join/leave events
   */
  subscribeToUserEvents(
    callbacks: {
      onUserJoined: (data: { userId: string; userName: string; roomId: string }) => void;
      onUserLeft: (data: { userId: string; roomId: string }) => void;
    }
  ): { unsubscribeJoined: () => void; unsubscribeLeft: () => void } {
    const unsubscribeJoined = this.subscribe('user_joined', callbacks.onUserJoined);
    const unsubscribeLeft = this.subscribe('user_left', callbacks.onUserLeft);
    
    return {
      unsubscribeJoined,
      unsubscribeLeft
    };
  }

  /**
   * Get message history for a room
   */
  getMessageHistory(roomId: string, beforeTimestamp?: number, limit?: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('get_messages', { 
        roomId, 
        limit: limit || 50, 
        before: beforeTimestamp ? new Date(beforeTimestamp).toISOString() : undefined 
      });
    } else {
      console.warn('[ChatWebSocket] Cannot get message history - not connected');
    }
  }

  /**
   * Mark messages as read in a room
   */
  markAsRead(roomId: string, messageId?: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_read', { roomId, messageId });
    } else {
      console.warn('[ChatWebSocket] Cannot mark as read - not connected');
    }
  }

  /**
   * Generic event subscription handler
   */
  private subscribe<K extends keyof ChatWebSocketEvents>(
    event: K,
    callback: ChatWebSocketEvents[K]
  ): () => void {
    if (!this.socket) {
      console.warn(`[ChatWebSocket] Cannot subscribe to ${event} - not connected`);
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
   * Emit chat event to server
   */
  emit(event: string, data: unknown): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`[ChatWebSocket] Cannot emit ${event} - not connected`);
    }
  }

  /**
   * Subscribe to chat events for React hooks
   */
  subscribeToChat(config: { 
    onMessage?: (message: ChatMessage) => void;
    onRoomUpdate?: (room: ChatRoom) => void;
    onUserPresence?: (presence: UserPresence) => void;
    onTyping?: (typing: TypingIndicator) => void;
  }): () => void {
    const unsubscribeFunctions: (() => void)[] = [];

    if (config.onMessage) {
      const unsubMessage = this.subscribe('message', config.onMessage);
      unsubscribeFunctions.push(unsubMessage);
    }

    if (config.onRoomUpdate) {
      const unsubRoom = this.subscribe('room_update', config.onRoomUpdate);
      unsubscribeFunctions.push(unsubRoom);
    }

    if (config.onUserPresence) {
      const unsubPresence = this.subscribe('presence_update', config.onUserPresence);
      unsubscribeFunctions.push(unsubPresence);
    }

    if (config.onTyping) {
      const unsubTyping = this.subscribe('typing_start', config.onTyping);
      unsubscribeFunctions.push(unsubTyping);
    }

    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }

  /**
   * Get user's chat rooms
   */
  getUserRooms(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('get_user_rooms');
    }
  }

  /**
   * Create a new chat room
   */
  createRoom(roomData: { name: string; type: string; participants: string[] }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('create_room', roomData);
    }
  }

  /**
   * Update chat room
   */
  updateRoom(roomId: string, updates: Partial<Pick<ChatRoom, 'name' | 'description' | 'settings'>>): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('update_room', { roomId, updates });
    }
  }

  /**
   * Delete chat room
   */
  deleteRoom(roomId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('delete_room', { roomId });
    }
  }

  /**
   * React to a message
   */
  reactToMessage(messageId: string, emoji: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('react_to_message', { messageId, emoji });
    }
  }

  /**
   * Set user presence status
   */
  setPresence(status: 'online' | 'away' | 'offline', statusMessage?: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('set_presence', { status, statusMessage });
    }
  }

  /**
   * Search messages
   */
  searchMessages(query: string, roomId?: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('search_messages', { query, roomId });
    }
  }
}

// Export singleton instance
export const chatWebSocket = new ChatWebSocketService();
