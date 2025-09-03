/**
 * MessageInput Component
 * Message composition and sending interface with typing indicators
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import type { MessageInputProps } from '@/types/communication';
import { MessageType } from '@/types/communication';

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = 'Type a message...',
  maxLength = 1000,
  className
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage, MessageType.TEXT);
      setMessage('');
      setIsTyping(false);
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Enforce max length
    if (value.length <= maxLength) {
      setMessage(value);
      
      // Handle typing indicator
      if (value.trim() && !isTyping) {
        setIsTyping(true);
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    }
  };

  const handleBlur = () => {
    // Stop typing indicator when focus is lost
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Card className={cn('p-3 border-t', className)}>
      <div className="flex gap-2 items-end">
        {/* File Attachment Button (Future Implementation) */}
        <Button 
          variant="ghost" 
          size="sm"
          className="flex-shrink-0 p-2 h-auto"
          disabled={disabled}
          title="Attach file (coming soon)"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'min-h-[40px] max-h-[120px] resize-none pr-12',
              'focus-visible:ring-1 focus-visible:ring-ring'
            )}
            rows={1}
          />
          
          {/* Character Counter */}
          {message.length > maxLength * 0.8 && (
            <div className={cn(
              'absolute bottom-1 right-12 text-xs',
              message.length >= maxLength 
                ? 'text-destructive' 
                : 'text-muted-foreground'
            )}>
              {message.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Send Button */}
        <Button 
          onClick={handleSendMessage}
          disabled={disabled || !message.trim()}
          size="sm"
          className="flex-shrink-0 p-2 h-auto"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Typing Indicator for Current User */}
      {isTyping && (
        <div className="text-xs text-muted-foreground mt-2">
          You are typing...
        </div>
      )}
    </Card>
  );
}
