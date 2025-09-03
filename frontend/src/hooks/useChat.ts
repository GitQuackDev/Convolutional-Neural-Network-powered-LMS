/**
 * useChat Hook
 * Chat state management and WebSocket integration for real-time messaging
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import type { 
  ChatMessage, 
  OnlineUser, 
  UseChatReturn
} from '@/types/communication';
import { MessageType } from '@/types/communication';

interface UseChatOptions {
  courseId: string;
  moduleId?: string;
  contentId?: string;
  autoConnect?: boolean;
}

interface WebSocketMessage {
  type: string;
  message?: ChatMessage;
  messageId?: string;
  content?: string;
  editedAt?: string;
  userId?: string;
  isTyping?: boolean;
  user?: OnlineUser;
  messages?: ChatMessage[];
  users?: OnlineUser[];
  [key: string]: unknown;
}

export function useChat({
  courseId,
  moduleId,
  contentId,
  autoConnect = true
}: UseChatOptions): UseChatReturn {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const messagesLoadedRef = useRef(false);

  // Get permissions for chat access control
  const {
    isEnrolled,
    canSendMessages,
    canEditMessage,
    canDeleteMessage,
    isRestricted,
    restrictionReason
  } = usePermissions({
    courseId,
    moduleId,
    contentId,
    autoLoad: true
  });

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
    switch (data.type) {
      case 'message_sent':
        if (data.message) {
          setMessages(prev => [...prev, data.message!]);
        }
        break;
        
      case 'message_edited':
        if (data.messageId && data.content && data.editedAt) {
          setMessages(prev => prev.map(msg => 
            msg.id === data.messageId 
              ? { ...msg, content: data.content as string, isEdited: true, editedAt: new Date(data.editedAt as string) }
              : msg
          ));
        }
        break;
        
      case 'message_deleted':
        if (data.messageId) {
          setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
        }
        break;
        
      case 'user_typing':
        if (data.userId !== user?.id && data.userId && typeof data.isTyping === 'boolean') {
          setOnlineUsers(prev => prev.map(u => 
            u.id === data.userId 
              ? { ...u, isTyping: data.isTyping as boolean }
              : u
          ));
        }
        break;
        
      case 'user_joined':
        if (data.user) {
          setOnlineUsers(prev => {
            const exists = prev.find(u => u.id === data.user!.id);
            if (exists) {
              return prev.map(u => u.id === data.user!.id ? data.user! : u);
            }
            return [...prev, data.user!];
          });
        }
        break;
        
      case 'user_left':
        if (data.userId) {
          setOnlineUsers(prev => prev.filter(u => u.id !== data.userId));
        }
        break;
        
      case 'user_online_status':
        if (data.userId) {
          setOnlineUsers(prev => prev.map(u => 
            u.id === data.userId 
              ? { ...u, lastSeen: new Date() }
              : u
          ));
        }
        break;
        
      case 'chat_history':
        if (!messagesLoadedRef.current && data.messages) {
          setMessages(data.messages);
          messagesLoadedRef.current = true;
        }
        break;
        
      case 'online_users':
        if (data.users) {
          setOnlineUsers(data.users);
        }
        break;
        
      default:
        console.log('🔔 Unknown chat message type:', data.type);
    }
  }, [user?.id]);

  // WebSocket connection management
  const connect = useCallback(() => {
    if (!user || !token || !isEnrolled || socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Connect to WebSocket chat namespace
      const wsUrl = `ws://localhost:3001/chat?token=${token}&courseId=${courseId}${moduleId ? `&moduleId=${moduleId}` : ''}${contentId ? `&contentId=${contentId}` : ''}`;
      
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log('🔗 Chat WebSocket connected');
        setIsConnected(true);
        
        // Join the course chat room
        if (socketRef.current) {
          socketRef.current.send(JSON.stringify({
            type: 'join_chat',
            courseId,
            moduleId,
            contentId,
            userId: user.id
          }));
        }
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      socketRef.current.onclose = () => {
        console.log('🔌 Chat WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds if still enrolled
        if (autoConnect && isEnrolled && !reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = undefined;
            connect();
          }, 3000);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('❌ Chat WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('❌ Failed to connect to chat WebSocket:', error);
      setIsConnected(false);
    }
  }, [user, token, courseId, moduleId, contentId, autoConnect, isEnrolled, handleWebSocketMessage]);

  // Send message via WebSocket
  const sendMessage = useCallback((content: string, type: MessageType = MessageType.TEXT) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected, cannot send message');
      return;
    }

    if (!canSendMessages) {
      console.error('❌ User does not have permission to send messages');
      if (isRestricted && restrictionReason) {
        console.error(`❌ User restricted: ${restrictionReason}`);
      }
      return;
    }

    const messageData = {
      type: 'send_message',
      content,
      messageType: type,
      courseId,
      moduleId,
      contentId
    };

    socketRef.current.send(JSON.stringify(messageData));
  }, [courseId, moduleId, contentId, canSendMessages, isRestricted, restrictionReason]);

  // Edit message via WebSocket
  const editMessage = useCallback((messageId: string, content: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected, cannot edit message');
      return;
    }

    // Find the message to check ownership
    const message = messages.find(msg => msg.id === messageId);
    if (!message) {
      console.error('❌ Message not found, cannot edit');
      return;
    }

    if (!canEditMessage(message.senderId)) {
      console.error('❌ User does not have permission to edit this message');
      return;
    }

    const editData = {
      type: 'edit_message',
      messageId,
      content
    };

    socketRef.current.send(JSON.stringify(editData));
  }, [messages, canEditMessage]);

  // Delete message via WebSocket
  const deleteMessage = useCallback((messageId: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected, cannot delete message');
      return;
    }

    // Find the message to check ownership
    const message = messages.find(msg => msg.id === messageId);
    if (!message) {
      console.error('❌ Message not found, cannot delete');
      return;
    }

    if (!canDeleteMessage(message.senderId)) {
      console.error('❌ User does not have permission to delete this message');
      return;
    }

    const deleteData = {
      type: 'delete_message',
      messageId
    };

    socketRef.current.send(JSON.stringify(deleteData));
  }, [messages, canDeleteMessage]);

  // Load chat history with pagination
  const loadHistory = useCallback(async (before?: Date, limit: number = 50): Promise<ChatMessage[]> => {
    try {
      const { ChatService } = await import('@/services/chatService');
      return await ChatService.getChatHistory({
        courseId,
        moduleId,
        contentId,
        before,
        limit
      });
    } catch (error) {
      console.error('❌ Failed to load chat history:', error);
      return [];
    }
  }, [courseId, moduleId, contentId]);

  // Mark message as read
  const markAsRead = useCallback((messageId: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const readData = {
      type: 'mark_read',
      messageId
    };

    socketRef.current.send(JSON.stringify(readData));
  }, []);

  // Set typing indicator
  const setTypingIndicator = useCallback((typing: boolean) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    setIsTyping(typing);

    const typingData = {
      type: 'user_typing',
      isTyping: typing,
      courseId,
      moduleId,
      contentId
    };

    socketRef.current.send(JSON.stringify(typingData));

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds
    if (typing) {
      typingTimeoutRef.current = setTimeout(() => {
        setTypingIndicator(false);
      }, 3000);
    }
  }, [courseId, moduleId, contentId]);

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (autoConnect && user && token && isEnrolled) {
      connect();
    }

    return () => {
      // Cleanup on unmount
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [connect, autoConnect, user, token, isEnrolled]);

  return {
    messages,
    onlineUsers,
    isConnected,
    isTyping,
    sendMessage,
    editMessage,
    deleteMessage,
    loadHistory,
    markAsRead,
    setTyping: setTypingIndicator
  };
}
