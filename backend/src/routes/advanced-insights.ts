import { Router } from 'express';
import * as advancedInsightsController from '../controllers/advancedInsightsController';
import { authenticateToken } from '../middleware/auth';
import {
  requireInsightAccess,
  requireReportGeneration,
  requireReportManagement,
  requirePredictiveAccess,
  validateCoursePermissions,
  validateUserPermissions
} from '../middleware/insightPermissions';

const router = Router();

/**
 * @route POST /api/insights/generate
 * @desc Generate comprehensive insights for a user or course
 * @access Private
 */
router.post('/generate', 
  authenticateToken as any, 
  requireInsightAccess,
  validateCoursePermissions,
  validateUserPermissions,
  (req, res) => advancedInsightsController.generateInsights(req as any, res)
);

/**
 * @route GET /api/insights
 * @desc Get existing insights with filtering
 * @access Private
 */
router.get('/', 
  authenticateToken as any, 
  requireInsightAccess,
  validateCoursePermissions,
  validateUserPermissions,
  (req, res) => advancedInsightsController.getInsights(req as any, res)
);

/**
 * @route POST /api/insights/predictions
 * @desc Generate predictive insights
 * @access Private
 */
router.post('/predictions', 
  authenticateToken as any, 
  requireInsightAccess,
  requirePredictiveAccess,
  validateCoursePermissions,
  validateUserPermissions,
  (req, res) => advancedInsightsController.generatePredictions(req as any, res)
);

/**
 * @route GET /api/insights/predictions
 * @desc Get existing predictions
 * @access Private
 */
router.get('/predictions', 
  authenticateToken as any, 
  requireInsightAccess,
  requirePredictiveAccess,
  validateCoursePermissions,
  validateUserPermissions,
  (req, res) => advancedInsightsController.getInsights(req as any, res)
);

/**
 * @route POST /api/insights/recommendations
 * @desc Generate personalized recommendations
 * @access Private
 */
router.post('/recommendations', 
  authenticateToken as any, 
  requireInsightAccess,
  validateUserPermissions,
  (req, res) => advancedInsightsController.generateRecommendations(req as any, res)
);

/**
 * @route GET /api/insights/recommendations
 * @desc Get existing recommendations
 * @access Private
 */
router.get('/recommendations', 
  authenticateToken as any, 
  requireInsightAccess,
  validateUserPermissions,
  (req, res) => advancedInsightsController.getRecommendations(req as any, res)
);

/**
 * @route POST /api/insights/reports
 * @desc Generate comprehensive report
 * @access Private
 */
router.post('/reports', 
  authenticateToken as any, 
  requireInsightAccess,
  requireReportGeneration,
  validateCoursePermissions,
  validateUserPermissions,
  (req, res) => advancedInsightsController.generateReport(req as any, res)
);

/**
 * @route GET /api/insights/reports
 * @desc Get existing reports
 * @access Private
 */
router.get('/reports', 
  authenticateToken as any, 
  requireInsightAccess,
  (req, res) => advancedInsightsController.getReports(req as any, res)
);

/**
 * @route GET /api/insights/reports/:reportId/download
 * @desc Download a specific report
 * @access Private
 */
router.get('/reports/:reportId/download', 
  authenticateToken as any, 
  requireInsightAccess,
  (req, res) => advancedInsightsController.downloadReport(req as any, res)
);

/**
 * @route DELETE /api/insights/reports/:reportId
 * @desc Delete a specific report
 * @access Private
 */
router.delete('/reports/:reportId', 
  authenticateToken as any, 
  requireInsightAccess,
  requireReportManagement,
  (req, res) => advancedInsightsController.deleteReport(req as any, res)
);

/**
 * @route GET /api/insights/permissions
 * @desc Get user's insight permissions
 * @access Private
 */
router.get('/permissions', 
  authenticateToken as any, 
  requireInsightAccess,
  (req, res) => {
    const permissions = (req as any).insightPermissions;
    res.json({
      success: true,
      data: permissions
    });
  }
);

export default router;
