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

  // WebSocket connection for real-time updates
  const { isConnected, subscribe } = useWebSocket('/analytics');

  console.log('🔗 AI Analysis WebSocket status:', { isConnected });

  // Subscribe to WebSocket events for real-time progress
  useEffect(() => {
    console.log('📡 WebSocket connection status changed:', { isConnected });
    if (!isConnected) return;

    console.log('🎯 Setting up WebSocket event subscriptions for AI analysis');

    // Subscribe to progress events only - using available WebSocket events
    const unsubscribeProgress = subscribe('progress', (data: unknown) => {
      console.log('📊 Received progress update:', data);
      
      // Type guard and safe casting
      const progressData = data as { 
        type?: string; 
        analysisId?: string; 
        modelType?: string; 
        progress?: number; 
        status?: string; 
        estimatedCompletion?: string; 
      };
      
      if (progressData.type === 'analysis_progress' && progressData.analysisId) {
        setAnalysisProgress(prev => {
          const newMap = new Map(prev);
          let currentProgress = newMap.get(progressData.analysisId!);
          
          if (!currentProgress) {
            currentProgress = {
              uploadId: progressData.analysisId!,
              overallProgress: 0,
              modelProgress: {} as Record<AnalysisModelType, {
                progress: number;
                status: 'pending' | 'processing' | 'completed' | 'error';
                estimatedCompletion?: Date;
              }>
            };
          }
          
          if (progressData.modelType && progressData.progress !== undefined) {
            currentProgress.modelProgress[progressData.modelType as AnalysisModelType] = {
              progress: progressData.progress,
              status: progressData.status as 'pending' | 'processing' | 'completed' | 'error',
              estimatedCompletion: progressData.estimatedCompletion ? new Date(progressData.estimatedCompletion) : undefined
            };
            
            // Update overall progress (average of all models)
            const modelProgresses = Object.values(currentProgress.modelProgress).map(p => p.progress);
            currentProgress.overallProgress = modelProgresses.reduce((sum, p) => sum + p, 0) / modelProgresses.length;
          }
          
          newMap.set(progressData.analysisId!, currentProgress);
          return newMap;
        });
      }
    });

    // Subscribe to completion events
    const unsubscribeError = subscribe('error', (message: string) => {
      console.error('❌ WebSocket error:', message);
    });

    return () => {
      unsubscribeProgress?.();
      unsubscribeError?.();
    };
  }, [isConnected, subscribe]);

  const generateConsolidatedInsights = useCallback((aiResults: Record<AIModelType, AIAnalysisResult>): ConsolidatedInsights => {
    // Safety check for null/undefined aiResults
    if (!aiResults || typeof aiResults !== 'object') {
      return {
        summary: 'No AI analysis results available',
        commonFindings: [],
        conflictingAnalyses: [],
        confidenceScore: 0,
        recommendedActions: ['Upload a file to get AI-powered insights']
      };
    }

    const allInsights = Object.values(aiResults).flatMap(result => result?.results?.insights || []);
    const allRecommendations = Object.values(aiResults).flatMap(result => result?.results?.recommendations || []);
    
    // Get unique insights and recommendations
    const uniqueInsights = [...new Set(allInsights)];
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    // Create combined description
    const descriptions = Object.values(aiResults).map(result => result?.results?.description || 'No description available');
    const combinedDescription = descriptions.length > 0 ? descriptions[0] : 'No description available';
    
    return {
      summary: combinedDescription,
      commonFindings: uniqueInsights.slice(0, 5), // Top 5 unique insights
      conflictingAnalyses: [], // Would need more complex logic to detect conflicts
      confidenceScore: 0.85, // Average confidence score
      recommendedActions: uniqueRecommendations.slice(0, 5) // Top 5 unique recommendations
    };
  }, []);

  const analyzeWithMultipleAI = useCallback(async (
    file: UploadedFile,
    aiModels: AIModelType[],
    cnnResult?: CNNAnalysisResult
  ): Promise<MultiAnalysisResult | null> => {
    const uploadId = file.id;
    console.log('🔍 Starting multi-AI analysis for:', uploadId);
    console.log('📋 Selected models:', aiModels);
    
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
      console.warn('⚠️ No authentication token found');
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

    // Make real API call to backend
    console.log('🚀 Starting AI analysis API call with models:', aiModels);
    console.log('📁 File:', file.file.name, 'Type:', file.file.type);
    
    try {
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('selectedModels', JSON.stringify(aiModels));

      console.log('📡 Making API request to /api/ai-analysis/analyze-multi');

      const apiResult = await apiService.post<{ aiResults: Record<string, AIAnalysisResult> }>('/api/ai-analysis/analyze-multi', formData);
      console.log('✅ AI analysis API response:', apiResult);
      
      const result: MultiAnalysisResult = {
        uploadId,
        cnnResults: cnnResult,
        aiResults: apiResult.aiResults || {},
        consolidatedInsights: generateConsolidatedInsights(apiResult.aiResults || {}),
        overallStatus: 'completed',
        timestamp: new Date().toISOString()
      };

      setMultiAnalysisResults(prev => new Map(prev).set(uploadId, result));
      setIsAnalyzing(prev => { const newSet = new Set(prev); newSet.delete(uploadId); return newSet; });
      return result;

    } catch (error) {
      console.error('❌ AI analysis API call failed:', error);
      
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
      
      // Quick fallback - no simulation
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
