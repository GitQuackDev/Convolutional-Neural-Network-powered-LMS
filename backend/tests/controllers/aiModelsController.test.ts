/**
 * AI Models Controller Tests
 * Story 1.2: AI Model Service Infrastructure
 */

import request from 'supertest';
import express from 'express';

// Mock the AI service configuration
jest.mock('../../src/config/aiServices', () => ({
  createAIServiceManagerConfig: jest.fn(() => ({
    services: [{
      serviceName: 'gpt4',
      apiKey: 'test-key'
    }],
    enabledServices: ['gpt4'],
    fallbackOrder: ['gpt4'],
    circuitBreakerOptions: {
      timeout: 30000,
      errorThresholdPercentage: 50,
      resetTimeout: 60000,
    },
    defaultService: 'gpt4',
  })),
  validateAIServiceConfig: jest.fn()
}));

// Mock the AI service manager
jest.mock('../../src/services/aiModels/AIServiceManager', () => ({
  AIServiceManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    analyzeContent: jest.fn().mockResolvedValue({
      success: true,
      content: 'Test analysis',
      confidence: 0.9,
      processingTime: 1000,
      metadata: { serviceName: 'gpt4', model: 'gpt-4' }
    }),
    getServiceHealth: jest.fn().mockResolvedValue(true),
    getServiceMetrics: jest.fn().mockReturnValue({
      serviceName: 'gpt4',
      totalRequests: 10,
      successfulRequests: 10,
      failedRequests: 0,
      averageResponseTime: 1000,
      lastRequestTime: new Date(),
      isHealthy: true
    }),
    getEnabledServices: jest.fn().mockReturnValue(['gpt4']),
    updateConfiguration: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn().mockResolvedValue(undefined)
  }))
}));

import * as aiModelsController from '../../src/controllers/aiModelsController';

const app = express();
app.use(express.json());

// Test routes
app.post('/analyze', aiModelsController.analyzeContent);
app.get('/health/:serviceType', aiModelsController.getServiceHealth);
app.get('/health', aiModelsController.getServiceHealth);
app.get('/metrics/:serviceType', aiModelsController.getServiceMetrics);
app.get('/metrics', aiModelsController.getServiceMetrics);
app.get('/services', aiModelsController.getEnabledServices);
app.put('/config', aiModelsController.updateConfiguration);
app.post('/compare', aiModelsController.compareServices);

describe('AI Models Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /analyze', () => {
    it('should analyze content successfully', async () => {
      const mockAnalysisResponse = {
        success: true,
        content: 'Analyzed content',
        confidence: 0.9,
        processingTime: 1000,
        metadata: {
          serviceName: 'GPT-4',
          model: 'gpt-4'
        }
      };

      // Mock the AI service manager
      const mockManager = {
        analyzeContent: jest.fn().mockResolvedValue(mockAnalysisResponse)
      };

      // Mock the initialization function
      jest.doMock('../../src/config/aiServices', () => ({
        createAIServiceManagerConfig: jest.fn().mockReturnValue({}),
        validateAIServiceConfig: jest.fn()
      }));

      const response = await request(app)
        .post('/analyze')
        .send({
          content: 'Test content',
          contentType: 'text/plain',
          preferredService: 'gpt4'
        });

      expect(response.status).toBe(200);
    });

    it('should return 400 for missing content', async () => {
      const response = await request(app)
        .post('/analyze')
        .send({
          contentType: 'text/plain'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Content is required');
    });

    it('should return 400 for missing content type', async () => {
      const response = await request(app)
        .post('/analyze')
        .send({
          content: 'Test content'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Content type is required');
    });

    it('should return 400 for invalid preferred service', async () => {
      const response = await request(app)
        .post('/analyze')
        .send({
          content: 'Test content',
          contentType: 'text/plain',
          preferredService: 'invalid-service'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid preferred service');
    });
  });

  describe('GET /health', () => {
    it('should return health status for all services', async () => {
      const response = await request(app)
        .get('/health');

      // With proper mocking, we expect success
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('health');
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid service type', async () => {
      const response = await request(app)
        .get('/health/invalid-service');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid service type');
    });
  });

  describe('GET /metrics', () => {
    it('should return 400 for invalid service type', async () => {
      const response = await request(app)
        .get('/metrics/invalid-service');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid service type');
    });
  });

  describe('POST /compare', () => {
    it('should return 400 for missing content', async () => {
      const response = await request(app)
        .post('/compare')
        .send({
          contentType: 'text/plain',
          services: ['gpt4', 'claude']
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Content is required');
    });

    it('should return 400 for missing services array', async () => {
      const response = await request(app)
        .post('/compare')
        .send({
          content: 'Test content',
          contentType: 'text/plain'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Services array is required');
    });

    it('should return 400 for empty services array', async () => {
      const response = await request(app)
        .post('/compare')
        .send({
          content: 'Test content',
          contentType: 'text/plain',
          services: []
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Services array is required');
    });

    it('should return 400 for invalid service in array', async () => {
      const response = await request(app)
        .post('/compare')
        .send({
          content: 'Test content',
          contentType: 'text/plain',
          services: ['gpt4', 'invalid-service']
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid service: invalid-service');
    });
  });

  describe('PUT /config', () => {
    it('should handle configuration update', async () => {
      const response = await request(app)
        .put('/config')
        .send({
          enabledServices: ['gpt4', 'claude'],
          defaultService: 'gpt4'
        });

      // With proper mocking, we expect success
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /services', () => {
    it('should handle get enabled services', async () => {
      const response = await request(app)
        .get('/services');

      // With proper mocking, we expect success
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.enabledServices).toEqual(['gpt4']);
    });
  });
});
