import { Request, Response } from 'express';
import { aiModelFactory, type AIModel } from '../services/aiModels/AIModelFactory';
import { AnalyticsService } from '../services/AnalyticsService';
import { webSocketService } from '../services/WebSocketService';
import type { 
  AIModelType, 
  AnalysisProgress,
  ConsolidatedInsights
} from '../types';
import fs from 'fs';

interface AuthenticatedRequest extends Request {
  user?: { 
    userId: string;
    email: string;
    role: string;
  };
}

export class AIAnalysisController {
  private analyticsService = new AnalyticsService();
  private activeAnalyses = new Map<string, AnalysisProgress>();

  /**
   * Start multi-AI analysis for uploaded file
   */
  async analyzeWithMultipleAI(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('🚀 AI Analysis Controller: analyzeWithMultipleAI called');
    console.log('📁 File:', req.file?.originalname, req.file?.mimetype);
    console.log('🤖 Selected models:', req.body?.selectedModels);
    
    try {
      const file = req.file;
      const { selectedModels } = req.body;
      const userId = req.user?.userId;
      
      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      if (!userId) {
        console.log('❌ No userId found in req.user:', req.user);
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!selectedModels || selectedModels.length === 0) {
        res.status(400).json({ error: 'No AI models specified' });
        return;
      }

      // Generate unique analysis ID and fileId
      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileId = `upload_${Date.now()}_${file.originalname}`;
      
      // Initialize model progress for selected models
      const initialModelProgress: Record<AIModelType, {
        progress: number;
        status: "pending" | "processing" | "completed" | "error" | "cancelled";
        errorMessage?: string;
        lastUpdated?: Date;
        estimatedCompletion?: Date;
      }> = {} as any;

      (selectedModels as AIModelType[]).forEach((model: AIModelType) => {
        initialModelProgress[model] = {
          progress: 0,
          status: 'pending',
          lastUpdated: new Date(),
          estimatedCompletion: new Date(Date.now() + aiModelFactory.getModel(model).getEstimatedTime())
        };
      });

      // Initialize progress tracking
      const progress: AnalysisProgress = {
        analysisId,
        fileId,
        userId,
        overallProgress: 0,
        modelProgress: initialModelProgress,
        status: 'started',
        startTime: new Date()
      };

      this.activeAnalyses.set(analysisId, progress);

      // Track analytics
      await this.analyticsService.recordUserAnalytics({
        sessionId: analysisId,
        action: 'multi_ai_analysis_started',
        resource: file.originalname,
        metadata: { selectedModels, analysisId, fileId },
        userId
      });

      // Start async analysis
      this.processMultiAnalysis(analysisId, file, selectedModels);

      res.json({
        analysisId,
        fileId,
        status: 'started',
        estimatedTime: aiModelFactory.getEstimatedTotalTime(selectedModels)
      });

    } catch (error) {
      console.error('Error starting multi-AI analysis:', error);
      res.status(500).json({ error: 'Failed to start analysis' });
    }
  }

  /**
   * Process multi-AI analysis in background
   */
  private async processMultiAnalysis(
    analysisId: string, 
    file: Express.Multer.File, 
    selectedModels: AIModelType[]
  ): Promise<void> {
    const analysis = this.activeAnalyses.get(analysisId);
    if (!analysis) return;

    try {
      analysis.status = 'processing';
      
      // Read file content (handle binary files gracefully)
      let content: string;
      try {
        content = fs.readFileSync(file.path, 'utf-8');
      } catch {
        // For binary files, just use filename and metadata
        content = `File: ${file.originalname}, Type: ${file.mimetype}, Size: ${file.size} bytes`;
      }
      
      // Process each model in parallel
      const analysisResults = await Promise.allSettled(
        selectedModels.map(async (model: AIModelType) => {
          try {
            // Update model status
            this.updateModelProgress(analysisId, model, 10, 'processing');
            
            console.log(`🤖 Getting AI model: ${model}`);
            // Get AI model and analyze
            const aiModel = aiModelFactory.getModel(model);
            console.log(`📊 Starting analysis with ${model}:`, {
              contentLength: content.length,
              fileName: file.originalname,
              fileType: file.mimetype
            });
            const result = await aiModel.analyze(content, file);
            console.log(`✅ Analysis completed for ${model}:`, result);
            
            // Update progress
            this.updateModelProgress(analysisId, model, 100, 'completed');
            
            return { model, result };
          } catch (error) {
            this.updateModelProgress(analysisId, model, 0, 'error', error instanceof Error ? error.message : 'Analysis failed');
            throw error;
          }
        })
      );

      // Determine final status
      const completedCount = analysisResults.filter(r => r.status === 'fulfilled').length;
      const errorCount = analysisResults.filter(r => r.status === 'rejected').length;
      
      const finalProgress = this.activeAnalyses.get(analysisId);
      if (finalProgress) {
        if (completedCount > 0 && errorCount === 0) {
          finalProgress.status = 'completed';
        } else if (completedCount > 0 && errorCount > 0) {
          finalProgress.status = 'completed_with_errors';
        } else {
          finalProgress.status = 'cancelled';
        }
        finalProgress.endTime = new Date();
        
        // Generate consolidated insights if we have successful results
        if (completedCount > 0) {
          const successfulResults = analysisResults
            .filter((r): r is PromiseFulfilledResult<{ model: AIModelType; result: any }> => r.status === 'fulfilled')
            .reduce((acc, r) => {
              acc[r.value.model] = r.value.result;
              return acc;
            }, {} as Record<AIModelType, any>);
          
          finalProgress.consolidatedInsights = this.generateConsolidatedInsights(successfulResults);
          
          // Emit completion event with results
          webSocketService.emitAnalysisComplete(
            finalProgress.userId, 
            analysisId, 
            {
              status: finalProgress.status,
              modelResults: successfulResults,
              consolidatedInsights: finalProgress.consolidatedInsights
            }
          );
        } else {
          // Emit error event if no successful results
          webSocketService.emitAnalysisError(
            finalProgress.userId, 
            analysisId, 
            'All AI models failed to process the content'
          );
        }
      }

      // Track completion analytics
      await this.analyticsService.recordUserAnalytics({
        sessionId: analysisId,
        action: 'multi_ai_analysis_completed',
        resource: file.originalname,
        metadata: { 
          successfulModels: completedCount,
          totalModels: selectedModels.length,
          errors: errorCount 
        },
        userId: analysis.userId
      });

      // Clean up file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

    } catch (error) {
      console.error('Error processing multi-AI analysis:', error);
      
      const analysis = this.activeAnalyses.get(analysisId);
      if (analysis) {
        analysis.status = 'cancelled';
        analysis.endTime = new Date();
        
        // Emit error event
        webSocketService.emitAnalysisError(
          analysis.userId,
          analysisId,
          error instanceof Error ? error.message : 'Unknown error occurred during analysis'
        );
      }
    }
  }

