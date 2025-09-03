import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnlineUser {
  id: string;
  username: string;
  displayName: string;
  role: 'student' | 'professor' | 'admin';
  lastSeen: Date;
  status: 'online' | 'away' | 'busy';
}

interface OnlineUsersListProps {
  users: OnlineUser[];
  currentUserId?: string;
  className?: string;
}

export function OnlineUsersList({ users, currentUserId, className }: OnlineUsersListProps) {
  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'professor':
        return 'default' as const;
      case 'admin':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'away':
        return 'text-yellow-500';
      case 'busy':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Sort users: professors first, then admins, then students, all alphabetically within groups
  const sortedUsers = [...users].sort((a, b) => {
    const roleOrder = { professor: 0, admin: 1, student: 2 };
    const roleComparison = roleOrder[a.role] - roleOrder[b.role];
    
    if (roleComparison !== 0) return roleComparison;
    
    return a.displayName.localeCompare(b.displayName);
  });

  // Separate users by role
  const professors = sortedUsers.filter(user => user.role === 'professor');
  const admins = sortedUsers.filter(user => user.role === 'admin');
  const students = sortedUsers.filter(user => user.role === 'student');

  const UserItem = ({ user }: { user: OnlineUser }) => {
    const isCurrentUser = currentUserId === user.id;
    
    return (
      <div 
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors',
          isCurrentUser && 'bg-primary/10'
        )}
      >
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`/api/users/${user.id}/avatar`} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
          <Circle 
            className={cn(
              'absolute -bottom-1 -right-1 h-3 w-3 fill-current',
              getStatusColor(user.status)
            )} 
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {user.displayName}
              {isCurrentUser && ' (You)'}
            </span>
            <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs flex-shrink-0">
              {user.role}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            @{user.username}
          </div>
        </div>
      </div>
    );
  };

  const UserGroup = ({ 
    title, 
    users, 
    count 
  }: { 
    title: string; 
    users: OnlineUser[]; 
    count: number;
  }) => {
    if (users.length === 0) return null;

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </h4>
          <Badge variant="outline" className="text-xs">
            {count}
          </Badge>
        </div>
        <div className="space-y-1">
          {users.map(user => (
            <UserItem key={user.id} user={user} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4" />
          Online Users
          <Badge variant="outline" className="ml-auto">
            {users.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {users.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No users online</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="space-y-4">
              <UserGroup 
                title="Instructors" 
                users={professors} 
                count={professors.length}
              />
              
              {admins.length > 0 && (
                <UserGroup 
                  title="Administrators" 
                  users={admins} 
                  count={admins.length}
                />
              )}
              
              <UserGroup 
                title="Students" 
                users={students} 
                count={students.length}
              />
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default OnlineUsersList;
