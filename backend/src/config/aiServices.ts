/**
 * AI Services Configuration
 * Story 1.2: AI Model Service Infrastructure
 */

import { AIServiceConfig, AIServiceType } from '../services/aiModels/types';
import { AIServiceManagerConfig } from '../services/aiModels/AIServiceManager';

// Environment variable helpers
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value || defaultValue!;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  return value ? value.toLowerCase() === 'true' : defaultValue;
};

// AI Service Configurations
export const createAIServiceConfigs = (): AIServiceConfig[] => {
  const configs: AIServiceConfig[] = [];

  // OpenRouter Configuration (Recommended - Single API for multiple models)
  if (process.env['OPENROUTER_API_KEY']) {
    configs.push({
      type: 'openrouter' as AIServiceType,
      serviceName: 'openrouter',
      apiKey: process.env['OPENROUTER_API_KEY'],
      endpoint: 'https://openrouter.ai/api/v1',
      maxRetries: getEnvNumber('OPENROUTER_MAX_RETRIES', 3),
      timeout: getEnvNumber('OPENROUTER_TIMEOUT', 30000),
      rateLimit: {
        requestsPerMinute: getEnvNumber('OPENROUTER_RPM', 100),
        requestsPerHour: getEnvNumber('OPENROUTER_RPH', 1000)
      },
      circuitBreaker: {
        failureThreshold: getEnvNumber('OPENROUTER_FAILURE_THRESHOLD', 5),
        resetTimeout: getEnvNumber('OPENROUTER_RESET_TIMEOUT', 60000),
        monitoringPeriod: getEnvNumber('OPENROUTER_MONITORING_PERIOD', 300000)
      },
      models: [
        'deepseek/deepseek-chat-v3.1:free', // FREE
        'google/gemini-2.5-flash-image-preview:free', // FREE
        'openai/gpt-4o', // Premium
        'anthropic/claude-3.5-sonnet', // Premium
        'nousresearch/hermes-4-70b' // Alternative
      ]
    });
  }

  // GPT-4 Configuration
  const gpt4ApiKey = process.env['OPENAI_API_KEY'];
  if (gpt4ApiKey) {
    configs.push({
      serviceName: 'gpt4',
      apiKey: gpt4ApiKey,
      endpoint: getEnvVar('OPENAI_ENDPOINT', 'https://api.openai.com/v1'),
      maxRetries: getEnvNumber('OPENAI_MAX_RETRIES', 3),
      timeout: getEnvNumber('OPENAI_TIMEOUT', 30000),
      maxContentLength: getEnvNumber('OPENAI_MAX_CONTENT_LENGTH', 50000),
      rateLimit: {
        requestsPerMinute: getEnvNumber('OPENAI_REQUESTS_PER_MINUTE', 60),
        requestsPerHour: getEnvNumber('OPENAI_REQUESTS_PER_HOUR', 3600),
      },
      circuitBreaker: {
        failureThreshold: getEnvNumber('OPENAI_FAILURE_THRESHOLD', 5),
        resetTimeout: getEnvNumber('OPENAI_RESET_TIMEOUT', 60000),
        monitoringPeriod: getEnvNumber('OPENAI_MONITORING_PERIOD', 60000),
      },
    });
  }

  // Claude Configuration
  const claudeApiKey = process.env['ANTHROPIC_API_KEY'];
  if (claudeApiKey) {
    configs.push({
      serviceName: 'claude',
      apiKey: claudeApiKey,
      endpoint: getEnvVar('ANTHROPIC_ENDPOINT', 'https://api.anthropic.com'),
      maxRetries: getEnvNumber('ANTHROPIC_MAX_RETRIES', 3),
      timeout: getEnvNumber('ANTHROPIC_TIMEOUT', 30000),
      maxContentLength: getEnvNumber('ANTHROPIC_MAX_CONTENT_LENGTH', 100000),
      rateLimit: {
        requestsPerMinute: getEnvNumber('ANTHROPIC_REQUESTS_PER_MINUTE', 50),
        requestsPerHour: getEnvNumber('ANTHROPIC_REQUESTS_PER_HOUR', 3000),
      },
      circuitBreaker: {
        failureThreshold: getEnvNumber('ANTHROPIC_FAILURE_THRESHOLD', 5),
        resetTimeout: getEnvNumber('ANTHROPIC_RESET_TIMEOUT', 60000),
        monitoringPeriod: getEnvNumber('ANTHROPIC_MONITORING_PERIOD', 60000),
      },
    });
  }

  // Gemini Configuration
  const geminiApiKey = process.env['GOOGLE_AI_API_KEY'];
  if (geminiApiKey) {
    configs.push({
      serviceName: 'gemini',
      apiKey: geminiApiKey,
      endpoint: getEnvVar('GOOGLE_AI_ENDPOINT', 'https://generativelanguage.googleapis.com'),
      maxRetries: getEnvNumber('GOOGLE_AI_MAX_RETRIES', 3),
      timeout: getEnvNumber('GOOGLE_AI_TIMEOUT', 30000),
      maxContentLength: getEnvNumber('GOOGLE_AI_MAX_CONTENT_LENGTH', 30000),
      rateLimit: {
        requestsPerMinute: getEnvNumber('GOOGLE_AI_REQUESTS_PER_MINUTE', 60),
        requestsPerHour: getEnvNumber('GOOGLE_AI_REQUESTS_PER_HOUR', 1500),
      },
      circuitBreaker: {
        failureThreshold: getEnvNumber('GOOGLE_AI_FAILURE_THRESHOLD', 5),
        resetTimeout: getEnvNumber('GOOGLE_AI_RESET_TIMEOUT', 60000),
        monitoringPeriod: getEnvNumber('GOOGLE_AI_MONITORING_PERIOD', 60000),
      },
    });
  }

  return configs;
};

