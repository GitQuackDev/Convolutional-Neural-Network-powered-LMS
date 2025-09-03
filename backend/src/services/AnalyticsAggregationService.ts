/**
 * Analytics Aggregation Service
 * Provides efficient data queries and caching for analytics dashboard
 * Builds upon the basic AnalyticsService with performance optimizations
 */

import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from './AnalyticsService';

const prisma = new PrismaClient();

interface AnalyticsFilters {
  startDate: Date;
  endDate: Date;
  courseId?: string;
  userId?: string;
  timeGranularity: 'hour' | 'day' | 'week';
}

interface MetricsCache {
  [key: string]: {
    data: any;
    expiry: Date;
  };
}

interface AggregatedMetrics {
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  contentAnalysisCount: number;
  aiModelUsage: Record<string, number>;
  totalPageViews: number;
  avgEngagementScore: number;
  completionRate: number;
  retentionRate: number;
  learningOutcomes: number;
  performanceImprovement: number;
  collaborationIndex: number;
  engagementChange: number;
}

interface EngagementDataPoint {
  timestamp: Date;
  activeUsers: number;
  sessionsStarted: number;
  pageViews: number;
  avgSessionDuration: number;
  engagementScore: number;
  contentInteractions: number;
}

interface LearningProgressData {
  userId: string;
  userName: string;
  courseId: string;
  courseName: string;
  progressPercentage: number;
  completedActivities: number;
  totalActivities: number;
  timeSpent: number;
  lastActivity: Date;
  analysisCount: number;
  engagementScore: number;
}

interface AIModelUsageData {
  modelName: string;
  usageCount: number;
  averageProcessingTime: number;
  successRate: number;
  totalRequests: number;
  errorRate: number;
  costPerRequest?: number;
  timestamp: Date;
}

export class AnalyticsAggregationService {
  private analyticsService: AnalyticsService;
  private cache: MetricsCache = {};
  private cacheExpiryMinutes = 5; // Cache expires after 5 minutes

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Get comprehensive analytics metrics with caching
   */
  async getAnalyticsMetrics(filters: AnalyticsFilters): Promise<AggregatedMetrics> {
    const cacheKey = this.generateCacheKey('metrics', filters);
    
    // Check cache first
    if (this.isCached(cacheKey)) {
      console.log('📦 Returning cached metrics data');
      return this.cache[cacheKey]!.data;
    }

    try {
      console.log('🔄 Generating fresh metrics data');
      
      // Get basic counts with optimized queries
      const [
        userSessions,
        analyticsRecords,
        aiAnalysisResults
      ] = await Promise.all([
        this.getSessionMetricsData(filters),
        this.getUserAnalyticsData(filters),
        this.getAIAnalysisData(filters)
      ]);

      // Calculate aggregated metrics
      const metrics: AggregatedMetrics = {
        activeUsers: this.calculateActiveUsers(userSessions),
        totalSessions: userSessions.length,
        averageSessionDuration: this.calculateAverageSessionDuration(userSessions),
        contentAnalysisCount: this.calculateContentAnalysisCount(analyticsRecords),
        aiModelUsage: this.calculateAIModelUsage(aiAnalysisResults),
        totalPageViews: this.calculateTotalPageViews(analyticsRecords),
        avgEngagementScore: this.calculateAverageEngagement(userSessions),
        completionRate: this.calculateCompletionRate(analyticsRecords),
        retentionRate: this.calculateRetentionRate(userSessions),
        learningOutcomes: this.calculateLearningOutcomes(analyticsRecords),
        performanceImprovement: this.calculatePerformanceImprovement(aiAnalysisResults),
        collaborationIndex: this.calculateCollaborationIndex(analyticsRecords),
        engagementChange: this.calculateEngagementChange(userSessions, filters)
      };

      // Cache the results
      this.setCacheData(cacheKey, metrics);
      
      return metrics;
    } catch (error) {
      console.error('❌ Failed to get analytics metrics:', error);
      throw error;
    }
  }

