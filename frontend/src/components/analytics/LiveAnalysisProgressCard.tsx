/**
 * Live Analysis Progress Card Component
 * Real-time display of AI analysis job progress with WebSocket updates
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAnalyticsWebSocket } from '@/hooks/useAnalyticsWebSocket';
import { useToast } from '@/hooks/use-toast';

interface AnalysisJob {
  jobId: string;
  contentId: string;
  contentName: string;
  analysisType: string;
  aiModels: ('gpt-4' | 'claude-3' | 'gemini-pro')[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedTimeRemaining?: number;
  queuePosition?: number;
  results?: Record<string, unknown>;
  startedAt: Date;
  completedAt?: Date;
}

interface LiveAnalysisProgressCardProps {
  className?: string;
  maxDisplayJobs?: number;
  showCompletedJobs?: boolean;
  onJobComplete?: (jobId: string, results: Record<string, unknown>) => void;
}

export const LiveAnalysisProgressCard: React.FC<LiveAnalysisProgressCardProps> = ({
  className = '',
  maxDisplayJobs = 5,
  showCompletedJobs = true,
  onJobComplete
}) => {
  const [activeJobs, setActiveJobs] = useState<Map<string, AnalysisJob>>(new Map());
  const [completedJobs, setCompletedJobs] = useState<AnalysisJob[]>([]);
  const { toast } = useToast();

  const {
    isConnected,
    progressUpdates,
    trackAnalysisProgress,
    stopTrackingProgress
  } = useAnalyticsWebSocket({
    autoConnect: true,
    trackProgress: Array.from(activeJobs.keys())
  });

  // Handle real-time progress updates
  useEffect(() => {
    if (!isConnected || progressUpdates.size === 0) return;

    progressUpdates.forEach((update, jobId) => {
      setActiveJobs(prev => {
        const newJobs = new Map(prev);
        const existingJob = newJobs.get(jobId);

        if (existingJob) {
          // Update existing job with progress
          const updatedJob: AnalysisJob = {
            ...existingJob,
            progress: update.progress,
            status: update.type === 'analysis_complete' ? 'completed' : 
                   update.type === 'analysis_started' ? 'processing' : existingJob.status,
            estimatedTimeRemaining: update.data.estimatedTimeRemaining,
            results: update.data.results,
            completedAt: update.type === 'analysis_complete' ? new Date(update.timestamp) : undefined
          };

          // Handle completion
          if (update.type === 'analysis_complete') {
            // Move to completed jobs
            setCompletedJobs(prevCompleted => [
              { ...updatedJob, status: 'completed' },
              ...prevCompleted.slice(0, maxDisplayJobs - 1)
            ]);

            // Remove from active jobs
            newJobs.delete(jobId);

            // Stop tracking
            stopTrackingProgress(jobId);

            // Show completion notification
            toast(`✅ Analysis completed for ${existingJob.contentName}`, { type: 'success' });

            // Trigger callback
            if (onJobComplete && update.data.results) {
              onJobComplete(jobId, update.data.results);
            }
          } else {
            newJobs.set(jobId, updatedJob);
          }
        } else {
          // Create new job from progress update
          const newJob: AnalysisJob = {
            jobId,
            contentId: update.data.contentId || jobId,
            contentName: `Analysis ${jobId.slice(-8)}`,
            analysisType: update.data.analysisType || 'Multi-AI Analysis',
            aiModels: ['gpt-4', 'claude-3', 'gemini-pro'], // Default models
            status: update.type === 'analysis_started' ? 'processing' : 'queued',
            progress: update.progress,
            estimatedTimeRemaining: update.data.estimatedTimeRemaining,
            startedAt: new Date(update.timestamp)
          };

          newJobs.set(jobId, newJob);
          
          // Start tracking this job
          trackAnalysisProgress(jobId, newJob.contentId);
        }

        return newJobs;
      });
    });
  }, [progressUpdates, isConnected, stopTrackingProgress, trackAnalysisProgress, toast, onJobComplete, maxDisplayJobs]);

  // Mock function to add a new analysis job (for testing)
  const addMockJob = () => {
    const mockJobId = `job_${Date.now()}`;
    const mockJob: AnalysisJob = {
      jobId: mockJobId,
      contentId: `content_${Date.now()}`,
      contentName: `Test Document ${Math.floor(Math.random() * 1000)}`,
      analysisType: 'Sentiment & Topic Analysis',
      aiModels: ['gpt-4', 'claude-3', 'gemini-pro'],
      status: 'queued',
      progress: 0,
      queuePosition: Math.floor(Math.random() * 5) + 1,
      startedAt: new Date()
    };

    setActiveJobs(prev => new Map(prev.set(mockJobId, mockJob)));
    trackAnalysisProgress(mockJobId, mockJob.contentId);
  };

  const getStatusIcon = (status: AnalysisJob['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: AnalysisJob['status']) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeRemaining = (seconds?: number): string => {
    if (!seconds) return 'Calculating...';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const activeJobsArray = Array.from(activeJobs.values());
  const displayJobs = showCompletedJobs 
    ? [...activeJobsArray, ...completedJobs].slice(0, maxDisplayJobs)
    : activeJobsArray.slice(0, maxDisplayJobs);

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Live AI Analysis Progress</CardTitle>
            {!isConnected && (
              <Badge variant="destructive" className="text-xs">
                Disconnected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {activeJobsArray.length} Active
            </Badge>
            {/* Debug button for testing */}
            <Button
              size="sm"
              variant="outline"
              onClick={addMockJob}
              className="h-7 text-xs"
            >
              <Play className="h-3 w-3 mr-1" />
              Test Job
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {displayJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No analysis jobs currently running</p>
            <p className="text-xs text-gray-400 mt-1">
              Start an analysis to see real-time progress here
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayJobs.map((job) => (
              <motion.div
                key={job.jobId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
                className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50"
              >
                {/* Job Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <div>
                      <h4 className="text-sm font-medium">{job.contentName}</h4>
                      <p className="text-xs text-muted-foreground">{job.analysisType}</p>
                    </div>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>

                {/* Progress Bar */}
                {job.status !== 'completed' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress: {job.progress}%</span>
                      {job.estimatedTimeRemaining && (
                        <span>ETA: {formatTimeRemaining(job.estimatedTimeRemaining)}</span>
                      )}
                    </div>
                    <Progress value={job.progress} className="h-2" />
                  </div>
                )}

                {/* AI Models */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">Models:</span>
                  {job.aiModels.map((model) => (
                    <Badge key={model} variant="secondary" className="text-xs">
                      {model}
                    </Badge>
                  ))}
                </div>

                {/* Queue Position */}
                {job.status === 'queued' && job.queuePosition && (
                  <div className="text-xs text-muted-foreground">
                    Queue position: #{job.queuePosition}
                  </div>
                )}

                {/* Completion Time */}
                {job.status === 'completed' && job.completedAt && (
                  <div className="text-xs text-green-600">
                    ✅ Completed at {job.completedAt.toLocaleTimeString()}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Real-time updates unavailable. Reconnecting...
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
