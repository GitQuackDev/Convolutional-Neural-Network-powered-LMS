/**
 * Advanced Insights Controller
 * Story 1.9: Advanced Reporting and Insights
 * 
 * Provides REST API endpoints for AI-powered insights and report generation
 */

import { Request, Response } from 'express';
import { AdvancedInsightsService } from '../services/advancedInsightsService';
import { ReportBuilderService } from '../services/reportBuilderService';

const insightsService = new AdvancedInsightsService();
const reportBuilderService = new ReportBuilderService();

/**
 * Generate comprehensive insights for a user or course
 */
export const generateInsights = async (req: Request, res: Response) => {
  try {
    const { userId, courseId, timeRange, includeAI } = req.body;

    const filters: any = {
      userId,
      courseId,
      timeRange: timeRange ? {
        start: new Date(timeRange.start),
        end: new Date(timeRange.end)
      } : undefined,
      courses: [],
      students: [],
      contentTypes: [],
      aiModels: [],
      confidenceThreshold: 0.5,
      includePredictive: true
    };

    const insights = await insightsService.generateInsights(filters);

    return res.status(200).json({
      success: true,
      data: insights,
      message: 'Insights generated successfully'
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get existing insights with filtering
 */
export const getInsights = async (req: Request, res: Response) => {
  try {
    const { userId, courseId, startDate, endDate } = req.query;

    let insights;
    const timeRange = startDate && endDate ? {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    } : undefined;

    if (userId) {
      insights = await insightsService.getUserInsights(userId as string, timeRange);
    } else if (courseId) {
      insights = await insightsService.getCourseInsights(courseId as string, timeRange);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either userId or courseId is required'
      });
    }

    return res.status(200).json({
      success: true,
      data: insights,
      message: 'Insights retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve insights',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Generate predictive insights
 */
export const generatePredictions = async (req: Request, res: Response) => {
  try {
    const { userId, courseId, timeframe } = req.body;

    // Get historical data for predictions
    const historicalData: any[] = []; // Placeholder - would fetch actual historical data
    const aiInsights: any[] = []; // Placeholder - would fetch AI insights

    const predictions = await insightsService.generatePredictiveInsights(
      historicalData,
      aiInsights
    );

    return res.status(200).json({
      success: true,
      data: predictions,
      message: 'Predictions generated successfully'
    });
  } catch (error) {
    console.error('Error generating predictions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate predictions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Generate personalized recommendations
 */
export const generateRecommendations = async (req: Request, res: Response) => {
  try {
    const { userId, context } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required for recommendations'
      });
    }

    const recommendations = await insightsService.generatePersonalizedRecommendations(
      userId,
      context || {}
    );

    return res.status(200).json({
      success: true,
      data: recommendations,
      message: 'Recommendations generated successfully'
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get existing recommendations for a user
 */
export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { priority, status } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const recommendations = await insightsService.getRecommendations(userId);

    // Apply filters if provided
    let filteredRecommendations = recommendations;
    if (priority) {
      filteredRecommendations = filteredRecommendations.filter(
        (rec: any) => rec.priority === priority
      );
    }
    if (status) {
      filteredRecommendations = filteredRecommendations.filter(
        (rec: any) => rec.status === status
      );
    }

    return res.status(200).json({
      success: true,
      data: filteredRecommendations,
      message: 'Recommendations retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve recommendations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Generate a comprehensive report
 */
export const generateReport = async (req: Request, res: Response) => {
  try {
    const reportRequest = req.body;

    // Validate required fields
    if (!reportRequest.title || !reportRequest.format || !reportRequest.sections) {
      return res.status(400).json({
        success: false,
        message: 'Report title, format, and sections are required'
      });
    }

    const report = await reportBuilderService.generateReport(reportRequest);

    return res.status(200).json({
      success: true,
      data: report,
      message: 'Report generated successfully'
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all available reports
 */
export const getReports = async (req: Request, res: Response) => {
  try {
    const { userId, format, startDate, endDate } = req.query;

    const filters: any = {};
    if (userId) filters.userId = userId;
    if (format) filters.format = format;
    if (startDate && endDate) {
      filters.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const reports = await reportBuilderService.getReports(filters);

    return res.status(200).json({
      success: true,
      data: reports,
      message: 'Reports retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving reports:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Download a specific report file
 */
export const downloadReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    
    // Get report metadata from database
    const reports = await reportBuilderService.getReports({ id: reportId });
    
    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = reports[0];
    const filePath = report.filePath;

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Report file not found'
      });
    }

    // Set appropriate headers for file download
    const fileName = filePath.split('/').pop() || 'report';
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Determine content type based on format
    switch (report.format) {
      case 'PDF':
        res.setHeader('Content-Type', 'application/pdf');
        break;
      case 'CSV':
        res.setHeader('Content-Type', 'text/csv');
        break;
      case 'JSON':
        res.setHeader('Content-Type', 'application/json');
        break;
      default:
        res.setHeader('Content-Type', 'application/octet-stream');
    }

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    return; // Explicit return for streaming response
  } catch (error) {
    console.error('Error downloading report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to download report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete a report
 */
export const deleteReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: 'Report ID is required'
      });
    }

    await reportBuilderService.deleteReport(reportId);

    return res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update recommendation status (mark as implemented, dismissed, etc.)
 * Note: This is a placeholder - the actual implementation would require
 * adding the updateRecommendationStatus method to AdvancedInsightsService
 */
export const updateRecommendationStatus = async (req: Request, res: Response) => {
  try {
    const { recommendationId } = req.params;
    const { status, implementationNotes } = req.body;

    // Placeholder implementation
    // await insightsService.updateRecommendationStatus(
    //   recommendationId,
    //   status,
    //   implementationNotes
    // );

    return res.status(200).json({
      success: true,
      message: 'Recommendation status update not yet implemented'
    });
  } catch (error) {
    console.error('Error updating recommendation status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update recommendation status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get insight analytics and metrics
 */
export const getInsightAnalytics = async (req: Request, res: Response) => {
  try {
    const { timeRange } = req.query;

    const analytics = {
      totalInsights: 0,
      insightsByType: {},
      averageConfidence: 0,
      actionableInsights: 0,
      implementedRecommendations: 0,
      topCategories: []
    };

    // This would be implemented with actual analytics queries
    // For now, returning placeholder data

    return res.status(200).json({
      success: true,
      data: analytics,
      message: 'Insight analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving insight analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve insight analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
