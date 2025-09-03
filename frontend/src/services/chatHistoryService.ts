import { apiClient } from '@/lib/apiClient';

export interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'professor' | 'admin';
  contextType: 'course' | 'module' | 'content';
  contextId: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  deleted?: boolean;
  deletedAt?: Date;
  metadata?: {
    replyTo?: string;
    attachments?: string[];
    mentions?: string[];
  };
}

export interface ChatHistoryFilters {
  contextType?: 'course' | 'module' | 'content';
  contextId?: string;
  authorId?: string;
  authorRole?: 'student' | 'professor' | 'admin';
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
  includeDeleted?: boolean;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  totalCount: number;
  hasNextPage: boolean;
  nextCursor?: string;
}

export interface MessageEditRequest {
  messageId: string;
  newContent: string;
  reason?: string;
}

export interface MessageDeleteRequest {
  messageId: string;
  reason?: string;
  softDelete?: boolean;
}

export interface ContentFilterResult {
  isAppropriate: boolean;
  confidence: number;
  flaggedCategories: string[];
  suggestedAction: 'allow' | 'review' | 'block';
}

class ChatHistoryService {
  private readonly baseUrl = '/api/chat/history';

  /**
   * Retrieve chat history with pagination and filtering
   */
  async getChatHistory(
    contextType: string,
    contextId: string,
    options: {
      limit?: number;
      cursor?: string;
      filters?: ChatHistoryFilters;
    } = {}
  ): Promise<ChatHistoryResponse> {
    try {
      const params = new URLSearchParams({
        contextType,
        contextId,
        limit: (options.limit || 50).toString(),
      });

      if (options.cursor) params.append('cursor', options.cursor);
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get(`${this.baseUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load chat history: ${response.statusText}`);
      }

      const data = await response.json() as {
        messages: Array<{
          id: string;
          content: string;
          authorId: string;
          authorName: string;
          authorRole: string;
          contextType: string;
          contextId: string;
          timestamp: string;
          edited?: boolean;
          editedAt?: string;
          deleted?: boolean;
          deletedAt?: string;
          metadata?: {
            replyTo?: string;
            attachments?: string[];
            mentions?: string[];
          };
        }>;
        totalCount: number;
        hasNextPage: boolean;
        nextCursor?: string;
      };
      
      return {
        ...data,
        messages: data.messages.map((msg) => ({
          ...msg,
          authorRole: msg.authorRole as 'student' | 'professor' | 'admin',
          contextType: msg.contextType as 'course' | 'module' | 'content',
          timestamp: new Date(msg.timestamp),
          editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined,
          deletedAt: msg.deletedAt ? new Date(msg.deletedAt) : undefined,
        })),
      };
    } catch (error) {
      console.error('❌ Failed to fetch chat history:', error);
      throw new Error('Failed to load chat history');
    }
  }

  /**
   * Search messages with advanced filtering
   */
  async searchMessages(
    query: string,
    contextType: string,
    contextId: string,
    options: {
      limit?: number;
      filters?: ChatHistoryFilters;
    } = {}
  ): Promise<ChatHistoryResponse> {
    try {
      const searchFilters = {
        ...options.filters,
        searchQuery: query,
      };

      return await this.getChatHistory(contextType, contextId, {
        limit: options.limit,
        filters: searchFilters,
      });
    } catch (error) {
      console.error('❌ Failed to search messages:', error);
      throw new Error('Failed to search messages');
    }
  }

  /**
   * Edit a message with audit trail
   */
  async editMessage(request: MessageEditRequest): Promise<ChatMessage> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${request.messageId}`, {
        content: request.newContent,
        reason: request.reason,
      });

      if (!response.ok) {
        throw new Error(`Failed to edit message: ${response.statusText}`);
      }

      const data = await response.json() as {
        id: string;
        content: string;
        authorId: string;
        authorName: string;
        authorRole: string;
        contextType: string;
        contextId: string;
        timestamp: string;
        editedAt?: string;
        metadata?: {
          replyTo?: string;
          attachments?: string[];
          mentions?: string[];
        };
      };

      return {
        ...data,
        authorRole: data.authorRole as 'student' | 'professor' | 'admin',
        contextType: data.contextType as 'course' | 'module' | 'content',
        timestamp: new Date(data.timestamp),
        editedAt: data.editedAt ? new Date(data.editedAt) : undefined,
      };
    } catch (error) {
      console.error('❌ Failed to edit message:', error);
      throw new Error('Failed to edit message');
    }
  }

  /**
   * Delete a message with audit trail
   */
  async deleteMessage(request: MessageDeleteRequest): Promise<void> {
    try {
      // Note: Send reason in query params since DELETE doesn't support body
      const params = new URLSearchParams();
      if (request.reason) params.append('reason', request.reason);
      if (request.softDelete !== undefined) params.append('softDelete', request.softDelete.toString());
      
      const url = `${this.baseUrl}/${request.messageId}${params.toString() ? `?${params}` : ''}`;
      const response = await apiClient.delete(url);
      
      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Failed to delete message:', error);
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Get message edit history
   */
  async getMessageHistory(messageId: string): Promise<{
    edits: Array<{
      version: number;
      content: string;
      editedBy: string;
      editedAt: Date;
      reason?: string;
    }>;
  }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${messageId}/history`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch message history: ${response.statusText}`);
      }

      const data = await response.json() as {
        edits: Array<{
          version: number;
          content: string;
          editedBy: string;
          editedAt: string;
          reason?: string;
        }>;
      };
      
      return {
        edits: data.edits.map((edit) => ({
          ...edit,
          editedAt: new Date(edit.editedAt),
        })),
      };
    } catch (error) {
      console.error('❌ Failed to fetch message history:', error);
      throw new Error('Failed to load message history');
    }
  }

  /**
   * Perform content filtering on message
   */
  async filterContent(content: string): Promise<ContentFilterResult> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/filter`, {
        content,
      });

      if (!response.ok) {
        throw new Error(`Content filtering failed: ${response.statusText}`);
      }

      return await response.json() as ContentFilterResult;
    } catch (error) {
      console.error('❌ Content filtering failed:', error);
      // Return safe default if filtering service fails
      return {
        isAppropriate: true,
        confidence: 0.5,
        flaggedCategories: [],
        suggestedAction: 'allow',
      };
    }
  }

  /**
   * Get chat statistics for analytics
   */
  async getChatStatistics(
    contextType: string,
    contextId: string,
    timeRange: {
      from: Date;
      to: Date;
    }
  ): Promise<{
    totalMessages: number;
    activeUsers: number;
    messagesByDay: Array<{ date: string; count: number }>;
    topUsers: Array<{ userId: string; username: string; messageCount: number }>;
  }> {
    try {
      const params = new URLSearchParams({
        contextType,
        contextId,
        from: timeRange.from.toISOString(),
        to: timeRange.to.toISOString(),
      });

      const response = await apiClient.get(`${this.baseUrl}/statistics?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.statusText}`);
      }

      return await response.json() as {
        totalMessages: number;
        activeUsers: number;
        messagesByDay: Array<{ date: string; count: number }>;
        topUsers: Array<{ userId: string; username: string; messageCount: number }>;
      };
    } catch (error) {
      console.error('❌ Failed to fetch chat statistics:', error);
      throw new Error('Failed to load chat statistics');
    }
  }

  /**
   * Export chat history for backup or analysis
   */
  async exportChatHistory(
    contextType: string,
    contextId: string,
    format: 'json' | 'csv' | 'txt' = 'json'
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        contextType,
        contextId,
        format,
      });

      const response = await apiClient.get(`${this.baseUrl}/export?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to export: ${response.statusText}`);
      }

      // For blob responses, we need to get the response as text first
      const text = await response.text();
      return new Blob([text], { 
        type: format === 'json' ? 'application/json' : 
             format === 'csv' ? 'text/csv' : 'text/plain' 
      });
    } catch (error) {
      console.error('❌ Failed to export chat history:', error);
      throw new Error('Failed to export chat history');
    }
  }
}

export const chatHistoryService = new ChatHistoryService();
export default chatHistoryService;
