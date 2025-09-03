import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AnalyticsController } from '../controllers/AnalyticsController';

const router = Router();
const analyticsController = new AnalyticsController();

// All analytics routes require authentication
router.use(authenticateToken as any);

/**
 * Analytics Overview - Comprehensive metrics
 * GET /api/analytics/overview?startDate=2025-01-01&endDate=2025-01-31&granularity=day
 */
router.get('/overview', (req: Request, res: Response) => 
  analyticsController.getAnalyticsOverview(req as any, res)
);

/**
 * Engagement Data - Timeline data for charts
 * GET /api/analytics/engagement?startDate=2025-01-01&endDate=2025-01-31&granularity=day
 */
router.get('/engagement', (req: Request, res: Response) =>
  analyticsController.getEngagementData(req as any, res)
);

/**
 * Learning Progress - Student/course progress data
 * GET /api/analytics/progress?startDate=2025-01-01&endDate=2025-01-31
 */
router.get('/progress', (req: Request, res: Response) =>
  analyticsController.getLearningProgress(req as any, res)
);

/**
 * AI Model Usage Analytics
 * GET /api/analytics/ai-models/usage?startDate=2025-01-01&endDate=2025-01-31
 */
router.get('/ai-models/usage', (req: Request, res: Response) =>
  analyticsController.getAIModelUsage(req as any, res)
);

/**
 * Export Analytics Data
 * POST /api/analytics/export
 * Body: { format: 'pdf' | 'csv', filters: {...}, reportType: 'comprehensive' }
 */
router.post('/export', (req: Request, res: Response) =>
  analyticsController.exportAnalytics(req as any, res)
);

/**
 * Cache Management - Admin only
 * DELETE /api/analytics/cache?pattern=metrics
 */
router.delete('/cache', (req: Request, res: Response) =>
  analyticsController.clearCache(req as any, res)
);

/**
 * Cache Status - Admin only
 * GET /api/analytics/cache/status
 */
router.get('/cache/status', (req: Request, res: Response) =>
  analyticsController.getCacheStatus(req as any, res)
);

/**
 * Record custom analytics event
 */
router.post('/event', async (req: Request, res: Response) => {
  try {
    const { action, resource, metadata } = req.body;
    
    // TODO: Implement custom event recording once AnalyticsService is integrated
    console.log(`📊 Custom Analytics Event: ${action} - ${resource}`, metadata);
    
    res.status(200).json({
      success: true,
      message: 'Analytics event recorded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error recording analytics event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record analytics event',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
