/**
 * Enhanced Progress Tracking Component
 * Displays real-time progress for multi-AI analysis with individual model progress
 */

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Clock, Loader } from 'lucide-react';
import type { MultiAnalysisProgress, AnalysisModelType } from '@/types/upload';

interface EnhancedProgressDisplayProps {
  progress: MultiAnalysisProgress;
  isConnected: boolean;
}

const modelIcons: Record<AnalysisModelType, React.ReactNode> = {
  cnn: <span className="text-blue-600 font-semibold">🧠</span>,
  gpt4: <span className="text-green-600 font-semibold">🤖</span>,
  claude: <span className="text-purple-600 font-semibold">🔮</span>,
  gemini: <span className="text-orange-600 font-semibold">💎</span>,
};

const modelNames: Record<AnalysisModelType, string> = {
  cnn: 'CNN Analysis',
  gpt4: 'GPT-4',
  claude: 'Claude',
  gemini: 'Gemini',
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case 'processing':
      return <Loader className="h-4 w-4 text-blue-600 animate-spin" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-400" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'error':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'processing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export const EnhancedProgressDisplay: React.FC<EnhancedProgressDisplayProps> = ({
  progress,
  isConnected,
}) => {
  const modelEntries = Object.entries(progress.modelProgress) as [AnalysisModelType, typeof progress.modelProgress[AnalysisModelType]][];

  const formatEstimatedTime = (estimatedCompletion?: Date) => {
    if (!estimatedCompletion) return null;
    
    const now = new Date();
    const remaining = estimatedCompletion.getTime() - now.getTime();
    
    if (remaining <= 0) return 'Completing...';
    
    const minutes = Math.ceil(remaining / (1000 * 60));
    if (minutes === 1) return '1 minute remaining';
    if (minutes < 60) return `${minutes} minutes remaining`;
    
    const hours = Math.ceil(minutes / 60);
    return hours === 1 ? '1 hour remaining' : `${hours} hours remaining`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Analysis Progress</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{progress.overallProgress}%</span>
          </div>
          <Progress 
            value={progress.overallProgress} 
            className="w-full h-2"
            // Add smooth animation
            style={{
              transition: 'all 0.5s ease-in-out'
            }}
          />
        </div>

        {/* Individual Model Progress */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Model Progress</h4>
          
          {modelEntries.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Clock className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">Preparing analysis...</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {modelEntries.map(([model, modelProgress]) => (
                <div key={model} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      {modelIcons[model]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          {modelNames[model]}
                        </span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(modelProgress.status)}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(modelProgress.status)}`}
                          >
                            {modelProgress.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Progress 
                          value={modelProgress.progress} 
                          className="w-full h-1.5"
                          style={{
                            transition: 'all 0.3s ease-in-out'
                          }}
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{modelProgress.progress}%</span>
                          {modelProgress.estimatedCompletion && (
                            <span className="italic">
                              {formatEstimatedTime(modelProgress.estimatedCompletion)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connection Status Warning */}
        {!isConnected && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">
              Real-time updates unavailable. Progress may not reflect current state.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
