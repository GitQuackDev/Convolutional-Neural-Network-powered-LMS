import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserAnalyticsData {
  userId?: string;
  sessionId: string;
  action: string;
  resource: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  responseSize?: number;
}

export interface SessionMetricsUpdate {
  lastActivity: Date;
  exitPage?: string;
  deviceInfo?: any;
}

export class AnalyticsService {
  /**
   * Record user analytics data using the actual Prisma schema
   */
  async recordUserAnalytics(data: UserAnalyticsData): Promise<void> {
    try {
      if (!data.userId) {
        // Skip recording for anonymous users for now
        return;
      }

      // Prepare analytics data according to schema
      const analyticsData = {
        pageViews: data.action === 'page_view' ? { [data.resource]: 1 } : {},
        contentInteractions: data.action !== 'page_view' ? {
          action: data.action,
          resource: data.resource,
          duration: data.duration,
          statusCode: data.statusCode,
          metadata: data.metadata
        } : {},
        cnnAnalysisUsage: data.action === 'cnn_analysis' ? {
          resource: data.resource,
          duration: data.duration,
          statusCode: data.statusCode,
          timestamp: new Date()
        } : {},
        learningProgress: {}
      };

      // Create analytics record
      const analyticsRecord = await prisma.userAnalytics.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId,
          pageViews: analyticsData.pageViews,
          contentInteractions: analyticsData.contentInteractions,
          cnnAnalysisUsage: analyticsData.cnnAnalysisUsage,
          learningProgress: analyticsData.learningProgress,
          timestamp: new Date()
        }
      });

      console.log(`📊 Analytics recorded: ${data.action} for user ${data.userId}`);
    } catch (error) {
      console.error('❌ Failed to record user analytics:', error);
      // Don't throw to avoid breaking the main request flow
    }
  }

  /**
   * Update session metrics using the actual schema
   */
  async updateSessionMetrics(
    sessionId: string, 
    userId?: string, 
    updates?: SessionMetricsUpdate
  ): Promise<void> {
    try {
      if (!userId) {
        return; // Skip for anonymous users
      }

      // Try to find existing session by userId and recent sessionStart
      const recentSessionStart = new Date();
      recentSessionStart.setHours(recentSessionStart.getHours() - 24); // Look for sessions in last 24 hours

      const existingSessions = await prisma.sessionMetrics.findMany({
        where: {
          userId,
          sessionStart: { gte: recentSessionStart }
        },
        orderBy: { sessionStart: 'desc' },
        take: 1
      });

      const now = new Date();

      if (existingSessions.length > 0 && existingSessions[0]) {
        const session = existingSessions[0];
        // Calculate active time based on session duration
        const sessionDuration = now.getTime() - session.sessionStart.getTime();
        const activeTimeSeconds = Math.floor(sessionDuration / 1000);

        // Update existing session
        await prisma.sessionMetrics.update({
          where: { id: session.id },
          data: {
            sessionEnd: now,
            activeTime: activeTimeSeconds,
            engagementScore: this.calculateEngagementScore(activeTimeSeconds),
            courseInteractions: updates?.deviceInfo || session.courseInteractions || {},
            assignmentProgress: session.assignmentProgress || {}
          }
        });
      } else {
        // Create new session metrics record
        await prisma.sessionMetrics.create({
          data: {
            userId,
            sessionStart: now,
            activeTime: 0,
            courseInteractions: updates?.deviceInfo || {},
            assignmentProgress: {},
            engagementScore: 0.0
          }
        });
      }

      console.log(`📈 Session metrics updated for user: ${userId}`);
    } catch (error) {
      console.error('❌ Failed to update session metrics:', error);
      // Don't throw to avoid breaking the main request flow
    }
  }

  /**
   * Calculate engagement score based on activity
   */
  private calculateEngagementScore(activeTimeSeconds: number): number {
    // Simple engagement score: more time = higher score, but with diminishing returns
    const maxScore = 100;
    const optimalTimeMinutes = 30; // 30 minutes is considered optimal engagement
    
    const activeTimeMinutes = activeTimeSeconds / 60;
    const score = Math.min(maxScore, (activeTimeMinutes / optimalTimeMinutes) * 100);
    
    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get analytics summary for a user
   */
  async getUserAnalyticsSummary(userId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await prisma.userAnalytics.findMany({
        where: {
          userId,
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'desc' }
      });

      const sessions = await prisma.sessionMetrics.findMany({
        where: {
          userId,
          sessionStart: { gte: startDate }
        }
      });

      return {
        totalAnalyticsRecords: analytics.length,
        totalSessions: sessions.length,
        avgEngagementScore: this.getAverageEngagementScore(sessions),
        totalActiveTime: this.getTotalActiveTime(sessions),
        cnnAnalysisCount: this.getCNNAnalysisCount(analytics)
      };
    } catch (error) {
      console.error('❌ Failed to get user analytics summary:', error);
      throw error;
    }
  }

  /**
   * Get system-wide analytics metrics
   */
  async getSystemAnalytics(days: number = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [totalUsers, totalAnalyticsRecords, totalSessions] = await Promise.all([
        prisma.userAnalytics.groupBy({
          by: ['userId'],
          where: { timestamp: { gte: startDate } }
        }).then(groups => groups.length),
        
        prisma.userAnalytics.count({
          where: { timestamp: { gte: startDate } }
        }),
        
        prisma.sessionMetrics.count({
          where: { sessionStart: { gte: startDate } }
        })
      ]);

      // Count CNN analyses by checking cnnAnalysisUsage field
      const analyticsWithCNN = await prisma.userAnalytics.findMany({
        where: {
          timestamp: { gte: startDate }
        },
        select: { cnnAnalysisUsage: true }
      });

      const cnnAnalyses = analyticsWithCNN.filter(record => 
        record.cnnAnalysisUsage && Object.keys(record.cnnAnalysisUsage as object).length > 0
      ).length;

      return {
        totalUsers,
        totalAnalyticsRecords,
        totalSessions,
        cnnAnalyses,
        period: `${days} days`
      };
    } catch (error) {
      console.error('❌ Failed to get system analytics:', error);
      throw error;
    }
  }

  /**
   * Check if user has consented to analytics tracking
   */
  async hasAnalyticsConsent(userId: string): Promise<boolean> {
    try {
      // For now, default to true. In future, this would check user preferences
      // This can be extended to check a user_preferences table or user settings
      return true;
    } catch (error) {
      console.error('❌ Failed to check analytics consent:', error);
      return false;
    }
  }

  /**
   * Anonymize analytics data for a user
   */
  async anonymizeUserData(userId: string): Promise<void> {
    try {
      // Update user analytics to remove identifiable information
      await prisma.userAnalytics.updateMany({
        where: { userId },
        data: {
          userId: 'anonymous'
        }
      });

      // Update session metrics
      await prisma.sessionMetrics.updateMany({
        where: { userId },
        data: {
          userId: 'anonymous'
        }
      });

      console.log(`🔒 Analytics data anonymized for user: ${userId}`);
    } catch (error) {
      console.error('❌ Failed to anonymize user data:', error);
      throw error;
    }
  }

  /**
   * Clean up old analytics data based on retention policy
   */
  async cleanupOldData(retentionDays: number = 365): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedAnalytics = await prisma.userAnalytics.deleteMany({
        where: { timestamp: { lt: cutoffDate } }
      });

      const deletedSessions = await prisma.sessionMetrics.deleteMany({
        where: { sessionStart: { lt: cutoffDate } }
      });

      console.log(`🗑️ Cleaned up ${deletedAnalytics.count} analytics records and ${deletedSessions.count} session records`);
    } catch (error) {
      console.error('❌ Failed to cleanup old data:', error);
      throw error;
    }
  }

  // Helper methods
  private getAverageEngagementScore(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((acc, session) => acc + session.engagementScore, 0);
    return Math.round((total / sessions.length) * 100) / 100;
  }

  private getTotalActiveTime(sessions: any[]): number {
    return sessions.reduce((acc, session) => acc + session.activeTime, 0);
  }

  private getCNNAnalysisCount(analytics: any[]): number {
    return analytics.filter(record => 
      record.cnnAnalysisUsage && Object.keys(record.cnnAnalysisUsage as object).length > 0
    ).length;
  }
}
