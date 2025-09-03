/**
 * ChatModerationPanel Component
 * Moderation controls for instructors and admins
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Shield, Ban, VolumeX, Users, Clock } from 'lucide-react';
import { ChatPermissionsService } from '@/services/chatPermissionsService';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';

interface ChatModerationPanelProps {
  courseId: string;
  className?: string;
}

interface ModeratableUser {
  id: string;
  username: string;
  role: string;
  isOnline: boolean;
  lastActivity: Date;
}

interface ModerationHistoryEntry {
  id: string;
  action: string;
  targetUserId: string;
  moderatorId: string;
  reason: string;
  timestamp: Date;
  duration?: number;
}

export function ChatModerationPanel({
  courseId,
  className = ''
}: ChatModerationPanelProps) {
  const { user } = useAuth();
  const { canModerate } = usePermissions({
    courseId,
    autoLoad: true
  });

  const [users, setUsers] = useState<ModeratableUser[]>([]);
  const [history, setHistory] = useState<ModerationHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [moderationAction, setModerationAction] = useState<'mute' | 'kick' | 'ban' | 'warn'>('warn');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<number>(60); // minutes
  const [showModerationDialog, setShowModerationDialog] = useState(false);

  const loadModeratableUsers = useCallback(async () => {
    try {
      const usersList = await ChatPermissionsService.getModeratableUsers(courseId);
      setUsers(usersList);
    } catch (error) {
      console.error('❌ Failed to load moderatable users:', error);
    }
  }, [courseId]);

  const loadModerationHistory = useCallback(async () => {
    try {
      const historyList = await ChatPermissionsService.getModerationHistory(courseId);
      setHistory(historyList.slice(0, 10)); // Show last 10 entries
    } catch (error) {
      console.error('❌ Failed to load moderation history:', error);
    }
  }, [courseId]);

  // Load moderatable users and history
  useEffect(() => {
    if (canModerate) {
      loadModeratableUsers();
      loadModerationHistory();
    }
  }, [canModerate, loadModeratableUsers, loadModerationHistory]);

  const handleModerationAction = async () => {
    if (!selectedUser || !reason.trim()) {
      alert('Please select a user and provide a reason');
      return;
    }

    setIsLoading(true);
    try {
      await ChatPermissionsService.performModerationAction(courseId, {
        action: moderationAction,
        userId: selectedUser,
        reason: reason.trim(),
        duration: ['mute', 'ban'].includes(moderationAction) ? duration : undefined
      });

      // Refresh data
      await loadModeratableUsers();
      await loadModerationHistory();

      // Reset form
      setSelectedUser('');
      setReason('');
      setDuration(60);
      setShowModerationDialog(false);

      alert(`Successfully applied ${moderationAction} action`);

    } catch (error) {
      console.error('❌ Failed to apply moderation action:', error);
      alert('Failed to apply moderation action');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'mute': return <VolumeX className="h-4 w-4" />;
      case 'ban': return <Ban className="h-4 w-4" />;
      case 'kick': return <Users className="h-4 w-4" />;
      case 'warn': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'mute': return 'bg-yellow-100 text-yellow-800';
      case 'ban': return 'bg-red-100 text-red-800';
      case 'kick': return 'bg-orange-100 text-orange-800';
      case 'warn': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Permanent';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  if (!canModerate) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Chat Moderation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {users.length} participants • {users.filter(u => u.isOnline).length} online
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowModerationDialog(true)}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Moderate User
          </Button>
        </div>

        {/* Moderation Dialog as Card */}
        {showModerationDialog && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Apply Moderation Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user to moderate" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.id !== user?.id).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username} ({user.role})
                        {user.isOnline && <Badge variant="secondary" className="ml-2">Online</Badge>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Action</label>
                <Select value={moderationAction} onValueChange={(value: string) => setModerationAction(value as 'warn' | 'mute' | 'kick' | 'ban')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="mute">Mute</SelectItem>
                    <SelectItem value="kick">Kick</SelectItem>
                    <SelectItem value="ban">Ban</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {['mute', 'ban'].includes(moderationAction) && (
                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                    min={1}
                    max={10080} // 1 week
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Reason</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a reason for this action..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowModerationDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleModerationAction}
                  disabled={isLoading || !selectedUser || !reason.trim()}
                >
                  Apply Action
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Moderation History */}
        <div>
          <h4 className="text-sm font-medium mb-3">Recent Actions</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No moderation actions yet
              </div>
            ) : (
              history.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getActionColor(entry.action)}>
                      {getActionIcon(entry.action)}
                      {entry.action}
                    </Badge>
                    <span className="text-sm">
                      {users.find(u => u.id === entry.targetUserId)?.username || 'Unknown User'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {entry.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(entry.duration)}
                      </span>
                    )}
                    <span>{entry.timestamp.toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Online Users */}
        <div>
          <h4 className="text-sm font-medium mb-3">Online Participants</h4>
          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
            {users.filter(u => u.isOnline).map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span className="text-sm">{user.username}</span>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  Active {Math.round((Date.now() - user.lastActivity.getTime()) / 60000)}m ago
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
