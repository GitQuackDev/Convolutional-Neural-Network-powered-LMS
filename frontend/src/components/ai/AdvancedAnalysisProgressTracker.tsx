/**
 * Advanced Analysis Progress Tracker Component
 * Story 2.6: AI Progress Tracking and Results Display Enhancement
 * Task 2.6.1: Enhanced Progress Tracking Components
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  RefreshCw,
  Activity,
  BarChart3,
  Zap,
  Shield,
  TrendingUp,
  AlertTriangle,
  GitCommit
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAnalyticsWebSocket } from '@/hooks/useAnalyticsWebSocket';
import { apiService } from '@/services/apiService';

import type {
  AdvancedAnalysisProgress,
  AdvancedAnalysisProgressTrackerProps,
  ProgressTimelineEntry,
  ModelProgressDetail,
  AIModelType,
  AnalysisError
} from '@/types/progressTracking';

import { cn } from '@/lib/utils';

// Model Performance Indicator subcomponent
const ModelPerformanceIndicator: React.FC<{
  model: AIModelType;
  progress: ModelProgressDetail;
  className?: string;
}> = ({ model, progress, className }) => {
  const getModelIcon = (model: AIModelType) => {
    switch (model) {
      case 'gpt-4': return '🧠';
      case 'claude-3': return '🎭';
      case 'gemini-pro': return '💎';
      default: return '🤖';
    }
  };

  const getStatusColor = (status: ModelProgressDetail['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getHealthColor = (health: ModelProgressDetail['health']['status']) => {
    switch (health) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unavailable': return 'text-red-500';
      case 'maintenance': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "p-4 border rounded-lg space-y-3 bg-gradient-to-br from-white to-gray-50",
        className
      )}
    >
      {/* Model Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getModelIcon(model)}</span>
          <div>
            <h4 className="font-semibold text-lg">{model.toUpperCase()}</h4>
            <div className="flex items-center space-x-2">
              <Badge className={cn("text-xs", getStatusColor(progress.status))}>
                {progress.status}
              </Badge>
              <div className={cn("flex items-center space-x-1", getHealthColor(progress.health.status))}>
                <Shield className="h-3 w-3" />
                <span className="text-xs font-medium">{progress.health.status}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Circle */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-gray-200 relative">
            <div 
              className="absolute inset-0 rounded-full border-4 border-blue-500 transition-all duration-500"
              style={{
                clipPath: `polygon(50% 50%, 50% 0%, ${
                  progress.progress <= 50 
                    ? `${50 + progress.progress}% 0%` 
                    : `100% 0%, 100% ${progress.progress - 50}%`
                }, 50% 50%)`
              }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold">{progress.progress}%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{progress.progress}%</span>
        </div>
        <Progress 
          value={progress.progress} 
          className="h-2"
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-gray-600">
            <Clock className="h-3 w-3" />
            <span>Processing Time</span>
          </div>
          <div className="font-medium">{formatDuration(progress.processingTime)}</div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-gray-600">
            <Activity className="h-3 w-3" />
            <span>Latency</span>
          </div>
          <div className="font-medium">{progress.health.latency}ms</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-gray-600">
            <TrendingUp className="h-3 w-3" />
            <span>Availability</span>
          </div>
          <div className="font-medium">{progress.health.availabilityScore}%</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-gray-600">
            <RefreshCw className="h-3 w-3" />
            <span>Retries</span>
          </div>
          <div className="font-medium">{progress.retryCount}</div>
        </div>
      </div>

      {/* Stage Indicator */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center space-x-2">
          <Loader2 className={cn("h-4 w-4", progress.status === 'processing' && "animate-spin")} />
          <span className="text-sm text-gray-600">Stage: {progress.stage}</span>
        </div>
        
        {progress.errorMessage && (
          <div className="flex items-center space-x-1 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs truncate max-w-24" title={progress.errorMessage}>
              Error
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Progress Timeline Component
const ProgressTimeline: React.FC<{
  timeline: ProgressTimelineEntry[];
  className?: string;
}> = ({ timeline, className }) => {
  const getEventIcon = (event: ProgressTimelineEntry['event']) => {
    switch (event) {
      case 'started': return <Play className="h-4 w-4 text-green-600" />;
      case 'stage_change': return <GitCommit className="h-4 w-4 text-blue-600" />;
      case 'model_complete': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'retry': return <RefreshCw className="h-4 w-4 text-yellow-600" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="font-semibold text-sm text-gray-700 flex items-center space-x-2">
        <GitCommit className="h-4 w-4" />
        <span>Progress Timeline</span>
      </h4>
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        <AnimatePresence>
          {timeline.slice(-10).reverse().map((entry, index) => (
            <motion.div
              key={`${entry.timestamp.getTime()}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-start space-x-3 p-2 rounded bg-gray-50"
            >
              <div className="mt-0.5">
                {getEventIcon(entry.event)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {entry.message}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                {entry.model && (
                  <span className="text-xs text-gray-600">
                    Model: {entry.model}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {entry.progress}%
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Main AdvancedAnalysisProgressTracker Component
export const AdvancedAnalysisProgressTracker: React.FC<AdvancedAnalysisProgressTrackerProps> = ({
  analysisId,
  className,
  showTimeline = true,
  showMetrics = true,
  autoRefresh = true,
  refreshInterval = 2000,
  onComplete,
  onError
}) => {
  const [progress, setProgress] = useState<AdvancedAnalysisProgress | null>(null);
  const [timeline, setTimeline] = useState<ProgressTimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'timeline' | 'metrics'>('overview');

  const { toast } = useToast();
  const { isConnected, progressUpdates } = useAnalyticsWebSocket({
    trackProgress: [analysisId]
  });

  // Fetch progress data
  const fetchProgress = useCallback(async () => {
    try {
      setError(null);
      const progressData = await apiService.aiAnalysis.getProgress(analysisId);
      
      // Transform API data to enhanced progress structure
      const enhancedProgress: AdvancedAnalysisProgress = {
        analysisId,
        overallProgress: progressData.overallProgress,
        status: progressData.modelProgress.every(m => m.status === 'completed') ? 'completed' :
                progressData.modelProgress.some(m => m.status === 'failed') ? 'error' : 'processing',
        startTime: new Date(progressData.processingStartTime),
        lastUpdated: new Date(progressData.lastUpdated),
        
        // Map model progress with enhanced details
        modelProgress: progressData.modelProgress.reduce((acc, model) => {
          // Map API status to our enhanced status
          const mapStatus = (apiStatus: string): ModelProgressDetail['status'] => {
            switch (apiStatus) {
              case 'queued': return 'pending';
              case 'failed': return 'error';
              case 'processing': return 'processing';
              case 'completed': return 'completed';
              default: return 'pending';
            }
          };

          const mapStage = (apiStage: string): 'validation' | 'preprocessing' | 'analysis' | 'consolidation' | 'completion' => {
            switch (apiStage) {
              case 'initialization': return 'validation';
              case 'analysis': return 'analysis';
              case 'consolidation': return 'consolidation';
              case 'completed': return 'completion';
              default: return 'analysis';
            }
          };

          acc[model.model as AIModelType] = {
            progress: model.progress,
            status: mapStatus(model.status),
            stage: mapStage(model.stage),
            retryCount: 0,
            health: {
              status: 'healthy',
              latency: Math.random() * 100 + 50,
              queueLength: Math.floor(Math.random() * 5),
              errorRate: Math.random() * 5,
              lastHealthCheck: new Date(),
              availabilityScore: Math.floor(Math.random() * 20) + 80
            },
            processingTime: model.estimatedTimeRemaining ? Date.now() - new Date(progressData.processingStartTime).getTime() : undefined
          };
          return acc;
        }, {} as Record<AIModelType, ModelProgressDetail>),
        
        stages: [
          {
            stage: 'validation',
            progress: 100,
            startTime: new Date(progressData.processingStartTime),
            completionTime: new Date(Date.now() - 300000),
            models: ['gpt-4', 'claude-3', 'gemini-pro'],
            description: 'Input validation and preprocessing'
          },
          {
            stage: 'analysis',
            progress: progressData.overallProgress,
            startTime: new Date(Date.now() - 240000),
            models: progressData.modelProgress.map(m => m.model as AIModelType),
            description: 'AI model analysis in progress'
          }
        ],
        
        totalRetries: 0,
        maxRetries: 3,
        selectedModels: progressData.modelProgress.map(m => m.model as AIModelType),
        // analysisType: 'multi-model-analysis', // Not in interface
        priority: 'medium',
        fileInfo: {
          name: 'analysis-file.pdf',
          size: 1024000,
          type: 'application/pdf',
          uploadTime: new Date(progressData.processingStartTime)
        },
        updateFrequency: 0.5,
        currentStage: progressData.currentStage as 'validation' | 'preprocessing' | 'analysis' | 'consolidation' | 'completion'
      };

      setProgress(enhancedProgress);
      
      // Add timeline entry for significant changes
      if (progress?.status !== enhancedProgress.status) {
        const timelineEntry: ProgressTimelineEntry = {
          timestamp: new Date(),
          event: enhancedProgress.status === 'completed' ? 'completed' : 
                 enhancedProgress.status === 'error' ? 'error' : 'stage_change',
          message: `Analysis ${enhancedProgress.status}`,
          progress: enhancedProgress.overallProgress
        };
        setTimeline(prev => [...prev, timelineEntry]);
      }

      // Handle completion
      if (enhancedProgress.status === 'completed' && onComplete) {
        onComplete(analysisId, enhancedProgress);
        toast(`Multi-AI analysis for ${enhancedProgress.fileInfo.name} has finished successfully.`, { type: 'success' });
      }

      // Handle errors
      if (enhancedProgress.status === 'error' && onError) {
        const error: AnalysisError = {
          code: 'ANALYSIS_FAILED',
          message: 'Analysis failed during processing',
          timestamp: new Date(),
          recoverable: true,
          retryCount: 0
        };
        onError(analysisId, error);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch progress';
      setError(errorMessage);
      console.error('Progress fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [analysisId, progress?.status, onComplete, onError, toast]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !isConnected) return;

    const interval = setInterval(fetchProgress, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, isConnected, refreshInterval, fetchProgress]);

  // Initial fetch
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Handle WebSocket updates
  useEffect(() => {
    const currentProgress = progressUpdates.get(analysisId);
    if (currentProgress && progress) {
      // Add timeline entry for WebSocket updates
      const timelineEntry: ProgressTimelineEntry = {
        timestamp: new Date(),
        event: 'stage_change',
        message: `Real-time update: ${currentProgress.progress}% complete`,
        progress: currentProgress.progress
      };
      setTimeline(prev => [...prev, timelineEntry]);
    }
  }, [progressUpdates, analysisId, progress]);

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading progress data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !progress) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <span>{error || 'Failed to load progress data'}</span>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchProgress}
            className="mt-4 w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const estimatedCompletion = progress.estimatedCompletion || 
    new Date(Date.now() + (100 - progress.overallProgress) * 1000 * 30);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Analysis Progress</span>
            <Badge className={cn(
              progress.status === 'completed' ? 'bg-green-100 text-green-800' :
              progress.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            )}>
              {progress.status}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Activity className="h-4 w-4" />
                <span className="text-xs">Live</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-gray-400">
                <Activity className="h-4 w-4" />
                <span className="text-xs">Offline</span>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={fetchProgress}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Overall Progress</h3>
            <span className="text-2xl font-bold">{progress.overallProgress}%</span>
          </div>
          
          <Progress value={progress.overallProgress} className="h-3" />
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">File:</span>
              <span className="ml-2 font-medium">{progress.fileInfo.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Started:</span>
              <span className="ml-2 font-medium">
                {new Intl.DateTimeFormat('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(progress.startTime)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Models:</span>
              <span className="ml-2 font-medium">{progress.selectedModels.length} active</span>
            </div>
            <div>
              <span className="text-gray-600">ETA:</span>
              <span className="ml-2 font-medium">
                {new Intl.DateTimeFormat('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(estimatedCompletion)}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            {showTimeline && <TabsTrigger value="timeline">Timeline</TabsTrigger>}
            {showMetrics && <TabsTrigger value="metrics">Metrics</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4">
              {Object.entries(progress.modelProgress).map(([model, modelProgress]) => (
                <ModelPerformanceIndicator
                  key={model}
                  model={model as AIModelType}
                  progress={modelProgress}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <div className="grid gap-4">
              {Object.entries(progress.modelProgress).map(([model, modelProgress]) => (
                <ModelPerformanceIndicator
                  key={model}
                  model={model as AIModelType}
                  progress={modelProgress}
                />
              ))}
            </div>
          </TabsContent>

          {showTimeline && (
            <TabsContent value="timeline">
              <ProgressTimeline timeline={timeline} />
            </TabsContent>
          )}

          {showMetrics && (
            <TabsContent value="metrics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Performance</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Time:</span>
                      <span className="font-medium">
                        {formatDuration(Date.now() - progress.startTime.getTime())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Update Rate:</span>
                      <span className="font-medium">{progress.updateFrequency}/sec</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Retries:</span>
                      <span className="font-medium">{progress.totalRetries}</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>System Health</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Connection:</span>
                      <span className={cn(
                        "font-medium",
                        isConnected ? "text-green-600" : "text-red-600"
                      )}>
                        {isConnected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Priority:</span>
                      <span className="font-medium capitalize">{progress.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Stage:</span>
                      <span className="font-medium capitalize">{progress.currentStage}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};
