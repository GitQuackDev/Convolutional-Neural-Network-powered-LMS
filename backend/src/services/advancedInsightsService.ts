import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from './AnalyticsService';
import { InsightGenerationEngine } from './insightEngine';
import { PredictiveAnalyticsEngine } from './predictiveEngine';
import { RecommendationEngine } from './recommendationEngine';
import { AIServiceManager } from './aiModels/AIServiceManager';

const prisma = new PrismaClient();

export interface InsightFilters {
  courses: string[];
  students: string[];
  contentTypes: string[];
  aiModels: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  confidenceThreshold: number;
}

export interface GeneratedInsights {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  recommendations: Recommendation[];
  supportingData: any[];
  aiSources: any;
  generatedAt: Date;
}

export interface PredictiveInsight {
  id: string;
  type: string;
  subject: string;
  subjectType: string;
  prediction: any;
  confidence: number;
  factors: any[];
  timeline: any;
  recommendations: Recommendation[];
  historicalDataIds: string[];
  createdAt: Date;
  expiresAt: Date;
}

export interface Recommendation {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  targetUserId?: string;
  targetCourseId?: string;
  targetContentId?: string;
  actionRequired: string;
  expectedImpact: string;
  confidence: number;
  sourceInsightId?: string;
  sourcePredictionId?: string;
  isImplemented: boolean;
  implementedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export interface RecommendationContext {
  courseId?: string;
  userId?: string;
  contentId?: string;
  userRole: string;
  currentPerformance?: number;
  engagementLevel?: number;
}

/**
 * Advanced Insights Service
 * Generates AI-powered educational insights by combining analytics data with AI analysis results
 */
export class AdvancedInsightsService {
  private prisma: PrismaClient;
  private analyticsService: AnalyticsService;
  private aiService: AIServiceManager;
  private insightEngine: InsightGenerationEngine;
  private predictiveEngine: PredictiveAnalyticsEngine;
  private recommendationEngine: RecommendationEngine;

  constructor() {
    this.prisma = new PrismaClient();
    this.analyticsService = new AnalyticsService();
    this.aiService = null as any; // Will be initialized when needed
    this.insightEngine = new InsightGenerationEngine();
    this.predictiveEngine = new PredictiveAnalyticsEngine();
    this.recommendationEngine = new RecommendationEngine();
  }

  /**
   * Generate comprehensive insights based on filters
   */
  async generateInsights(filters: InsightFilters): Promise<GeneratedInsights[]> {
    try {
      // 1. Gather analytics data
      const analyticsData = await this.analyticsService.getAggregatedData(filters);
      
      // 2. Create simplified AI results structure since full AI integration is not ready
      const aiResults = [{
        aiResults: [],
        patterns: [],
        trends: []
      }];
      
      // 3. Process data through insight engine
      const insights = await this.insightEngine.processData(analyticsData, aiResults);
      
      // 4. Store insights in database
      const savedInsights = await this.saveInsights(insights, filters);
      
      return savedInsights;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw new Error('Failed to generate insights');
    }
  }

  /**
   * Generate predictive insights for future performance
   */
  async generatePredictiveInsights(
    historicalData: any[],
    aiInsights: any[]
  ): Promise<PredictiveInsight[]> {
    try {
      const predictionInput = {
        historicalData: historicalData,
        currentMetrics: aiInsights,
        timeframe: 30 // 30 days prediction
      };
      
      const predictions = await this.predictiveEngine.generatePredictions(predictionInput);

      // Save predictions to database
      const savedPredictions = await this.savePredictiveInsights(predictions);
      
      return savedPredictions;
    } catch (error) {
      console.error('Error generating predictive insights:', error);
      throw new Error('Failed to generate predictive insights');
    }
  }

