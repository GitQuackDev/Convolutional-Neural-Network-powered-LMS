/**
 * Role-based Access Control Middleware for Advanced Insights
 * Story 1.9: Advanced Reporting and Insights
 * 
 * Provides granular access control for insights and reporting features
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface InsightPermissions {
  canViewInsights: boolean;
  canGenerateReports: boolean;
  canAccessCourseInsights: boolean;
  canAccessUserInsights: boolean;
  canManageReports: boolean;
  canScheduleReports: boolean;
  canAccessPredictiveAnalytics: boolean;
  canViewRecommendations: boolean;
  canModerateInsights: boolean;
  allowedCourses: string[];
  allowedUsers: string[];
}

/**
 * Get user permissions for insights based on their role and context
 */
export async function getUserInsightPermissions(
  userId: string, 
  userRole: string
): Promise<InsightPermissions> {
  const basePermissions: InsightPermissions = {
    canViewInsights: false,
    canGenerateReports: false,
    canAccessCourseInsights: false,
    canAccessUserInsights: false,
    canManageReports: false,
    canScheduleReports: false,
    canAccessPredictiveAnalytics: false,
    canViewRecommendations: false,
    canModerateInsights: false,
    allowedCourses: [],
    allowedUsers: []
  };

  try {
    switch (userRole) {
      case 'ADMIN':
        return {
          canViewInsights: true,
          canGenerateReports: true,
          canAccessCourseInsights: true,
          canAccessUserInsights: true,
          canManageReports: true,
          canScheduleReports: true,
          canAccessPredictiveAnalytics: true,
          canViewRecommendations: true,
          canModerateInsights: true,
          allowedCourses: ['*'], // All courses
          allowedUsers: ['*'] // All users
        };

      case 'PROFESSOR':
        // Get courses taught by this professor
        const taughtCourses = await prisma.course.findMany({
          where: { ownerId: userId },
          select: { id: true }
        });

        // Get enrolled students in their courses
        const enrolledStudents = await prisma.courseEnrollment.findMany({
          where: {
            courseId: { in: taughtCourses.map((c: any) => c.id) }
          },
          select: { userId: true }
        });

        return {
          canViewInsights: true,
          canGenerateReports: true,
          canAccessCourseInsights: true,
          canAccessUserInsights: true, // For their students
          canManageReports: true,
          canScheduleReports: true,
          canAccessPredictiveAnalytics: true,
          canViewRecommendations: true,
          canModerateInsights: true, // For their courses
          allowedCourses: taughtCourses.map((c: any) => c.id),
          allowedUsers: [userId, ...enrolledStudents.map((e: any) => e.userId)]
        };

      case 'STUDENT':
        // Get courses enrolled by this student
        const enrolledCourses = await prisma.courseEnrollment.findMany({
          where: { userId },
          select: { courseId: true }
        });

        return {
          canViewInsights: true, // Own insights only
          canGenerateReports: false,
          canAccessCourseInsights: false, // Limited course insights
          canAccessUserInsights: true, // Own insights only
          canManageReports: false,
          canScheduleReports: false,
          canAccessPredictiveAnalytics: true, // Own predictions
          canViewRecommendations: true, // Own recommendations
          canModerateInsights: false,
          allowedCourses: enrolledCourses.map((e: any) => e.courseId),
          allowedUsers: [userId] // Only themselves
        };

      case 'COMMUNITY_MODERATOR':
      case 'REGULAR_MODERATOR':
        return {
          canViewInsights: true,
          canGenerateReports: false,
          canAccessCourseInsights: true, // Limited
          canAccessUserInsights: false,
          canManageReports: false,
          canScheduleReports: false,
          canAccessPredictiveAnalytics: false,
          canViewRecommendations: true,
          canModerateInsights: true, // Their moderation scope
          allowedCourses: [], // Would need to be configured based on moderation scope
          allowedUsers: []
        };

      default:
        return basePermissions;
    }
  } catch (error) {
    console.error('Error getting user insight permissions:', error);
    return basePermissions;
  }
}

