/**
 * Live Engagement Metrics Component
 * Real-time display of user engagement and activity metrics
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Activity,
  Clock,
  BookOpen,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAnalyticsWebSocket } from '@/hooks/useAnalyticsWebSocket';

interface LiveEngagementMetric {
  key: string;
  label: string;
  value: number;
  previousValue?: number;
  unit: string;
  target?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  icon: React.ComponentType<{ className?: string }>;
}

interface LiveEngagementMetricsProps {
  className?: string;
  courseId?: string;
  timeRange?: 'hour' | 'day' | 'week';
  showAlerts?: boolean;
}

export const LiveEngagementMetrics: React.FC<LiveEngagementMetricsProps> = ({
  className = '',
  courseId,
  timeRange = 'day',
  showAlerts = true
}) => {
  const [metrics, setMetrics] = useState<LiveEngagementMetric[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  const {
    isConnected,
    analyticsData,
    engagementData,
    requestAnalytics
  } = useAnalyticsWebSocket({
    autoConnect: true,
    significantChangeSeverity: 'medium'
  });

  // Initialize metrics with default values
  useEffect(() => {
    const initialMetrics: LiveEngagementMetric[] = [
      {
        key: 'activeUsers',
        label: 'Active Users',
        value: 0,
        unit: 'users',
        target: 100,
        threshold: { warning: 30, critical: 10 },
        icon: Users
      },
      {
        key: 'sessionDuration',
        label: 'Avg Session Duration',
        value: 0,
        unit: 'min',
        target: 45,
        threshold: { warning: 20, critical: 10 },
        icon: Clock
      },
      {
        key: 'courseCompletion',
        label: 'Course Completion',
        value: 0,
        unit: '%',
        target: 80,
        threshold: { warning: 50, critical: 30 },
        icon: BookOpen
      },
      {
        key: 'interactionRate',
        label: 'Interaction Rate',
        value: 0,
        unit: '%',
        target: 85,
        threshold: { warning: 60, critical: 40 },
        icon: MessageSquare
      },
      {
        key: 'contentEngagement',
        label: 'Content Engagement',
        value: 0,
        unit: 'score',
        target: 4.5,
        threshold: { warning: 3.0, critical: 2.0 },
        icon: Activity
      }
    ];

    setMetrics(initialMetrics);
  }, []);

  // Update metrics with real-time data
  useEffect(() => {
    if (!isConnected) return;

    if (analyticsData?.metrics) {
      setMetrics(prevMetrics => 
        prevMetrics.map(metric => {
          const { metrics: data } = analyticsData;
          let newValue = metric.value;

          switch (metric.key) {
            case 'activeUsers':
              newValue = data.activeUsers || metric.value;
              break;
            case 'sessionDuration':
              newValue = Math.round((data.averageSessionDuration || 0) / 60); // Convert to minutes
              break;
            case 'courseCompletion':
              // Calculate from progress data if available
              newValue = Math.round((data.engagementScore || 0) * 20); // Convert 0-5 scale to 0-100%
              break;
            case 'interactionRate':
              newValue = Math.round((data.engagementScore || 0) * 17); // Convert 0-5 scale to 0-85%
              break;
            case 'contentEngagement':
              newValue = Number((data.engagementScore || 0).toFixed(1));
              break;
          }

          return {
            ...metric,
            previousValue: metric.value,
            value: newValue
          };
        })
      );

      setLastUpdateTime(new Date());
    }
  }, [analyticsData, isConnected]);

  // Update engagement-specific metrics
  useEffect(() => {
    if (!isConnected || !engagementData) return;

    if (engagementData.aggregatedData) {
      setMetrics(prevMetrics => 
        prevMetrics.map(metric => {
          const { aggregatedData } = engagementData;
          let newValue = metric.value;

          switch (metric.key) {
            case 'activeUsers':
              newValue = aggregatedData!.activeUsers;
              break;
            case 'sessionDuration':
              newValue = Math.round(aggregatedData!.averageSessionTime / 60);
              break;
          }

          return {
            ...metric,
            previousValue: metric.value,
            value: newValue
          };
        })
      );
    }
  }, [engagementData, isConnected]);

  // Request real-time metrics when component mounts or filters change
  useEffect(() => {
    if (isConnected && requestAnalytics) {
      requestAnalytics({
        courseId,
        timeRange,
        metrics: ['engagement', 'sessions', 'completion']
      });
    }
  }, [isConnected, requestAnalytics, courseId, timeRange]);

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous || previous === current) {
      return <Minus className="h-4 w-4 text-gray-500" />;
    }
    
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendPercentage = (current: number, previous?: number): string => {
    if (!previous || previous === 0) return '';
    
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getMetricStatus = (metric: LiveEngagementMetric): 'healthy' | 'warning' | 'critical' => {
    if (!metric.threshold) return 'healthy';
    
    if (metric.value <= metric.threshold.critical) {
      return 'critical';
    }
    
    if (metric.value <= metric.threshold.warning) {
      return 'warning';
    }
    
    return 'healthy';
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Live Engagement Metrics</CardTitle>
            {!isConnected && (
              <Badge variant="destructive" className="text-xs">
                Disconnected
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Last updated: {lastUpdateTime.toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric) => {
            const status = getMetricStatus(metric);
            const IconComponent = metric.icon;
            
            return (
              <motion.div
                key={metric.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border rounded-lg bg-gradient-to-br from-white to-gray-50"
              >
                {/* Metric Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {metric.label}
                    </span>
                  </div>
                  {showAlerts && status !== 'healthy' && (
                    <Badge className={`text-xs ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                    </Badge>
                  )}
                </div>

                {/* Metric Value */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {metric.value}
                    </span>
                    <span className="text-sm text-gray-500">
                      {metric.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {getTrendIcon(metric.value, metric.previousValue)}
                    <span className="text-xs text-gray-500">
                      {getTrendPercentage(metric.value, metric.previousValue)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar (if target exists) */}
                {metric.target && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((metric.value / metric.target) * 100)}%</span>
                    </div>
                    <Progress 
                      value={Math.min((metric.value / metric.target) * 100, 100)} 
                      className="h-2"
                    />
                  </div>
                )}

                {/* Target Information */}
                {metric.target && (
                  <div className="text-xs text-gray-500">
                    Target: {metric.target} {metric.unit}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                Real-time updates unavailable. Showing last cached data.
              </span>
            </div>
          </div>
        )}

        {/* Alerts Summary */}
        {showAlerts && (
          <div className="mt-4">
            {metrics.some(m => getMetricStatus(m) !== 'healthy') && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Engagement Alerts</span>
                </div>
                <div className="space-y-1">
                  {metrics
                    .filter(m => getMetricStatus(m) !== 'healthy')
                    .map(metric => (
                      <div key={metric.key} className="text-xs text-red-700">
                        • {metric.label} is {getMetricStatus(metric)} ({metric.value} {metric.unit})
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
