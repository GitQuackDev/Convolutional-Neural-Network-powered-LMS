import { AIModelType } from '../../types/index';
import { OpenRouterIntegration } from './OpenRouterIntegration';

export interface AIModel {
  analyze(content: string, file?: Express.Multer.File): Promise<any>;
  getModelName(): string;
  getEstimatedTime(): number;
}

// Real OpenRouter-powered models
class GPT4Model implements AIModel {
  private openRouterModel: OpenRouterIntegration;

  constructor() {
    const apiKey = process.env['OPENROUTER_API_KEY'];
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required for GPT-4 model');
    }
    this.openRouterModel = new OpenRouterIntegration(
      apiKey,
      'openai/gpt-4o',
      'GPT-4 Omni via OpenRouter'
    );
  }

  async analyze(content: string, file?: Express.Multer.File): Promise<any> {
    return await this.openRouterModel.analyze(content, file);
  }

  getModelName(): string {
    return 'GPT-4 Omni';
  }

  getEstimatedTime(): number {
    return 3000; // 3 seconds
  }
}

class ClaudeModel implements AIModel {
  private openRouterModel: OpenRouterIntegration;

  constructor() {
    const apiKey = process.env['OPENROUTER_API_KEY'];
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required for Claude model');
    }
    this.openRouterModel = new OpenRouterIntegration(
      apiKey,
      'anthropic/claude-3.5-sonnet',
      'Claude 3.5 Sonnet via OpenRouter'
    );
  }

  async analyze(content: string, file?: Express.Multer.File): Promise<any> {
    return await this.openRouterModel.analyze(content, file);
  }

  getModelName(): string {
    return 'Claude 3.5 Sonnet';
  }

  getEstimatedTime(): number {
    return 4000; // 4 seconds
  }
}

class GeminiModel implements AIModel {
  private openRouterModel: OpenRouterIntegration;

  constructor() {
    const apiKey = process.env['OPENROUTER_API_KEY'];
    console.log('🔑 Gemini Model - API Key loaded:', !!apiKey, 'length:', apiKey?.length || 0);
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required for Gemini model');
    }
    // Using the FREE Gemini model from OpenRouter
    this.openRouterModel = new OpenRouterIntegration(
      apiKey,
      'google/gemini-2.5-flash-image-preview:free',
      'Gemini 2.5 Flash (Free) via OpenRouter'
    );
    console.log('✅ Gemini Model initialized with OpenRouter integration');
  }

  async analyze(content: string, file?: Express.Multer.File): Promise<any> {
    return await this.openRouterModel.analyze(content, file);
  }

  getModelName(): string {
    return 'Gemini 2.5 Flash (Free)';
  }

  getEstimatedTime(): number {
    return 2500; // 2.5 seconds
  }
}

// Also create a FREE DeepSeek model for testing
class DeepSeekModel implements AIModel {
  private openRouterModel: OpenRouterIntegration;

  constructor() {
    const apiKey = process.env['OPENROUTER_API_KEY'];
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required for DeepSeek model');
    }
    // Using the FREE DeepSeek model from OpenRouter
    this.openRouterModel = new OpenRouterIntegration(
      apiKey,
      'deepseek/deepseek-chat-v3.1:free',
      'DeepSeek V3.1 (Free) via OpenRouter'
    );
  }

  async analyze(content: string, file?: Express.Multer.File): Promise<any> {
    return await this.openRouterModel.analyze(content, file);
  }

  getModelName(): string {
    return 'DeepSeek V3.1 (Free)';
  }

  getEstimatedTime(): number {
    return 2000; // 2 seconds
  }
}

class AIModelFactory {
  private models: Map<AIModelType, AIModel> = new Map();

  constructor() {
    // Start with FREE models for testing
    this.models.set('gemini', new GeminiModel());  // FREE Gemini 2.5 Flash
    // this.models.set('deepseek', new DeepSeekModel()); // FREE DeepSeek (uncomment if you add 'deepseek' to AIModelType)
    
    // Premium models (cost money)
    this.models.set('gpt4', new GPT4Model());      // GPT-4 Omni (premium)
    this.models.set('claude', new ClaudeModel());  // Claude 3.5 Sonnet (premium)
  }

  getModel(modelType: AIModelType): AIModel {
    const model = this.models.get(modelType);
    if (!model) {
      throw new Error(`AI model ${modelType} not found`);
    }
    return model;
  }

  getAllModels(): AIModelType[] {
    return Array.from(this.models.keys());
  }

  getEstimatedTotalTime(models: AIModelType[]): number {
    return models.reduce((total, modelType) => {
      const model = this.getModel(modelType);
      return total + model.getEstimatedTime();
    }, 0);
  }
}

export const aiModelFactory = new AIModelFactory();
