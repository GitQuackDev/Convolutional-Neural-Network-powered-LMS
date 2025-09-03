/**
 * ChatService
 * REST API integration for chat functionality
 */

import { apiClient } from '@/lib/apiClient';
import type { ChatMessage, OnlineUser, ChatPermissions } from '@/types/communication';

export interface ChatHistoryParams {
  courseId: string;
  moduleId?: string;
  contentId?: string;
  before?: Date;
  limit?: number;
}

export interface CreateMessageParams {
  courseId: string;
  moduleId?: string;
  contentId?: string;
  content: string;
  messageType?: string;
}

export interface UpdateMessageParams {
  messageId: string;
  content: string;
}

export interface ChatPermissionsParams {
  courseId: string;
  moduleId?: string;
  contentId?: string;
}

export interface ChatStatsResponse {
  totalMessages: number;
  activeUsers: number;
  lastActivity: Date;
}

export class ChatService {
  /**
   * Load chat message history with pagination
   */
  static async getChatHistory({
    courseId,
    moduleId,
    contentId,
    before,
    limit = 50
  }: ChatHistoryParams): Promise<ChatMessage[]> {
    const params = new URLSearchParams({
      limit: limit.toString()
    });

    if (moduleId) params.append('moduleId', moduleId);
    if (contentId) params.append('contentId', contentId);
    if (before) params.append('before', before.toISOString());

    const response = await apiClient.get(`/api/chat/${courseId}/messages?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load chat history: ${response.statusText}`);
    }

    const data = await response.json() as { messages: Record<string, unknown>[] };
    
    // Convert date strings to Date objects
    return data.messages.map((message: Record<string, unknown>) => ({
      ...message,
      createdAt: new Date(message.createdAt as string),
      editedAt: message.editedAt ? new Date(message.editedAt as string) : undefined
    })) as ChatMessage[];
  }

  /**
   * Create a new chat message
   */
  static async createMessage({
    courseId,
    moduleId,
    contentId,
    content,
    messageType = 'text'
  }: CreateMessageParams): Promise<ChatMessage> {
    const response = await apiClient.post(`/api/chat/${courseId}/messages`, {
      moduleId,
      contentId,
      content,
      messageType
    });

    if (!response.ok) {
      throw new Error(`Failed to create message: ${response.statusText}`);
    }

    const data = await response.json() as { message: Record<string, unknown> };
    
    return {
      ...data.message,
      createdAt: new Date(data.message.createdAt as string),
      editedAt: data.message.editedAt ? new Date(data.message.editedAt as string) : undefined
    } as ChatMessage;
  }

  /**
   * Update an existing chat message
   */
  static async updateMessage({
    messageId,
    content
  }: UpdateMessageParams): Promise<ChatMessage> {
    const response = await apiClient.put(`/api/chat/messages/${messageId}`, {
      content
    });

    if (!response.ok) {
      throw new Error(`Failed to update message: ${response.statusText}`);
    }

    const data = await response.json() as { message: Record<string, unknown> };
    
    return {
      ...data.message,
      createdAt: new Date(data.message.createdAt as string),
      editedAt: data.message.editedAt ? new Date(data.message.editedAt as string) : undefined
    } as ChatMessage;
  }

  /**
   * Delete a chat message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    const response = await apiClient.delete(`/api/chat/messages/${messageId}`);

    if (!response.ok) {
      throw new Error(`Failed to delete message: ${response.statusText}`);
    }
  }

  /**
   * Mark a message as read
   */
  static async markMessageAsRead(messageId: string): Promise<void> {
    const response = await apiClient.post(`/api/chat/messages/${messageId}/read`);

    if (!response.ok) {
      throw new Error(`Failed to mark message as read: ${response.statusText}`);
    }
  }

  /**
   * Get chat permissions for current user in a context
   */
  static async getChatPermissions({
    courseId,
    moduleId,
    contentId
  }: ChatPermissionsParams): Promise<ChatPermissions> {
    const params = new URLSearchParams();
    if (moduleId) params.append('moduleId', moduleId);
    if (contentId) params.append('contentId', contentId);

    const response = await apiClient.get(`/api/chat/${courseId}/permissions?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to get chat permissions: ${response.statusText}`);
    }

    const data = await response.json() as { permissions: ChatPermissions };
    return data.permissions;
  }

  /**
   * Get online users in a chat context
   */
  static async getOnlineUsers({
    courseId,
    moduleId,
    contentId
  }: ChatPermissionsParams): Promise<OnlineUser[]> {
    const params = new URLSearchParams();
    if (moduleId) params.append('moduleId', moduleId);
    if (contentId) params.append('contentId', contentId);

    const response = await apiClient.get(`/api/chat/${courseId}/online?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to get online users: ${response.statusText}`);
    }

    const data = await response.json() as { users: Record<string, unknown>[] };
    
    // Convert date strings to Date objects
    return data.users.map((user: Record<string, unknown>) => ({
      ...user,
      lastSeen: new Date(user.lastSeen as string)
    })) as OnlineUser[];
  }

  /**
   * Get chat statistics for a context
   */
  static async getChatStats({
    courseId,
    moduleId,
    contentId
  }: ChatPermissionsParams): Promise<ChatStatsResponse> {
    const params = new URLSearchParams();
    if (moduleId) params.append('moduleId', moduleId);
    if (contentId) params.append('contentId', contentId);

    const response = await apiClient.get(`/api/chat/${courseId}/stats?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to get chat stats: ${response.statusText}`);
    }

    const data = await response.json() as { stats: Record<string, unknown> };
    
    return {
      ...data.stats,
      lastActivity: new Date(data.stats.lastActivity as string)
    } as ChatStatsResponse;
  }

  /**
   * Search chat messages
   */
  static async searchMessages({
    courseId,
    moduleId,
    contentId,
    query,
    limit = 20,
    before
  }: ChatHistoryParams & { query: string }): Promise<ChatMessage[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });

    if (moduleId) params.append('moduleId', moduleId);
    if (contentId) params.append('contentId', contentId);
    if (before) params.append('before', before.toISOString());

    const response = await apiClient.get(`/api/chat/${courseId}/search?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to search messages: ${response.statusText}`);
    }

    const data = await response.json() as { messages: Record<string, unknown>[] };
    
    // Convert date strings to Date objects
    return data.messages.map((message: Record<string, unknown>) => ({
      ...message,
      createdAt: new Date(message.createdAt as string),
      editedAt: message.editedAt ? new Date(message.editedAt as string) : undefined
    })) as ChatMessage[];
  }

  /**
   * Report a message for moderation
   */
  static async reportMessage(messageId: string, reason: string): Promise<void> {
    const response = await apiClient.post(`/api/chat/messages/${messageId}/report`, {
      reason
    });

    if (!response.ok) {
      throw new Error(`Failed to report message: ${response.statusText}`);
    }
  }

  /**
   * Pin/unpin a message (requires permissions)
   */
  static async toggleMessagePin(messageId: string, pinned: boolean): Promise<void> {
    const response = await apiClient.post(`/api/chat/messages/${messageId}/pin`, {
      pinned
    });

    if (!response.ok) {
      throw new Error(`Failed to toggle message pin: ${response.statusText}`);
    }
  }
}
