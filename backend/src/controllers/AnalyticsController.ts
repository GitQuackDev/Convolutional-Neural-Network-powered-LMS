/**
 * Analytics Controller
 * Handles analytics dashboard API endpoints with data aggregation and caching
 */

import { Request, Response } from 'express';
import { AnalyticsAggregationService } from '../services/AnalyticsAggregationService';

interface AuthenticatedRequest extends Request {
  user?: { 
    userId: string;
    email: string;
    role: string;
  };
}

interface AnalyticsFilters {
  startDate: Date;
  endDate: Date;
  courseId?: string;
  userId?: string;
  timeGranularity: 'hour' | 'day' | 'week';
}

export class AnalyticsController {
  private aggregationService = new AnalyticsAggregationService();

  /**
   * Get comprehensive analytics overview
   * GET /api/analytics/overview
   */
  async getAnalyticsOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check authorization - only professors and admins can access analytics
      if (!req.user || (req.user.role !== 'professor' && req.user.role !== 'admin')) {
        res.status(403).json({ error: 'Access denied: insufficient permissions' });
        return;
      }

      const filters = this.parseAnalyticsFilters(req.query);
      
      if (!filters) {
        res.status(400).json({ error: 'Invalid filter parameters' });
        return;
      }

      console.log('📊 Fetching analytics overview with filters:', filters);

      const metrics = await this.aggregationService.getAnalyticsMetrics(filters);
      
