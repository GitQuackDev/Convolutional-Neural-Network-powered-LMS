/**
 * OpenAI GPT-4 Service Implementation
 * Story 1.2: AI Model Service Infrastructure
 */

import OpenAI from 'openai';
import { AbstractAIService } from './AbstractAIService';
import { AIAnalysisResponse, AIServiceInfo, AIServiceConfig } from './types';

export class GPT4Service extends AbstractAIService {
  private openai: OpenAI;

  constructor(config: AIServiceConfig) {
    super(config);
    this.openai = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  getServiceName(): string {
    return 'GPT-4';
  }

  getServiceInfo(): AIServiceInfo {
    return {
      name: 'GPT-4',
      type: 'gpt4',
      version: '1.0.0',
      description: 'OpenAI GPT-4 service for advanced content analysis and generation',
      capabilities: [
        'text_analysis',
        'content_summarization',
        'educational_content_review',
        'assignment_feedback',
        'discussion_moderation'
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
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content analyst. Provide detailed, constructive analysis focused on learning outcomes, clarity, and educational value.'
          },
          {
            role: 'user',
            content: educationalPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const processingTime = Date.now() - startTime;
      const analysis = completion.choices[0]?.message?.content || 'No analysis generated';
      
      // Parse the analysis response
      const parsedAnalysis = this.parseAnalysisResponse(analysis);
      
      const response: AIAnalysisResponse = {
        success: true,
        content: parsedAnalysis.content,
        confidence: parsedAnalysis.confidence,
        processingTime,
        metadata: {
          serviceName: this.getServiceName(),
          model: 'gpt-4',
          tokens: {
            input: completion.usage?.prompt_tokens || 0,
            output: completion.usage?.completion_tokens || 0,
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
          model: 'gpt-4',
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private createEducationalPrompt(content: string, contentType: string): string {
    return `
Please analyze the following educational content and provide a comprehensive assessment:

Content Type: ${contentType}
Content: ${content}

Please provide your analysis in the following structured format:

ANALYSIS:
[Your detailed analysis of the educational value, clarity, and effectiveness]

CONFIDENCE: [0-100]
[Your confidence level in this analysis]

REASONING:
[Explanation of your analysis approach and key factors considered]

SUGGESTIONS:
- [Specific suggestion 1]
- [Specific suggestion 2]
- [Additional suggestions as needed]

CATEGORIES:
[Comma-separated list of relevant educational categories or topics]

SENTIMENT: [Positive/Neutral/Negative score from -1 to 1]

COMPLEXITY: [Low/Medium/High]
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
      confidence: 85, // Default confidence
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
      console.warn('Failed to parse GPT-4 analysis response:', parseError);
    }

    return result;
  }
}
