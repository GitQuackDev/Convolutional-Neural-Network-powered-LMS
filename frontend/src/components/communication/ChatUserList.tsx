/**
 * ChatUserList Component
 * Display online users and participants with typing indicators
 */

import { useState } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ChatUserListProps } from '@/types/communication';

export function ChatUserList({
  users,
  currentUserId,
  showTypingIndicator = true,
  className
}: ChatUserListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getUserInitials = (username: string) => {
    return username
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'professor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const onlineUsers = users.filter(user => {
    const lastSeenThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
    return new Date(user.lastSeen) > lastSeenThreshold;
  });

  const typingUsers = users.filter(user => 
    user.isTyping && user.id !== currentUserId
  );

  return (
    <Card className={cn('w-full', className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Participants</span>
                <Badge variant="secondary" className="text-xs">
                  {onlineUsers.length}
                </Badge>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Typing Indicators */}
            {showTypingIndicator && typingUsers.length > 0 && (
              <div className="mb-3 p-2 bg-muted/50 rounded-md">
                <div className="text-xs text-muted-foreground">
                  {typingUsers.length === 1 ? (
                    <span>
                      <strong>{typingUsers[0].username}</strong> is typing...
                    </span>
                  ) : (
                    <span>
                      <strong>{typingUsers.length} people</strong> are typing...
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Online Users List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {onlineUsers.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-4">
                  No one is currently online
                </div>
              ) : (
                onlineUsers.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors',
                      user.id === currentUserId && 'bg-primary/10'
                    )}
                  >
                    {/* User Avatar with Online Indicator */}
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={user.avatar} 
                          alt={user.username}
                        />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Online Status Dot */}
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-sm font-medium truncate',
                          user.id === currentUserId && 'text-primary'
                        )}>
                          {user.username}
                          {user.id === currentUserId && ' (You)'}
                        </span>
                        
                        {/* Role Badge */}
                        {user.role !== 'student' && (
                          <Badge 
                            variant="outline" 
                            className={cn('text-xs py-0 px-1', getRoleColor(user.role))}
                          >
                            {user.role}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Typing Indicator */}
                      {user.isTyping && user.id !== currentUserId && (
                        <div className="text-xs text-muted-foreground">
                          typing...
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Offline Users Count */}
            {users.length > onlineUsers.length && (
              <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
                {users.length - onlineUsers.length} participant{users.length - onlineUsers.length !== 1 ? 's' : ''} offline
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