  /**
   * Get engagement timeline data with time-based aggregation
   */
  async getEngagementData(filters: AnalyticsFilters): Promise<EngagementDataPoint[]> {
    const cacheKey = this.generateCacheKey('engagement', filters);
    
    if (this.isCached(cacheKey)) {
      console.log('📦 Returning cached engagement data');
      return this.cache[cacheKey]!.data;
    }

    try {
      console.log('🔄 Generating fresh engagement data');

      // Get time-bucketed data based on granularity
      const timeIntervals = this.generateTimeIntervals(filters);
      const engagementData: EngagementDataPoint[] = [];

      for (const interval of timeIntervals) {
        const intervalFilters = {
          ...filters,
          startDate: interval.start,
          endDate: interval.end
        };

        const [sessions, analytics] = await Promise.all([
          this.getSessionMetricsData(intervalFilters),
          this.getUserAnalyticsData(intervalFilters)
        ]);

        engagementData.push({
          timestamp: interval.start,
          activeUsers: this.calculateActiveUsers(sessions),
          sessionsStarted: sessions.length,
          pageViews: this.calculateTotalPageViews(analytics),
          avgSessionDuration: this.calculateAverageSessionDuration(sessions),
          engagementScore: this.calculateAverageEngagement(sessions),
          contentInteractions: this.calculateContentInteractions(analytics)
        });
      }

      this.setCacheData(cacheKey, engagementData);
      return engagementData;
    } catch (error) {
      console.error('❌ Failed to get engagement data:', error);
      throw error;
    }
  }