// Parse enabled services from environment
export const getEnabledServices = (): AIServiceType[] => {
  const enabledServicesEnv = getEnvVar('AI_ENABLED_SERVICES', 'gpt4,claude,gemini');
  return enabledServicesEnv.split(',').map(s => s.trim() as AIServiceType);
};

// Parse fallback order from environment
export const getFallbackOrder = (): AIServiceType[] => {
  const fallbackOrderEnv = getEnvVar('AI_FALLBACK_ORDER', 'gpt4,claude,gemini');
  return fallbackOrderEnv.split(',').map(s => s.trim() as AIServiceType);
};

// Get default service
export const getDefaultService = (): AIServiceType => {
  return getEnvVar('AI_DEFAULT_SERVICE', 'gpt4') as AIServiceType;
};

// Create AI Service Manager Configuration
export const createAIServiceManagerConfig = (): AIServiceManagerConfig => {
  const services = createAIServiceConfigs();
  
  if (services.length === 0) {
    console.warn('No AI services configured. Please set API keys in environment variables.');
  }

  return {
    services,
    enabledServices: getEnabledServices().filter(service => 
      services.some(config => config.serviceName === service || config.type === service)
    ),
    fallbackOrder: getFallbackOrder().filter(service =>
      services.some(config => config.serviceName === service || config.type === service)
    ),
    circuitBreakerOptions: {
      timeout: getEnvNumber('AI_CIRCUIT_BREAKER_TIMEOUT', 30000),
      errorThresholdPercentage: getEnvNumber('AI_CIRCUIT_BREAKER_ERROR_THRESHOLD', 50),
      resetTimeout: getEnvNumber('AI_CIRCUIT_BREAKER_RESET_TIMEOUT', 60000),
    },
    defaultService: getDefaultService(),
  };
};

// Configuration validation
export const validateAIServiceConfig = (config: AIServiceManagerConfig): void => {
  if (config.services.length === 0) {
    throw new Error('At least one AI service must be configured');
  }

  if (config.enabledServices.length === 0) {
    throw new Error('At least one AI service must be enabled');
  }

  if (!config.enabledServices.includes(config.defaultService)) {
    throw new Error(`Default service ${config.defaultService} is not in enabled services list`);
  }

  // Validate that all enabled services have configurations
  for (const enabledService of config.enabledServices) {
    const serviceConfig = config.services.find(s => 
      s.serviceName === enabledService || s.type === enabledService
    );
    if (!serviceConfig) {
      throw new Error(`Configuration missing for enabled service: ${enabledService}`);
    }
    
    if (!serviceConfig.apiKey) {
      throw new Error(`API key missing for service: ${enabledService}`);
    }
  }
};

// Hot reload configuration
export const reloadAIServiceConfig = (): AIServiceManagerConfig => {
  const config = createAIServiceManagerConfig();
  validateAIServiceConfig(config);
  return config;
};

// Export default configuration
export const aiServiceManagerConfig = createAIServiceManagerConfig();