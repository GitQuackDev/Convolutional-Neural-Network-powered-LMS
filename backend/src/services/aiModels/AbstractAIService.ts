import { AIAnalysisResponse, AIServiceInfo, AIServiceConfig, AIServiceMetrics } from './types';

export abstract class AbstractAIService {
  protected config: AIServiceConfig;
  protected metrics: AIServiceMetrics;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.metrics = {
      serviceName: this.getServiceName(),
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
      isHealthy: true
    };
  }

  abstract getServiceName(): string;
  abstract analyzeContent(content: string, contentType: string): Promise<AIAnalysisResponse>;
  abstract getServiceInfo(): AIServiceInfo;

  protected validateContent(content: string, contentType: string): void {
    if (!content || typeof content !== 'string') {
      throw new Error('Content must be a non-empty string');
    }
    
    if (!contentType || typeof contentType !== 'string') {
      throw new Error('Content type must be specified');
    }

    const maxLength = this.config.maxContentLength || 50000; // Default 50k chars
    if (content.length > maxLength) {
      throw new Error(`Content exceeds maximum length of ${maxLength} characters`);
    }
  }

  protected extractTextFromContent(content: string, contentType: string): string {
    switch (contentType.toLowerCase()) {
      case 'text/plain':
      case 'text/html':
      case 'application/json':
        return content;
      default:
        return content;
    }
  }

  protected updateMetrics(success: boolean, responseTime: number): void {
    this.metrics.totalRequests++;
    this.metrics.lastRequestTime = new Date();
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    const totalSuccessful = this.metrics.successfulRequests;
    if (success && totalSuccessful > 0) {
      this.metrics.averageResponseTime = 
        ((this.metrics.averageResponseTime * (totalSuccessful - 1)) + responseTime) / totalSuccessful;
    }

    const successRate = this.metrics.successfulRequests / this.metrics.totalRequests;
    this.metrics.isHealthy = successRate >= 0.8;
  }

  getMetrics(): AIServiceMetrics {
    return { ...this.metrics };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const testResponse = await this.analyzeContent(
        'This is a test message for health check.',
        'text/plain'
      );
      return testResponse.success;
    } catch (error) {
      console.error(`Health check failed for ${this.getServiceName()}:`, error);
      return false;
    }
  }
}
