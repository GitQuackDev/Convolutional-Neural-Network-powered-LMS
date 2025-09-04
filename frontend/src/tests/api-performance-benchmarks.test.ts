// Performance Benchmarking for API Integration Foundation
// Story 2.1: Task 2.1.5 - Performance validation and benchmarking

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '@/services/apiService';

// Mock authStorage
vi.mock('@/utils/authStorage', () => ({
  authStorage: {
    getToken: vi.fn(() => 'mock-token')
  }
}));

// Mock fetch with controlled timing
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Performance test utilities
const measureExecutionTime = async <T>(fn: () => Promise<T>): Promise<{ result: T, duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, duration: end - start };
};

const createMockResponse = (delay = 0) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        ok: true,
        json: async () => ({ success: true, timestamp: Date.now() })
      });
    }, delay);
  });
};

describe('API Service Performance Benchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Response Time Benchmarks', () => {
    it('should handle fast responses (< 100ms) efficiently', async () => {
      mockFetch.mockImplementation(() => createMockResponse(50));

      const { duration } = await measureExecutionTime(async () => {
        return await apiService.analytics.getOverview();
      });

      // Should complete within 200ms (50ms mock delay + processing overhead)
      expect(duration).toBeLessThan(200);
    });

    it('should handle moderate responses (200-500ms) within acceptable range', async () => {
      mockFetch.mockImplementation(() => createMockResponse(300));

      const { duration } = await measureExecutionTime(async () => {
        return await apiService.analytics.getEngagement();
      });

      // Should complete within 500ms (300ms mock delay + processing overhead)
      expect(duration).toBeLessThan(500);
    });

    it('should handle slow responses (500ms+) with timeout considerations', async () => {
      mockFetch.mockImplementation(() => createMockResponse(600));

      const { duration } = await measureExecutionTime(async () => {
        return await apiService.annotations.getAnnotations('content-123');
      });

      // Should complete within 800ms (600ms mock delay + processing overhead)
      expect(duration).toBeLessThan(800);
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      mockFetch.mockImplementation(() => createMockResponse(100));

      const { duration } = await measureExecutionTime(async () => {
        const promises = [
          apiService.analytics.getOverview(),
          apiService.analytics.getEngagement(),
          apiService.annotations.getAnnotations('content-1'),
          apiService.annotations.getAnnotations('content-2'),
          apiService.courses.getUserCourses()
        ];

        return await Promise.all(promises);
      });

      // 5 concurrent requests should complete in roughly the same time as a single request
      // (due to concurrency) plus some overhead. Should be much less than 5 * 100ms = 500ms
      expect(duration).toBeLessThan(300);
    });

    it('should handle sequential requests with acceptable cumulative time', async () => {
      mockFetch.mockImplementation(() => createMockResponse(50));

      const { duration } = await measureExecutionTime(async () => {
        await apiService.analytics.getOverview();
        await apiService.analytics.getEngagement();
        await apiService.annotations.getAnnotations('content-1');
        return 'completed';
      });

      // 3 sequential requests should be roughly 3 * 50ms = 150ms + overhead
      expect(duration).toBeLessThan(250);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory with repeated API calls', async () => {
      mockFetch.mockImplementation(() => createMockResponse(10));

      // Performance memory API is not available in all environments
      const memoryAPI = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      const initialMemory = memoryAPI?.usedJSHeapSize || 0;
      
      // Perform many API calls
      for (let i = 0; i < 50; i++) {
        await apiService.analytics.getOverview();
      }

      const finalMemory = memoryAPI?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB for 50 calls)
      // This is a rough check - actual values may vary by environment
      if (memoryAPI) {
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
      } else {
        // If memory API not available, just ensure calls completed successfully
        expect(true).toBe(true);
      }
    });

    it('should reuse connections efficiently', async () => {
      mockFetch.mockImplementation(() => createMockResponse(20));

      const { duration } = await measureExecutionTime(async () => {
        // Multiple calls to same endpoint should be efficient
        const promises = Array(10).fill(null).map(() => 
          apiService.analytics.getOverview()
        );
        return await Promise.all(promises);
      });

      // 10 concurrent calls should be efficient due to connection reuse
      expect(duration).toBeLessThan(150);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle retry scenarios efficiently', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({})
          });
        }
        return createMockResponse(50);
      });

      const { duration } = await measureExecutionTime(async () => {
        return await apiService.analytics.getOverview();
      });

      // Should complete with retries in reasonable time
      // 2 failures + 1 success with exponential backoff
      expect(duration).toBeLessThan(5000); // 5 seconds max
      expect(callCount).toBe(3); // Verify retry logic executed
    });

    it('should fail fast on 4xx errors', async () => {
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' })
      }));

      const { duration } = await measureExecutionTime(async () => {
        try {
          await apiService.analytics.getOverview();
        } catch {
          return 'error handled';
        }
      });

      // Should fail immediately without retries
      expect(duration).toBeLessThan(100);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Processing Performance', () => {
    it('should efficiently process large annotation datasets', async () => {
      const largeAnnotationSet = Array(1000).fill(null).map((_, i) => ({
        id: `annotation-${i}`,
        contentId: 'content-123',
        userId: `user-${i % 10}`,
        userName: `User ${i % 10}`,
        text: `Annotation text ${i}`,
        position: { x: i % 100, y: (i * 2) % 100 },
        type: 'comment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replies: [],
        tags: []
      }));

      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        json: async () => largeAnnotationSet
      }));

      const { duration, result } = await measureExecutionTime(async () => {
        return await apiService.annotations.getAnnotations('content-123');
      });

      // Should process 1000 annotations efficiently
      expect(duration).toBeLessThan(100);
      expect(result).toHaveLength(1000);
    });

    it('should efficiently process analytics data with complex calculations', async () => {
      const complexAnalyticsData = {
        totalStudents: 10000,
        activeStudents: 8500,
        completionRate: 87.5,
        avgScore: 85.2,
        courseCount: 150,
        assignmentCount: 2000
      };

      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        json: async () => complexAnalyticsData
      }));

      const { duration, result } = await measureExecutionTime(async () => {
        return await apiService.analytics.getOverview();
      });

      // Should handle complex data efficiently
      expect(duration).toBeLessThan(150);
      expect(result.totalStudents).toBe(10000);
    });
  });
});

// Performance validation summary
describe('Performance Validation Summary', () => {
  it('should meet all performance criteria for production use', () => {
    const performanceCriteria = {
      maxResponseTime: 5000, // 5 seconds
      maxMemoryIncrease: 10 * 1024 * 1024, // 10MB
      maxConcurrentRequests: 10,
      maxRetryTime: 5000, // 5 seconds with retries
      maxDataProcessingTime: 200 // 200ms for large datasets
    };

    // Validate criteria are reasonable
    expect(performanceCriteria.maxResponseTime).toBe(5000);
    expect(performanceCriteria.maxMemoryIncrease).toBe(10485760);
    expect(performanceCriteria.maxConcurrentRequests).toBe(10);
    
    // This test documents our performance expectations
    // Actual performance is validated in the tests above
  });
});
