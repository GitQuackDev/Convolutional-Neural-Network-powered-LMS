import { OpenAI } from 'openai';
import { AIModel } from './AIModelFactory';

export class OpenRouterIntegration implements AIModel {
  private client: OpenAI;
  private model: string;
  private displayName: string;

  constructor(apiKey: string, model: string, displayName: string) {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000', // Your site URL
        'X-Title': 'LMS CNN Analysis', // Your app name
      }
    });
    this.model = model;
    this.displayName = displayName;
  }

  async analyze(content: string, file?: Express.Multer.File): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Debug logging
      console.log(`🔍 OpenRouter ${this.displayName} analyzing content:`, {
        contentLength: content.length,
        contentPreview: content.substring(0, 200) + '...',
        model: this.model,
        fileName: file?.originalname,
        fileType: file?.mimetype,
        hasFile: !!file
      });

      // Handle image files differently
      if (file && file.mimetype.startsWith('image/')) {
        console.log(`📸 Processing image file: ${file.originalname}`);
        
        // Convert image to base64
        let imageBuffer: Buffer;
        
        if (file.buffer) {
          // File is already in memory as buffer
          imageBuffer = file.buffer;
        } else if (file.path) {
          // File is stored on disk, read it
          const fs = require('fs');
          imageBuffer = fs.readFileSync(file.path);
        } else {
          throw new Error('File buffer or path not available');
        }
        
        const base64Image = imageBuffer.toString('base64');
        const imageUrl = `data:${file.mimetype};base64,${base64Image}`;
        
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are an expert visual content analyst. Analyze the image thoroughly and provide specific, detailed insights about what you actually see. Be very specific about the visual content, objects, colors, composition, and context. Avoid generic responses.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this image in detail and provide specific insights about what you see:

Please provide:
1. A detailed description of what is actually visible in the image
2. Specific objects, colors, textures, and visual elements you can identify
3. The context, setting, or environment shown
4. Educational or practical applications relevant to what you observe
5. Specific recommendations based on the actual visual content

Be concrete and specific to what you actually see in the image. Avoid generic responses.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        });

        console.log(`🔍 OpenRouter image analysis response:`, {
          responseLength: response.choices[0]?.message?.content?.length || 0,
          responsePreview: response.choices[0]?.message?.content?.substring(0, 200) + '...',
          usage: response.usage
        });

        const analysis = response.choices[0]?.message?.content || 'No analysis available';
        
        return {
          summary: analysis,
          keyPoints: this.extractKeyPoints(analysis),
          sentiment: 'neutral',
          topics: this.extractTopics(analysis),
          complexity: 'medium',
          readability: 80,
          confidence: 0.85,
          processingTime: Date.now() - startTime,
          metadata: {
            model: this.model,
            provider: 'OpenRouter',
            usage: response.usage,
            type: 'image_analysis'
          }
        };
      }

      // Handle text content
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert educational content analyst. Analyze the provided content thoroughly and provide specific, relevant insights. Be very detailed and specific to the actual content provided. Avoid generic responses.`
          },
          {
            role: 'user',
            content: `Analyze this specific content in detail and provide insights relevant to what you see:

CONTENT TO ANALYZE:
${content}

Please provide:
1. A specific summary of what this content actually contains
2. Key insights that are directly relevant to this specific content
3. Educational or practical applications specific to this content
4. Specific recommendations based on what you observe

Be concrete and avoid generic responses. Focus on the actual content provided.`
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, focused responses
        max_tokens: 1000
      });

      console.log(`🔍 OpenRouter text analysis response:`, {
        responseLength: response.choices[0]?.message?.content?.length || 0,
        responsePreview: response.choices[0]?.message?.content?.substring(0, 200) + '...',
        usage: response.usage
      });

      const analysis = response.choices[0]?.message?.content || 'No analysis generated';
      
      return {
        summary: analysis,
        keyPoints: this.extractKeyPoints(analysis),
        sentiment: 'neutral',
        topics: this.extractTopics(analysis),
        complexity: 'medium',
        readability: 80,
        confidence: 0.85,
        processingTime: Date.now() - startTime,
        metadata: {
          model: this.model,
          provider: 'OpenRouter',
          usage: response.usage,
          type: 'text_analysis'
        }
      };
    } catch (error) {
      console.error(`OpenRouter ${this.displayName} analysis failed:`, error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getModelName(): string {
    return this.displayName;
  }

  getEstimatedTime(): number {
    return 3000; // 3 seconds estimate for OpenRouter models
  }

  private extractKeyPoints(analysis: string): string[] {
    // Simple extraction - could be enhanced with NLP
    const sentences = analysis.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  private extractTopics(analysis: string): string[] {
    // Simple topic extraction - could be enhanced
    const commonTopics = ['education', 'learning', 'content', 'analysis', 'quality'];
    return commonTopics.filter(topic => 
      analysis.toLowerCase().includes(topic)
    ).slice(0, 3);
  }
}

// Pre-configured model instances for easy use
export const createOpenRouterModels = (apiKey: string) => {
  return {
    // FREE MODELS - Perfect for development/testing
    deepseek: new OpenRouterIntegration(
      apiKey, 
      'deepseek/deepseek-chat-v3.1:free', 
      'DeepSeek V3.1 (Free)'
    ),
    gemini: new OpenRouterIntegration(
      apiKey, 
      'google/gemini-2.5-flash-image-preview:free', 
      'Gemini 2.5 Flash (Free)'
    ),
    
    // PREMIUM MODELS - For production
    gpt4: new OpenRouterIntegration(
      apiKey, 
      'openai/gpt-4o', 
      'GPT-4 Omni'
    ),
    claude: new OpenRouterIntegration(
      apiKey, 
      'anthropic/claude-3.5-sonnet', 
      'Claude 3.5 Sonnet'
    ),
    
    // SPECIALIZED MODELS
    hermes: new OpenRouterIntegration(
      apiKey, 
      'nousresearch/hermes-4-70b', 
      'Hermes 4 70B'
    )
  };
};
