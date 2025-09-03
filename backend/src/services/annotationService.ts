import { prisma } from '../lib/prisma';

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

// Basic type for annotation operations
interface CollaborationAnnotation {
  id: string;
  contentId: string;
  contentType: AnnotationContentType;
  authorId: string;
  text: string;
  position: any;
  selectionData?: any;
  annotationType: AnnotationType;
  isResolved: boolean;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
  threadId?: string | null;
  parentId?: string | null;
  visibility: AnnotationVisibility;
  permissions: any;
  metadata?: any;
  version: number;
  isEdited: boolean;
  editedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author?: any;
  resolver?: any;
  replies?: any[];
}

export interface CreateAnnotationData {
  contentId: string;
  contentType: AnnotationContentType;
  authorId: string;
  text: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    page?: number;
  };
  selectionData?: {
    start: number;
    end: number;
    selectedText: string;
  };
  annotationType?: AnnotationType;
  visibility?: AnnotationVisibility;
  permissions?: Record<string, boolean>;
  metadata?: Record<string, any>;
  threadId?: string;
  parentId?: string;
}

export interface AnnotationFilter {
  contentId?: string;
  contentType?: AnnotationContentType;
  authorId?: string;
  visibility?: AnnotationVisibility;
  isResolved?: boolean;
  threadId?: string;
  annotationType?: AnnotationType;
}

