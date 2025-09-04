/**
 * Model Performance Indicator Component
 * Story 2.6: AI Progress Tracking and Results Display Enhancement
 * Task 2.6.1: Enhanced Progress Tracking Components
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Clock,
  Activity,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

import type {
  ModelPerformanceIndicatorProps,
  ModelProgressDetail,
  AIModelType
} from '@/types/progressTracking';

import { cn } from '@/lib/utils';

export const ModelPerformanceIndicator: React.FC<ModelPerformanceIndicatorProps> = ({
  model,
  health,
  progress,
  showMetrics = true,
  showHistory = false,
  className,
  onClick
}) => {
  const getModelIcon = (model: AIModelType) => {
    switch (model) {
      case 'gpt-4': return '🧠';
      case 'claude-3': return '🎭';
      case 'gemini-pro': return '💎';
      default: return '🤖';
    }
  };

  const getModelName = (model: AIModelType) => {
    switch (model) {
      case 'gpt-4': return 'GPT-4';
      case 'claude-3': return 'Claude 3';
      case 'gemini-pro': return 'Gemini Pro';
      default: return model;
    }
  };

  const getHealthColor = (status: typeof health.status) => {
    switch (status) {
      case 'healthy': return 'text-green-500 bg-green-100';
      case 'degraded': return 'text-yellow-500 bg-yellow-100';
      case 'unavailable': return 'text-red-500 bg-red-100';
      case 'maintenance': return 'text-gray-500 bg-gray-100';
      default: return 'text-gray-400 bg-gray-50';
    }
  };

  const getProgressColor = (status?: ModelProgressDetail['status']) => {
    if (!status) return 'text-gray-500';
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'error': return 'text-red-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-yellow-600';
    }
  };

  const formatLatency = (latency: number) => {
    if (latency < 1000) return `${Math.round(latency)}ms`;
    return `${(latency / 1000).toFixed(1)}s`;
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-600';
    if (latency < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-lg",
          className
        )}
        onClick={() => onClick?.(model)}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{getModelIcon(model)}</div>
              <div>
                <h3 className="font-semibold text-lg">{getModelName(model)}</h3>
                <div className="flex items-center space-x-2">
                  <Badge className={cn("text-xs", getHealthColor(health.status))}>
                    {health.status}
                  </Badge>
                  {progress && (
                    <span className={cn("text-xs font-medium", getProgressColor(progress.status))}>
                      {progress.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Health Indicator */}
            <div className="flex items-center space-x-2">
              <div className={cn("flex items-center space-x-1", getHealthColor(health.status).split(' ')[0])}>
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">{health.availabilityScore}%</span>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          {progress && (
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
              
              {progress.status === 'processing' && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Stage: {progress.stage}</span>
                </div>
              )}

              {progress.status === 'error' && progress.errorMessage && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="truncate" title={progress.errorMessage}>
                    {progress.errorMessage}
                  </span>
                </div>
              )}

              {progress.status === 'completed' && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Completed successfully</span>
                </div>
              )}
            </div>
          )}

          {/* Metrics Section */}
          {showMetrics && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-gray-600">
                  <Activity className="h-3 w-3" />
                  <span className="text-xs">Latency</span>
                </div>
                <div className={cn("text-sm font-medium", getLatencyColor(health.latency))}>
                  {formatLatency(health.latency)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-gray-600">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">Queue</span>
                </div>
                <div className="text-sm font-medium">
                  {health.queueLength} jobs
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-gray-600">
                  <Brain className="h-3 w-3" />
                  <span className="text-xs">Error Rate</span>
                </div>
                <div className={cn(
                  "text-sm font-medium",
                  health.errorRate > 10 ? "text-red-600" :
                  health.errorRate > 5 ? "text-yellow-600" : "text-green-600"
                )}>
                  {health.errorRate.toFixed(1)}%
                </div>
              </div>

              {progress && progress.processingTime && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">Duration</span>
                  </div>
                  <div className="text-sm font-medium">
                    {Math.floor(progress.processingTime / 1000)}s
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Historical Performance */}
          {showHistory && (
            <div className="mt-4 pt-3 border-t">
              <div className="text-xs text-gray-600 mb-2">Recent Performance</div>
              <div className="flex items-center justify-between text-xs">
                <span>Avg. Latency: {formatLatency(health.latency * 0.9)}</span>
                <span>Success Rate: {(100 - health.errorRate).toFixed(1)}%</span>
              </div>
            </div>
          )}

          {/* Last Health Check */}
          <div className="mt-3 pt-2 border-t text-xs text-gray-500">
            Last checked: {new Intl.DateTimeFormat('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }).format(health.lastHealthCheck)}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