  /**
   * Get analysis progress
   */
  async getAnalysisProgress(req: Request, res: Response): Promise<void> {
    try {
      const { analysisId } = req.params;
      
      if (!analysisId) {
        res.status(400).json({ error: 'Analysis ID is required' });
        return;
      }

      const progress = this.activeAnalyses.get(analysisId);
      
      if (!progress) {
        res.status(404).json({ error: 'Analysis not found' });
        return;
      }

      res.json(progress);
    } catch (error) {
      console.error('Error getting analysis progress:', error);
      res.status(500).json({ error: 'Failed to get progress' });
    }
  }

  /**
   * Get consolidated insights
   */
  async getConsolidatedInsights(req: Request, res: Response): Promise<void> {
    try {
      const { analysisId } = req.params;
      
      if (!analysisId) {
        res.status(400).json({ error: 'Analysis ID is required' });
        return;
      }

      const progress = this.activeAnalyses.get(analysisId);
      
      if (!progress) {
        res.status(404).json({ error: 'Analysis not found' });
        return;
      }

      if (!progress.consolidatedInsights) {
        res.status(404).json({ error: 'Consolidated insights not available' });
        return;
      }

      res.json(progress.consolidatedInsights);
    } catch (error) {
      console.error('Error getting consolidated insights:', error);
      res.status(500).json({ error: 'Failed to get insights' });
    }
  }

  /**
   * Cancel analysis
   */
  async cancelAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { analysisId } = req.params;
      
      if (!analysisId) {
        res.status(400).json({ error: 'Analysis ID is required' });
        return;
      }

      const progress = this.activeAnalyses.get(analysisId);
      
      if (!progress) {
        res.status(404).json({ error: 'Analysis not found' });
        return;
      }

      // Cancel all pending/processing models
      (Object.keys(progress.modelProgress) as AIModelType[]).forEach(model => {
        const modelProgress = progress.modelProgress[model];
        if (modelProgress && (modelProgress.status === 'pending' || modelProgress.status === 'processing')) {
          modelProgress.status = 'cancelled';
          modelProgress.lastUpdated = new Date();
        }
      });

      progress.status = 'cancelled';
      progress.endTime = new Date();

      res.json({ message: 'Analysis cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling analysis:', error);
      res.status(500).json({ error: 'Failed to cancel analysis' });
    }
  }

  /**
   * Update model progress
   */
  private updateModelProgress(
    analysisId: string, 
    model: AIModelType, 
    progress: number, 
    status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled',
    errorMessage?: string
  ): void {
    const analysis = this.activeAnalyses.get(analysisId);
    if (!analysis) return;

    const modelProgress = analysis.modelProgress[model];
    if (modelProgress) {
      modelProgress.progress = progress;
      modelProgress.status = status;
      modelProgress.lastUpdated = new Date();
      if (errorMessage && status === 'error') {
        modelProgress.errorMessage = errorMessage;
      }
    }

    // Calculate overall progress
    const models = Object.keys(analysis.modelProgress) as AIModelType[];
    const totalProgress = models.reduce((sum, m) => {
      const mp = analysis.modelProgress[m];
      return sum + (mp?.progress || 0);
    }, 0);
    analysis.overallProgress = Math.round(totalProgress / models.length);

    // Emit WebSocket events for real-time updates
    webSocketService.emitModelProgress(analysis.userId, analysisId, model, progress, status);
    webSocketService.emitAnalysisProgress(analysis.userId, analysis);
  }

  /**
   * Generate consolidated insights from multiple AI results
   */
  private generateConsolidatedInsights(results: Record<AIModelType, any>): ConsolidatedInsights {
    const models = Object.keys(results) as AIModelType[];
    const analyses = Object.values(results);

    // Generate a simple summary
    const summary = `Analysis completed using ${models.length} AI models.`;
    
    // Find common findings - simplified approach
    const allFindings = analyses.flatMap(r => r.analysis?.keyPoints || []);
    const commonFindings = [...new Set(allFindings)].slice(0, 5);
    
    // Calculate average confidence
    const avgConfidence = analyses.reduce((sum, r) => sum + (r.confidence || 0), 0) / analyses.length;

    return {
      summary,
      commonFindings,
      conflictingAnalyses: [], // Simplified - no conflicts for now
      confidenceScore: avgConfidence,
      recommendedActions: ['Review the analysis results', 'Consider manual verification for low confidence items']
    };
  }
}
