/**
 * Chat WebSocket React Hook
 * Provides React integration for real-time chat functionality
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { chatWebSocket } from '@/services/websocket/chatWebSocket';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessage, ChatRoom, UserPresence, TypingIndicator } from '@/services/websocket/chatWebSocket';

interface UseChatWebSocketState {
  isConnected: boolean;
  currentRooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: ChatMessage[];
  onlineUsers: UserPresence[];
  typingUsers: TypingIndicator[];
  connectionError: string | null;
  messageHistory: Map<string, ChatMessage[]>;
  unreadCounts: Map<string, number>;
  lastSeen: Map<string, string>;
}

interface UseChatWebSocketActions {
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Room management
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  createRoom: (name: string, type: 'public' | 'private' | 'direct', participants?: string[]) => void;
  updateRoom: (roomId: string, updates: Partial<Pick<ChatRoom, 'name' | 'description' | 'settings'>>) => void;
  deleteRoom: (roomId: string) => void;
  
  // Message management
  sendMessage: (roomId: string, content: string, attachments?: { name: string; url: string; type: string }[]) => void;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  getMessageHistory: (roomId: string, beforeTimestamp?: string, limit?: number) => void;
  markAsRead: (roomId: string, lastMessageId?: string) => void;
  
  // Presence and typing
  setPresence: (status: 'online' | 'away' | 'busy' | 'offline', statusMessage?: string) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  
  // Utilities
  setActiveRoom: (room: ChatRoom | null) => void;
  clearError: () => void;
  getUnreadCount: (roomId: string) => number;
  getTotalUnreadCount: () => number;
  searchMessages: (query: string, roomId?: string) => void;
}

interface UseChatWebSocketOptions {
  autoConnect?: boolean;
  enablePresence?: boolean;
  enableTypingIndicators?: boolean;
  messageLimit?: number;
}

export function useChatWebSocket(options: UseChatWebSocketOptions = {}): [UseChatWebSocketState, UseChatWebSocketActions] {
  const { user } = useAuth();
  const {
    autoConnect = true,
    enablePresence = true,
    enableTypingIndicators = true,
    messageLimit = 50
  } = options;

  // State management
  const [state, setState] = useState<UseChatWebSocketState>({
    isConnected: false,
    currentRooms: [],
    activeRoom: null,
    messages: [],
    onlineUsers: [],
    typingUsers: [],
    connectionError: null,
    messageHistory: new Map(),
    unreadCounts: new Map(),
    lastSeen: new Map()
  });

  // Refs for stable references
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connection management
  const connect = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setState(prev => ({ ...prev, connectionError: 'User not authenticated' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, connectionError: null }));
      await chatWebSocket.connect(user.id);

      // Subscribe to all chat events
      const unsubscribe = chatWebSocket.subscribeToChat({
        onMessageReceived: (message: ChatMessage) => {
          setState(prev => {
            const roomHistory = prev.messageHistory.get(message.roomId) || [];
            const updatedHistory = [...roomHistory, message].slice(-messageLimit);
            
            const newMessageHistory = new Map(prev.messageHistory);
            newMessageHistory.set(message.roomId, updatedHistory);

            // Update messages if this is the active room
            const updatedMessages = prev.activeRoom?.id === message.roomId 
              ? updatedHistory 
              : prev.messages;

            // Update unread count if not active room or window not focused
            const newUnreadCounts = new Map(prev.unreadCounts);
            if (prev.activeRoom?.id !== message.roomId || !document.hasFocus()) {
              const currentCount = newUnreadCounts.get(message.roomId) || 0;
              newUnreadCounts.set(message.roomId, currentCount + 1);
            }

            return {
              ...prev,
              messages: updatedMessages,
              messageHistory: newMessageHistory,
              unreadCounts: newUnreadCounts
            };
          });
        },

        onMessageUpdated: (message: ChatMessage) => {
          setState(prev => {
            const roomHistory = prev.messageHistory.get(message.roomId) || [];
            const updatedHistory = roomHistory.map(msg => 
              msg.id === message.id ? message : msg
            );
            
            const newMessageHistory = new Map(prev.messageHistory);
            newMessageHistory.set(message.roomId, updatedHistory);

            const updatedMessages = prev.activeRoom?.id === message.roomId 
              ? updatedHistory 
              : prev.messages;

            return {
              ...prev,
              messages: updatedMessages,
              messageHistory: newMessageHistory
            };
          });
        },

        onMessageDeleted: (data: { messageId: string; roomId: string }) => {
          setState(prev => {
            const roomHistory = prev.messageHistory.get(data.roomId) || [];
            const updatedHistory = roomHistory.filter(msg => msg.id !== data.messageId);
            
            const newMessageHistory = new Map(prev.messageHistory);
            newMessageHistory.set(data.roomId, updatedHistory);

            const updatedMessages = prev.activeRoom?.id === data.roomId 
              ? updatedHistory 
              : prev.messages;

            return {
              ...prev,
              messages: updatedMessages,
              messageHistory: newMessageHistory
            };
          });
        },

        onRoomJoined: (room: ChatRoom) => {
          setState(prev => ({
            ...prev,
            currentRooms: [...prev.currentRooms.filter(r => r.id !== room.id), room]
          }));
        },

        onRoomLeft: (data: { roomId: string }) => {
          setState(prev => {
            const newMessageHistory = new Map(prev.messageHistory);
            newMessageHistory.delete(data.roomId);
            
            const newUnreadCounts = new Map(prev.unreadCounts);
            newUnreadCounts.delete(data.roomId);
            
            const newLastSeen = new Map(prev.lastSeen);
            newLastSeen.delete(data.roomId);

            return {
              ...prev,
              currentRooms: prev.currentRooms.filter(r => r.id !== data.roomId),
              activeRoom: prev.activeRoom?.id === data.roomId ? null : prev.activeRoom,
              messages: prev.activeRoom?.id === data.roomId ? [] : prev.messages,
              messageHistory: newMessageHistory,
              unreadCounts: newUnreadCounts,
              lastSeen: newLastSeen
            };
          });
        },

        onRoomUpdated: (room: ChatRoom) => {
          setState(prev => ({
            ...prev,
            currentRooms: prev.currentRooms.map(r => r.id === room.id ? room : r),
            activeRoom: prev.activeRoom?.id === room.id ? room : prev.activeRoom
          }));
        },

        onUserPresence: enablePresence ? (presence: UserPresence) => {
          setState(prev => ({
            ...prev,
            onlineUsers: prev.onlineUsers.filter(u => u.userId !== presence.userId).concat(presence)
          }));
        } : undefined,

        onTypingStart: enableTypingIndicators ? (indicator: TypingIndicator) => {
          setState(prev => ({
            ...prev,
            typingUsers: prev.typingUsers.filter(t => 
              !(t.userId === indicator.userId && t.roomId === indicator.roomId)
            ).concat(indicator)
          }));
        } : undefined,

        onTypingStop: enableTypingIndicators ? (data: { userId: string; roomId: string }) => {
          setState(prev => ({
            ...prev,
            typingUsers: prev.typingUsers.filter(t => 
              !(t.userId === data.userId && t.roomId === data.roomId)
            )
          }));
        } : undefined
      });

      unsubscribeRef.current = unsubscribe;

      setState(prev => ({ ...prev, isConnected: true, connectionError: null }));

      // Get user's current rooms
      chatWebSocket.getUserRooms();

    } catch (error) {
      console.error('[useChatWebSocket] Connection error:', error);
      setState(prev => ({ 
        ...prev, 
        connectionError: error instanceof Error ? error.message : 'Connection failed',
        isConnected: false 
      }));

      // Schedule reconnection attempt
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        if (autoConnect) {
          connect();
        }
      }, 5000);
    }
  }, [user?.id, enablePresence, enableTypingIndicators, messageLimit, autoConnect]);

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Clear all timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    typingTimeoutRef.current.clear();

    chatWebSocket.disconnect();

    setState({
      isConnected: false,
      currentRooms: [],
      activeRoom: null,
      messages: [],
      onlineUsers: [],
      typingUsers: [],
      connectionError: null,
      messageHistory: new Map(),
      unreadCounts: new Map(),
      lastSeen: new Map()
    });
  }, []);

  // Room management actions
  const joinRoom = useCallback((roomId: string) => {
    chatWebSocket.joinRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    chatWebSocket.leaveRoom(roomId);
  }, []);

  const createRoom = useCallback((name: string, type: 'public' | 'private' | 'direct', participants?: string[]) => {
    chatWebSocket.createRoom({ name, type, participants });
  }, []);

  const updateRoom = useCallback((roomId: string, updates: Partial<Pick<ChatRoom, 'name' | 'description' | 'settings'>>) => {
    chatWebSocket.updateRoom(roomId, updates);
  }, []);

  const deleteRoom = useCallback((roomId: string) => {
    chatWebSocket.deleteRoom(roomId);
  }, []);

  // Message management actions
  const sendMessage = useCallback((roomId: string, content: string, attachments?: { name: string; url: string; type: string }[]) => {
    // If attachments exist, treat as file message, otherwise text
    const messageType: 'text' | 'file' = attachments && attachments.length > 0 ? 'file' : 'text';
    chatWebSocket.sendMessage(roomId, content, messageType);
  }, []);

  const editMessage = useCallback((messageId: string, newContent: string) => {
    chatWebSocket.editMessage(messageId, newContent);
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    chatWebSocket.deleteMessage(messageId);
  }, []);

  const reactToMessage = useCallback((messageId: string, emoji: string) => {
    chatWebSocket.reactToMessage(messageId, emoji);
  }, []);

  const getMessageHistory = useCallback((roomId: string, beforeTimestamp?: string, limit?: number) => {
    // Convert string timestamp to number if provided
    const timestampNumber = beforeTimestamp ? new Date(beforeTimestamp).getTime() : undefined;
    chatWebSocket.getMessageHistory(roomId, timestampNumber, limit || messageLimit);
  }, [messageLimit]);

  const markAsRead = useCallback((roomId: string, lastMessageId?: string) => {
    chatWebSocket.markAsRead(roomId, lastMessageId);
    
    setState(prev => {
      const newUnreadCounts = new Map(prev.unreadCounts);
      newUnreadCounts.set(roomId, 0);
      
      const newLastSeen = new Map(prev.lastSeen);
      newLastSeen.set(roomId, new Date().toISOString());
      
      return {
        ...prev,
        unreadCounts: newUnreadCounts,
        lastSeen: newLastSeen
      };
    });
  }, []);

  // Presence and typing actions
  const setPresence = useCallback((status: 'online' | 'away' | 'busy' | 'offline', statusMessage?: string) => {
    if (enablePresence) {
      // Map 'busy' to 'away' for backend compatibility
      const backendStatus: 'online' | 'away' | 'offline' = status === 'busy' ? 'away' : status as 'online' | 'away' | 'offline';
      chatWebSocket.setPresence(backendStatus, statusMessage);
    }
  }, [enablePresence]);

  const startTyping = useCallback((roomId: string) => {
    if (enableTypingIndicators) {
      chatWebSocket.startTyping(roomId);
      
      // Auto-stop typing after 3 seconds
      const existingTimeout = typingTimeoutRef.current.get(roomId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      const timeout = setTimeout(() => {
        stopTyping(roomId);
      }, 3000);
      
      typingTimeoutRef.current.set(roomId, timeout);
    }
  }, [enableTypingIndicators]);

  const stopTyping = useCallback((roomId: string) => {
    if (enableTypingIndicators) {
      chatWebSocket.stopTyping(roomId);
      
      const timeout = typingTimeoutRef.current.get(roomId);
      if (timeout) {
        clearTimeout(timeout);
        typingTimeoutRef.current.delete(roomId);
      }
    }
  }, [enableTypingIndicators]);

  // Utility actions
  const setActiveRoom = useCallback((room: ChatRoom | null) => {
    setState(prev => {
      if (room) {
        // Load messages for the active room
        const roomMessages = prev.messageHistory.get(room.id) || [];
        
        // Mark room as read when switching to it
        if (roomMessages.length > 0) {
          markAsRead(room.id, roomMessages[roomMessages.length - 1].id);
        }
        
        return {
          ...prev,
          activeRoom: room,
          messages: roomMessages
        };
      } else {
        return {
          ...prev,
          activeRoom: null,
          messages: []
        };
      }
    });
  }, [markAsRead]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, connectionError: null }));
  }, []);

  const getUnreadCount = useCallback((roomId: string): number => {
    return state.unreadCounts.get(roomId) || 0;
  }, [state.unreadCounts]);

  const getTotalUnreadCount = useCallback((): number => {
    return Array.from(state.unreadCounts.values()).reduce((total, count) => total + count, 0);
  }, [state.unreadCounts]);

  const searchMessages = useCallback((query: string, roomId?: string) => {
    chatWebSocket.searchMessages(query, roomId);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && user?.id && !state.isConnected) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, user?.id, connect, disconnect]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Actions object
  const actions: UseChatWebSocketActions = {
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    getMessageHistory,
    markAsRead,
    setPresence,
    startTyping,
    stopTyping,
    setActiveRoom,
    clearError,
    getUnreadCount,
    getTotalUnreadCount,
    searchMessages
  };

  return [state, actions];
}