      res.status(200).json({
        success: true,
        data: metrics,
        filters: {
          startDate: filters.startDate.toISOString(),
          endDate: filters.endDate.toISOString(),
          granularity: filters.timeGranularity
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to fetch analytics overview:', error);
      res.status(500).json({ 
        error: 'Failed to fetch analytics overview',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get engagement data for charts
   * GET /api/analytics/engagement
   */
  async getEngagementData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || (req.user.role !== 'professor' && req.user.role !== 'admin')) {
        res.status(403).json({ error: 'Access denied: insufficient permissions' });
        return;
      }

      const filters = this.parseAnalyticsFilters(req.query);
      
      if (!filters) {
        res.status(400).json({ error: 'Invalid filter parameters' });
        return;
      }

      console.log('📈 Fetching engagement data with filters:', filters);

      const engagementData = await this.aggregationService.getEngagementData(filters);
      
      res.status(200).json({
        success: true,
        data: engagementData,
        filters: {
          startDate: filters.startDate.toISOString(),
          endDate: filters.endDate.toISOString(),
          granularity: filters.timeGranularity
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to fetch engagement data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch engagement data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get learning progress data
   * GET /api/analytics/progress
   */
  async getLearningProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || (req.user.role !== 'professor' && req.user.role !== 'admin')) {
        res.status(403).json({ error: 'Access denied: insufficient permissions' });
        return;
      }

      const filters = this.parseAnalyticsFilters(req.query);
      
      if (!filters) {
        res.status(400).json({ error: 'Invalid filter parameters' });
        return;
      }

      console.log('📚 Fetching learning progress with filters:', filters);

      const progressData = await this.aggregationService.getLearningProgressData(filters);
      
      res.status(200).json({
        success: true,
        data: progressData,
        filters: {
          startDate: filters.startDate.toISOString(),
          endDate: filters.endDate.toISOString()
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to fetch learning progress:', error);
      res.status(500).json({ 
        error: 'Failed to fetch learning progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get AI model usage analytics
   * GET /api/analytics/ai-models/usage
   */
  async getAIModelUsage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || (req.user.role !== 'professor' && req.user.role !== 'admin')) {
        res.status(403).json({ error: 'Access denied: insufficient permissions' });
        return;
      }

      const filters = this.parseAnalyticsFilters(req.query);
      
      if (!filters) {
        res.status(400).json({ error: 'Invalid filter parameters' });
        return;
      }

      console.log('🤖 Fetching AI model usage with filters:', filters);

      const aiUsageData = await this.aggregationService.getAIModelUsageData(filters);
      
      res.status(200).json({
        success: true,
        data: aiUsageData,
        filters: {
          startDate: filters.startDate.toISOString(),
          endDate: filters.endDate.toISOString()
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to fetch AI model usage:', error);
      res.status(500).json({ 
        error: 'Failed to fetch AI model usage',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Export analytics data
   * POST /api/analytics/export
   */
  async exportAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || (req.user.role !== 'professor' && req.user.role !== 'admin')) {
        res.status(403).json({ error: 'Access denied: insufficient permissions' });
        return;
      }

      const { format, filters: rawFilters, reportType = 'comprehensive' } = req.body;

      if (!format || !['pdf', 'csv'].includes(format)) {
        res.status(400).json({ error: 'Invalid export format. Use "pdf" or "csv"' });
        return;
      }

      const filters = this.parseAnalyticsFilters(rawFilters);
      
      if (!filters) {
        res.status(400).json({ error: 'Invalid filter parameters' });
        return;
      }

      console.log(`📄 Exporting analytics data as ${format.toUpperCase()} with filters:`, filters);

      // Get comprehensive data for export
      const exportFilters = { ...filters, timeGranularity: 'day' as const };
      const data = await this.aggregationService.getAnalyticsMetrics(exportFilters);
      const engagement = await this.aggregationService.getEngagementData(exportFilters);
      const progress = await this.aggregationService.getLearningProgressData(exportFilters);
      const aiUsage = await this.aggregationService.getAIModelUsageData(exportFilters);

      if (format === 'csv') {
        // Generate CSV
        const csvData = this.generateCSVReport(data, engagement, progress, aiUsage, reportType);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.status(200).send(csvData);
      } else if (format === 'pdf') {
        // Generate PDF placeholder (would require pdf generation library)
        res.status(200).json({
          success: true,
          message: 'PDF export feature coming soon',
          data: {
            downloadUrl: `/api/analytics/reports/pdf/${Date.now()}`,
            reportType,
            generatedAt: new Date().toISOString(),
            summary: {
              totalRecords: data.activeUsers + data.totalSessions,
              dateRange: { start: filters.startDate, end: filters.endDate },
              format: 'PDF'
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Error exporting analytics:', error);
      res.status(500).json({
        error: 'Failed to export analytics data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Clear analytics cache
   * DELETE /api/analytics/cache
   */
  async clearCache(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Access denied: Admin role required' });
        return;
      }

      const { pattern } = req.query as any;
      const cleared = this.aggregationService.clearCache(pattern);

      res.status(200).json({
        success: true,
        message: `Cache cleared successfully`,
        data: {
          pattern: pattern || 'all',
          cleared,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      res.status(500).json({
        error: 'Failed to clear cache',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get cache status
   * GET /api/analytics/cache/status
   */
  async getCacheStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Access denied: Admin role required' });
        return;
      }

      // Simple cache status since getCacheStatus method doesn't exist
      const cacheInfo = {
        enabled: true,
        size: Object.keys(this.aggregationService['cache'] || {}).length,
        lastClearTime: new Date().toISOString(),
        expiryMinutes: 5
      };

      res.status(200).json({
        success: true,
        data: {
          cacheStatus: cacheInfo,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error getting cache status:', error);
      res.status(500).json({
        error: 'Failed to get cache status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate CSV report from analytics data
   */
  private generateCSVReport(
    data: any,
    engagement: any,
    progress: any,
    aiUsage: any,
    reportType: string
  ): string {
    let csvContent = '';

    if (reportType === 'comprehensive') {
      // Overview metrics
      csvContent += 'Analytics Overview\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Active Users,${data.activeUsers}\n`;
      csvContent += `Total Sessions,${data.totalSessions}\n`;
      csvContent += `Page Views,${data.totalPageViews}\n`;
      csvContent += `Average Session Duration,${data.averageSessionDuration}\n`;
      csvContent += `Content Analysis Count,${data.contentAnalysisCount}\n`;
      csvContent += `Engagement Score,${data.avgEngagementScore}\n`;
      csvContent += `Completion Rate,${data.completionRate}%\n`;
      csvContent += `Retention Rate,${data.retentionRate}%\n\n`;

      // Engagement timeline
      csvContent += 'Daily Engagement\n';
      csvContent += 'Date,Page Views,Sessions,Unique Users\n';
      engagement.timeline?.forEach((day: any) => {
        csvContent += `${day.date},${day.pageViews},${day.sessions},${day.uniqueUsers}\n`;
      });
      csvContent += '\n';

      // Learning progress
      csvContent += 'Learning Progress Summary\n';
      csvContent += 'Course,Completion Rate,Average Progress,Active Students\n';
      progress.courseProgress?.forEach((course: any) => {
        csvContent += `${course.courseName},${course.completionRate}%,${course.averageProgress}%,${course.activeStudents}\n`;
      });
      csvContent += '\n';

      // AI Model Usage
      csvContent += 'AI Model Usage\n';
      csvContent += 'Model,Usage Count,Success Rate,Average Processing Time\n';
      aiUsage.modelUsage?.forEach((model: any) => {
        csvContent += `${model.model},${model.usageCount},${model.successRate}%,${model.avgProcessingTime}ms\n`;
      });
    }

    return csvContent;
  }

  /**
   * Parse and validate analytics filters from request query parameters
   */
  private parseAnalyticsFilters(query: any): AnalyticsFilters | null {
    try {
      const now = new Date();
      const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      const startDate = query.startDate ? new Date(query.startDate) : defaultStart;
      const endDate = query.endDate ? new Date(query.endDate) : now;
      const granularity = query.granularity || 'day';
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }
      
      if (startDate >= endDate) {
        return null;
      }
      
      // Validate granularity
      if (!['hour', 'day', 'week'].includes(granularity)) {
        return null;
      }
      
      return {
        startDate,
        endDate,
        courseId: query.courseId,
        userId: query.userId,
        timeGranularity: granularity as 'hour' | 'day' | 'week'
      };
    } catch (error) {
      console.error('❌ Failed to parse analytics filters:', error);
      return null;
    }
  }
}
