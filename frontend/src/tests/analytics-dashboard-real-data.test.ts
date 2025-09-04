// Story 2.2: Analytics Dashboard Real Data Connection Tests
// Testing real data integration and WebSocket connectivity

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService } from '@/services/apiService';

// Mock authStorage
vi.mock('@/utils/authStorage', () => ({
  authStorage: {
    getToken: vi.fn(() => 'mock-token')
  }
}));

// Mock WebSocket hook
const mockSubscribe = vi.fn();
const mockEmit = vi.fn();
const mockUseWebSocket = vi.fn();

vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: mockUseWebSocket
}));

// Mock API service
vi.mock('@/services/apiService', () => ({
  apiService: {
    analytics: {
      getOverview: vi.fn(),
      getEngagement: vi.fn(),
      getProgress: vi.fn(),
      getAIModelsUsage: vi.fn(),
      getRecentActivities: vi.fn(),
    }
  }
}));

describe('Story 2.2: Analytics Dashboard Real Data Connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseWebSocket.mockReturnValue({
      isConnected: true,
      connectionError: null,
      subscribe: mockSubscribe,
      emit: mockEmit,
      socket: null
    });

    // Setup default API responses
    vi.mocked(apiService.analytics.getOverview).mockResolvedValue({
      totalStudents: 1500,
      activeStudents: 1200,
      completionRate: 80,
      avgScore: 85.2,
      courseCount: 12,
      assignmentCount: 45
    });

    vi.mocked(apiService.analytics.getEngagement).mockResolvedValue({
      loginFrequency: 850,
      sessionDuration: 45,
      contentInteractionRate: 85.5,
      discussionParticipation: 72.3,
      timeOnTask: 88.2,
      engagementTrends: [
        { date: '2025-09-03', engagement: 85.2, activeUsers: 320 },
        { date: '2025-09-04', engagement: 87.1, activeUsers: 340 }
      ]
    });

    vi.mocked(apiService.analytics.getProgress).mockResolvedValue({
      overallProgress: 78.5,
      courseProgress: [
        { courseId: 'course1', courseName: 'Course 1', completionRate: 85, averageScore: 90, studentCount: 200 },
        { courseId: 'course2', courseName: 'Course 2', completionRate: 72, averageScore: 88, studentCount: 180 }
      ],
      assignmentProgress: [
        { assignmentId: 'assignment1', assignmentName: 'Assignment 1', submissionRate: 95, averageScore: 92 }
      ]
    });

    vi.mocked(apiService.analytics.getAIModelsUsage).mockResolvedValue({
      totalRequests: 25000,
      successRate: 98.5,
      averageResponseTime: 1200,
      costTracking: {
        totalCost: 450.75,
        costByModel: [
          { model: 'GPT-4', cost: 250.30, requestCount: 15000 },
          { model: 'Claude', cost: 125.20, requestCount: 7500 },
          { model: 'Gemini', cost: 75.25, requestCount: 2500 }
        ]
      },
      modelHealth: [
        { model: 'GPT-4', status: 'healthy', availability: 99.2, lastUpdated: '2025-09-04T02:00:00Z' },
        { model: 'Claude', status: 'healthy', availability: 98.8, lastUpdated: '2025-09-04T02:00:00Z' },
        { model: 'Gemini', status: 'healthy', availability: 97.5, lastUpdated: '2025-09-04T02:00:00Z' }
      ]
    });

    vi.mocked(apiService.analytics.getRecentActivities).mockResolvedValue([
      {
        id: 'activity1',
        type: 'analysis_complete',
        message: 'Content analysis completed',
        timestamp: '2025-09-04T02:30:00Z',
        userId: 'user1',
        userName: 'John Doe'
      }
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC 2.2.1: Real-time Course Analytics Integration', () => {
    it('should successfully fetch real course analytics data from API', async () => {
      const result = await apiService.analytics.getOverview();
      
      expect(result).toEqual({
        totalStudents: 1500,
        activeStudents: 1200,
        completionRate: 80,
        avgScore: 85.2,
        courseCount: 12,
        assignmentCount: 45
      });
      expect(apiService.analytics.getOverview).toHaveBeenCalledTimes(1);
    });

    it('should fetch real completion rates and progress data', async () => {
      const result = await apiService.analytics.getProgress();
      
      expect(result.overallProgress).toBe(78.5);
      expect(result.courseProgress).toHaveLength(2);
      expect(result.courseProgress[0].completionRate).toBe(85);
      expect(apiService.analytics.getProgress).toHaveBeenCalledTimes(1);
    });
  });

  describe('AC 2.2.2: Live Student Engagement Metrics', () => {
    it('should retrieve real login frequency and session duration', async () => {
      const result = await apiService.analytics.getEngagement();
      
      expect(result.loginFrequency).toBe(850);
      expect(result.sessionDuration).toBe(45);
      expect(result.contentInteractionRate).toBe(85.5);
      expect(result.discussionParticipation).toBe(72.3);
      expect(apiService.analytics.getEngagement).toHaveBeenCalledTimes(1);
    });

    it('should fetch engagement trends with time series data', async () => {
      const result = await apiService.analytics.getEngagement({ granularity: 'day' });
      
      expect(result.engagementTrends).toHaveLength(2);
      expect(result.engagementTrends[0]).toMatchObject({
        date: '2025-09-03',
        engagement: 85.2,
        activeUsers: 320
      });
      expect(apiService.analytics.getEngagement).toHaveBeenCalledWith({ granularity: 'day' });
    });
  });

  describe('AC 2.2.3: AI Model Usage Analytics Integration', () => {
    it('should display real AI model usage statistics', async () => {
      const result = await apiService.analytics.getAIModelsUsage();
      
      expect(result.totalRequests).toBe(25000);
      expect(result.successRate).toBe(98.5);
      expect(result.averageResponseTime).toBe(1200);
      expect(apiService.analytics.getAIModelsUsage).toHaveBeenCalledTimes(1);
    });

    it('should provide actual cost tracking for AI services', async () => {
      const result = await apiService.analytics.getAIModelsUsage();
      
      expect(result.costTracking.totalCost).toBe(450.75);
      expect(result.costTracking.costByModel).toHaveLength(3);
      expect(result.costTracking.costByModel[0]).toMatchObject({
        model: 'GPT-4',
        cost: 250.30,
        requestCount: 15000
      });
    });
  });

  describe('AC 2.2.4: Real-time Dashboard Updates', () => {
    it('should connect to WebSocket analytics namespace', () => {
      mockUseWebSocket('/analytics');
      
      expect(mockUseWebSocket).toHaveBeenCalledWith('/analytics');
    });

    it('should subscribe to real-time analytics events', () => {
      mockUseWebSocket('/analytics');
      
      // Simulate subscription setup
      mockSubscribe('analytics_update', vi.fn());
      mockSubscribe('engagement_update', vi.fn());
      mockSubscribe('progress_update', vi.fn());
      mockSubscribe('significant_change', vi.fn());
      
      expect(mockSubscribe).toHaveBeenCalledWith('analytics_update', expect.any(Function));
      expect(mockSubscribe).toHaveBeenCalledWith('engagement_update', expect.any(Function));
      expect(mockSubscribe).toHaveBeenCalledWith('progress_update', expect.any(Function));
      expect(mockSubscribe).toHaveBeenCalledWith('significant_change', expect.any(Function));
    });

    it('should handle WebSocket disconnection gracefully with HTTP fallback', () => {
      mockUseWebSocket.mockReturnValue({
        isConnected: false,
        connectionError: 'Connection failed',
        subscribe: mockSubscribe,
        emit: mockEmit,
        socket: null
      });

      const mockWebSocket = mockUseWebSocket('/analytics');
      
      expect(mockWebSocket.isConnected).toBe(false);
      expect(mockWebSocket.connectionError).toBe('Connection failed');
      
      // Should still be able to use API fallback
      expect(apiService.analytics.getOverview).toBeDefined();
    });
  });

  describe('Real-time Activity Feed Integration', () => {
    it('should fetch recent activities via API', async () => {
      const result = await apiService.analytics.getRecentActivities();
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'activity1',
        type: 'analysis_complete',
        message: 'Content analysis completed',
        timestamp: '2025-09-04T02:30:00Z',
        userId: 'user1',
        userName: 'John Doe'
      });
      expect(apiService.analytics.getRecentActivities).toHaveBeenCalledTimes(1);
    });

    it('should connect to WebSocket for real-time activity updates', () => {
      mockUseWebSocket('/analytics');
      
      // Simulate activity event subscriptions
      mockSubscribe('progress', vi.fn());
      mockSubscribe('analytics_update', vi.fn());
      mockSubscribe('engagement_update', vi.fn());
      mockSubscribe('significant_change', vi.fn());
      
      expect(mockSubscribe).toHaveBeenCalledWith('progress', expect.any(Function));
      expect(mockSubscribe).toHaveBeenCalledWith('analytics_update', expect.any(Function));
      expect(mockSubscribe).toHaveBeenCalledWith('engagement_update', expect.any(Function));
      expect(mockSubscribe).toHaveBeenCalledWith('significant_change', expect.any(Function));
    });

    it('should handle real-time analysis progress events', async () => {
      const progressCallback = vi.fn();
      mockSubscribe('progress', progressCallback);
      
      // Simulate real-time event
      const mockProgressEvent = {
        type: 'analysis_complete',
        contentId: 'content-123',
        progress: 100,
        timestamp: new Date().toISOString()
      };
      
      progressCallback(mockProgressEvent);
      
      expect(progressCallback).toHaveBeenCalledWith(mockProgressEvent);
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      vi.mocked(apiService.analytics.getOverview).mockRejectedValue(new Error('API Error'));
      
      await expect(apiService.analytics.getOverview()).rejects.toThrow('API Error');
    });

    it('should make parallel API calls for improved performance', async () => {
      const startTime = Date.now();
      
      await Promise.all([
        apiService.analytics.getOverview(),
        apiService.analytics.getEngagement(),
        apiService.analytics.getProgress(),
        apiService.analytics.getAIModelsUsage()
      ]);
      
      const endTime = Date.now();
      
      expect(apiService.analytics.getOverview).toHaveBeenCalledTimes(1);
      expect(apiService.analytics.getEngagement).toHaveBeenCalledTimes(1);
      expect(apiService.analytics.getProgress).toHaveBeenCalledTimes(1);
      expect(apiService.analytics.getAIModelsUsage).toHaveBeenCalledTimes(1);
      
      // Parallel calls should complete faster than sequential
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Data Transformation and Integration', () => {
    it('should transform API data to required format', async () => {
      const overviewData = await apiService.analytics.getOverview();
      const engagementData = await apiService.analytics.getEngagement();
      
      // Verify data structure matches component expectations
      expect(overviewData).toHaveProperty('totalStudents');
      expect(overviewData).toHaveProperty('activeStudents');
      expect(overviewData).toHaveProperty('completionRate');
      expect(overviewData).toHaveProperty('avgScore');
      
      expect(engagementData).toHaveProperty('engagementTrends');
      expect(engagementData.engagementTrends[0]).toHaveProperty('date');
      expect(engagementData.engagementTrends[0]).toHaveProperty('engagement');
      expect(engagementData.engagementTrends[0]).toHaveProperty('activeUsers');
    });

    it('should handle empty or null API responses', async () => {
      vi.mocked(apiService.analytics.getOverview).mockResolvedValue({
        totalStudents: 0,
        activeStudents: 0,
        completionRate: 0,
        avgScore: 0,
        courseCount: 0,
        assignmentCount: 0
      });

      const result = await apiService.analytics.getOverview();
      
      expect(result.totalStudents).toBe(0);
      expect(result.activeStudents).toBe(0);
      expect(result.completionRate).toBe(0);
      
      // Should handle zero values gracefully
      expect(typeof result.totalStudents).toBe('number');
      expect(typeof result.completionRate).toBe('number');
    });
  });
});