/**
 * Middleware to check if user can access insights
 */
export const requireInsightAccess = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const permissions = await getUserInsightPermissions(user.id, user.role);
    
    if (!permissions.canViewInsights) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access insights'
      });
      return;
    }

    // Attach permissions to request for use in controllers
    (req as any).insightPermissions = permissions;
    next();
  } catch (error) {
    console.error('Error in insight access middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify permissions'
    });
  }
};

/**
 * Middleware to check if user can generate reports
 */
export const requireReportGeneration = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const permissions = (req as any).insightPermissions;
    
    if (!permissions?.canGenerateReports) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to generate reports'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error in report generation middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify report permissions'
    });
  }
};

/**
 * Middleware to check if user can manage reports
 */
export const requireReportManagement = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const permissions = (req as any).insightPermissions;
    
    if (!permissions?.canManageReports) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to manage reports'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error in report management middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify management permissions'
    });
  }
};

/**
 * Middleware to check if user can access predictive analytics
 */
export const requirePredictiveAccess = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const permissions = (req as any).insightPermissions;
    
    if (!permissions?.canAccessPredictiveAnalytics) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access predictive analytics'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error in predictive access middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify predictive permissions'
    });
  }
};

/**
 * Filter data based on user permissions
 */
export function filterDataByPermissions(
  data: any[], 
  permissions: InsightPermissions,
  userId: string
): any[] {
  return data.filter(item => {
    // Check course access
    if (item.courseId) {
      if (permissions.allowedCourses.includes('*')) {
        return true;
      }
      if (!permissions.allowedCourses.includes(item.courseId)) {
        return false;
      }
    }

    // Check user access
    if (item.userId || item.targetUserId) {
      const targetUser = item.userId || item.targetUserId;
      if (permissions.allowedUsers.includes('*')) {
        return true;
      }
      if (!permissions.allowedUsers.includes(targetUser)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Validate course access for insights
 */
export function validateCourseAccess(
  courseId: string, 
  permissions: InsightPermissions
): boolean {
  if (permissions.allowedCourses.includes('*')) {
    return true;
  }
  return permissions.allowedCourses.includes(courseId);
}

/**
 * Validate user access for insights
 */
export function validateUserAccess(
  targetUserId: string, 
  permissions: InsightPermissions
): boolean {
  if (permissions.allowedUsers.includes('*')) {
    return true;
  }
  return permissions.allowedUsers.includes(targetUserId);
}

/**
 * Middleware to validate course access in request
 */
export const validateCoursePermissions = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    const permissions = (req as any).insightPermissions;
    const courseId = req.params['courseId'] || req.body['courseId'] || req.query['courseId'];

    if (courseId && !validateCourseAccess(courseId as string, permissions)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access this course data'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error validating course permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate course permissions'
    });
  }
};

/**
 * Middleware to validate user access in request
 */
export const validateUserPermissions = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    const permissions = (req as any).insightPermissions;
    const targetUserId = req.params['userId'] || req.body['userId'] || req.query['userId'];

    if (targetUserId && !validateUserAccess(targetUserId as string, permissions)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access this user data'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error validating user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate user permissions'
    });
  }
};

/**
 * Get sanitized permissions for client
 */
export function getClientPermissions(permissions: InsightPermissions): any {
  return {
    canViewInsights: permissions.canViewInsights,
    canGenerateReports: permissions.canGenerateReports,
    canAccessCourseInsights: permissions.canAccessCourseInsights,
    canAccessUserInsights: permissions.canAccessUserInsights,
    canManageReports: permissions.canManageReports,
    canScheduleReports: permissions.canScheduleReports,
    canAccessPredictiveAnalytics: permissions.canAccessPredictiveAnalytics,
    canViewRecommendations: permissions.canViewRecommendations,
    canModerateInsights: permissions.canModerateInsights,
    courseCount: permissions.allowedCourses.includes('*') ? 'all' : permissions.allowedCourses.length,
    userCount: permissions.allowedUsers.includes('*') ? 'all' : permissions.allowedUsers.length
  };
}
