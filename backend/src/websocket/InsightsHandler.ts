/**
 * Real-time Insights Handler
 * Story 1.9: Advanced Reporting and Insights
 * 
 * Manages real-time delivery of AI-powered insights and notifications
 */

import { Socket } from 'socket.io';
import { AdvancedInsightsService } from '../services/advancedInsightsService';
import { EventBroadcaster } from './EventBroadcaster';
import { ConnectionManager } from './ConnectionManager';
import { 
  InsightType, 
  PredictionType, 
  GeneratedInsight, 
  PredictiveInsight, 
  Recommendation 
} from '../types/insights';

export interface InsightNotification {
  id: string;
  type: 'insight' | 'prediction' | 'recommendation' | 'report_ready' | 'alert';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: any;
  targetUserId?: string;
  targetCourseId?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface InsightSubscription {
  userId: string;
  socketId: string;
  subscriptionTypes: InsightType[];
  courseFilters: string[];
  notificationPreferences: {
    realTime: boolean;
    summary: boolean;
    alerts: boolean;
  };
}

export class InsightsHandler {
  private insightsService: AdvancedInsightsService;
  private eventBroadcaster: EventBroadcaster;
  private connectionManager: ConnectionManager;
  private subscriptions: Map<string, InsightSubscription> = new Map();
  private insightCache: Map<string, any> = new Map();
  private processingQueue: InsightNotification[] = [];
  private isProcessing = false;

  constructor(
    insightsService: AdvancedInsightsService,
    eventBroadcaster: EventBroadcaster,
    connectionManager: ConnectionManager
  ) {
    this.insightsService = insightsService;
    this.eventBroadcaster = eventBroadcaster;
    this.connectionManager = connectionManager;

    // Start background processes
    this.startInsightMonitoring();
    this.startNotificationProcessor();
  }

  /**
   * Handle new socket connection for insights
   */
  public handleConnection(socket: Socket, userId: string): void {
    console.log(`🔗 User ${userId} connected to insights service`);

    // Register event handlers
    this.registerInsightHandlers(socket, userId);

    // Send initial insights if available
    this.sendInitialInsights(socket, userId);
  }

  /**
   * Handle socket disconnection
   */
  public handleDisconnection(socket: Socket, userId: string): void {
    console.log(`🔌 User ${userId} disconnected from insights service`);
    
    // Remove subscription
    this.subscriptions.delete(socket.id);
  }

  /**
   * Register insight-related event handlers
   */
  private registerInsightHandlers(socket: Socket, userId: string): void {
    // Subscribe to real-time insights
    socket.on('insights:subscribe', (data: {
      types: InsightType[];
      courseFilters: string[];
      preferences: any;
    }) => {
      this.handleInsightSubscription(socket, userId, data);
    });

    // Unsubscribe from insights
    socket.on('insights:unsubscribe', () => {
      this.subscriptions.delete(socket.id);
      socket.emit('insights:unsubscribed');
    });

    // Request immediate insight generation
    socket.on('insights:generate', async (data: {
      courseId?: string;
      timeRange?: any;
      types?: InsightType[];
    }) => {
      await this.handleInsightGeneration(socket, userId, data);
    });

    // Request predictive analytics
    socket.on('insights:predict', async (data: {
      type: PredictionType;
      context: any;
    }) => {
      await this.handlePredictionRequest(socket, userId, data);
    });

    // Request recommendations
    socket.on('insights:recommend', async (data: {
      context: any;
    }) => {
      await this.handleRecommendationRequest(socket, userId, data);
    });

    // Mark insights as read
    socket.on('insights:mark_read', (insightIds: string[]) => {
      this.handleMarkInsightsRead(userId, insightIds);
    });

    // Request insight history
    socket.on('insights:history', async (data: {
      limit?: number;
      offset?: number;
      filters?: any;
    }) => {
      await this.handleInsightHistory(socket, userId, data);
    });
  }

  /**
   * Handle insight subscription
   */
  private handleInsightSubscription(
    socket: Socket, 
    userId: string, 
    data: any
  ): void {
    const subscription: InsightSubscription = {
      userId,
      socketId: socket.id,
      subscriptionTypes: data.types || [],
      courseFilters: data.courseFilters || [],
      notificationPreferences: {
        realTime: data.preferences?.realTime ?? true,
        summary: data.preferences?.summary ?? true,
        alerts: data.preferences?.alerts ?? true
      }
    };

    this.subscriptions.set(socket.id, subscription);

    socket.emit('insights:subscribed', {
      success: true,
      subscription: {
        types: subscription.subscriptionTypes,
        courses: subscription.courseFilters,
        preferences: subscription.notificationPreferences
      }
    });

    console.log(`📊 User ${userId} subscribed to insights:`, subscription.subscriptionTypes);
  }

