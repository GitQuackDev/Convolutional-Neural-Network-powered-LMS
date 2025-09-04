/**
 * Integrated Chat-Annotation Component  
 * Story 2.7: Collaborative Features Integration
 * Task 2.7.2: Enhanced Chat-Annotation Integration
 */

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

import {
  MessageSquare,
  PenTool,
  Reply,
  Link2,
  Hash,
  MoreHorizontal,
  Pin,
  AtSign,
  Paperclip,
  Send,
  Smile,
  Image as ImageIcon
} from 'lucide-react';

import { cn } from '@/lib/utils';

// Enhanced type definitions for chat-annotation integration
export interface ChatAnnotationIntegration {
  messageId: string;
  annotationId?: string;
  contentReference?: ContentReference;
  contextData: MessageContext;
  crossReferences: CrossReference[];
}

export interface ContentReference {
  contentId: string;
  contentType: string;
  selection?: TextSelection | AreaSelection;
  timestamp: Date;
  context: string;
}

export interface TextSelection {
  startOffset: number;
  endOffset: number;
  selectedText: string;
}

export interface AreaSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MessageContext {
  threadId?: string;
  parentMessageId?: string;
  contentContext: string;
  participants: string[];
  relatedAnnotations: string[];
}

export interface CrossReference {
  type: 'annotation_to_message' | 'message_to_annotation' | 'content_reference';
  sourceId: string;
  targetId: string;
  relationshipType: 'reply' | 'reference' | 'explanation' | 'question';
  metadata: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: Date;
  type: 'text' | 'annotation_reference' | 'content_reference' | 'system';
  threadId?: string;
  parentMessageId?: string;
  attachments?: MessageAttachment[];
  references?: ContentReference[];
  reactions?: MessageReaction[];
  isEdited?: boolean;
  editedAt?: Date;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface AnnotationReference {
  id: string;
  content: string;
  position: { x: number; y: number };
  authorId: string;
  authorName: string;
  timestamp: Date;
  relatedMessages: string[];
  isResolved?: boolean;
}

interface IntegratedChatAnnotationProps {
  messages: ChatMessage[];
  annotations: AnnotationReference[];
  currentUserId: string;
  contentId: string;
  contentType: string;
  onSendMessage: (content: string, references?: ContentReference[]) => void;
  onCreateAnnotation: (content: string, position: { x: number; y: number }, messageRef?: string) => void;
  onMessageReply: (messageId: string, content: string) => void;
  onAnnotationDiscuss: (annotationId: string, content: string) => void;
  onReferenceContent: (selection: TextSelection | AreaSelection) => void;
  className?: string;
}

/**
 * Integrated Chat-Annotation Component
 * Unified interface combining chat and annotation functionality
 */
export const IntegratedChatAnnotation: React.FC<IntegratedChatAnnotationProps> = ({
  messages,
  annotations,
  onSendMessage,
  onCreateAnnotation,
  onMessageReply,
  className
}) => {
  const { toast } = useToast();
  const [messageContent, setMessageContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [selectedReferences, setSelectedReferences] = useState<ContentReference[]>([]);
  const [showAnnotationMode, setShowAnnotationMode] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = useCallback(() => {
    if (!messageContent.trim()) return;

    if (replyingTo) {
      onMessageReply(replyingTo, messageContent);
      setReplyingTo(null);
    } else {
      onSendMessage(messageContent, selectedReferences);
    }

    setMessageContent('');
    setSelectedReferences([]);
    toast('Message sent');
  }, [messageContent, replyingTo, selectedReferences, onSendMessage, onMessageReply, toast]);

  const handleCreateAnnotationFromMessage = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      // Create annotation with message reference
      onCreateAnnotation(
        `Discussion: ${message.content.slice(0, 50)}...`,
        { x: 100, y: 100 }, // Default position
        messageId
      );
      toast('Annotation created from message');
    }
  }, [messages, onCreateAnnotation, toast]);

  const handleAnnotationDiscussion = useCallback((annotationId: string) => {
    const annotation = annotations.find(a => a.id === annotationId);
    if (annotation) {
      setMessageContent(`@annotation:${annotationId} `);
      messageInputRef.current?.focus();
    }
  }, [annotations]);

  const formatMessageContent = (content: string) => {
    // Enhanced message formatting with annotation references
    return content.replace(/@annotation:(\w+)/g, (match, annotationId) => {
      const annotation = annotations.find(a => a.id === annotationId);
      return annotation ? `📝 ${annotation.content.slice(0, 30)}...` : match;
    });
  };

  const getMessageIcon = (type: ChatMessage['type'] | 'annotation') => {
    switch (type) {
      case 'annotation_reference': return <PenTool className="h-3 w-3 text-blue-500" />;
      case 'content_reference': return <Link2 className="h-3 w-3 text-green-500" />;
      case 'system': return <Hash className="h-3 w-3 text-gray-500" />;
      case 'annotation': return <PenTool className="h-3 w-3 text-purple-500" />;
      default: return <MessageSquare className="h-3 w-3 text-gray-600" />;
    }
  };

  const replyingToMessage = replyingTo ? messages.find(m => m.id === replyingTo) : null;

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Collaborative Discussion</span>
            <Badge variant="outline">
              {messages.length} messages
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={showAnnotationMode ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAnnotationMode(!showAnnotationMode)}
            >
              <PenTool className="h-4 w-4 mr-1" />
              Annotations
            </Button>
            
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages and Annotations Area */}
      <CardContent className="flex-1 flex flex-col p-4 space-y-4">
        <ScrollArea className="flex-1">
          <div className="space-y-3">
            {/* Integrated message and annotation timeline */}
            {[...messages, ...annotations.map(a => ({
              id: a.id,
              content: a.content,
              authorId: a.authorId,
              authorName: a.authorName,
              timestamp: a.timestamp,
              type: 'annotation' as const,
              position: a.position,
              isResolved: a.isResolved,
              relatedMessages: a.relatedMessages
            }))].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).map((item) => (
              <Card key={item.id} className={cn(
                "p-3 transition-colors",
                item.type === 'annotation' && "border-l-4 border-l-blue-500 bg-blue-50/50"
              )}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                      {item.authorName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">{item.authorName}</span>
                      {getMessageIcon(item.type)}
                      <span className="text-xs text-gray-500">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                      {item.type === 'annotation' && item.isResolved && (
                        <Badge variant="secondary" className="text-xs">Resolved</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-900 mb-2">
                      {item.type === 'annotation' ? (
                        <div className="space-y-2">
                          <div className="font-medium flex items-center space-x-2">
                            <PenTool className="h-3 w-3" />
                            <span>Annotation</span>
                          </div>
                          <div>{item.content}</div>
                          {item.relatedMessages && item.relatedMessages.length > 0 && (
                            <div className="text-xs text-blue-600">
                              Related to {item.relatedMessages.length} message(s)
                            </div>
                          )}
                        </div>
                      ) : (
                        formatMessageContent(item.content)
                      )}
                    </div>
                    
                    {/* Message Actions */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => item.type === 'annotation' 
                          ? handleAnnotationDiscussion(item.id)
                          : setReplyingTo(item.id)
                        }
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        {item.type === 'annotation' ? 'Discuss' : 'Reply'}
                      </Button>
                      
                      {item.type !== 'annotation' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => handleCreateAnnotationFromMessage(item.id)}
                        >
                          <PenTool className="h-3 w-3 mr-1" />
                          Annotate
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                      >
                        <Pin className="h-3 w-3 mr-1" />
                        Pin
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Message Composer */}
        <div className="space-y-3">
          {replyingToMessage && (
            <Card className="p-2 bg-gray-50 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Reply className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-gray-600">
                    Replying to {replyingToMessage.authorName}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => setReplyingTo(null)}
                >
                  ×
                </Button>
              </div>
              <div className="text-xs text-gray-700 mt-1 truncate">
                {replyingToMessage.content}
              </div>
            </Card>
          )}
          
          {selectedReferences.length > 0 && (
            <Card className="p-2 bg-blue-50 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Link2 className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-gray-600">
                    {selectedReferences.length} content reference(s)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => setSelectedReferences([])}
                >
                  ×
                </Button>
              </div>
            </Card>
          )}
          
          <div className="flex space-x-2">
            <div className="flex-1">
              <Textarea
                ref={messageInputRef}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder={replyingTo ? "Write a reply..." : "Type a message..."}
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              
              {/* Message Composer Toolbar */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <AtSign className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {messageContent.length}/500
                  </span>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default IntegratedChatAnnotation;
