import { Request, Response } from 'express';
import { annotationService, CreateAnnotationData, AnnotationFilter } from '../services/annotationService';
import { UserRole } from '../types';

// Define annotation enums locally for type safety
const AnnotationContentType = {
  ASSIGNMENT: 'ASSIGNMENT',
  COURSE_MATERIAL: 'COURSE_MATERIAL',
  CNN_ANALYSIS: 'CNN_ANALYSIS',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  UPLOADED_FILE: 'UPLOADED_FILE'
} as const;

const AnnotationType = {
  COMMENT: 'COMMENT',
  QUESTION: 'QUESTION',
  SUGGESTION: 'SUGGESTION',
  HIGHLIGHT: 'HIGHLIGHT',
  DRAWING: 'DRAWING',
  BOOKMARK: 'BOOKMARK'
} as const;

const AnnotationVisibility = {
  PRIVATE: 'PRIVATE',
  COURSE: 'COURSE',
  INSTRUCTORS: 'INSTRUCTORS',
  STUDY_GROUP: 'STUDY_GROUP',
  PUBLIC: 'PUBLIC'
} as const;

type AnnotationContentType = typeof AnnotationContentType[keyof typeof AnnotationContentType];
type AnnotationType = typeof AnnotationType[keyof typeof AnnotationType];
type AnnotationVisibility = typeof AnnotationVisibility[keyof typeof AnnotationVisibility];

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