  /**
   * Get learning progress data for students or courses
   */
  async getLearningProgressData(filters: AnalyticsFilters): Promise<LearningProgressData[]> {
    const cacheKey = this.generateCacheKey('progress', filters);
    
    if (this.isCached(cacheKey)) {
      console.log('📦 Returning cached progress data');
      return this.cache[cacheKey]!.data;
    }

    try {
      console.log('🔄 Generating fresh progress data');

      // Get user progress data with proper Prisma queries
      const users = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          ...(filters.userId && { id: filters.userId })
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          sessionMetrics: {
            where: {
              sessionStart: {
                gte: filters.startDate,
                lte: filters.endDate
              }
            },
            select: {
              engagementScore: true,
              activeTime: true,
              sessionStart: true
            }
          },
          userAnalytics: {
            where: {
              timestamp: {
                gte: filters.startDate,
                lte: filters.endDate
              }
            },
            select: {
              id: true,
              cnnAnalysisUsage: true
            }
          }
        }
      });

      const progressData: LearningProgressData[] = users.map(user => {
        const totalActivities = user.sessionMetrics.length;
        const completedActivities = user.sessionMetrics.filter(s => s.activeTime > 300).length;
        const totalTimeSpent = user.sessionMetrics.reduce((acc, s) => acc + s.activeTime, 0);
        const avgEngagement = totalActivities > 0 ? 
          user.sessionMetrics.reduce((acc, s) => acc + s.engagementScore, 0) / totalActivities : 0;
        const lastActivity = user.sessionMetrics.length > 0 ? 
          Math.max(...user.sessionMetrics.map(s => s.sessionStart.getTime())) : Date.now();
        const analysisCount = user.userAnalytics.filter(ua => 
          ua.cnnAnalysisUsage && Object.keys(ua.cnnAnalysisUsage as object).length > 0
        ).length;

        return {
          userId: user.id,
          userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          courseId: 'general',
          courseName: 'General Learning',
          progressPercentage: Math.min(100, Math.round((completedActivities / Math.max(1, totalActivities)) * 100)),
          completedActivities,
          totalActivities,
          timeSpent: totalTimeSpent,
          lastActivity: new Date(lastActivity),
          analysisCount,
          engagementScore: Math.round(avgEngagement * 100) / 100
        };
      });

      this.setCacheData(cacheKey, progressData);
      return progressData;
    } catch (error) {
      console.error('❌ Failed to get learning progress data:', error);
      throw error;
    }
  }

  /**
   * Get AI model usage analytics
   */
  async getAIModelUsageData(filters: AnalyticsFilters): Promise<AIModelUsageData[]> {
    const cacheKey = this.generateCacheKey('ai_usage', filters);
    
    if (this.isCached(cacheKey)) {
      console.log('📦 Returning cached AI usage data');
      return this.cache[cacheKey]!.data;
    }

    try {
      console.log('🔄 Generating fresh AI usage data');

      // Get AI analysis results data
      const aiResults = await prisma.aIAnalysisResults.findMany({
        where: {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate
          }
        },
        select: {
          cnnResults: true,
          gpt4Results: true,
          claudeResults: true,
          geminiResults: true,
          processingTime: true,
          confidence: true,
          createdAt: true
        }
      });

      // Process AI results to extract model usage and success metrics
      const modelStats: Record<string, {
        totalRequests: number;
        successCount: number;
        totalProcessingTime: number;
        errorCount: number;
      }> = {};

      aiResults.forEach((result: any) => {
        // Extract model usage from results
        const models = ['cnn', 'gpt4', 'claude', 'gemini'];
        models.forEach(model => {
          const modelResults = result[`${model}Results`];
          if (modelResults) {
            if (!modelStats[model]) {
              modelStats[model] = {
                totalRequests: 0,
                successCount: 0,
                totalProcessingTime: 0,
                errorCount: 0
              };
            }

            modelStats[model].totalRequests++;
            
            // Determine success based on presence and quality of results
            if (modelResults && typeof modelResults === 'object' && Object.keys(modelResults).length > 0) {
              modelStats[model].successCount++;
            } else {
              modelStats[model].errorCount++;
            }

            // Extract processing time from processingTime JSON
            const processingTimeData = result.processingTime as any;
            if (processingTimeData && processingTimeData[model]) {
              modelStats[model].totalProcessingTime += Number(processingTimeData[model]) || 0;
            }
          }
        });
      });

      const usageData: AIModelUsageData[] = Object.entries(modelStats).map(([modelName, stats]) => ({
        modelName,
        usageCount: stats.totalRequests,
        averageProcessingTime: stats.totalRequests > 0 ? 
          Math.round(stats.totalProcessingTime / stats.totalRequests) : 0,
        successRate: stats.totalRequests > 0 ? 
          Math.round((stats.successCount / stats.totalRequests) * 100) : 0,
        totalRequests: stats.totalRequests,
        errorRate: stats.totalRequests > 0 ? 
          Math.round((stats.errorCount / stats.totalRequests) * 100) : 0,
        timestamp: new Date()
      }));

      this.setCacheData(cacheKey, usageData);
      return usageData;
    } catch (error) {
      console.error('❌ Failed to get AI model usage data:', error);
      throw error;
    }
  }

  /**
   * Clear cache for specific keys or all cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      Object.keys(this.cache).forEach(key => {
        if (key.includes(pattern)) {
          delete this.cache[key];
        }
      });
      console.log(`🗑️ Cleared cache entries matching pattern: ${pattern}`);
    } else {
      this.cache = {};
      console.log('🗑️ Cleared all cache');
    }
  }

  // Private helper methods
  private async getSessionMetricsData(filters: AnalyticsFilters) {
    return await prisma.sessionMetrics.findMany({
      where: {
        sessionStart: {
          gte: filters.startDate,
          lte: filters.endDate
        },
        ...(filters.userId && { userId: filters.userId })
      },
      select: {
        userId: true,
        sessionStart: true,
        sessionEnd: true,
        activeTime: true,
        engagementScore: true
      }
    });
  }

  private async getUserAnalyticsData(filters: AnalyticsFilters) {
    return await prisma.userAnalytics.findMany({
      where: {
        timestamp: {
          gte: filters.startDate,
          lte: filters.endDate
        },
        ...(filters.userId && { userId: filters.userId })
      },
      select: {
        userId: true,
        pageViews: true,
        contentInteractions: true,
        cnnAnalysisUsage: true,
        timestamp: true
      }
    });
  }

  private async getAIAnalysisData(filters: AnalyticsFilters) {
    return await prisma.aIAnalysisResults.findMany({
      where: {
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate
        }
      },
      select: {
        cnnResults: true,
        gpt4Results: true,
        claudeResults: true,
        geminiResults: true,
        processingTime: true,
        confidence: true,
        createdAt: true
      }
    });
  }

  private generateCacheKey(type: string, filters: AnalyticsFilters): string {
    const filterStr = JSON.stringify({
      start: filters.startDate.getTime(),
      end: filters.endDate.getTime(),
      courseId: filters.courseId,
      userId: filters.userId,
      granularity: filters.timeGranularity
    });
    return `${type}_${Buffer.from(filterStr).toString('base64')}`;
  }

  private isCached(key: string): boolean {
    return !!(this.cache[key] && this.cache[key].expiry > new Date());
  }

  private setCacheData(key: string, data: any): void {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + this.cacheExpiryMinutes);
    this.cache[key] = { data, expiry };
  }

  private generateTimeIntervals(filters: AnalyticsFilters): Array<{start: Date, end: Date}> {
    const intervals: Array<{start: Date, end: Date}> = [];
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);

    let current = new Date(start);
    while (current < end) {
      const intervalEnd = new Date(current);
      
      switch (filters.timeGranularity) {
        case 'hour':
          intervalEnd.setHours(intervalEnd.getHours() + 1);
          break;
        case 'day':
          intervalEnd.setDate(intervalEnd.getDate() + 1);
          break;
        case 'week':
          intervalEnd.setDate(intervalEnd.getDate() + 7);
          break;
      }

      intervals.push({
        start: new Date(current),
        end: intervalEnd > end ? new Date(end) : intervalEnd
      });

      current = intervalEnd;
    }

    return intervals;
  }

  // Calculation helper methods
  private calculateActiveUsers(sessions: any[]): number {
    const uniqueUsers = new Set(sessions.map(s => s.userId));
    return uniqueUsers.size;
  }

  private calculateAverageSessionDuration(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    const totalTime = sessions.reduce((acc, session) => acc + (session.activeTime || 0), 0);
    return Math.round(totalTime / sessions.length);
  }

  private calculateContentAnalysisCount(analytics: any[]): number {
    return analytics.filter(record => 
      record.cnnAnalysisUsage && Object.keys(record.cnnAnalysisUsage as object).length > 0
    ).length;
  }

  private calculateAIModelUsage(aiResults: any[]): Record<string, number> {
    const usage: Record<string, number> = {};
    aiResults.forEach(result => {
      const model = result.modelUsed || 'unknown';
      usage[model] = (usage[model] || 0) + 1;
    });
    return usage;
  }

  private calculateTotalPageViews(analytics: any[]): number {
    return analytics.reduce((acc, record) => {
      const pageViews = record.pageViews as object;
      return acc + Object.keys(pageViews || {}).length;
    }, 0);
  }

  private calculateAverageEngagement(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    const totalEngagement = sessions.reduce((acc, session) => acc + (session.engagementScore || 0), 0);
    return Math.round((totalEngagement / sessions.length) * 100) / 100;
  }

  private calculateCompletionRate(analytics: any[]): number {
    // Mock calculation - would need actual completion data
    return Math.round(Math.random() * 40 + 60); // 60-100%
  }

  private calculateRetentionRate(sessions: any[]): number {
    // Mock calculation - would need retention logic
    return Math.round(Math.random() * 20 + 70); // 70-90%
  }

  private calculateLearningOutcomes(analytics: any[]): number {
    return analytics.length; // Simple count for now
  }

  private calculatePerformanceImprovement(aiResults: any[]): number {
    if (aiResults.length === 0) return 0;
    const avgAccuracy = aiResults.reduce((acc, result) => acc + (result.accuracy || 0), 0) / aiResults.length;
    return Math.round(avgAccuracy * 100) / 100;
  }

  private calculateCollaborationIndex(analytics: any[]): number {
    // Mock calculation - would need collaboration data
    return Math.round(Math.random() * 30 + 40); // 40-70
  }

  private calculateEngagementChange(sessions: any[], filters: AnalyticsFilters): number {
    // Mock calculation - would compare with previous period
    return Math.round((Math.random() - 0.5) * 20); // -10% to +10%
  }

  private calculateContentInteractions(analytics: any[]): number {
    return analytics.reduce((acc, record) => {
      const interactions = record.contentInteractions as object;
      return acc + (interactions ? 1 : 0);
    }, 0);
  }
}
