import { AbstractAIService } from './AbstractAIService';
import { AIServiceType, AIServiceConfig, AIAnalysisResponse, AIServiceMetrics } from './types';
import { GPT4Service } from './GPT4Service';
import { ClaudeService } from './ClaudeService';
import { GeminiService } from './GeminiService';
import CircuitBreaker from 'opossum';

export interface AIServiceManagerConfig {
  services: AIServiceConfig[];
  enabledServices: AIServiceType[];
  fallbackOrder: AIServiceType[];
  circuitBreakerOptions: {
    timeout: number;
    errorThresholdPercentage: number;
    resetTimeout: number;
  };
  defaultService: AIServiceType;
}

export class AIServiceManager {
  private services: Map<AIServiceType, AbstractAIService> = new Map();
  private circuitBreakers: Map<AIServiceType, CircuitBreaker> = new Map();
  private config: AIServiceManagerConfig;
  private isInitialized = false;

  constructor(config: AIServiceManagerConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize enabled services
    for (const serviceType of this.config.enabledServices) {
      await this.initializeService(serviceType);
    }

    this.isInitialized = true;
  }

  private async initializeService(serviceType: AIServiceType): Promise<void> {
    // Find service config
    const serviceConfig = this.config.services.find(s => 
      (s.serviceName?.toLowerCase() === serviceType) || (s.type === serviceType)
    );
    if (!serviceConfig) {
      throw new Error(`No configuration found for service: ${serviceType}`);
    }

    let service: AbstractAIService;

    switch (serviceType) {
      case 'openrouter':
        // For now, use a mock service until we implement OpenRouterService
        service = new GPT4Service(serviceConfig);
        break;
      case 'gpt4':
        service = new GPT4Service(serviceConfig);
        break;
      case 'claude':
        service = new ClaudeService(serviceConfig);
        break;
      case 'gemini':
        service = new GeminiService(serviceConfig);
        break;
      default:
        throw new Error(`Unsupported AI service type: ${serviceType}`);
    }

    // Create circuit breaker for service
    const circuitBreaker = new CircuitBreaker(
      async (content: string, contentType: string) => service.analyzeContent(content, contentType),
      this.config.circuitBreakerOptions
    );

    this.services.set(serviceType, service);
    this.circuitBreakers.set(serviceType, circuitBreaker);
  }

  async analyzeContent(
    content: string, 
    contentType: string, 
    preferredService?: AIServiceType
  ): Promise<AIAnalysisResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const errors: Error[] = [];

    // Try primary service first (default or specified)
    const primaryService = preferredService || this.config.defaultService;
    
    if (this.config.enabledServices.includes(primaryService)) {
      try {
        return await this.executeWithCircuitBreaker(primaryService, content, contentType);
      } catch (error) {
        errors.push(error as Error);
        console.warn(`Primary service ${primaryService} failed:`, error);
      }
    }

    // Try fallback services in order
    for (const serviceType of this.config.fallbackOrder) {
      if (serviceType === primaryService) continue; // Skip already tried primary
      
      if (this.config.enabledServices.includes(serviceType)) {
        try {
          return await this.executeWithCircuitBreaker(serviceType, content, contentType);
        } catch (error) {
          errors.push(error as Error);
          console.warn(`Fallback service ${serviceType} failed:`, error);
        }
      }
    }

    // All services failed
    throw new Error(`All AI services failed. Errors: ${errors.map(e => e.message).join(', ')}`);
  }

  private async executeWithCircuitBreaker(
    serviceType: AIServiceType, 
    content: string, 
    contentType: string
  ): Promise<AIAnalysisResponse> {
    const circuitBreaker = this.circuitBreakers.get(serviceType);
    if (!circuitBreaker) {
      throw new Error(`Circuit breaker not found for service: ${serviceType}`);
    }

    return await circuitBreaker.fire(content, contentType) as AIAnalysisResponse;
  }

  async getServiceHealth(serviceType?: AIServiceType): Promise<boolean | Record<AIServiceType, boolean>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (serviceType) {
      const service = this.services.get(serviceType);
      if (!service) {
        throw new Error(`Service not found: ${serviceType}`);
      }
      return await service.healthCheck();
    }

    // Return health for all services
    const healthMap: Record<string, boolean> = {};
    for (const [type, service] of this.services) {
      healthMap[type] = await service.healthCheck();
    }
    return healthMap as Record<AIServiceType, boolean>;
  }

  async getServiceMetrics(serviceType?: AIServiceType): Promise<AIServiceMetrics | Record<AIServiceType, AIServiceMetrics>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (serviceType) {
      const service = this.services.get(serviceType);
      if (!service) {
        throw new Error(`Service not found: ${serviceType}`);
      }
      return service.getMetrics();
    }

    // Return metrics for all services
    const metricsMap: Record<string, AIServiceMetrics> = {};
    for (const [type, service] of this.services) {
      metricsMap[type] = service.getMetrics();
    }
    return metricsMap as Record<AIServiceType, AIServiceMetrics>;
  }

  getEnabledServices(): AIServiceType[] {
    if (!this.isInitialized) {
      return [];
    }
    return [...this.config.enabledServices];
  }

  async updateConfiguration(newConfig: Partial<AIServiceManagerConfig>): Promise<void> {
    // Update configuration
    this.config = { ...this.config, ...newConfig };

    // Re-initialize if services changed
    if (newConfig.enabledServices) {
      // Clean up old services
      for (const [serviceType] of this.services) {
        if (!this.config.enabledServices.includes(serviceType)) {
          this.services.delete(serviceType);
          this.circuitBreakers.delete(serviceType);
        }
      }

      // Initialize new services
      for (const serviceType of this.config.enabledServices) {
        if (!this.services.has(serviceType)) {
          await this.initializeService(serviceType);
        }
      }
    }
  }

  async cleanup(): Promise<void> {
    this.services.clear();
    this.circuitBreakers.clear();
    this.isInitialized = false;
  }
}