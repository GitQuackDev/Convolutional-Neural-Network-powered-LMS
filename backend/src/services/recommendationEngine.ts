import OpenAI from 'openai';

export interface RecommendationInput {
  userId?: string;
  courseId?: string;
  userProfile: any;
  performanceData: any;
  engagementData: any;
  learningGoals: any;
  constraints?: any;
}

export interface RecommendationResult {
  type: string;
  title: string;
  description: string;
  priority: string;
  actionItems: string[];
  expectedImpact: string;
  timeToImplement: number;
  resources: string[];
  successMetrics: string[];
  confidence: number;
}

/**
 * Recommendation Engine
 * Generates personalized recommendations based on AI analysis
 */
export class RecommendationEngine {
  private aiClient: OpenAI;

  constructor() {
    this.aiClient = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'] || process.env['OPENROUTER_API_KEY'],
      baseURL: process.env['OPENROUTER_API_KEY'] ? 'https://openrouter.ai/api/v1' : undefined
    });
  }

  /**
   * Generate comprehensive recommendations
   */
  async generateRecommendations(input: RecommendationInput): Promise<RecommendationResult[]> {
    try {
      const recommendations: RecommendationResult[] = [];

      // 1. Learning path recommendations
      const learningRecs = await this.generateLearningRecommendations(input);
      recommendations.push(...learningRecs);

      // 2. Content recommendations
      const contentRecs = await this.generateContentRecommendations(input);
      recommendations.push(...contentRecs);

      // 3. Study strategy recommendations
      const strategyRecs = await this.generateStrategyRecommendations(input);
      recommendations.push(...strategyRecs);

      // 4. Intervention recommendations
      const interventionRecs = await this.generateInterventionRecommendations(input);
      recommendations.push(...interventionRecs);

      return this.prioritizeRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Generate learning path recommendations
   */
  private async generateLearningRecommendations(input: RecommendationInput): Promise<RecommendationResult[]> {
    try {
      const prompt = `
        Generate personalized learning path recommendations based on:
        
        User Profile: ${JSON.stringify(input.userProfile)}
        Performance Data: ${JSON.stringify(input.performanceData)}
        Learning Goals: ${JSON.stringify(input.learningGoals)}
        
        Recommend:
        1. Optimal learning sequence
        2. Skill gap priorities
        3. Difficulty progression
        4. Time allocation strategies
        5. Learning modality preferences
        
        For each recommendation, provide:
        - Specific action items
        - Expected learning impact
        - Implementation timeline
        - Success metrics
        
        Format as JSON array of recommendation objects.
      `;

      const response = await this.aiClient.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      });

      const aiRecommendations = JSON.parse(response.choices[0]?.message?.content || '[]');

      return aiRecommendations.map((rec: any) => ({
        type: 'LEARNING_PATH',
        title: rec.title,
        description: rec.description,
        priority: rec.priority || 'MEDIUM',
        actionItems: rec.actionItems || [],
        expectedImpact: rec.expectedImpact || '',
        timeToImplement: rec.timeToImplement || 7,
        resources: rec.resources || [],
        successMetrics: rec.successMetrics || [],
        confidence: rec.confidence || 0.7
      }));
    } catch (error) {
      console.error('Error generating learning recommendations:', error);
      return [];
    }
  }

  /**
   * Generate content recommendations
   */
  private async generateContentRecommendations(input: RecommendationInput): Promise<RecommendationResult[]> {
    try {
      const prompt = `
        Generate content recommendations based on learning analytics:
        
        User Profile: ${JSON.stringify(input.userProfile)}
        Performance Data: ${JSON.stringify(input.performanceData)}
        Engagement Data: ${JSON.stringify(input.engagementData)}
        
        Recommend:
        1. Content types that match learning style
        2. Difficulty-appropriate materials
        3. Supplementary resources
        4. Practice exercises
        5. Assessment formats
        
        Focus on improving engagement and learning outcomes.
        Provide specific content suggestions with rationale.
      `;

      const response = await this.aiClient.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      });

      const aiRecommendations = JSON.parse(response.choices[0]?.message?.content || '[]');

      return aiRecommendations.map((rec: any) => ({
        type: 'CONTENT_OPTIMIZATION',
        title: rec.title,
        description: rec.description,
        priority: rec.priority || 'MEDIUM',
        actionItems: rec.actionItems || [],
        expectedImpact: rec.expectedImpact || '',
        timeToImplement: rec.timeToImplement || 3,
        resources: rec.resources || [],
        successMetrics: rec.successMetrics || [],
        confidence: rec.confidence || 0.6
      }));
    } catch (error) {
      console.error('Error generating content recommendations:', error);
      return [];
    }
  }

  /**
   * Generate study strategy recommendations
   */
  private async generateStrategyRecommendations(input: RecommendationInput): Promise<RecommendationResult[]> {
    try {
      const prompt = `
        Generate personalized study strategy recommendations:
        
        User Profile: ${JSON.stringify(input.userProfile)}
        Performance Data: ${JSON.stringify(input.performanceData)}
        Engagement Data: ${JSON.stringify(input.engagementData)}
        
        Recommend strategies for:
        1. Time management and scheduling
        2. Study techniques and methods
        3. Motivation and engagement
        4. Progress tracking
        5. Habit formation
        
        Base recommendations on learning science and personalized data analysis.
        Include implementation guidance and expected outcomes.
      `;

      const response = await this.aiClient.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      });

      const aiRecommendations = JSON.parse(response.choices[0]?.message?.content || '[]');

      return aiRecommendations.map((rec: any) => ({
        type: 'STUDY_STRATEGY',
        title: rec.title,
        description: rec.description,
        priority: rec.priority || 'MEDIUM',
        actionItems: rec.actionItems || [],
        expectedImpact: rec.expectedImpact || '',
        timeToImplement: rec.timeToImplement || 14,
        resources: rec.resources || [],
        successMetrics: rec.successMetrics || [],
        confidence: rec.confidence || 0.7
      }));
    } catch (error) {
      console.error('Error generating strategy recommendations:', error);
      return [];
    }
  }

  /**
   * Generate intervention recommendations for at-risk situations
   */
  private async generateInterventionRecommendations(input: RecommendationInput): Promise<RecommendationResult[]> {
    try {
      const prompt = `
        Generate intervention recommendations for potential learning issues:
        
        User Profile: ${JSON.stringify(input.userProfile)}
        Performance Data: ${JSON.stringify(input.performanceData)}
        Engagement Data: ${JSON.stringify(input.engagementData)}
        
        Identify needs for:
        1. Academic support interventions
        2. Engagement boost strategies
        3. Motivation recovery plans
        4. Skill gap remediation
        5. Progress acceleration techniques
        
        Prioritize urgent interventions and provide step-by-step implementation.
        Include prevention strategies for future issues.
      `;

      const response = await this.aiClient.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      });

      const aiRecommendations = JSON.parse(response.choices[0]?.message?.content || '[]');

      return aiRecommendations.map((rec: any) => ({
        type: 'INTERVENTION',
        title: rec.title,
        description: rec.description,
        priority: rec.priority || 'HIGH',
        actionItems: rec.actionItems || [],
        expectedImpact: rec.expectedImpact || '',
        timeToImplement: rec.timeToImplement || 1,
        resources: rec.resources || [],
        successMetrics: rec.successMetrics || [],
        confidence: rec.confidence || 0.8
      }));
    } catch (error) {
      console.error('Error generating intervention recommendations:', error);
      return [];
    }
  }

  /**
   * Prioritize recommendations based on impact and urgency
   */
  private prioritizeRecommendations(recommendations: RecommendationResult[]): RecommendationResult[] {
    return recommendations.sort((a, b) => {
      // Priority order: HIGH > MEDIUM > LOW
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // High priority first
      }

      // If same priority, sort by confidence
      return b.confidence - a.confidence;
    });
  }

  /**
   * Generate recommendation summary
   */
  async generateRecommendationSummary(recommendations: RecommendationResult[]): Promise<string> {
    try {
      const prompt = `
        Create an executive summary of the following educational recommendations:
        
        ${recommendations.map(r => `
        ${r.title} (${r.type}, Priority: ${r.priority})
        - ${r.description}
        - Expected Impact: ${r.expectedImpact}
        - Implementation Time: ${r.timeToImplement} days
        `).join('\n')}
        
        Provide:
        1. Overall assessment of student/course status
        2. Priority action items
        3. Expected outcomes if recommendations are followed
        4. Timeline for implementation
        
        Keep it concise but comprehensive for educators and administrators.
      `;

      const response = await this.aiClient.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      });

      return response.choices[0]?.message?.content || 'Summary generation failed';
    } catch (error) {
      console.error('Error generating recommendation summary:', error);
      return 'Unable to generate recommendation summary';
    }
  }

  /**
   * Filter recommendations by type
   */
  filterByType(recommendations: RecommendationResult[], type: string): RecommendationResult[] {
    return recommendations.filter(rec => rec.type === type);
  }

  /**
   * Filter recommendations by priority
   */
  filterByPriority(recommendations: RecommendationResult[], priority: string): RecommendationResult[] {
    return recommendations.filter(rec => rec.priority === priority);
  }

  /**
   * Get recommendations requiring immediate action
   */
  getUrgentRecommendations(recommendations: RecommendationResult[]): RecommendationResult[] {
    return recommendations.filter(rec => 
      rec.priority === 'HIGH' && rec.timeToImplement <= 3
    );
  }

  /**
   * Calculate recommendation metrics
   */
  calculateMetrics(recommendations: RecommendationResult[]): any {
    return {
      total: recommendations.length,
      byType: recommendations.reduce((acc, rec) => {
        acc[rec.type] = (acc[rec.type] || 0) + 1;
        return acc;
      }, {} as any),
      byPriority: recommendations.reduce((acc, rec) => {
        acc[rec.priority] = (acc[rec.priority] || 0) + 1;
        return acc;
      }, {} as any),
      averageConfidence: recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length,
      urgentActions: this.getUrgentRecommendations(recommendations).length
    };
  }
}
