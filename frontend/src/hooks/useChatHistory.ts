import { useState, useCallback, useEffect } from 'react';
import { chatHistoryService } from '@/services/chatHistoryService';
import type { ChatMessage, ChatHistoryFilters, MessageEditRequest, MessageDeleteRequest } from '@/services/chatHistoryService';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

interface UseChatHistoryProps {
  contextType: 'course' | 'module' | 'content';
  contextId: string;
}

interface UseChatHistoryReturn {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  hasNextPage: boolean;
  isSearching: boolean;
  searchResults: ChatMessage[];
  
  // Actions
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  searchMessages: (query: string, filters?: ChatHistoryFilters) => Promise<void>;
  clearSearch: () => void;
  editMessage: (request: MessageEditRequest) => Promise<void>;
  deleteMessage: (request: MessageDeleteRequest) => Promise<void>;
  exportHistory: (format?: 'json' | 'csv' | 'txt') => Promise<void>;
  
  // Utilities
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (messageId: string) => void;
}

export function useChatHistory({ contextType, contextId }: UseChatHistoryProps): UseChatHistoryReturn {
  const { user } = useAuth();
  const { canEditMessage, canDeleteMessage } = usePermissions({ courseId: contextId });

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);

  /**
   * Load initial chat history
   */
  const loadHistory = useCallback(async (reset = false) => {
    if (isLoading && !reset) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatHistoryService.getChatHistory(
        contextType,
        contextId,
        {
          limit: 50,
          cursor: reset ? undefined : nextCursor,
        }
      );

      if (reset) {
        setMessages(response.messages);
      } else {
        setMessages(prev => [...prev, ...response.messages]);
      }

      setHasNextPage(response.hasNextPage);
      setNextCursor(response.nextCursor);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chat history';
      setError(errorMessage);
      console.error('❌ Error loading chat history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [contextType, contextId, nextCursor, isLoading]);

  /**
   * Load more messages (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoading) return;
    await loadHistory(false);
  }, [hasNextPage, isLoading, loadHistory]);

  /**
   * Refresh chat history
   */
  const refresh = useCallback(async () => {
    setNextCursor(undefined);
    await loadHistory(true);
  }, [loadHistory]);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  /**
   * Search messages with filters
   */
  const searchMessages = useCallback(async (query: string, filters?: ChatHistoryFilters) => {
    if (!query.trim()) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await chatHistoryService.searchMessages(
        query,
        contextType,
        contextId,
        { filters }
      );

      setSearchResults(response.messages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search messages';
      setError(errorMessage);
      console.error('❌ Error searching messages:', err);
    } finally {
      setIsSearching(false);
    }
  }, [contextType, contextId, clearSearch]);

  /**
   * Edit a message
   */
  const editMessage = useCallback(async (request: MessageEditRequest) => {
    if (!user) throw new Error('User not authenticated');
    
    // Check permissions
    const message = messages.find(m => m.id === request.messageId);
    if (!message) throw new Error('Message not found');
    
    if (!canEditMessage(message.authorId)) {
      throw new Error('You do not have permission to edit this message');
    }

    setError(null);

    try {
      const updatedMessage = await chatHistoryService.editMessage(request);
      
      // Update local state
      updateMessage(request.messageId, updatedMessage);
      
      // Also update search results if they contain this message
      setSearchResults(prev => 
        prev.map(msg => msg.id === request.messageId ? updatedMessage : msg)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit message';
      setError(errorMessage);
      throw err;
    }
  }, [user, messages, canEditMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Delete a message
   */
  const deleteMessage = useCallback(async (request: MessageDeleteRequest) => {
    if (!user) throw new Error('User not authenticated');
    
    // Check permissions
    const message = messages.find(m => m.id === request.messageId);
    if (!message) throw new Error('Message not found');
    
    if (!canDeleteMessage(message.authorId)) {
      throw new Error('You do not have permission to delete this message');
    }

    setError(null);

    try {
      await chatHistoryService.deleteMessage(request);
      
      // Update local state based on soft/hard delete
      if (request.softDelete ?? true) {
        updateMessage(request.messageId, { 
          deleted: true, 
          deletedAt: new Date(),
          content: '[Message deleted]'
        });
      } else {
        removeMessage(request.messageId);
      }
      
      // Also update search results
      setSearchResults(prev => 
        prev.filter(msg => msg.id !== request.messageId)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
      setError(errorMessage);
      throw err;
    }
  }, [user, messages, canDeleteMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Export chat history
   */
  const exportHistory = useCallback(async (format: 'json' | 'csv' | 'txt' = 'json') => {
    setError(null);

    try {
      const blob = await chatHistoryService.exportChatHistory(contextType, contextId, format);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-history-${contextId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export chat history';
      setError(errorMessage);
      throw err;
    }
  }, [contextType, contextId]);

  /**
   * Add a new message to the local state (for real-time updates)
   */
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [message, ...prev]);
  }, []);

  /**
   * Update an existing message in local state
   */
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...updates, edited: true, editedAt: new Date() }
          : msg
      )
    );
  }, []);

  /**
   * Remove a message from local state
   */
  const removeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // Load initial history when component mounts
  useEffect(() => {
    if (contextType && contextId) {
      loadHistory(true);
    }
  }, [contextType, contextId, loadHistory]);

  return {
    // State
    messages,
    isLoading,
    error,
    hasNextPage,
    isSearching,
    searchResults,
    
    // Actions
    loadMore,
    refresh,
    searchMessages,
    clearSearch,
    editMessage,
    deleteMessage,
    exportHistory,
    
    // Utilities
    addMessage,
    updateMessage,
    removeMessage,
  };
}

export default useChatHistory;
