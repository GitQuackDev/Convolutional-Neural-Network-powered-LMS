/**
 * usePermissions Hook
 * React hook for managing chat permissions and access control
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { ChatPermissionsService } from '@/services/chatPermissionsService';
import type { ChatPermissions } from '@/types/communication';

interface UsePermissionsOptions {
  courseId: string;
  moduleId?: string;
  contentId?: string;
  autoLoad?: boolean;
}

interface UsePermissionsReturn {
  permissions: ChatPermissions | null;
  isEnrolled: boolean;
  userRole: 'student' | 'professor' | 'admin' | null;
  isLoading: boolean;
  error: string | null;
  canSendMessages: boolean;
  canEditMessage: (messageOwnerId: string) => boolean;
  canDeleteMessage: (messageOwnerId: string) => boolean;
  canModerate: boolean;
  isRestricted: boolean;
  restrictionReason: string | null;
  refreshPermissions: () => Promise<void>;
  checkUserRestrictions: () => Promise<void>;
}

export function usePermissions({
  courseId,
  moduleId,
  contentId,
  autoLoad = true
}: UsePermissionsOptions): UsePermissionsReturn {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<ChatPermissions | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'professor' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState<string | null>(null);

  // Check for user restrictions (mute/ban status)
  const checkRestrictions = useCallback(async () => {
    if (!user) return;

    try {
      const restrictions = await ChatPermissionsService.checkUserRestrictions(courseId, user.id);
      
      const isCurrentlyRestricted = restrictions.isMuted || restrictions.isBanned;
      setIsRestricted(isCurrentlyRestricted);
      
      if (isCurrentlyRestricted) {
        let reason = restrictions.reason || 'No reason provided';
        if (restrictions.isBanned) {
          reason = `Banned: ${reason}`;
          if (restrictions.bannedUntil) {
            reason += ` (until ${restrictions.bannedUntil.toLocaleString()})`;
          }
        } else if (restrictions.isMuted) {
          reason = `Muted: ${reason}`;
          if (restrictions.mutedUntil) {
            reason += ` (until ${restrictions.mutedUntil.toLocaleString()})`;
          }
        }
        setRestrictionReason(reason);
      } else {
        setRestrictionReason(null);
      }

    } catch (err) {
      console.error('❌ Failed to check user restrictions:', err);
      // Don't set error state for restrictions check, just log it
    }
  }, [user, courseId]);

  // Load permissions and enrollment status
  const loadPermissions = useCallback(async () => {
    if (!user) {
      setPermissions(null);
      setIsEnrolled(false);
      setUserRole(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify enrollment and get permissions
      const enrollment = await ChatPermissionsService.verifyChatAccess({
        courseId,
        moduleId,
        contentId,
        userId: user.id
      });

      setIsEnrolled(enrollment.isEnrolled);
      setUserRole(enrollment.role);
      setPermissions(enrollment.permissions);

      // Check for any user restrictions
      if (enrollment.isEnrolled) {
        await checkRestrictions();
      }

    } catch (err) {
      console.error('❌ Failed to load chat permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
      
      // Set default restricted permissions on error
      setPermissions({
        canSend: false,
        canEdit: false,
        canDelete: false,
        canModerate: false,
        canViewHistory: false
      });
      setIsEnrolled(false);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, courseId, moduleId, contentId, checkRestrictions]);

  // Auto-load permissions on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadPermissions();
    }
  }, [autoLoad, loadPermissions]);

  // Helper functions for common permission checks
  const canSendMessages = Boolean(
    permissions?.canSend && 
    isEnrolled && 
    !isRestricted
  );

  const canEditMessage = useCallback((messageOwnerId: string): boolean => {
    if (!permissions || !user || !userRole) return false;
    
    return ChatPermissionsService.canPerformMessageAction(
      'edit',
      messageOwnerId,
      user.id,
      userRole,
      permissions
    ) && !isRestricted;
  }, [permissions, user, userRole, isRestricted]);

  const canDeleteMessage = useCallback((messageOwnerId: string): boolean => {
    if (!permissions || !user || !userRole) return false;
    
    return ChatPermissionsService.canPerformMessageAction(
      'delete',
      messageOwnerId,
      user.id,
      userRole,
      permissions
    ) && !isRestricted;
  }, [permissions, user, userRole, isRestricted]);

  const canModerate = Boolean(
    permissions?.canModerate && 
    isEnrolled && 
    (userRole === 'professor' || userRole === 'admin')
  );

  return {
    permissions,
    isEnrolled,
    userRole,
    isLoading,
    error,
    canSendMessages,
    canEditMessage,
    canDeleteMessage,
    canModerate,
    isRestricted,
    restrictionReason,
    refreshPermissions: loadPermissions,
    checkUserRestrictions: checkRestrictions
  };
}
