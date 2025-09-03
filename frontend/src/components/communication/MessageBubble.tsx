/**
 * MessageBubble Component
 * Individual message display component with user avatar, content, and actions
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MessageBubbleProps } from '@/types/communication';
import { MessageType } from '@/types/communication';

export function MessageBubble({
  message,
  currentUserId,
  showAvatar = true,
  showTimestamp = true,
  onEdit,
  onDelete,
  className
}: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isOwnMessage = message.senderId === currentUserId;
  const canEdit = isOwnMessage && onEdit;
  const canDelete = (isOwnMessage || message.sender.role === 'admin') && onDelete;

  const getUserInitials = (username: string) => {
    return username
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMessageTypeColor = (type: MessageType) => {
    switch (type) {
      case MessageType.SYSTEM:
        return 'bg-muted text-muted-foreground';
      case MessageType.FILE:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return isOwnMessage 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted';
    }
  };

  if (message.messageType === MessageType.SYSTEM) {
    return (
      <div className={cn('flex justify-center my-2', className)}>
        <Badge variant="secondary" className="text-xs">
          {message.content}
        </Badge>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'flex gap-3 group',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* User Avatar */}
      {showAvatar && !isOwnMessage && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={message.sender.avatar} 
              alt={message.sender.username}
            />
            <AvatarFallback className="text-xs">
              {getUserInitials(message.sender.username)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        'flex flex-col space-y-1 max-w-[70%]',
        isOwnMessage ? 'items-end' : 'items-start'
      )}>
        {/* Sender Name and Timestamp */}
        {!isOwnMessage && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {message.sender.username}
            </span>
            {message.sender.role !== 'student' && (
              <Badge variant="outline" className="text-xs py-0 px-1">
                {message.sender.role}
              </Badge>
            )}
            {showTimestamp && (
              <span>
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              </span>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <Card className={cn(
          'p-3 border-0 shadow-sm relative',
          getMessageTypeColor(message.messageType),
          'group-hover:shadow-md transition-shadow'
        )}>
          <div className="break-words whitespace-pre-wrap">
            {message.content}
          </div>
          
          {/* Edited Indicator */}
          {message.isEdited && (
            <div className="text-xs opacity-60 mt-1">
              edited {message.editedAt && formatDistanceToNow(new Date(message.editedAt), { addSuffix: true })}
            </div>
          )}

          {/* Message Actions */}
          {(canEdit || canDelete) && isHovered && (
            <div className={cn(
              'absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity',
              isOwnMessage ? 'left-1' : 'right-1'
            )}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-background/80"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwnMessage ? 'start' : 'end'}>
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit?.(message.id, message.content)}>
                      <Edit2 className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(message.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </Card>

        {/* Own Message Timestamp */}
        {isOwnMessage && showTimestamp && (
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </div>
        )}
      </div>

      {/* Own Message Avatar */}
      {showAvatar && isOwnMessage && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={message.sender.avatar} 
              alt={message.sender.username}
            />
            <AvatarFallback className="text-xs">
              {getUserInitials(message.sender.username)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
}
