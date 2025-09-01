/**
 * Google Gemini Service Implementation
 * Story 1.2: AI Model Service Infrastructure
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AbstractAIService } from './AbstractAIService';
import { AIAnalysisResponse, AIServiceInfo, AIServiceConfig } from './types';

export class GeminiService extends AbstractAIService {
  private genAI: GoogleGenerativeAI;

  constructor(config: AIServiceConfig) {
    super(config);
    this.genAI = new GoogleGenerativeAI(config.apiKey);
  }

  getServiceName(): string {
    return 'Gemini';
  }

  getServiceInfo(): AIServiceInfo {
    return {
      name: 'Gemini',
      type: 'gemini',
      version: '1.0.0',
      description: 'Google Gemini service for multimodal content understanding and analysis',
      capabilities: [
        'multimodal_analysis',
        'content_understanding',
        'educational_insights',
        'contextual_analysis',
        'comprehensive_feedback'
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
      
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const result = await model.generateContent(educationalPrompt);
      const response = await result.response;
      const analysis = response.text();

      const processingTime = Date.now() - startTime;
      
      // Parse the analysis response
      const parsedAnalysis = this.parseAnalysisResponse(analysis);
      
      const aiResponse: AIAnalysisResponse = {
        success: true,
        content: parsedAnalysis.content,
        confidence: parsedAnalysis.confidence,
        processingTime,
        metadata: {
          serviceName: this.getServiceName(),
          model: 'gemini-pro',
          tokens: {
            input: 0, // Gemini doesn't provide token counts directly
            output: 0,
          },
          ...(parsedAnalysis.reasoning && { reasoning: parsedAnalysis.reasoning }),
          ...(parsedAnalysis.suggestions && { suggestions: parsedAnalysis.suggestions }),
          ...(parsedAnalysis.categories && { categories: parsedAnalysis.categories }),
          ...(parsedAnalysis.sentimentScore !== undefined && { sentimentScore: parsedAnalysis.sentimentScore }),
          ...(parsedAnalysis.complexity && { complexity: parsedAnalysis.complexity }),
        },
      };

      this.updateMetrics(true, processingTime);
      return aiResponse;

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
          model: 'gemini-pro',
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private createEducationalPrompt(content: string, contentType: string): string {
    return `
Please conduct a comprehensive educational analysis of the following content:

Content Type: ${contentType}
Content: ${content}

As an expert educational technology analyst, evaluate this content across multiple dimensions including pedagogical effectiveness, engagement potential, learning outcomes, and accessibility. 

Please structure your response in the following format:

ANALYSIS:
[Provide an in-depth analysis covering educational value, pedagogical approach, engagement strategies, learning objectives alignment, and overall effectiveness]

CONFIDENCE: [0-100]
[Your confidence level in this educational assessment]

REASONING:
[Explain your analytical methodology, key educational principles applied, and rationale for your assessment]

SUGGESTIONS:
- [Specific, evidence-based improvement recommendation 1]
- [Specific, evidence-based improvement recommendation 2]
- [Additional actionable suggestions for enhancement]

CATEGORIES:
[Identify relevant educational categories, learning domains, subject areas, or pedagogical frameworks]

SENTIMENT: [Score from -1 to 1]
[Assess the emotional tone and motivational impact on learners]

COMPLEXITY: [Low/Medium/High]
[Evaluate the cognitive demand and appropriate learning level]
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
      confidence: 82, // Default confidence for Gemini
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
      console.warn('Failed to parse Gemini analysis response:', parseError);
    }

    return result;
  }
}
