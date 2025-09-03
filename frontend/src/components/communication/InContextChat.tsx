/**
 * InContextChat Component
 * Main embedded chat component that integrates into existing course views
 */

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ChatUserList } from './ChatUserList';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import type { InContextChatProps } from '@/types/communication';
import { MessageType } from '@/types/communication';

export function InContextChat({
  courseId,
  moduleId,
  contentId,
  context = 'course',
  embedded = true,
  initiallyExpanded = false,
  className
}: InContextChatProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [showParticipants, setShowParticipants] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real WebSocket integration using useChat hook
  const {
    messages,
    onlineUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    loadHistory
  } = useChat({
    courseId,
    moduleId,
    contentId,
    autoConnect: true
  });

  const unreadCount = messages.filter(msg => 
    user && !msg.readBy.includes(user.id)
  ).length;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial chat history
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (content: string, type: MessageType = MessageType.TEXT) => {
    sendMessage(content, type);
  };

  const handleEditMessage = (messageId: string, content: string) => {
    editMessage(messageId, content);
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(messageId);
  };

  const getContextTitle = () => {
    switch (context) {
      case 'module':
        return moduleId ? `Module Discussion` : 'Course Chat';
      case 'content':
        return contentId ? `Content Discussion` : 'Course Chat';
      default:
        return 'Course Chat';
    }
  };

  if (!user) {
    return null;
  }

  // Minimized state
  if (!isExpanded && embedded) {
    return (
      <Card className={cn('fixed bottom-4 right-4 w-80 z-50', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              className="p-0 h-auto font-medium"
              onClick={() => setIsExpanded(true)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {getContextTitle()}
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn(
      embedded 
        ? 'fixed bottom-4 right-4 w-96 h-[500px] z-50' 
        : 'w-full h-full',
      'flex flex-col',
      className
    )}>
      {/* Chat Header */}
      <CardHeader className="pb-2 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">{getContextTitle()}</span>
            <Badge variant="secondary" className="text-xs">
              {onlineUsers.length} online
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Participants Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
              className="h-8 w-8 p-0"
            >
              {showParticipants ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            {/* Minimize/Close */}
            {embedded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Chat Content */}
      <div className="flex flex-1 min-h-0">
        {/* Messages Area */}
        <CardContent className="flex-1 p-0 flex flex-col min-w-0">
          {/* Messages List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    currentUserId={user?.id || ''}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="flex-shrink-0">
            <MessageInput
              onSendMessage={handleSendMessage}
              placeholder={`Message in ${getContextTitle()}...`}
            />
          </div>
        </CardContent>

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="w-64 border-l flex-shrink-0">
            <ChatUserList
              users={onlineUsers}
              currentUserId={user?.id || ''}
              className="h-full border-0 rounded-none"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
