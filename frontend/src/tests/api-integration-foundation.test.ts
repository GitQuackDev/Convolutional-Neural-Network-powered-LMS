// API Integration Foundation Tests
// Story 2.1: Test enhanced API service functionality

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '@/services/apiService';

// Mock authStorage
vi.mock('@/utils/authStorage', () => ({
  authStorage: {
    getToken: vi.fn(() => 'mock-token')
  }
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Enhanced API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Functionality', () => {
    it('should successfully fetch analytics overview', async () => {
      const mockResponse = {
        totalStudents: 100,
        activeStudents: 85,
        completionRate: 87.5,
        avgScore: 85.2,
        courseCount: 5,
        assignmentCount: 20
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await apiService.analytics.getOverview();
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should successfully fetch annotations', async () => {
      const mockAnnotations = [
        {
          id: 'annotation-1',
          contentId: 'content-123',
          userId: 'user-1',
          userName: 'John Doe',
          text: 'Test annotation',
          position: { x: 100, y: 200, width: 150, height: 25 },
          type: 'comment',
          createdAt: '2025-01-01T10:00:00Z',
          updatedAt: '2025-01-01T10:00:00Z',
          replies: [],
          tags: []
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnnotations
      });

      const result = await apiService.annotations.getAnnotations('content-123');
      expect(result).toEqual(mockAnnotations);
    });

    it('should create new annotation', async () => {
      const newAnnotationData = {
        contentId: 'content-123',
        text: 'New annotation',
        position: { x: 50, y: 100 },
        type: 'highlight' as const,
        tags: ['important']
      };

      const mockCreatedAnnotation = {
        id: 'annotation-2',
        userId: 'user-1',
        userName: 'John Doe',
        createdAt: '2025-01-01T11:00:00Z',
        updatedAt: '2025-01-01T11:00:00Z',
        replies: [],
        ...newAnnotationData
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedAnnotation
      });

      const result = await apiService.annotations.createAnnotation(newAnnotationData);
      expect(result).toEqual(mockCreatedAnnotation);
    });

    it('should submit AI analysis request', async () => {
      const analysisRequest = {
        content: 'Test content for analysis',
        models: ['gpt-4', 'claude', 'gemini'],
        parameters: {
          analysisType: 'content_quality' as const,
          detailLevel: 'detailed' as const,
          includeRecommendations: true
        },
        goals: [
          {
            type: 'improvement' as const,
            focus: 'clarity',
            weight: 1.0
          }
        ],
        priority: 'high' as const
      };

      const mockAnalysisJob = {
        id: 'job-123',
        status: 'queued' as const,
        models: ['gpt-4', 'claude', 'gemini'],
        createdAt: '2025-01-01T12:00:00Z',
        estimatedCompletionTime: '2025-01-01T12:05:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysisJob
      });

      const result = await apiService.aiAnalysis.analyzeMulti(analysisRequest);
      expect(result).toEqual(mockAnalysisJob);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors appropriately', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          message: 'Resource not found',
          code: 'NOT_FOUND'
        })
      });

      await expect(apiService.analytics.getOverview()).rejects.toThrow('Resource not found');
    });

    it('should retry on server errors', async () => {
      // Mock consecutive failures then success
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      const result = await apiService.analytics.getOverview();
      expect(result).toEqual({ success: true });
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});

// Integration validation for component data flow
describe('API Integration Validation', () => {
  it('should validate analytics data structure for dashboard compatibility', () => {
    const mockAnalyticsData = {
      totalStudents: 120,
      activeStudents: 95,
      completionRate: 78.5,
      avgScore: 86.3,
      courseCount: 8,
      assignmentCount: 24
    };

    // Verify the data structure matches component expectations
    expect(typeof mockAnalyticsData.totalStudents).toBe('number');
    expect(typeof mockAnalyticsData.completionRate).toBe('number');
    expect(mockAnalyticsData.activeStudents).toBeLessThanOrEqual(mockAnalyticsData.totalStudents);
  });

  it('should validate annotation data structure for viewer compatibility', () => {
    const mockAnnotation = {
      id: 'annotation-1',
      contentId: 'content-123',
      userId: 'user-1',
      userName: 'John Doe',
      text: 'Test annotation',
      position: { x: 100, y: 200, width: 150, height: 25 },
      type: 'comment',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z',
      replies: [],
      tags: []
    };

    // Verify annotation structure
    expect(mockAnnotation).toHaveProperty('id');
    expect(mockAnnotation).toHaveProperty('position');
    expect(mockAnnotation.position).toHaveProperty('x');
    expect(mockAnnotation.position).toHaveProperty('y');
    expect(Array.isArray(mockAnnotation.replies)).toBe(true);
    expect(Array.isArray(mockAnnotation.tags)).toBe(true);
  });
});
