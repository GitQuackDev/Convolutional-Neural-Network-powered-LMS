/**
 * AI Service Manager Tests
 * Story 1.2: AI Model Service Infrastructure
 */

import { AIServiceManager, AIServiceManagerConfig } from '../../../src/services/aiModels/AIServiceManager';
import { AIServiceConfig, AIServiceType } from '../../../src/services/aiModels/types';

// Mock the AI services
jest.mock('../../../src/services/aiModels/GPT4Service');
jest.mock('../../../src/services/aiModels/ClaudeService');
jest.mock('../../../src/services/aiModels/GeminiService');
jest.mock('opossum');

describe('AIServiceManager', () => {
  let serviceManager: AIServiceManager;
  let mockConfig: AIServiceManagerConfig;

  beforeEach(() => {
    mockConfig = {
      services: [
        {
          serviceName: 'gpt4',
          apiKey: 'test-gpt4-key',
          endpoint: 'https://api.openai.com/v1',
          maxRetries: 3,
          timeout: 30000,
        },
        {
          serviceName: 'claude',
          apiKey: 'test-claude-key',
          endpoint: 'https://api.anthropic.com',
          maxRetries: 3,
          timeout: 30000,
        }
      ] as AIServiceConfig[],
      enabledServices: ['gpt4', 'claude'] as AIServiceType[],
      fallbackOrder: ['gpt4', 'claude'] as AIServiceType[],
      circuitBreakerOptions: {
        timeout: 30000,
        errorThresholdPercentage: 50,
        resetTimeout: 60000,
      },
      defaultService: 'gpt4' as AIServiceType,
    };

    serviceManager = new AIServiceManager(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create AIServiceManager with valid configuration', () => {
      expect(serviceManager).toBeInstanceOf(AIServiceManager);
    });

    it('should store configuration correctly', () => {
      // Access config directly since service isn't initialized yet
      expect((serviceManager as any).config.enabledServices).toEqual(['gpt4', 'claude']);
    });
  });

  describe('initialize()', () => {
    it('should initialize enabled services', async () => {
      await serviceManager.initialize();
      expect(serviceManager.getEnabledServices()).toEqual(['gpt4', 'claude']);
    });

    it('should not reinitialize if already initialized', async () => {
      await serviceManager.initialize();
      await serviceManager.initialize(); // Second call should not throw
      expect(serviceManager.getEnabledServices()).toEqual(['gpt4', 'claude']);
    });

    it('should throw error for unsupported service type', async () => {
      const invalidConfig = {
        ...mockConfig,
        services: [{
          serviceName: 'invalid-service',
          apiKey: 'test-key'
        } as AIServiceConfig],
        enabledServices: ['invalid-service' as AIServiceType],
      };

      const invalidManager = new AIServiceManager(invalidConfig);
      await expect(invalidManager.initialize()).rejects.toThrow('Unsupported AI service type: invalid-service');
    });
  });

  describe('analyzeContent()', () => {
    beforeEach(async () => {
      await serviceManager.initialize();
    });

    it('should analyze content using default service', async () => {
      const mockResponse = {
        success: true,
        content: 'Analysis complete',
        confidence: 0.9,
        processingTime: 1000,
        metadata: {
          serviceName: 'GPT-4',
          model: 'gpt-4',
        }
      };

      // Mock the circuit breaker fire method
      const mockCircuitBreaker = {
        fire: jest.fn().mockResolvedValue(mockResponse)
      };
      (serviceManager as any).circuitBreakers.set('gpt4', mockCircuitBreaker);

      const result = await serviceManager.analyzeContent('test content', 'text/plain');
      
      expect(result).toEqual(mockResponse);
      expect(mockCircuitBreaker.fire).toHaveBeenCalledWith('test content', 'text/plain');
    });

    it('should use preferred service when specified', async () => {
      const mockResponse = {
        success: true,
        content: 'Analysis complete',
        confidence: 0.9,
        processingTime: 1000,
        metadata: {
          serviceName: 'Claude',
          model: 'claude-3',
        }
      };

      const mockCircuitBreaker = {
        fire: jest.fn().mockResolvedValue(mockResponse)
      };
      (serviceManager as any).circuitBreakers.set('claude', mockCircuitBreaker);

      const result = await serviceManager.analyzeContent('test content', 'text/plain', 'claude');
      
      expect(result).toEqual(mockResponse);
      expect(mockCircuitBreaker.fire).toHaveBeenCalledWith('test content', 'text/plain');
    });

    it('should fallback to next service when primary fails', async () => {
      const fallbackResponse = {
        success: true,
        content: 'Fallback analysis',
        confidence: 0.8,
        processingTime: 1200,
        metadata: {
          serviceName: 'Claude',
          model: 'claude-3',
        }
      };

      // Mock primary service to fail
      const mockPrimaryCircuitBreaker = {
        fire: jest.fn().mockRejectedValue(new Error('Primary service failed'))
      };
      (serviceManager as any).circuitBreakers.set('gpt4', mockPrimaryCircuitBreaker);

      // Mock fallback service to succeed
      const mockFallbackCircuitBreaker = {
        fire: jest.fn().mockResolvedValue(fallbackResponse)
      };
      (serviceManager as any).circuitBreakers.set('claude', mockFallbackCircuitBreaker);

      const result = await serviceManager.analyzeContent('test content', 'text/plain');
      
      expect(result).toEqual(fallbackResponse);
      expect(mockPrimaryCircuitBreaker.fire).toHaveBeenCalled();
      expect(mockFallbackCircuitBreaker.fire).toHaveBeenCalledWith('test content', 'text/plain');
    });

    it('should throw error when all services fail', async () => {
      // Mock all services to fail
      const mockError = new Error('Service failed');
      const mockCircuitBreaker = {
        fire: jest.fn().mockRejectedValue(mockError)
      };
      
      (serviceManager as any).circuitBreakers.set('gpt4', mockCircuitBreaker);
      (serviceManager as any).circuitBreakers.set('claude', mockCircuitBreaker);

      await expect(serviceManager.analyzeContent('test content', 'text/plain'))
        .rejects.toThrow('All AI services failed');
    });
  });

  describe('getServiceHealth()', () => {
    beforeEach(async () => {
      await serviceManager.initialize();
    });

    it('should return health for specific service', async () => {
      const mockService = {
        healthCheck: jest.fn().mockResolvedValue(true)
      };
      (serviceManager as any).services.set('gpt4', mockService);

      const health = await serviceManager.getServiceHealth('gpt4');
      
      expect(health).toBe(true);
      expect(mockService.healthCheck).toHaveBeenCalled();
    });

    it('should return health for all services', async () => {
      const mockGPT4Service = {
        healthCheck: jest.fn().mockResolvedValue(true)
      };
      const mockClaudeService = {
        healthCheck: jest.fn().mockResolvedValue(false)
      };

      (serviceManager as any).services.set('gpt4', mockGPT4Service);
      (serviceManager as any).services.set('claude', mockClaudeService);

      const health = await serviceManager.getServiceHealth();
      
      expect(health).toEqual({
        gpt4: true,
        claude: false
      });
    });

    it('should throw error for unknown service', async () => {
      await expect(serviceManager.getServiceHealth('unknown' as AIServiceType))
        .rejects.toThrow('Service not found: unknown');
    });
  });

  describe('getServiceMetrics()', () => {
    beforeEach(async () => {
      await serviceManager.initialize();
    });

    it('should return metrics for specific service', async () => {
      const mockMetrics = {
        serviceName: 'GPT-4',
        totalRequests: 10,
        successfulRequests: 9,
        failedRequests: 1,
        averageResponseTime: 1500,
        lastRequestTime: new Date(),
        isHealthy: true
      };

      const mockService = {
        getMetrics: jest.fn().mockReturnValue(mockMetrics)
      };
      (serviceManager as any).services.set('gpt4', mockService);

      const metrics = await serviceManager.getServiceMetrics('gpt4');
      
      expect(metrics).toEqual(mockMetrics);
      expect(mockService.getMetrics).toHaveBeenCalled();
    });

    it('should return metrics for all services', async () => {
      const mockGPT4Metrics = {
        serviceName: 'GPT-4',
        totalRequests: 10,
        successfulRequests: 9,
        failedRequests: 1,
        averageResponseTime: 1500,
        lastRequestTime: new Date(),
        isHealthy: true
      };

      const mockClaudeMetrics = {
        serviceName: 'Claude',
        totalRequests: 5,
        successfulRequests: 5,
        failedRequests: 0,
        averageResponseTime: 1200,
        lastRequestTime: new Date(),
        isHealthy: true
      };

      const mockGPT4Service = {
        getMetrics: jest.fn().mockReturnValue(mockGPT4Metrics)
      };
      const mockClaudeService = {
        getMetrics: jest.fn().mockReturnValue(mockClaudeMetrics)
      };

      (serviceManager as any).services.set('gpt4', mockGPT4Service);
      (serviceManager as any).services.set('claude', mockClaudeService);

      const metrics = await serviceManager.getServiceMetrics();
      
      expect(metrics).toEqual({
        gpt4: mockGPT4Metrics,
        claude: mockClaudeMetrics
      });
    });
  });

  describe('updateConfiguration()', () => {
    beforeEach(async () => {
      await serviceManager.initialize();
    });

    it('should update enabled services', async () => {
      await serviceManager.updateConfiguration({
        enabledServices: ['claude'] as AIServiceType[]
      });

      expect(serviceManager.getEnabledServices()).toEqual(['claude']);
    });

    it('should initialize new services when configuration changes', async () => {
      const newConfig = {
        ...mockConfig,
        services: [
          ...mockConfig.services,
          {
            serviceName: 'gemini',
            apiKey: 'test-gemini-key'
          } as AIServiceConfig
        ],
        enabledServices: ['gpt4', 'claude', 'gemini'] as AIServiceType[]
      };

      await serviceManager.updateConfiguration(newConfig);

      expect(serviceManager.getEnabledServices()).toEqual(['gpt4', 'claude', 'gemini']);
    });
  });

  describe('cleanup()', () => {
    it('should cleanup all services and reset state', async () => {
      await serviceManager.initialize();
      await serviceManager.cleanup();

      expect(serviceManager.getEnabledServices()).toEqual([]);
    });
  });
});