  /**
   * Generate personalized recommendations for users
   */
  async generatePersonalizedRecommendations(
    userId: string,
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    try {
      // Build user profile
      const userProfile = await this.buildUserProfile(userId);
      
      // Gather contextual data
      const contextualData = await this.gatherContextualData(context);
      
      // Generate recommendations
      const recommendationInput: any = {
        userId: context.userId,
        courseId: context.courseId,
        userProfile: userProfile,
        performanceData: contextualData.performanceData || {},
        engagementData: contextualData.engagementData || {},
        learningGoals: contextualData.learningGoals || {},
        constraints: contextualData.constraints
      };
      
      const recommendations = await this.recommendationEngine.generateRecommendations(
        recommendationInput
      );

      // Save recommendations
      const savedRecommendations = await this.saveRecommendations(recommendations);
      
      return savedRecommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Get insights for a specific course
   */
  async getCourseInsights(courseId: string, timeRange?: { start: Date; end: Date }): Promise<GeneratedInsights[]> {
    try {
      const whereClause: any = {
        courseId: courseId
      };

      if (timeRange) {
        whereClause.createdAt = {
          gte: timeRange.start,
          lte: timeRange.end
        };
      }

      const insights = await this.prisma.generatedInsight.findMany({
        where: whereClause,
        include: {
          user: true,
          course: true,
          recommendations: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return insights.map(this.formatInsight);
    } catch (error) {
      console.error('Error getting course insights:', error);
      throw new Error('Failed to get course insights');
    }
  }

  /**
   * Get insights for a specific user
   */
  async getUserInsights(userId: string, timeRange?: { start: Date; end: Date }): Promise<GeneratedInsights[]> {
    try {
      const whereClause: any = {
        userId: userId
      };

      if (timeRange) {
        whereClause.createdAt = {
          gte: timeRange.start,
          lte: timeRange.end
        };
      }

      const insights = await this.prisma.generatedInsight.findMany({
        where: whereClause,
        include: {
          user: true,
          course: true,
          recommendations: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return insights.map(this.formatInsight);
    } catch (error) {
      console.error('Error getting user insights:', error);
      throw new Error('Failed to get user insights');
    }
  }

  /**
   * Get predictive insights for a subject
   */
  async getPredictiveInsights(
    subject: string, 
    subjectType: 'user' | 'course' | 'content'
  ): Promise<PredictiveInsight[]> {
    try {
      const predictions = await this.prisma.predictiveInsight.findMany({
        where: {
          subject: subject,
          subjectType: subjectType,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          recommendations: true
        },
        orderBy: {
          confidence: 'desc'
        }
      });

      return predictions.map(this.formatPredictiveInsight);
    } catch (error) {
      console.error('Error getting predictive insights:', error);
      throw new Error('Failed to get predictive insights');
    }
  }

  /**
   * Get recommendations for a user/course/content
   */
  async getRecommendations(
    targetUserId?: string,
    targetCourseId?: string,
    targetContentId?: string
  ): Promise<Recommendation[]> {
    try {
      const recommendations = await this.prisma.recommendation.findMany({
        where: {
          ...(targetUserId && { targetUserId }),
          ...(targetCourseId && { targetCourseId }),
          ...(targetContentId && { targetContentId }),
          isImplemented: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          sourceInsight: true,
          sourcePrediction: true
        },
        orderBy: [
          { priority: 'desc' },
          { confidence: 'desc' }
        ]
      });

      return recommendations.map(this.formatRecommendation);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to get recommendations');
    }
  }

  /**
   * Mark a recommendation as implemented
   */
  async implementRecommendation(recommendationId: string): Promise<void> {
    try {
      await this.prisma.recommendation.update({
        where: { id: recommendationId },
        data: {
          isImplemented: true,
          implementedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error implementing recommendation:', error);
      throw new Error('Failed to implement recommendation');
    }
  }

  /**
   * Private helper methods
   */
  private async saveInsights(insights: any[], filters: InsightFilters): Promise<GeneratedInsights[]> {
    const savedInsights: GeneratedInsights[] = [];

    for (const insight of insights) {
      const saved = await this.prisma.generatedInsight.create({
        data: {
          type: insight.type,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          userId: insight.userId,
          courseId: insight.courseId,
          contentId: insight.contentId,
          analyticsDataIds: insight.analyticsDataIds || [],
          aiResultIds: insight.aiResultIds || [],
          supportingData: insight.supportingData || {},
          isActionable: insight.isActionable || false
        },
        include: {
          user: true,
          course: true,
          recommendations: true
        }
      });

      savedInsights.push(this.formatInsight(saved));
    }

    return savedInsights;
  }

  private async savePredictiveInsights(predictions: any[]): Promise<PredictiveInsight[]> {
    const savedPredictions: PredictiveInsight[] = [];

    for (const prediction of predictions) {
      const saved = await this.prisma.predictiveInsight.create({
        data: {
          type: prediction.type,
          subject: prediction.subject,
          subjectType: prediction.subjectType,
          prediction: prediction.prediction || {},
          confidence: prediction.confidence,
          factors: prediction.factors || [],
          timeline: prediction.timeline || {},
          historicalDataIds: prediction.historicalDataIds || [],
          expiresAt: prediction.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        },
        include: {
          recommendations: true
        }
      });

      savedPredictions.push(this.formatPredictiveInsight(saved));
    }

    return savedPredictions;
  }

  private async saveRecommendations(recommendations: any[]): Promise<Recommendation[]> {
    const savedRecommendations: Recommendation[] = [];

    for (const recommendation of recommendations) {
      const saved = await this.prisma.recommendation.create({
        data: {
          type: recommendation.type,
          priority: recommendation.priority,
          title: recommendation.title,
          description: recommendation.description,
          targetUserId: recommendation.targetUserId,
          targetCourseId: recommendation.targetCourseId,
          targetContentId: recommendation.targetContentId,
          actionRequired: recommendation.actionRequired,
          expectedImpact: recommendation.expectedImpact,
          confidence: recommendation.confidence,
          sourceInsightId: recommendation.sourceInsightId,
          sourcePredictionId: recommendation.sourcePredictionId,
          expiresAt: recommendation.expiresAt
        },
        include: {
          sourceInsight: true,
          sourcePrediction: true
        }
      });

      savedRecommendations.push(this.formatRecommendation(saved));
    }

    return savedRecommendations;
  }

  private async buildUserProfile(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userAnalytics: {
          orderBy: { timestamp: 'desc' },
          take: 50
        },
        sessionMetrics: {
          orderBy: { sessionStart: 'desc' },
          take: 30
        },
        aiAnalysisResults: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    return {
      userId: user?.id,
      role: user?.role,
      analyticsHistory: user?.userAnalytics || [],
      sessionHistory: user?.sessionMetrics || [],
      aiAnalysisHistory: user?.aiAnalysisResults || []
    };
  }

  private async gatherContextualData(context: RecommendationContext): Promise<any> {
    const contextualData: any = {
      userRole: context.userRole,
      currentPerformance: context.currentPerformance,
      engagementLevel: context.engagementLevel
    };

    if (context.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: context.courseId },
        include: {
          enrollments: true,
          assignments: true
        }
      });
      contextualData.course = course;
    }

    return contextualData;
  }

  private formatInsight(insight: any): GeneratedInsights {
    return {
      id: insight.id,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      confidence: insight.confidence,
      recommendations: insight.recommendations?.map(this.formatRecommendation) || [],
      supportingData: insight.supportingData,
      aiSources: insight.aiResultIds,
      generatedAt: insight.createdAt
    };
  }

  private formatPredictiveInsight(prediction: any): PredictiveInsight {
    return {
      id: prediction.id,
      type: prediction.type,
      subject: prediction.subject,
      subjectType: prediction.subjectType,
      prediction: prediction.prediction,
      confidence: prediction.confidence,
      factors: prediction.factors,
      timeline: prediction.timeline,
      recommendations: prediction.recommendations?.map(this.formatRecommendation) || [],
      historicalDataIds: prediction.historicalDataIds,
      createdAt: prediction.createdAt,
      expiresAt: prediction.expiresAt
    };
  }

  private formatRecommendation(recommendation: any): Recommendation {
    return {
      id: recommendation.id,
      type: recommendation.type,
      priority: recommendation.priority,
      title: recommendation.title,
      description: recommendation.description,
      targetUserId: recommendation.targetUserId,
      targetCourseId: recommendation.targetCourseId,
      targetContentId: recommendation.targetContentId,
      actionRequired: recommendation.actionRequired,
      expectedImpact: recommendation.expectedImpact,
      confidence: recommendation.confidence,
      sourceInsightId: recommendation.sourceInsightId,
      sourcePredictionId: recommendation.sourcePredictionId,
      isImplemented: recommendation.isImplemented,
      implementedAt: recommendation.implementedAt,
      createdAt: recommendation.createdAt,
      expiresAt: recommendation.expiresAt
    };
  }

  /**
   * Generate predictions - wrapper method for compatibility
   */
  async generatePredictions(
    type: string,
    userId: string,
    context: any
  ): Promise<any> {
    try {
      // Use the predictive analytics engine to generate predictions
      const predictionInput = {
        type,
        userId,
        context,
        historicalData: await this.getHistoricalDataForUser(userId),
        currentMetrics: context.currentMetrics || {},
        timeframe: context.timeframe || 30
      };

      const predictions = await this.predictiveEngine.generatePredictions(predictionInput);
      return predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      throw new Error('Failed to generate predictions');
    }
  }

  /**
   * Get historical data for a user
   */
  private async getHistoricalDataForUser(userId: string): Promise<any[]> {
    try {
      // Get user analytics data
      const analytics = await this.analyticsService.getUserAnalyticsSummary(userId, 90);

      return analytics;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }
}
