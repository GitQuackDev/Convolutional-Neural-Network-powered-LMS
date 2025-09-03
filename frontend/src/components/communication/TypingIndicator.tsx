import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface TypingUser {
  id: string;
  name: string;
  role: 'student' | 'professor' | 'admin';
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  className?: string;
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format typing message
  const getTypingMessage = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
    } else {
      return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing...`;
    }
  };

  return (
    <div className={cn('flex items-center gap-3 p-4 text-muted-foreground', className)}>
      {/* Show up to 3 avatars */}
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map((user) => (
          <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
            <AvatarImage src={`/api/users/${user.id}/avatar`} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>

      {/* Typing message with animated dots */}
      <div className="flex items-center gap-2 text-sm">
        <span>{getTypingMessage()}</span>
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