  /**
   * Handle insight generation request
   */
  private async handleInsightGeneration(
    socket: Socket, 
    userId: string, 
    data: any
  ): Promise<void> {
    try {
      socket.emit('insights:generation_started', { requestId: data.requestId });

      const filters = {
        courses: data.courseId ? [data.courseId] : [],
        students: data.courseId ? [] : [userId],
        contentTypes: data.types || [],
        aiModels: ['openai', 'anthropic', 'google'],
        dateRange: data.timeRange || {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        confidenceThreshold: 0.7
      };

      const insights = await this.insightsService.generateInsights(filters);

      socket.emit('insights:generated', {
        requestId: data.requestId,
        success: true,
        data: insights,
        generatedAt: new Date()
      });

      // Broadcast to other relevant users if course-level insights
      if (data.courseId) {
        await this.broadcastCourseInsights(data.courseId, insights, userId);
      }

    } catch (error) {
      console.error('Error generating insights:', error);
      socket.emit('insights:generation_error', {
        requestId: data.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Handle prediction request
   */
  private async handlePredictionRequest(
    socket: Socket, 
    userId: string, 
    data: any
  ): Promise<void> {
    try {
      const prediction = await this.insightsService.generatePredictions(
        data.type,
        userId,
        data.context
      );

      socket.emit('insights:prediction', {
        success: true,
        data: prediction,
        type: data.type,
        generatedAt: new Date()
      });

    } catch (error) {
      console.error('Error generating prediction:', error);
      socket.emit('insights:prediction_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Handle recommendation request
   */
  private async handleRecommendationRequest(
    socket: Socket, 
    userId: string, 
    data: any
  ): Promise<void> {
    try {
      const recommendations = await this.insightsService.generatePersonalizedRecommendations(
        userId,
        data.context
      );

      socket.emit('insights:recommendations', {
        success: true,
        data: recommendations,
        generatedAt: new Date()
      });

    } catch (error) {
      console.error('Error generating recommendations:', error);
      socket.emit('insights:recommendations_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Handle marking insights as read
   */
  private handleMarkInsightsRead(userId: string, insightIds: string[]): void {
    // Update read status in database
    // This would typically involve updating the insights records
    console.log(`📖 User ${userId} marked ${insightIds.length} insights as read`);
  }

  /**
   * Handle insight history request
   */
  private async handleInsightHistory(
    socket: Socket, 
    userId: string, 
    data: any
  ): Promise<void> {
    try {
      const timeRange = data.filters?.timeRange;
      const insights = await this.insightsService.getUserInsights(userId, timeRange);

      socket.emit('insights:history', {
        success: true,
        data: insights,
        total: insights.length,
        limit: data.limit,
        offset: data.offset
      });

    } catch (error) {
      console.error('Error fetching insight history:', error);
      socket.emit('insights:history_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send initial insights when user connects
   */
  private async sendInitialInsights(socket: Socket, userId: string): Promise<void> {
    try {
      // Get recent unread insights
      const recentInsights = await this.insightsService.getUserInsights(userId, {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date()
      });

      if (recentInsights.length > 0) {
        socket.emit('insights:initial', {
          insights: recentInsights,
          unreadCount: recentInsights.length,
          lastUpdated: new Date()
        });
      }

    } catch (error) {
      console.error('Error sending initial insights:', error);
    }
  }

  /**
   * Broadcast course-level insights to relevant users
   */
  private async broadcastCourseInsights(
    courseId: string, 
    insights: any[], 
    originUserId: string
  ): Promise<void> {
    // Get all users connected to this course
    const courseConnections = this.connectionManager.getCourseConnections(courseId);

    for (const courseConnection of courseConnections) {
      if (courseConnection.userId !== originUserId) {
        const subscription = this.subscriptions.get(courseConnection.socketId);
        
        if (subscription?.notificationPreferences.realTime) {
          courseConnection.socket.emit('insights:course_update', {
            courseId,
            insights: insights.filter(insight => 
              subscription.subscriptionTypes.includes(insight.type)
            ),
            source: 'peer_generated',
            timestamp: new Date()
          });
        }
      }
    }
  }

  /**
   * Start background insight monitoring
   */
  private startInsightMonitoring(): void {
    setInterval(async () => {
      try {
        await this.checkForNewInsights();
        await this.checkForCriticalAlerts();
      } catch (error) {
        console.error('Error in insight monitoring:', error);
      }
    }, 30000); // Check every 30 seconds

    console.log('📊 Insight monitoring service started');
  }

  /**
   * Check for new insights that need to be delivered
   */
  private async checkForNewInsights(): Promise<void> {
    // This would query for recent insights and send notifications
    // Implementation would depend on your specific requirements
  }

  /**
   * Check for critical alerts that need immediate attention
   */
  private async checkForCriticalAlerts(): Promise<void> {
    // Check for critical learning situations, performance drops, etc.
    // Send high-priority notifications
  }

  /**
   * Start notification processor
   */
  private startNotificationProcessor(): void {
    setInterval(() => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        this.processNotificationQueue();
      }
    }, 1000);

    console.log('📬 Notification processor started');
  }

  /**
   * Process notification queue
   */
  private async processNotificationQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    
    try {
      while (this.processingQueue.length > 0) {
        const notification = this.processingQueue.shift()!;
        await this.deliverNotification(notification);
      }
    } catch (error) {
      console.error('Error processing notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Deliver notification to relevant users
   */
  private async deliverNotification(notification: InsightNotification): Promise<void> {
    try {
      // Determine target users
      let targetUsers: string[] = [];
      
      if (notification.targetUserId) {
        targetUsers = [notification.targetUserId];
      } else if (notification.targetCourseId) {
        // Get all users in course
        const courseConnections = this.connectionManager.getCourseConnections(
          notification.targetCourseId
        );
        targetUsers = courseConnections.map(conn => conn.userId);
      }

      // Send notification to each target user
      for (const userId of targetUsers) {
        const userConnections = this.connectionManager.getUserConnections(userId);
        
        for (const socket of userConnections) {
          const subscription = this.subscriptions.get(socket.id);
          
          if (subscription?.notificationPreferences.realTime) {
            socket.emit('insights:notification', {
              id: notification.id,
              type: notification.type,
              urgency: notification.urgency,
              title: notification.title,
              message: notification.message,
              data: notification.data,
              timestamp: notification.createdAt
            });
          }
        }
      }

    } catch (error) {
      console.error('Error delivering notification:', error);
    }
  }

  /**
   * Queue notification for delivery
   */
  public queueNotification(notification: InsightNotification): void {
    this.processingQueue.push(notification);
  }

  /**
   * Send real-time insight update
   */
  public async sendInsightUpdate(
    insight: GeneratedInsight | PredictiveInsight | Recommendation,
    targetUsers?: string[]
  ): Promise<void> {
    const notification: InsightNotification = {
      id: insight.id,
      type: 'insight',
      urgency: this.determineUrgency(insight),
      title: this.generateNotificationTitle(insight),
      message: this.generateNotificationMessage(insight),
      data: insight,
      createdAt: new Date()
    };

    if (targetUsers) {
      for (const userId of targetUsers) {
        notification.targetUserId = userId;
        this.queueNotification({...notification});
      }
    } else {
      this.queueNotification(notification);
    }
  }

  /**
   * Determine notification urgency based on insight content
   */
  private determineUrgency(insight: any): 'low' | 'medium' | 'high' | 'critical' {
    // Logic to determine urgency based on insight type and content
    if (insight.type === 'INTERVENTION_NEEDED') return 'critical';
    if (insight.type === 'PREDICTIVE_ALERT') return 'high';
    if (insight.type === 'PERFORMANCE_TREND') return 'medium';
    return 'low';
  }

  /**
   * Generate notification title
   */
  private generateNotificationTitle(insight: any): string {
    switch (insight.type) {
      case 'PERFORMANCE_TREND':
        return 'Performance Trend Detected';
      case 'INTERVENTION_NEEDED':
        return 'Student Intervention Required';
      case 'CONTENT_EFFECTIVENESS':
        return 'Content Effectiveness Update';
      default:
        return 'New Insight Available';
    }
  }

  /**
   * Generate notification message
   */
  private generateNotificationMessage(insight: any): string {
    return insight.description || insight.summary || 'New insight data available';
  }

  /**
   * Get subscription statistics
   */
  public getSubscriptionStats(): any {
    const stats = {
      totalSubscriptions: this.subscriptions.size,
      byType: new Map<InsightType, number>(),
      activeUsers: new Set<string>()
    };

    for (const subscription of this.subscriptions.values()) {
      stats.activeUsers.add(subscription.userId);
      
      for (const type of subscription.subscriptionTypes) {
        stats.byType.set(type, (stats.byType.get(type) || 0) + 1);
      }
    }

    return {
      totalSubscriptions: stats.totalSubscriptions,
      activeUsers: stats.activeUsers.size,
      subscriptionsByType: Object.fromEntries(stats.byType)
    };
  }
}
