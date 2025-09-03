import { useState, useRef, useEffect } from 'react';
import { CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Hash, 
  Users,
  Settings,
  History,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import our chat components
import { MessageBubble } from './MessageBubble';
import { OnlineUsersList } from './OnlineUsersList';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import { ChatModerationPanel } from './ChatModerationPanel';

// Import hooks
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { MessageType } from '@/types/communication';

interface ChatInterfaceProps {
  contextType: 'course' | 'module' | 'content';
  contextId: string;
  contextTitle?: string;
  className?: string;
  compact?: boolean;
}

export function ChatInterface({ 
  contextType, 
  contextId, 
  contextTitle,
  className,
  compact = false 
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const { canModerate, isRestricted, restrictionReason } = usePermissions({ courseId: contextId });
  
  const {
    messages,
    onlineUsers,
    isConnected,
    sendMessage,
    deleteMessage,
    setTyping
  } = useChat({ courseId: contextId });

  // Local state
  const [messageInput, setMessageInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(!compact);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicators
  useEffect(() => {
    if (isComposing && messageInput.trim()) {
      setTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    } else {
      setTyping(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isComposing, messageInput, setTyping]);

  // Handle message input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessageInput(value);
    setIsComposing(value.trim().length > 0);
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    const content = messageInput.trim();
    if (!content || isRestricted) return;

    try {
      await sendMessage(content, MessageType.TEXT);
      
      setMessageInput('');
      setIsComposing(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format context title
  const getContextTitle = () => {
    if (contextTitle) return contextTitle;
    return `${contextType.charAt(0).toUpperCase() + contextType.slice(1)} Chat`;
  };

  return (
    <div className={cn('flex h-full', className)}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat Header */}
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">{getContextTitle()}</h3>
              <div className="flex items-center gap-1">
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                )} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="h-8 w-8 p-0"
              >
                <History className="h-4 w-4" />
              </Button>
              
              {canModerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModeration(!showModeration)}
                  className="h-8 w-8 p-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              
              {!compact && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                  className="h-8 w-8 p-0"
                >
                  <Users className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Restriction Notice */}
          {isRestricted && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                You are restricted from participating in this chat.
                {restrictionReason && ` Reason: ${restrictionReason}`}
              </span>
            </div>
          )}
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Hash className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">Welcome to the chat!</p>
                  <p className="text-sm">Start a conversation by sending a message below.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      currentUserId={user?.id || ''}
                      onEdit={(msg) => {
                        // Handle edit - would open edit modal
                        console.log('Edit message:', msg);
                      }}
                      onDelete={(msgId) => {
                        // Handle delete
                        deleteMessage(msgId);
                      }}
                    />
                  ))}
                  
                  {/* Typing Indicator - Comment out for now since we don't have typing users */}
                  {/* <TypingIndicator typingUsers={[]} /> */}
                  
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        {/* Message Input */}
        {!isRestricted && (
          <div className="border-t p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Textarea
                  ref={inputRef}
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                  className="min-h-[60px] resize-none"
                  disabled={!isConnected}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  disabled={!isConnected}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  disabled={!isConnected}
                >
                  <Smile className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || !isConnected}
                  className="h-9"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Side Panels */}
      {(showOnlineUsers || showHistory || showModeration) && (
        <>
          <Separator orientation="vertical" className="mx-0" />
          <div className="w-80 flex flex-col min-h-0">
            {showOnlineUsers && (
              <OnlineUsersList 
                users={onlineUsers.map(user => ({
                  ...user,
                  displayName: user.username,
                  status: 'online' as const
                }))}
                currentUserId={user?.id}
                className="border-0 shadow-none"
              />
            )}
            
            {showHistory && (
              <ChatHistoryPanel
                contextType={contextType}
                contextId={contextId}
                className="border-0 shadow-none flex-1"
              />
            )}
            
            {showModeration && canModerate && (
              <ChatModerationPanel
                courseId={contextId}
                className="border-0 shadow-none"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ChatInterface;
