/**
 * Chat Permissions Service
 * Handles course enrollment verification and role-based chat permissions
 */

import { apiClient } from '@/lib/apiClient';
import type { ChatPermissions } from '@/types/communication';

export interface ChatAccessParams {
  courseId: string;
  moduleId?: string;
  contentId?: string;
  userId: string;
}

export interface EnrollmentStatus {
  isEnrolled: boolean;
  role: 'student' | 'professor' | 'admin';
  enrollmentDate?: Date;
  permissions: ChatPermissions;
}

export interface ModerationAction {
  action: 'mute' | 'kick' | 'ban' | 'warn';
  userId: string;
  reason: string;
  duration?: number; // in minutes, for temporary actions
}

export class ChatPermissionsService {
  /**
   * Verify user's course enrollment and get chat permissions
   */
  static async verifyChatAccess({
    courseId,
    moduleId,
    contentId,
    userId
  }: ChatAccessParams): Promise<EnrollmentStatus> {
    const params = new URLSearchParams({ userId });
    if (moduleId) params.append('moduleId', moduleId);
    if (contentId) params.append('contentId', contentId);

    const response = await apiClient.get(`/api/courses/${courseId}/chat-access?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to verify chat access: ${response.statusText}`);
    }

    const data = await response.json() as {
      enrollment: Record<string, unknown>;
    };

    return {
      isEnrolled: data.enrollment.isEnrolled as boolean,
      role: data.enrollment.role as 'student' | 'professor' | 'admin',
      enrollmentDate: data.enrollment.enrollmentDate ? new Date(data.enrollment.enrollmentDate as string) : undefined,
      permissions: data.enrollment.permissions as ChatPermissions
    };
  }

  /**
   * Get chat permissions based on user role and context
   */
  static async getChatPermissions({
    courseId,
    moduleId,
    contentId,
    userId
  }: ChatAccessParams): Promise<ChatPermissions> {
    try {
      const enrollment = await this.verifyChatAccess({ courseId, moduleId, contentId, userId });
      
      if (!enrollment.isEnrolled) {
        // No permissions for non-enrolled users
        return {
          canSend: false,
          canEdit: false,
          canDelete: false,
          canModerate: false,
          canViewHistory: false
        };
      }

      return enrollment.permissions;
    } catch (error) {
      console.error('❌ Failed to get chat permissions:', error);
      // Return restricted permissions on error
      return {
        canSend: false,
        canEdit: false,
        canDelete: false,
        canModerate: false,
        canViewHistory: false
      };
    }
  }

  /**
   * Get default permissions based on user role
   */
  static getDefaultPermissions(role: 'student' | 'professor' | 'admin'): ChatPermissions {
    switch (role) {
      case 'admin':
        return {
          canSend: true,
          canEdit: true,
          canDelete: true,
          canModerate: true,
          canViewHistory: true
        };
      case 'professor':
        return {
          canSend: true,
          canEdit: true,
          canDelete: true,
          canModerate: true,
          canViewHistory: true
        };
      case 'student':
        return {
          canSend: true,
          canEdit: true, // Can edit own messages
          canDelete: true, // Can delete own messages
          canModerate: false,
          canViewHistory: true
        };
      default:
        return {
          canSend: false,
          canEdit: false,
          canDelete: false,
          canModerate: false,
          canViewHistory: false
        };
    }
  }

  /**
   * Check if user can perform specific action on a message
   */
  static canPerformMessageAction(
    action: 'edit' | 'delete' | 'report',
    messageOwnerId: string,
    currentUserId: string,
    userRole: 'student' | 'professor' | 'admin',
    permissions: ChatPermissions
  ): boolean {
    const isOwnMessage = messageOwnerId === currentUserId;
    const isModerator = userRole === 'professor' || userRole === 'admin';

    switch (action) {
      case 'edit':
        return permissions.canEdit && isOwnMessage;
      case 'delete':
        return permissions.canDelete && (isOwnMessage || isModerator);
      case 'report':
        return !isOwnMessage; // Can't report own messages
      default:
        return false;
    }
  }

  /**
   * Perform moderation action (admin/professor only)
   */
  static async performModerationAction(
    courseId: string,
    moderationAction: ModerationAction
  ): Promise<void> {
    const response = await apiClient.post(`/api/courses/${courseId}/chat/moderate`, {
      action: moderationAction.action,
      targetUserId: moderationAction.userId,
      reason: moderationAction.reason,
      duration: moderationAction.duration
    });

    if (!response.ok) {
      throw new Error(`Failed to perform moderation action: ${response.statusText}`);
    }
  }

  /**
   * Get list of users that can be moderated in a course
   */
  static async getModeratableUsers(courseId: string): Promise<Array<{
    id: string;
    username: string;
    role: string;
    isOnline: boolean;
    lastActivity: Date;
  }>> {
    const response = await apiClient.get(`/api/courses/${courseId}/chat/moderatable-users`);

    if (!response.ok) {
      throw new Error(`Failed to get moderatable users: ${response.statusText}`);
    }

    const data = await response.json() as {
      users: Array<Record<string, unknown>>;
    };

    return data.users.map(user => ({
      id: user.id as string,
      username: user.username as string,
      role: user.role as string,
      isOnline: user.isOnline as boolean,
      lastActivity: new Date(user.lastActivity as string)
    }));
  }

  /**
   * Get chat moderation history for a course
   */
  static async getModerationHistory(courseId: string): Promise<Array<{
    id: string;
    action: string;
    targetUserId: string;
    moderatorId: string;
    reason: string;
    timestamp: Date;
    duration?: number;
  }>> {
    const response = await apiClient.get(`/api/courses/${courseId}/chat/moderation-history`);

    if (!response.ok) {
      throw new Error(`Failed to get moderation history: ${response.statusText}`);
    }

    const data = await response.json() as {
      history: Array<Record<string, unknown>>;
    };

    return data.history.map(entry => ({
      id: entry.id as string,
      action: entry.action as string,
      targetUserId: entry.targetUserId as string,
      moderatorId: entry.moderatorId as string,
      reason: entry.reason as string,
      timestamp: new Date(entry.timestamp as string),
      duration: entry.duration as number | undefined
    }));
  }

  /**
   * Check if user is currently muted/banned in a course
   */
  static async checkUserRestrictions(
    courseId: string,
    userId: string
  ): Promise<{
    isMuted: boolean;
    isBanned: boolean;
    mutedUntil?: Date;
    bannedUntil?: Date;
    reason?: string;
  }> {
    const response = await apiClient.get(`/api/courses/${courseId}/chat/user-restrictions/${userId}`);

    if (!response.ok) {
      throw new Error(`Failed to check user restrictions: ${response.statusText}`);
    }

    const data = await response.json() as {
      restrictions: Record<string, unknown>;
    };

    const restrictions = data.restrictions;

    return {
      isMuted: restrictions.isMuted as boolean,
      isBanned: restrictions.isBanned as boolean,
      mutedUntil: restrictions.mutedUntil ? new Date(restrictions.mutedUntil as string) : undefined,
      bannedUntil: restrictions.bannedUntil ? new Date(restrictions.bannedUntil as string) : undefined,
      reason: restrictions.reason as string | undefined
    };
  }
}
