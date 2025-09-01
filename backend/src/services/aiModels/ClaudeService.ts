/**
 * Anthropic Claude Service Implementation  
 * Story 1.2: AI Model Service Infrastructure
 */

import Anthropic from '@anthropic-ai/sdk';
import { AbstractAIService } from './AbstractAIService';
import { AIAnalysisResponse, AIServiceInfo, AIServiceConfig } from './types';

export class ClaudeService extends AbstractAIService {
  private anthropic: Anthropic;

  constructor(config: AIServiceConfig) {
    super(config);
    this.anthropic = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  getServiceName(): string {
    return 'Claude';
  }

  getServiceInfo(): AIServiceInfo {
    return {
      name: 'Claude',
      type: 'claude',
      version: '1.0.0',
      description: 'Anthropic Claude service for sophisticated reasoning and analysis',
      capabilities: [
        'deep_analysis',
        'logical_reasoning',
        'educational_assessment',
        'content_critique',
        'detailed_feedback'
      ],
      status: 'available',
      lastHealthCheck: new Date(),
    };
  }

  async analyzeContent(content: string, contentType: string): Promise<AIAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      this.validateContent(content, contentType);
      
      const textContent = this.extractTextFromContent(content, contentType);
      
      // Create educational analysis prompt
      const educationalPrompt = this.createEducationalPrompt(textContent, contentType);
      
      const message = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: educationalPrompt
          }
        ],
      });

      const processingTime = Date.now() - startTime;
      const analysis = message.content[0]?.type === 'text' ? message.content[0].text : 'No analysis generated';
      
      // Parse the analysis response
      const parsedAnalysis = this.parseAnalysisResponse(analysis);
      
      const response: AIAnalysisResponse = {
        success: true,
        content: parsedAnalysis.content,
        confidence: parsedAnalysis.confidence,
        processingTime,
        metadata: {
          serviceName: this.getServiceName(),
          model: 'claude-3-sonnet-20240229',
          tokens: {
            input: message.usage?.input_tokens || 0,
            output: message.usage?.output_tokens || 0,
          },
          ...(parsedAnalysis.reasoning && { reasoning: parsedAnalysis.reasoning }),
          ...(parsedAnalysis.suggestions && { suggestions: parsedAnalysis.suggestions }),
          ...(parsedAnalysis.categories && { categories: parsedAnalysis.categories }),
          ...(parsedAnalysis.sentimentScore !== undefined && { sentimentScore: parsedAnalysis.sentimentScore }),
          ...(parsedAnalysis.complexity && { complexity: parsedAnalysis.complexity }),
        },
      };

      this.updateMetrics(true, processingTime);
      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(false, processingTime);
      
      return {
        success: false,
        content: '',
        confidence: 0,
        processingTime,
        metadata: {
          serviceName: this.getServiceName(),
          model: 'claude-3-sonnet-20240229',
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private createEducationalPrompt(content: string, contentType: string): string {
    return `
As an expert educational content analyst, please provide a comprehensive assessment of the following content:

Content Type: ${contentType}
Content: ${content}

Please analyze this content with a focus on educational value, pedagogical effectiveness, and learning outcomes. Structure your response as follows:

ANALYSIS:
[Provide a detailed analysis covering educational effectiveness, clarity, engagement level, and learning potential]

CONFIDENCE: [0-100]
[Your confidence level in this analysis]

REASONING:
[Explain your analytical approach, key criteria used, and factors that influenced your assessment]

SUGGESTIONS:
- [Specific, actionable suggestion 1]
- [Specific, actionable suggestion 2]
- [Additional improvement recommendations]

CATEGORIES:
[List relevant educational categories, subjects, or learning domains]

SENTIMENT: [Score from -1 to 1]
[Rate the overall tone and emotional impact]

COMPLEXITY: [Low/Medium/High]
[Assess the cognitive load and difficulty level]
    `;
  }

  private parseAnalysisResponse(analysis: string): {
    content: string;
    confidence: number;
    reasoning?: string;
    suggestions?: string[];
    categories?: string[];
    sentimentScore?: number;
    complexity?: 'low' | 'medium' | 'high';
  } {
    const result: {
      content: string;
      confidence: number;
      reasoning?: string;
      suggestions?: string[];
      categories?: string[];
      sentimentScore?: number;
      complexity?: 'low' | 'medium' | 'high';
    } = {
      content: analysis,
      confidence: 88, // Default confidence for Claude
    };

    try {
      // Extract confidence
      const confidenceMatch = analysis.match(/CONFIDENCE:\s*(\d+)/i);
      if (confidenceMatch && confidenceMatch[1]) {
        result.confidence = parseInt(confidenceMatch[1], 10);
      }

      // Extract reasoning
      const reasoningMatch = analysis.match(/REASONING:\s*(.*?)(?=\n[A-Z]+:|$)/s);
      if (reasoningMatch && reasoningMatch[1]) {
        result.reasoning = reasoningMatch[1].trim();
      }

      // Extract suggestions
      const suggestionsMatch = analysis.match(/SUGGESTIONS:\s*(.*?)(?=\n[A-Z]+:|$)/s);
      if (suggestionsMatch && suggestionsMatch[1]) {
        result.suggestions = suggestionsMatch[1]
          .split('\n')
          .map(s => s.replace(/^-\s*/, '').trim())
          .filter(s => s.length > 0);
      }

      // Extract categories
      const categoriesMatch = analysis.match(/CATEGORIES:\s*(.*?)(?=\n[A-Z]+:|$)/s);
      if (categoriesMatch && categoriesMatch[1]) {
        result.categories = categoriesMatch[1]
          .split(',')
          .map(c => c.trim())
          .filter(c => c.length > 0);
      }

      // Extract sentiment
      const sentimentMatch = analysis.match(/SENTIMENT:\s*([-+]?[0-9]*\.?[0-9]+)/i);
      if (sentimentMatch && sentimentMatch[1]) {
        result.sentimentScore = parseFloat(sentimentMatch[1]);
      }

      // Extract complexity
      const complexityMatch = analysis.match(/COMPLEXITY:\s*(Low|Medium|High)/i);
      if (complexityMatch && complexityMatch[1]) {
        result.complexity = complexityMatch[1].toLowerCase() as 'low' | 'medium' | 'high';
      }

    } catch (parseError) {
      console.warn('Failed to parse Claude analysis response:', parseError);
    }

    return result;
  }
}
