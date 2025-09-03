import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Download, 
  Filter, 
  Edit, 
  Trash2, 
  History, 
  Calendar,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import type { ChatMessage, ChatHistoryFilters } from '@/services/chatHistoryService';

interface ChatHistoryPanelProps {
  contextType: 'course' | 'module' | 'content';
  contextId: string;
  className?: string;
}

export function ChatHistoryPanel({ contextType, contextId, className }: ChatHistoryPanelProps) {
  const { user } = useAuth();
  const { canModerate } = usePermissions({ courseId: contextId });
  
  const {
    messages,
    isLoading,
    error,
    hasNextPage,
    isSearching,
    searchResults,
    loadMore,
    refresh,
    searchMessages,
    clearSearch,
    editMessage,
    deleteMessage,
    exportHistory,
  } = useChatHistory({ contextType, contextId });

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editReason, setEditReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [filters, setFilters] = useState<ChatHistoryFilters>({});
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Handle search
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchMessages(searchQuery, filters);
    } else {
      clearSearch();
    }
  };

  // Handle message edit
  const handleEditMessage = async () => {
    if (!selectedMessage || !editContent.trim()) return;

    try {
      await editMessage({
        messageId: selectedMessage.id,
        newContent: editContent,
        reason: editReason.trim() || undefined,
      });
      
      setIsEditing(false);
      setSelectedMessage(null);
      setEditContent('');
      setEditReason('');
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  // Handle message delete
  const handleDeleteMessage = async (message: ChatMessage, reason?: string) => {
    try {
      await deleteMessage({
        messageId: message.id,
        reason,
        softDelete: true,
      });
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Start editing a message
  const startEditing = (message: ChatMessage) => {
    setSelectedMessage(message);
    setEditContent(message.content);
    setEditReason('');
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setSelectedMessage(null);
    setEditContent('');
    setEditReason('');
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'professor':
        return 'default';
      case 'admin':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Display messages (search results or regular messages)
  const displayMessages = searchResults.length > 0 ? searchResults : messages;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Chat History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {canModerate && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportHistory('json')}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
              <div>
                <label className="text-sm font-medium">Author Role</label>
                <Select 
                  value={filters.authorRole || ''} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, authorRole: value as 'student' | 'professor' | 'admin' | undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any role</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Date From</label>
                <Input
                  type="date"
                  value={filters.dateFrom?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateFrom: e.target.value ? new Date(e.target.value) : undefined 
                  }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date To</label>
                <Input
                  type="date"
                  value={filters.dateTo?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateTo: e.target.value ? new Date(e.target.value) : undefined 
                  }))}
                />
              </div>
            </div>
          )}

          {/* Search Results Info */}
          {searchResults.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{searchResults.length} search results</span>
              <Button variant="ghost" size="sm" onClick={clearSearch}>
                Clear search
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="text-destructive text-sm mb-4 p-3 bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {/* Messages List */}
        <ScrollArea className="h-96" ref={scrollAreaRef}>
          <div className="space-y-4">
            {displayMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages found</p>
              </div>
            ) : (
              displayMessages.map((message) => (
                <div key={message.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{message.authorName}</span>
                      <Badge variant={getRoleBadgeVariant(message.authorRole)}>
                        {message.authorRole}
                      </Badge>
                      {message.edited && (
                        <Badge variant="outline" className="text-xs">
                          Edited
                        </Badge>
                      )}
                      {message.deleted && (
                        <Badge variant="destructive" className="text-xs">
                          Deleted
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatTimestamp(message.timestamp)}
                      {(user?.id === message.authorId || canModerate) && !message.deleted && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(message)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMessage(message)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm">
                    {message.deleted ? (
                      <span className="italic text-muted-foreground">[Message deleted]</span>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.editedAt && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Last edited: {formatTimestamp(message.editedAt)}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Load More Button */}
            {hasNextPage && searchResults.length === 0 && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={loadMore} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Edit Message Modal */}
        {isEditing && selectedMessage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md m-4">
              <CardHeader>
                <CardTitle>Edit Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Message Content</label>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    placeholder="Enter message content..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Edit Reason (Optional)</label>
                  <Input
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="Why are you editing this message?"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={cancelEditing}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleEditMessage}
                    disabled={!editContent.trim()}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ChatHistoryPanel;
