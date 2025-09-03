/**
 * ChatWidget Component  
 * Collapsible chat widget for course views without disrupting content flow
 */

import { useState } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InContextChat } from './InContextChat';
import type { ChatWidgetProps } from '@/types/communication';

export function ChatWidget({
  courseId,
  position = 'overlay',
  collapsible = true,
  showParticipants = false,
  className
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount] = useState(2); // Mock unread count

  const getPositionStyles = () => {
    switch (position) {
      case 'sidebar':
        return 'relative w-full h-full';
      case 'inline':
        return 'relative w-full';
      case 'bottom':
        return 'fixed bottom-0 left-0 right-0 z-40';
      case 'overlay':
      default:
        return 'fixed bottom-4 right-4 z-50';
    }
  };

  // Floating chat toggle button for overlay/bottom positions
  if ((position === 'overlay' || position === 'bottom') && !isOpen) {
    return (
      <div className={cn(getPositionStyles(), className)}>
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            'h-12 px-4 shadow-lg',
            position === 'bottom' ? 'rounded-t-lg rounded-b-none w-80' : 'rounded-full'
          )}
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          <span className="font-medium">Course Chat</span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {unreadCount}
            </Badge>
          )}
          {showParticipants && (
            <>
              <Users className="h-4 w-4 ml-2 opacity-70" />
              <span className="text-sm opacity-70 ml-1">5</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  // Sidebar or inline chat widget
  if (position === 'sidebar' || position === 'inline') {
    return (
      <div className={cn(getPositionStyles(), className)}>
        {collapsible && !isOpen ? (
          // Collapsed sidebar state
          <div className="w-full border rounded-lg bg-background">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(true)}
              className="w-full h-12 justify-start px-4"
            >
              <MessageCircle className="h-5 w-5 mr-3" />
              <div className="flex-1 text-left">
                <div className="font-medium">Course Chat</div>
                <div className="text-sm text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} new messages` : 'Join the discussion'}
                </div>
              </div>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>
        ) : (
          // Expanded sidebar/inline chat
          <div className={cn(
            'border rounded-lg bg-background',
            position === 'sidebar' ? 'h-full' : 'h-96'
          )}>
            <InContextChat
              courseId={courseId}
              context="course"
              embedded={false}
              initiallyExpanded={true}
              className="border-0 rounded-lg h-full"
            />
          </div>
        )}
      </div>
    );
  }

  // Overlay or bottom expanded chat
  return (
    <div className={cn(getPositionStyles(), className)}>
      <InContextChat
        courseId={courseId}
        context="course"
        embedded={true}
        initiallyExpanded={true}
        className={cn(
          position === 'bottom' 
            ? 'fixed bottom-0 right-4 w-96 h-96 rounded-t-lg rounded-b-none' 
            : ''
        )}
      />
    </div>
  );
}
