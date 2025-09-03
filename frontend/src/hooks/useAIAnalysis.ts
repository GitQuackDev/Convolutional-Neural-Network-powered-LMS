import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { apiService } from '@/services/apiService';
import { authStorage } from '@/utils/authStorage';
import type { 
  AIAnalysisResult, 
  MultiAnalysisResult, 
  MultiAnalysisProgress,
  ConsolidatedInsights,
  AIModelType,
  AnalysisModelType,
  UploadedFile,
  CNNAnalysisResult 
} from '@/types/upload';

const useAIAnalysis = () => {
  const [multiAnalysisResults, setMultiAnalysisResults] = useState<Map<string, MultiAnalysisResult>>(new Map());
  const [analysisProgress, setAnalysisProgress] = useState<Map<string, MultiAnalysisProgress>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState<Set<string>>(new Set());
  const [progressIdMapping, setProgressIdMapping] = useState<Map<string, string>>(new Map()); // analysisId -> uploadId

  // WebSocket connection for real-time updates
  const { isConnected, subscribe } = useWebSocket('/analytics');

  // Subscribe to WebSocket events for real-time progress
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to progress events
    const unsubscribeProgress = subscribe('progress', (data: unknown) => {
      // Type guard and safe casting
      const progressData = data as { 
        type?: string; 
        analysisId?: string; 
        modelType?: string; 
        progress?: number; 
        status?: string; 
        estimatedCompletion?: string; 
      };
      
      console.log('🔄 Raw progress data received:', progressData);
      
      if (progressData.type === 'analysis_progress' && progressData.analysisId) {
        console.log('🔄 Processing analysis progress:', progressData);
        
        setAnalysisProgress(prev => {
          const newMap = new Map(prev);
          
          // Try to find the uploadId for this analysisId using the mapping
          let targetUploadId = progressData.analysisId!;
          const mappedUploadId = progressIdMapping.get(progressData.analysisId!);
          if (mappedUploadId) {
            targetUploadId = mappedUploadId;
            console.log('📍 Using mapped uploadId:', targetUploadId, 'for analysisId:', progressData.analysisId);
          } else {
            // If no mapping exists, try to find any entry that's currently analyzing
            let foundActive = false;
            for (const [key, progress] of newMap.entries()) {
              if (Object.keys(progress.modelProgress).length > 0 && progress.overallProgress < 100) {
                targetUploadId = key;
                console.log('📍 Using active analysis uploadId:', targetUploadId, 'for analysisId:', progressData.analysisId);
                foundActive = true;
                break;
              }
            }
            
            // If still no match, use the analysisId directly as a fallback
            if (!foundActive) {
              targetUploadId = progressData.analysisId!;
              console.log('📍 Using analysisId directly as uploadId:', targetUploadId);
            }
          }
          
          let currentProgress = newMap.get(targetUploadId);
          
          if (!currentProgress) {
            console.log('🆕 Creating new progress for:', targetUploadId);
            currentProgress = {
              uploadId: targetUploadId,
              overallProgress: 0,
              modelProgress: {} as Record<AnalysisModelType, {
                progress: number;
                status: 'pending' | 'processing' | 'completed' | 'error';
                estimatedCompletion?: Date;
              }>
            };
          }
          
          if (progressData.modelType && progressData.progress !== undefined) {
            console.log('📊 Updating progress for model:', progressData.modelType, 'to', progressData.progress + '%');
            currentProgress.modelProgress[progressData.modelType as AnalysisModelType] = {
              progress: progressData.progress,
              status: progressData.status as 'pending' | 'processing' | 'completed' | 'error',
              estimatedCompletion: progressData.estimatedCompletion ? new Date(progressData.estimatedCompletion) : undefined
            };
            
            // Update overall progress (average of all models)
            const modelProgresses = Object.values(currentProgress.modelProgress).map(p => p.progress);
            currentProgress.overallProgress = modelProgresses.reduce((sum, p) => sum + p, 0) / modelProgresses.length;
            console.log('📈 Overall progress updated to:', currentProgress.overallProgress + '%');
          }
          
          newMap.set(targetUploadId, currentProgress);
          return newMap;
        });
      }
    });

    // Subscribe to completion events
    const unsubscribeError = subscribe('error', (message: string) => {
      console.error('WebSocket error:', message);
    });

    return () => {
      unsubscribeProgress?.();
      unsubscribeError?.();
    };
  }, [isConnected, subscribe, progressIdMapping]);

  const generateConsolidatedInsights = useCallback((aiResults: Record<AIModelType, AIAnalysisResult>): ConsolidatedInsights => {
    // Safety check for null/undefined aiResults
    if (!aiResults || typeof aiResults !== 'object' || Object.keys(aiResults).length === 0) {
      return {
        summary: 'No AI analysis results available for consolidation',
        commonFindings: [],
        conflictingAnalyses: [],
        confidenceScore: 0,
        recommendedActions: ['Upload a file and select AI models to get comprehensive insights']
      };
    }

    // Filter out invalid results
    const validResults = Object.entries(aiResults).filter(([, result]) => 
      result && result.results && result.status === 'completed'
    );

    if (validResults.length === 0) {
      return {
        summary: 'AI analysis completed but no valid results were generated',
        commonFindings: ['Analysis may have encountered errors'],
        conflictingAnalyses: [],
        confidenceScore: 0,
        recommendedActions: [
          'Try uploading a different file format',
          'Check file content and size',
          'Retry with different AI models'
        ]
      };
    }

    // Gather all insights and recommendations from valid results
    const allInsights: string[] = [];
    const allRecommendations: string[] = [];
    const allDescriptions: string[] = [];
    const confidenceScores: number[] = [];

    validResults.forEach(([, result]) => {
      if (result.results) {
        if (result.results.description) {
          allDescriptions.push(result.results.description);
        }
        if (result.results.insights) {
          allInsights.push(...result.results.insights);
        }
        if (result.results.recommendations) {
          allRecommendations.push(...result.results.recommendations);
        }
        confidenceScores.push(result.confidence);
      }
    });
    
    // Get unique insights and recommendations
    const uniqueInsights = [...new Set(allInsights)];
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    // Calculate average confidence
    const avgConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length 
      : 0;
    
    // Create a comprehensive summary
    const modelsUsed = validResults.map(([model]) => model).join(', ');
    const summaryText = allDescriptions.length > 0 
      ? `Multi-AI analysis completed using ${modelsUsed}. ${allDescriptions[0]}` 
      : `Multi-AI analysis completed using ${validResults.length} model(s): ${modelsUsed}. Content successfully processed and analyzed across multiple AI systems.`;
    
    return {
      summary: summaryText,
      commonFindings: uniqueInsights.slice(0, 8), // Top 8 unique insights
      conflictingAnalyses: [], // Would need more complex logic to detect actual conflicts
      confidenceScore: avgConfidence,
      recommendedActions: uniqueRecommendations.slice(0, 6) // Top 6 unique recommendations
    };
  }, []);

  const analyzeWithMultipleAI = useCallback(async (
    file: UploadedFile,
    aiModels: AIModelType[],
    cnnResult?: CNNAnalysisResult
  ): Promise<MultiAnalysisResult | null> => {
    const uploadId = file.id;
    setIsAnalyzing(prev => new Set(prev).add(uploadId));

    // Initialize progress tracking
    const initialProgress: MultiAnalysisProgress = {
      uploadId,
      overallProgress: 0,
      modelProgress: {} as Record<AnalysisModelType, {
        progress: number;
        status: 'pending' | 'processing' | 'completed' | 'error';
        estimatedCompletion?: Date;
      }>
    };

    aiModels.forEach(model => {
      initialProgress.modelProgress[model as AnalysisModelType] = {
        progress: 0,
        status: 'pending'
      };
    });

    setAnalysisProgress(prev => new Map(prev).set(uploadId, initialProgress));

    // Check authentication before making API call
    const token = authStorage.getToken();
    if (!token) {
      const result: MultiAnalysisResult = {
        uploadId,
        cnnResults: cnnResult,
        aiResults: {} as Record<AIModelType, AIAnalysisResult>,
        consolidatedInsights: {
          summary: 'Authentication required to access AI analysis features. Please log in to continue.',
          commonFindings: [],
          conflictingAnalyses: [],
          confidenceScore: 0,
          recommendedActions: [
            'Log in to your account to access AI analysis',
            'If you don\'t have an account, please register first',
            'Your session may have expired - try refreshing and logging in again'
          ]
        },
        overallStatus: 'error',
        timestamp: new Date().toISOString()
      };

      setMultiAnalysisResults(prev => new Map(prev).set(uploadId, result));
      setIsAnalyzing(prev => { const newSet = new Set(prev); newSet.delete(uploadId); return newSet; });
      return result;
    }

    // Make API call to backend
    try {
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('selectedModels', JSON.stringify(aiModels));

      console.log('🔍 DEBUG: Starting API call');
      console.log('📤 Sending models:', aiModels);
      console.log('📄 File details:', { name: file.file.name, size: file.file.size, type: file.file.type });

      const apiResult = await apiService.post<{ aiResults: Record<string, AIAnalysisResult>; analysisId?: string }>('/api/ai-analysis/analyze-multi', formData);
      
      console.log('📥 API Response received:', apiResult);
      console.log('🔬 AI Results structure:', apiResult.aiResults);
      console.log('🆔 Analysis ID from backend:', apiResult.analysisId);

      // Set a fallback timeout for progress tracking (if WebSocket fails)
      setTimeout(() => {
        console.warn('⚠️ Progress timeout - updating to show processing...');
        setAnalysisProgress(prev => {
          const newMap = new Map(prev);
          const currentProgress = newMap.get(uploadId);
          if (currentProgress && currentProgress.overallProgress === 0) {
            // If progress is still at 0, show that we're processing
            const updatedProgress = { ...currentProgress };
            aiModels.forEach(model => {
              if (updatedProgress.modelProgress[model as AnalysisModelType]?.status === 'pending') {
                updatedProgress.modelProgress[model as AnalysisModelType] = {
                  progress: 50,
                  status: 'processing'
                };
              }
            });
            // Recalculate overall progress
            const modelProgresses = Object.values(updatedProgress.modelProgress).map(p => p.progress);
            updatedProgress.overallProgress = modelProgresses.reduce((sum, p) => sum + p, 0) / modelProgresses.length;
            newMap.set(uploadId, updatedProgress);
          }
          return newMap;
        });
      }, 3000); // 3 second timeout

      // If we got an analysisId, create mapping from analysisId to uploadId for progress tracking
      if (apiResult.analysisId) {
        setProgressIdMapping(prev => new Map(prev).set(apiResult.analysisId!, uploadId));
        
        // Also update any existing progress to use the correct uploadId
        setAnalysisProgress(prev => {
          const newMap = new Map(prev);
          const existingProgress = newMap.get(apiResult.analysisId!);
          if (existingProgress) {
            newMap.delete(apiResult.analysisId!);
            newMap.set(uploadId, { ...existingProgress, uploadId });
          }
          return newMap;
        });
      }
      console.log('🔢 Number of AI results:', Object.keys(apiResult.aiResults || {}).length);
      
      const result: MultiAnalysisResult = {
        uploadId,
        cnnResults: cnnResult,
        aiResults: apiResult.aiResults || {},
        consolidatedInsights: generateConsolidatedInsights(apiResult.aiResults || {}),
        overallStatus: 'completed',
        timestamp: new Date().toISOString()
      };

      console.log('📊 Final MultiAnalysisResult:', result);
      console.log('🎯 Setting results in state for uploadId:', uploadId);

      // Update progress to 100% completion
      setAnalysisProgress(prev => {
        const newMap = new Map(prev);
        const currentProgress = newMap.get(uploadId);
        if (currentProgress) {
          const completedProgress = { ...currentProgress };
          Object.keys(completedProgress.modelProgress).forEach(model => {
            completedProgress.modelProgress[model as AnalysisModelType] = {
              progress: 100,
              status: 'completed'
            };
          });
          completedProgress.overallProgress = 100;
          newMap.set(uploadId, completedProgress);
        }
        return newMap;
      });

      setMultiAnalysisResults(prev => new Map(prev).set(uploadId, result));
      setIsAnalyzing(prev => { const newSet = new Set(prev); newSet.delete(uploadId); return newSet; });
      return result;

    } catch (error) {
      console.error('AI analysis API call failed:', error);
      
      let errorMessage = 'AI analysis temporarily unavailable. Please try again later.';
      let recommendedActions = ['API service temporarily unavailable'];
      
      // Handle authentication errors specifically
      if (error instanceof Error && error.message.includes('401 Unauthorized')) {
        errorMessage = 'Authentication required to access AI analysis features. Please log in to continue.';
        recommendedActions = [
          'Log in to your account to access AI analysis',
          'If you don\'t have an account, please register first',
          'Check that your session hasn\'t expired'
        ];
      }
      
      const result: MultiAnalysisResult = {
        uploadId,
        cnnResults: cnnResult,
        aiResults: {} as Record<AIModelType, AIAnalysisResult>,
        consolidatedInsights: {
          summary: errorMessage,
          commonFindings: [],
          conflictingAnalyses: [],
          confidenceScore: 0,
          recommendedActions
        },
        overallStatus: 'error',
        timestamp: new Date().toISOString()
      };

      setMultiAnalysisResults(prev => new Map(prev).set(uploadId, result));
      setIsAnalyzing(prev => { const newSet = new Set(prev); newSet.delete(uploadId); return newSet; });
      return result;
    }
  }, [generateConsolidatedInsights]);

  const getAnalysisResult = useCallback((uploadId: string): MultiAnalysisResult | undefined => {
    return multiAnalysisResults.get(uploadId);
  }, [multiAnalysisResults]);

  const getAnalysisProgress = useCallback((uploadId: string): MultiAnalysisProgress | undefined => {
    return analysisProgress.get(uploadId);
  }, [analysisProgress]);

  const clearAnalysisResults = useCallback(() => {
    setMultiAnalysisResults(new Map());
    setAnalysisProgress(new Map());
    setProgressIdMapping(new Map());
    setIsAnalyzing(new Set());
  }, []);

  const clearAnalysisResult = useCallback((uploadId: string) => {
    setMultiAnalysisResults(prev => {
      const newMap = new Map(prev);
      newMap.delete(uploadId);
      return newMap;
    });
    setAnalysisProgress(prev => {
      const newMap = new Map(prev);
      newMap.delete(uploadId);
      return newMap;
    });
    setIsAnalyzing(prev => {
      const newSet = new Set(prev);
      newSet.delete(uploadId);
      return newSet;
    });
  }, []);

  const isFileAnalyzing = useCallback((uploadId: string): boolean => {
    return isAnalyzing.has(uploadId);
  }, [isAnalyzing]);

  return {
    analyzeWithMultipleAI,
    startMultiAnalysis: analyzeWithMultipleAI, // Alias for compatibility
    getAnalysisResult,
    getMultiAnalysisResult: getAnalysisResult, // Alias for compatibility
    getAnalysisProgress,
    clearAnalysisResults,
    clearAnalysisResult,
    isFileAnalyzing,
    multiAnalysisResults,
    analysisProgress,
    isAnalyzing,
    isWebSocketConnected: isConnected
  };
};

export { useAIAnalysis };
export default useAIAnalysis;