export class AnnotationController {
  /**
   * Create a new annotation
   */
  async createAnnotation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        contentId,
        contentType,
        text,
        position,
        selectionData,
        annotationType,
        visibility,
        permissions,
        metadata,
        threadId,
        parentId,
      } = req.body;

      // Validate required fields
      if (!contentId || !contentType || !text || !position) {
        res.status(400).json({ 
          error: 'Missing required fields: contentId, contentType, text, position' 
        });
        return;
      }

      // Validate content type
      if (!Object.values(AnnotationContentType).includes(contentType)) {
        res.status(400).json({ error: 'Invalid content type' });
        return;
      }

      // Validate annotation type if provided
      if (annotationType && !Object.values(AnnotationType).includes(annotationType)) {
        res.status(400).json({ error: 'Invalid annotation type' });
        return;
      }

      // Validate visibility if provided
      if (visibility && !Object.values(AnnotationVisibility).includes(visibility)) {
        res.status(400).json({ error: 'Invalid visibility setting' });
        return;
      }

      const annotationData: CreateAnnotationData = {
        contentId,
        contentType,
        authorId: req.user.userId,
        text,
        position,
        selectionData,
        annotationType,
        visibility,
        permissions,
        metadata,
        threadId,
        parentId,
      };

      const annotation = await annotationService.createAnnotation(annotationData);
      
      res.status(201).json({
        success: true,
        annotation,
      });
    } catch (error) {
      console.error('Error creating annotation:', error);
      res.status(500).json({ 
        error: 'Failed to create annotation',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get annotations for content
   */
  async getAnnotations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        contentId,
        contentType,
        authorId,
        visibility,
        isResolved,
        threadId,
        annotationType,
        page = 1,
        limit = 50,
      } = req.query;

      const filter: AnnotationFilter = {};
      
      if (contentId) filter.contentId = contentId as string;
      if (contentType) filter.contentType = contentType as AnnotationContentType;
      if (authorId) filter.authorId = authorId as string;
      if (visibility) filter.visibility = visibility as AnnotationVisibility;
      if (isResolved !== undefined) filter.isResolved = isResolved === 'true';
      if (threadId) filter.threadId = threadId as string;
      if (annotationType) filter.annotationType = annotationType as AnnotationType;

      const result = await annotationService.getAnnotations(
        filter,
        req.user.userId,
        req.user.role,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error fetching annotations:', error);
      res.status(500).json({ 
        error: 'Failed to fetch annotations',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update an annotation
   */
  async updateAnnotation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { annotationId } = req.params;
      const updateData = req.body;

      if (!annotationId) {
        res.status(400).json({ error: 'Annotation ID is required' });
        return;
      }

      const updatedAnnotation = await annotationService.updateAnnotation(
        annotationId,
        updateData,
        req.user.userId
      );

      res.json({
        success: true,
        annotation: updatedAnnotation,
      });
    } catch (error) {
      console.error('Error updating annotation:', error);
      const statusCode = error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;
      res.status(statusCode).json({ 
        error: 'Failed to update annotation',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete an annotation
   */
  async deleteAnnotation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { annotationId } = req.params;

      if (!annotationId) {
        res.status(400).json({ error: 'Annotation ID is required' });
        return;
      }

      await annotationService.deleteAnnotation(annotationId, req.user.userId, req.user.role);

      res.json({
        success: true,
        message: 'Annotation deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting annotation:', error);
      const statusCode = error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;
      res.status(statusCode).json({ 
        error: 'Failed to delete annotation',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Resolve an annotation
   */
  async resolveAnnotation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { annotationId } = req.params;

      if (!annotationId) {
        res.status(400).json({ error: 'Annotation ID is required' });
        return;
      }

      const resolvedAnnotation = await annotationService.resolveAnnotation(
        annotationId,
        req.user.userId,
        req.user.role
      );

      res.json({
        success: true,
        annotation: resolvedAnnotation,
      });
    } catch (error) {
      console.error('Error resolving annotation:', error);
      const statusCode = error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;
      res.status(statusCode).json({ 
        error: 'Failed to resolve annotation',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get annotation thread
   */
  async getAnnotationThread(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { threadId } = req.params;

      if (!threadId) {
        res.status(400).json({ error: 'Thread ID is required' });
        return;
      }

      const thread = await annotationService.getAnnotationThread(threadId, req.user.userId);

      res.json({
        success: true,
        thread,
      });
    } catch (error) {
      console.error('Error fetching annotation thread:', error);
      res.status(500).json({ 
        error: 'Failed to fetch annotation thread',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get annotation statistics
   */
  async getAnnotationStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { contentId, contentType } = req.query;

      if (!contentId || !contentType) {
        res.status(400).json({ error: 'Content ID and content type are required' });
        return;
      }

      const stats = await annotationService.getAnnotationStats(
        contentId as string,
        contentType as AnnotationContentType
      );

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error('Error fetching annotation statistics:', error);
      res.status(500).json({ 
        error: 'Failed to fetch annotation statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Moderate annotation content
   */
  async moderateAnnotation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Check if user has moderation permissions
      if (!['INSTRUCTOR', 'ADMIN'].includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions for moderation' });
        return;
      }

      const { annotationId } = req.params;
      const { action, reason } = req.body;

      if (!annotationId) {
        res.status(400).json({ error: 'Annotation ID is required' });
        return;
      }

      if (!action || !['hide', 'show', 'flag', 'unflag', 'delete'].includes(action)) {
        res.status(400).json({ error: 'Valid moderation action is required (hide, show, flag, unflag, delete)' });
        return;
      }

      const result = await annotationService.moderateAnnotation(
        annotationId,
        action,
        req.user.userId,
        reason
      );

      res.json({
        success: true,
        annotation: result,
        message: `Annotation ${action} successfully`,
      });
    } catch (error) {
      console.error('Error moderating annotation:', error);
      const statusCode = error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;
      res.status(statusCode).json({ 
        error: 'Failed to moderate annotation',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Change annotation visibility
   */
  async changeVisibility(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { annotationId } = req.params;
      const { visibility } = req.body;

      if (!annotationId) {
        res.status(400).json({ error: 'Annotation ID is required' });
        return;
      }

      if (!visibility || !Object.values(AnnotationVisibility).includes(visibility)) {
        res.status(400).json({ error: 'Valid visibility setting is required' });
        return;
      }

      const updatedAnnotation = await annotationService.changeVisibility(
        annotationId,
        visibility,
        req.user.userId,
        req.user.role
      );

      res.json({
        success: true,
        annotation: updatedAnnotation,
        message: 'Annotation visibility updated successfully',
      });
    } catch (error) {
      console.error('Error changing annotation visibility:', error);
      const statusCode = error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;
      res.status(statusCode).json({ 
        error: 'Failed to change annotation visibility',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get moderation queue
   */
  async getModerationQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Check if user has moderation permissions
      if (!['INSTRUCTOR', 'ADMIN'].includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions for moderation' });
        return;
      }

      const { 
        courseId,
        status = 'pending',
        page = 1,
        limit = 20 
      } = req.query;

      const result = await annotationService.getModerationQueue(
        courseId as string,
        status as string,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      res.status(500).json({ 
        error: 'Failed to fetch moderation queue',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Bulk moderate annotations
   */
  async bulkModerate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Check if user has moderation permissions
      if (!['INSTRUCTOR', 'ADMIN'].includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions for moderation' });
        return;
      }

      const { annotationIds, action, reason } = req.body;

      if (!annotationIds || !Array.isArray(annotationIds) || annotationIds.length === 0) {
        res.status(400).json({ error: 'Array of annotation IDs is required' });
        return;
      }

      if (!action || !['hide', 'show', 'flag', 'unflag', 'delete'].includes(action)) {
        res.status(400).json({ error: 'Valid moderation action is required' });
        return;
      }

      const result = await annotationService.bulkModerate(
        annotationIds,
        action,
        req.user.userId,
        reason
      );

      res.json({
        success: true,
        processed: result.processed,
        failed: result.failed,
        message: `Bulk ${action} completed: ${result.processed} processed, ${result.failed} failed`,
      });
    } catch (error) {
      console.error('Error bulk moderating annotations:', error);
      res.status(500).json({ 
        error: 'Failed to bulk moderate annotations',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get annotation analytics
   */
  async getAnnotationAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Check if user has analytics access
      if (!['INSTRUCTOR', 'ADMIN'].includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions for analytics' });
        return;
      }

      const { contentId } = req.params;
      const { timeRange = '7d' } = req.query;

      if (!contentId) {
        res.status(400).json({ error: 'Content ID is required' });
        return;
      }

      const analytics = await annotationService.getAnnotationAnalytics(
        contentId,
        timeRange as string
      );

      res.json({
        success: true,
        analytics,
      });
    } catch (error) {
      console.error('Error fetching annotation analytics:', error);
      res.status(500).json({ 
        error: 'Failed to fetch annotation analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const annotationController = new AnnotationController();
