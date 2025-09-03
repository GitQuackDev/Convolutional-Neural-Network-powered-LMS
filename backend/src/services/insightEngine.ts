import OpenAI from 'openai';

export interface AnalyticsData {
  userEngagement: any;
  contentInteractions: any;
  performanceMetrics: any;
  sessionData: any;
}

export interface ConsolidatedInsights {
  aiResults: any[];
  patterns: any[];
  trends: any[];
}

export interface ProcessedInsight {
  type: string;
  title: string;
  description: string;
  confidence: number;
  userId?: string;
  courseId?: string;
  contentId?: string;
  analyticsDataIds: string[];
  aiResultIds: string[];
  supportingData: any;
  isActionable: boolean;
}

/**
 * Insight Generation Engine
 * Uses AI to process analytics data and generate educational insights
 */
export class InsightGenerationEngine {
  private aiClient: OpenAI;

  constructor() {
    this.aiClient = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'] || process.env['OPENROUTER_API_KEY'],
      baseURL: process.env['OPENROUTER_API_KEY'] ? 'https://openrouter.ai/api/v1' : undefined
    });
  }

  /**
   * Process analytics data and AI results to generate insights
   */
  async processData(
    analyticsData: AnalyticsData,
    aiResults: ConsolidatedInsights[]
  ): Promise<ProcessedInsight[]> {
    try {
      const insights: ProcessedInsight[] = [];

      // 1. Generate performance trend insights
      const performanceInsights = await this.generatePerformanceInsights(analyticsData);
      insights.push(...performanceInsights);

      // 2. Generate content effectiveness insights
      const contentInsights = await this.generateContentInsights(analyticsData, aiResults);
      insights.push(...contentInsights);

      // 3. Generate engagement pattern insights
      const engagementInsights = await this.generateEngagementInsights(analyticsData);
      insights.push(...engagementInsights);

      // 4. Generate AI-powered recommendations
      const recommendationInsights = await this.generateRecommendationInsights(analyticsData, aiResults);
      insights.push(...recommendationInsights);

      return insights;
    } catch (error) {
      console.error('Error processing insight data:', error);
      throw new Error('Failed to process insight data');
    }
  }

  /**
   * Generate performance trend insights
   */
  private async generatePerformanceInsights(analyticsData: AnalyticsData): Promise<ProcessedInsight[]> {
    const insights: ProcessedInsight[] = [];

    try {
      // Analyze performance trends using AI
      const prompt = `
        Analyze the following educational performance data and identify key insights:
        
        Performance Metrics: ${JSON.stringify(analyticsData.performanceMetrics)}
        Session Data: ${JSON.stringify(analyticsData.sessionData)}
        
        Provide insights about:
        1. Learning progress trends
        2. Performance patterns
        3. Areas of improvement
        4. Success indicators
        
        Format as JSON array with title, description, confidence (0-1), and actionable recommendations.
      `;

      const response = await this.aiClient.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      });

      const aiInsights = JSON.parse(response.choices[0]?.message?.content || '[]');

      for (const insight of aiInsights) {
        insights.push({
          type: 'PERFORMANCE_TREND',
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          analyticsDataIds: [],
          aiResultIds: [],
          supportingData: analyticsData.performanceMetrics,
          isActionable: insight.confidence > 0.7
        });
      }
    } catch (error) {
      console.error('Error generating performance insights:', error);
    }

    return insights;
  }

  /**
   * Generate content effectiveness insights
   */
  private async generateContentInsights(
    analyticsData: AnalyticsData,
    aiResults: ConsolidatedInsights[]
  ): Promise<ProcessedInsight[]> {
    const insights: ProcessedInsight[] = [];

    try {
      const prompt = `
        Analyze content effectiveness based on analytics and AI analysis:
        
        Content Interactions: ${JSON.stringify(analyticsData.contentInteractions)}
        AI Analysis Results: ${JSON.stringify(aiResults)}
        
        Identify:
        1. Most effective content types
        2. Content that needs improvement
        3. Engagement patterns by content
        4. Optimal content delivery strategies
        
        Provide actionable insights in JSON format.
      `;

      const response = await this.aiClient.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      });

      const aiInsights = JSON.parse(response.choices[0]?.message?.content || '[]');

      for (const insight of aiInsights) {
        insights.push({
          type: 'CONTENT_EFFECTIVENESS',
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          analyticsDataIds: [],
          aiResultIds: aiResults.map(r => r.aiResults?.[0]?.id || '').filter(Boolean),
          supportingData: {
            contentInteractions: analyticsData.contentInteractions,
            aiResults: aiResults
          },
          isActionable: insight.confidence > 0.6
        });
      }
    } catch (error) {
      console.error('Error generating content insights:', error);
    }

    return insights;
  }

  /**
   * Generate engagement pattern insights
   */
  private async generateEngagementInsights(analyticsData: AnalyticsData): Promise<ProcessedInsight[]> {
    const insights: ProcessedInsight[] = [];

    try {
      const prompt = `
        Analyze user engagement patterns from the following data:
        
        User Engagement: ${JSON.stringify(analyticsData.userEngagement)}
        Session Data: ${JSON.stringify(analyticsData.sessionData)}
        
        Identify:
        1. Peak engagement times
        2. Drop-off patterns
        3. Engagement quality indicators
        4. User behavior trends
        
        Provide insights with confidence scores and recommendations.
      `;

      const response = await this.aiClient.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      });

      const aiInsights = JSON.parse(response.choices[0]?.message?.content || '[]');

      for (const insight of aiInsights) {
        insights.push({
          type: 'ENGAGEMENT_PATTERN',
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          analyticsDataIds: [],
          aiResultIds: [],
          supportingData: {
            userEngagement: analyticsData.userEngagement,
            sessionData: analyticsData.sessionData
          },
          isActionable: insight.confidence > 0.65
        });
      }
    } catch (error) {
      console.error('Error generating engagement insights:', error);
    }

    return insights;
  }

  /**
   * Generate AI-powered recommendation insights
   */
  private async generateRecommendationInsights(
    analyticsData: AnalyticsData,
    aiResults: ConsolidatedInsights[]
  ): Promise<ProcessedInsight[]> {
    const insights: ProcessedInsight[] = [];

    try {
      const prompt = `
        Based on comprehensive analytics and AI analysis, generate strategic recommendations:
        
        Complete Analytics: ${JSON.stringify(analyticsData)}
        AI Consolidated Results: ${JSON.stringify(aiResults)}
        
        Generate recommendations for:
        1. Improving learning outcomes
        2. Optimizing content delivery
        3. Enhancing student engagement
        4. Preventing learning difficulties
        5. Personalizing education paths
        
        Each recommendation should include:
        - Specific action items
        - Expected impact
        - Implementation priority
        - Success metrics
        
        Return as JSON array with high confidence recommendations.
      `;

      const response = await this.aiClient.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      });

      const aiInsights = JSON.parse(response.choices[0]?.message?.content || '[]');

      for (const insight of aiInsights) {
        insights.push({
          type: 'RECOMMENDATION',
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          analyticsDataIds: [],
          aiResultIds: aiResults.map(r => r.aiResults?.[0]?.id || '').filter(Boolean),
          supportingData: {
            fullAnalytics: analyticsData,
            aiInsights: aiResults,
            actionItems: insight.actionItems,
            expectedImpact: insight.expectedImpact
          },
          isActionable: true
        });
      }
    } catch (error) {
      console.error('Error generating recommendation insights:', error);
    }

    return insights;
  }

  /**
   * Generate natural language summary for insights
   */
  async generateInsightSummary(insights: ProcessedInsight[]): Promise<string> {
    try {
      const prompt = `
        Create a comprehensive summary of the following educational insights:
        
        ${insights.map(i => `- ${i.title}: ${i.description} (Confidence: ${i.confidence})`).join('\n')}
        
        Provide:
        1. Overall assessment of learning effectiveness
        2. Key areas of success
        3. Priority areas for improvement
        4. Strategic recommendations
        
        Keep it concise but actionable for educational administrators.
      `;

      const response = await this.aiClient.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      });

      return response.choices[0]?.message?.content || 'Summary generation failed';
    } catch (error) {
      console.error('Error generating insight summary:', error);
      return 'Unable to generate insight summary';
    }
  }

  /**
   * Extract key metrics from insights
   */
  extractKeyMetrics(insights: ProcessedInsight[]): any {
    return {
      totalInsights: insights.length,
      actionableInsights: insights.filter(i => i.isActionable).length,
      averageConfidence: insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length,
      insightsByType: insights.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      }, {} as any)
    };
  }
}
