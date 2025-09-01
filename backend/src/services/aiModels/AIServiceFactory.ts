/**
 * AI Service Factory for creating service instances
 * Story 1.2: AI Model Service Infrastructure
 */

import { GPT4Service } from './GPT4Service';
import { ClaudeService } from './ClaudeService';
import { GeminiService } from './GeminiService';
import { AbstractAIService } from './AbstractAIService';
import { AIServiceType, AIServiceConfig } from './types';

export class AIServiceFactory {
  private static serviceConfigs: Map<AIServiceType, AIServiceConfig> = new Map();

  /**
   * Register a service configuration
   */
  static registerService(type: AIServiceType, config: AIServiceConfig): void {
    if (!config.apiKey) {
      throw new Error(`API key is required for ${type} service`);
    }
    
    // Validate service-specific requirements
    AIServiceFactory.validateServiceConfig(type, config);
    
    AIServiceFactory.serviceConfigs.set(type, config);
  }

  /**
   * Create a service instance
   */
  static createService(type: AIServiceType, config?: AIServiceConfig): AbstractAIService {
    const serviceConfig = config || AIServiceFactory.serviceConfigs.get(type);
    
    if (!serviceConfig) {
      throw new Error(`No configuration found for service type: ${type}`);
    }

    switch (type) {
      case 'gpt4':
        return new GPT4Service(serviceConfig);
      
      case 'claude':
        return new ClaudeService(serviceConfig);
      
      case 'gemini':
        return new GeminiService(serviceConfig);
      
      default:
        throw new Error(`Unsupported service type: ${type}`);
    }
  }

  /**
   * Create multiple service instances
   */
  static createServices(types: AIServiceType[]): Map<AIServiceType, AbstractAIService> {
    const services = new Map<AIServiceType, AbstractAIService>();
    
    for (const type of types) {
      try {
        const service = AIServiceFactory.createService(type);
        services.set(type, service);
      } catch (error) {
        console.error(`Failed to create service ${type}:`, error);
        // Continue creating other services even if one fails
      }
    }
    
    return services;
  }

  /**
   * Get available service types
   */
  static getAvailableServices(): AIServiceType[] {
    return Array.from(AIServiceFactory.serviceConfigs.keys());
  }

  /**
   * Check if a service type is configured
   */
  static isServiceConfigured(type: AIServiceType): boolean {
    return AIServiceFactory.serviceConfigs.has(type);
  }

  /**
   * Validate service-specific configuration
   */
  private static validateServiceConfig(type: AIServiceType, config: AIServiceConfig): void {
    switch (type) {
      case 'gpt4':
        if (!config.apiKey.startsWith('sk-')) {
          console.warn('OpenAI API key should start with "sk-"');
        }
        break;
      
      case 'claude':
        if (!config.apiKey.startsWith('sk-ant-')) {
          console.warn('Anthropic API key should start with "sk-ant-"');
        }
        break;
      
      case 'gemini':
        // Gemini API keys have a different format
        if (config.apiKey.length < 20) {
          console.warn('Google API key seems too short');
        }
        break;
    }

    // Validate common configuration
    if (config.maxRetries && (config.maxRetries < 0 || config.maxRetries > 10)) {
      throw new Error('maxRetries must be between 0 and 10');
    }

    if (config.timeout && (config.timeout < 1000 || config.timeout > 300000)) {
      throw new Error('timeout must be between 1000ms and 300000ms (5 minutes)');
    }

    if (config.rateLimit) {
      if (config.rateLimit.requestsPerMinute <= 0 || config.rateLimit.requestsPerHour <= 0) {
        throw new Error('Rate limits must be positive numbers');
      }
    }

    if (config.circuitBreaker) {
      const cb = config.circuitBreaker;
      if (cb.failureThreshold <= 0 || cb.resetTimeout <= 0 || cb.monitoringPeriod <= 0) {
        throw new Error('Circuit breaker settings must be positive numbers');
      }
    }
  }

  /**
   * Update configuration for an existing service
   */
  static updateServiceConfig(type: AIServiceType, updates: Partial<AIServiceConfig>): void {
    const existingConfig = AIServiceFactory.serviceConfigs.get(type);
    if (!existingConfig) {
      throw new Error(`No configuration found for service type: ${type}`);
    }

    const updatedConfig = { ...existingConfig, ...updates };
    AIServiceFactory.validateServiceConfig(type, updatedConfig);
    AIServiceFactory.serviceConfigs.set(type, updatedConfig);
  }

  /**
   * Remove service configuration
   */
  static removeService(type: AIServiceType): boolean {
    return AIServiceFactory.serviceConfigs.delete(type);
  }

  /**
   * Clear all service configurations
   */
  static clearAllServices(): void {
    AIServiceFactory.serviceConfigs.clear();
  }

  /**
   * Get service configuration (without sensitive data)
   */
  static getServiceConfig(type: AIServiceType): Partial<AIServiceConfig> | undefined {
    const config = AIServiceFactory.serviceConfigs.get(type);
    if (!config) {
      return undefined;
    }

    // Return config without API key
    const { apiKey, ...safeConfig } = config;
    return safeConfig;
  }
}