export class AnnotationService {
  /**
   * Create a new annotation
   */
  async createAnnotation(data: CreateAnnotationData): Promise<CollaborationAnnotation> {
    try {
      const annotation = await prisma.collaborationAnnotation.create({
        data: {
          contentId: data.contentId,
          contentType: data.contentType,
          authorId: data.authorId,
          text: data.text,
          position: data.position,
          selectionData: data.selectionData || null,
          annotationType: data.annotationType || AnnotationType.COMMENT,
          visibility: data.visibility || AnnotationVisibility.COURSE,
          permissions: data.permissions || {},
          metadata: data.metadata || null,
          threadId: data.threadId || null,
          parentId: data.parentId || null,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
          resolver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      return annotation;
    } catch (error) {
      console.error('Error creating annotation:', error);
      throw new Error('Failed to create annotation');
    }
  }

  /**
   * Get annotations for content with filtering
   */
  async getAnnotations(
    filter: AnnotationFilter,
    userId: string,
    userRole: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    annotations: CollaborationAnnotation[];
    totalCount: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause based on filter and user permissions
      const whereClause: any = {
        ...filter,
        OR: [
          { visibility: AnnotationVisibility.PUBLIC },
          { visibility: AnnotationVisibility.COURSE },
          { authorId: userId }, // User can always see their own annotations
          ...(userRole === 'PROFESSOR' || userRole === 'ADMIN' 
            ? [{ visibility: AnnotationVisibility.INSTRUCTORS }] 
            : []
          ),
        ],
      };

      const [annotations, totalCount] = await Promise.all([
        prisma.collaborationAnnotation.findMany({
          where: whereClause,
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
              },
            },
            resolver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    role: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.collaborationAnnotation.count({ where: whereClause }),
      ]);

      return {
        annotations,
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      console.error('Error fetching annotations:', error);
      throw new Error('Failed to fetch annotations');
    }
  }

  /**
   * Update an annotation
   */
  async updateAnnotation(
    annotationId: string,
    data: Partial<CreateAnnotationData>,
    userId: string
  ): Promise<CollaborationAnnotation> {
    try {
      // Check if user owns the annotation or has admin privileges
      const existingAnnotation = await prisma.collaborationAnnotation.findUnique({
        where: { id: annotationId },
        include: { author: true },
      });

      if (!existingAnnotation) {
        throw new Error('Annotation not found');
      }

      if (existingAnnotation.authorId !== userId) {
        throw new Error('Unauthorized to update this annotation');
      }

      const updatedAnnotation = await prisma.collaborationAnnotation.update({
        where: { id: annotationId },
        data: {
          ...data,
          isEdited: true,
          editedAt: new Date(),
          version: { increment: 1 },
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
          resolver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      return updatedAnnotation;
    } catch (error) {
      console.error('Error updating annotation:', error);
      throw new Error('Failed to update annotation');
    }
  }

  /**
   * Delete an annotation
   */
  async deleteAnnotation(annotationId: string, userId: string, userRole: string): Promise<void> {
    try {
      const annotation = await prisma.collaborationAnnotation.findUnique({
        where: { id: annotationId },
      });

      if (!annotation) {
        throw new Error('Annotation not found');
      }

      // Check permissions: author or admin/professor can delete
      if (annotation.authorId !== userId && userRole !== 'ADMIN' && userRole !== 'PROFESSOR') {
        throw new Error('Unauthorized to delete this annotation');
      }

      await prisma.collaborationAnnotation.delete({
        where: { id: annotationId },
      });
    } catch (error) {
      console.error('Error deleting annotation:', error);
      throw new Error('Failed to delete annotation');
    }
  }

  /**
   * Resolve an annotation
   */
  async resolveAnnotation(
    annotationId: string,
    resolverId: string,
    userRole: string
  ): Promise<CollaborationAnnotation> {
    try {
      // Only instructors/admins can resolve annotations
      if (userRole !== 'PROFESSOR' && userRole !== 'ADMIN') {
        throw new Error('Unauthorized to resolve annotations');
      }

      const resolvedAnnotation = await prisma.collaborationAnnotation.update({
        where: { id: annotationId },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: resolverId,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
          resolver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return resolvedAnnotation;
    } catch (error) {
      console.error('Error resolving annotation:', error);
      throw new Error('Failed to resolve annotation');
    }
  }

  /**
   * Get annotation thread (parent + all replies)
   */
  async getAnnotationThread(threadId: string, userId: string): Promise<CollaborationAnnotation[]> {
    try {
      const thread = await prisma.collaborationAnnotation.findMany({
        where: {
          OR: [
            { id: threadId },
            { threadId: threadId },
          ],
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
          resolver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return thread;
    } catch (error) {
      console.error('Error fetching annotation thread:', error);
      throw new Error('Failed to fetch annotation thread');
    }
  }

  /**
   * Get annotation statistics for content
   */
  async getAnnotationStats(contentId: string, contentType: AnnotationContentType): Promise<{
    totalAnnotations: number;
    resolvedAnnotations: number;
    annotationsByType: Record<string, number>;
    recentActivity: number;
  }> {
    try {
      const [
        totalAnnotations,
        resolvedAnnotations,
        annotationsByType,
        recentActivity,
      ] = await Promise.all([
        prisma.collaborationAnnotation.count({
          where: { contentId, contentType },
        }),
        prisma.collaborationAnnotation.count({
          where: { contentId, contentType, isResolved: true },
        }),
        prisma.collaborationAnnotation.groupBy({
          by: ['annotationType'],
          where: { contentId, contentType },
          _count: { annotationType: true },
        }),
        prisma.collaborationAnnotation.count({
          where: {
            contentId,
            contentType,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

      const typeStats = annotationsByType.reduce((acc: Record<string, number>, item: any) => {
        acc[item.annotationType] = item._count.annotationType;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalAnnotations,
        resolvedAnnotations,
        annotationsByType: typeStats,
        recentActivity,
      };
    } catch (error) {
      console.error('Error fetching annotation statistics:', error);
      throw new Error('Failed to fetch annotation statistics');
    }
  }

  /**
   * Moderate annotation content
   */
  async moderateAnnotation(
    annotationId: string,
    action: string,
    moderatorId: string,
    reason?: string
  ): Promise<CollaborationAnnotation> {
    try {
      // Get the annotation first to check permissions
      const annotation = await prisma.collaborationAnnotation.findUnique({
        where: { id: annotationId },
      });

      if (!annotation) {
        throw new Error('Annotation not found');
      }

      let updateData: any = {
        moderatedAt: new Date(),
        moderatedBy: moderatorId,
      };

      // Add moderation reason if provided
      if (reason) {
        updateData.moderationReason = reason;
      }

      // Apply moderation action
      switch (action) {
        case 'hide':
          updateData.isHidden = true;
          updateData.moderationStatus = 'HIDDEN';
          break;
        case 'show':
          updateData.isHidden = false;
          updateData.moderationStatus = 'APPROVED';
          break;
        case 'flag':
          updateData.isFlagged = true;
          updateData.moderationStatus = 'FLAGGED';
          break;
        case 'unflag':
          updateData.isFlagged = false;
          updateData.moderationStatus = 'APPROVED';
          break;
        case 'delete':
          // Soft delete by marking as deleted
          updateData.isDeleted = true;
          updateData.deletedAt = new Date();
          updateData.moderationStatus = 'DELETED';
          break;
        default:
          throw new Error('Invalid moderation action');
      }

      const moderatedAnnotation = await prisma.collaborationAnnotation.update({
        where: { id: annotationId },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      return moderatedAnnotation;
    } catch (error) {
      console.error('Error moderating annotation:', error);
      throw new Error('Failed to moderate annotation');
    }
  }

  /**
   * Change annotation visibility
   */
  async changeVisibility(
    annotationId: string,
    visibility: AnnotationVisibility,
    userId: string,
    userRole: string
  ): Promise<CollaborationAnnotation> {
    try {
      // Get the annotation first to check permissions
      const annotation = await prisma.collaborationAnnotation.findUnique({
        where: { id: annotationId },
      });

      if (!annotation) {
        throw new Error('Annotation not found');
      }

      // Check permissions: author, instructor, or admin can change visibility
      const canChangeVisibility = 
        annotation.authorId === userId || 
        ['INSTRUCTOR', 'ADMIN'].includes(userRole);

      if (!canChangeVisibility) {
        throw new Error('Unauthorized: Cannot change annotation visibility');
      }

      const updatedAnnotation = await prisma.collaborationAnnotation.update({
        where: { id: annotationId },
        data: { 
          visibility,
          updatedAt: new Date(),
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      return updatedAnnotation;
    } catch (error) {
      console.error('Error changing annotation visibility:', error);
      throw new Error('Failed to change annotation visibility');
    }
  }

  /**
   * Get moderation queue
   */
  async getModerationQueue(
    courseId?: string,
    status: string = 'pending',
    page: number = 1,
    limit: number = 20
  ): Promise<{
    annotations: CollaborationAnnotation[];
    totalCount: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      // Build moderation filter
      let where: any = {
        isDeleted: { not: true },
      };

      if (courseId) {
        where.courseId = courseId;
      }

      // Filter by moderation status
      switch (status) {
        case 'pending':
          where.OR = [
            { moderationStatus: null },
            { moderationStatus: 'PENDING' },
            { isFlagged: true },
          ];
          break;
        case 'flagged':
          where.isFlagged = true;
          break;
        case 'hidden':
          where.isHidden = true;
          break;
        case 'approved':
          where.moderationStatus = 'APPROVED';
          break;
        default:
          // Default to pending
          where.OR = [
            { moderationStatus: null },
            { moderationStatus: 'PENDING' },
          ];
      }

      const [annotations, totalCount] = await Promise.all([
        prisma.collaborationAnnotation.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
              },
            },
          },
        }),
        prisma.collaborationAnnotation.count({ where }),
      ]);

      return {
        annotations,
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      throw new Error('Failed to fetch moderation queue');
    }
  }

  /**
   * Bulk moderate annotations
   */
  async bulkModerate(
    annotationIds: string[],
    action: string,
    moderatorId: string,
    reason?: string
  ): Promise<{
    processed: number;
    failed: number;
  }> {
    try {
      let processed = 0;
      let failed = 0;

      // Process each annotation individually to handle errors gracefully
      for (const annotationId of annotationIds) {
        try {
          await this.moderateAnnotation(annotationId, action, moderatorId, reason);
          processed++;
        } catch (error) {
          console.error(`Failed to moderate annotation ${annotationId}:`, error);
          failed++;
        }
      }

      return { processed, failed };
    } catch (error) {
      console.error('Error bulk moderating annotations:', error);
      throw new Error('Failed to bulk moderate annotations');
    }
  }

  /**
   * Get annotation analytics
   */
  async getAnnotationAnalytics(
    contentId: string,
    timeRange: string = '7d'
  ): Promise<{
    totalAnnotations: number;
    annotationsByDay: Array<{ date: string; count: number }>;
    topContributors: Array<{ user: any; annotationCount: number }>;
    annotationTypes: Record<string, number>;
    engagement: {
      averageAnnotationsPerUser: number;
      mostActiveDay: string;
      responseRate: number;
    };
  }> {
    try {
      // Parse time range
      let startDate: Date;
      const now = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const [
        totalAnnotations,
        annotationsByDay,
        topContributors,
        annotationTypes,
        uniqueUsers,
      ] = await Promise.all([
        // Total annotations count
        prisma.collaborationAnnotation.count({
          where: {
            contentId,
            createdAt: { gte: startDate },
            isDeleted: { not: true },
          },
        }),

        // Annotations by day
        prisma.collaborationAnnotation.groupBy({
          by: ['createdAt'],
          where: {
            contentId,
            createdAt: { gte: startDate },
            isDeleted: { not: true },
          },
          _count: { id: true },
        }),

        // Top contributors
        prisma.collaborationAnnotation.groupBy({
          by: ['authorId'],
          where: {
            contentId,
            createdAt: { gte: startDate },
            isDeleted: { not: true },
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5,
        }),

        // Annotation types distribution
        prisma.collaborationAnnotation.groupBy({
          by: ['annotationType'],
          where: {
            contentId,
            createdAt: { gte: startDate },
            isDeleted: { not: true },
          },
          _count: { annotationType: true },
        }),

        // Unique users count
        prisma.collaborationAnnotation.groupBy({
          by: ['authorId'],
          where: {
            contentId,
            createdAt: { gte: startDate },
            isDeleted: { not: true },
          },
        }),
      ]);

      // Process annotations by day
      const dailyAnnotations = annotationsByDay.reduce((acc: Record<string, number>, item: any) => {
        const date = item.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (item._count?.id || 0);
        return acc;
      }, {} as Record<string, number>);

      const annotationsByDayArray = Object.entries(dailyAnnotations).map(([date, count]) => ({
        date,
        count: count as number,
      }));

      // Get user details for top contributors
      const contributorDetails = await Promise.all(
        topContributors.map(async (contributor: any) => {
          const user = await prisma.user.findUnique({
            where: { id: contributor.authorId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          });
          return {
            user,
            annotationCount: contributor._count?.id || 0,
          };
        })
      );

      // Process annotation types
      const typeStats = annotationTypes.reduce((acc: Record<string, number>, item: any) => {
        acc[item.annotationType] = item._count?.annotationType || 0;
        return acc;
      }, {} as Record<string, number>);

      // Calculate engagement metrics
      const averageAnnotationsPerUser = uniqueUsers.length > 0 ? totalAnnotations / uniqueUsers.length : 0;
      
      const mostActiveDay = annotationsByDayArray.reduce(
        (max, day) => (day.count as number) > (max.count as number) ? day : max,
        { date: '', count: 0 }
      ).date;

      // Calculate response rate (annotations with replies)
      const annotationsWithReplies = await prisma.collaborationAnnotation.count({
        where: {
          contentId,
          createdAt: { gte: startDate },
          isDeleted: { not: true },
          replies: { some: {} },
        },
      });

      const responseRate = totalAnnotations > 0 ? (annotationsWithReplies / totalAnnotations) * 100 : 0;

      return {
        totalAnnotations,
        annotationsByDay: annotationsByDayArray,
        topContributors: contributorDetails,
        annotationTypes: typeStats,
        engagement: {
          averageAnnotationsPerUser,
          mostActiveDay,
          responseRate,
        },
      };
    } catch (error) {
      console.error('Error fetching annotation analytics:', error);
      throw new Error('Failed to fetch annotation analytics');
    }
  }
}

export const annotationService = new AnnotationService();
