import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Filter,
  RefreshCw,
  AlertCircle,
  Download,
  Users,
  Clock,
  Brain
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useWebSocket } from '@/hooks/useWebSocket';
import { apiService } from '@/services/apiService';
import { MetricCard } from './MetricCard';
import { EngagementChart } from './EngagementChart';
import { ProgressChart } from './ProgressChart';
import { AIModelUsageChart } from './AIModelUsageChart';
import { RealtimeActivityFeed } from './RealtimeActivityFeed';

import type { 
  AnalyticsMetrics, 
  EngagementDataPoint, 
  LearningProgressData,
  AnalyticsFilters,
  AIModelUsageData 
} from '@/types/analytics';

interface AnalyticsDashboardProps {
  userRole: 'professor' | 'admin';
  courseFilter?: string;
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userRole,
  courseFilter,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [engagementData, setEngagementData] = useState<EngagementDataPoint[]>([]);
  const [progressData, setProgressData] = useState<LearningProgressData[]>([]);
  const [aiModelUsage, setAIModelUsage] = useState<AIModelUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      end: new Date()
    },
    courseId: courseFilter,
    timeGranularity: 'day'
  });
  
  // WebSocket connection for real-time updates
  const { isConnected, connectionError, subscribe, emit } = useWebSocket('/analytics');

  // Real-time data handlers
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to real-time analytics events
    const unsubscribeMetrics = subscribe('analytics_update', (data) => {
      console.log('📊 Real-time metrics update:', data);
      if (data.metrics) {
        setMetrics(prev => prev ? { ...prev, ...data.metrics } : data.metrics as AnalyticsMetrics);
      }
    });

    const unsubscribeEngagement = subscribe('engagement_update', (data) => {
      console.log('👥 Real-time engagement update:', data);
      setEngagementData(prev => [...prev.slice(-29), data.dataPoint]);
    });

    const unsubscribeProgress = subscribe('progress_update', (data) => {
      console.log('📈 Real-time progress update:', data);
      setProgressData(prev => [...prev.slice(-19), data.dataPoint]);
    });

    const unsubscribeAIUsage = subscribe('ai_usage_update', (data) => {
      console.log('🤖 Real-time AI usage update:', data);
      setAIModelUsage(prev => [...prev.slice(-9), data.dataPoint]);
    });

    // Request initial real-time data subscription
    emit('subscribe_analytics', {
      filters,
      realTimeOnly: false
    });

    return () => {
      unsubscribeMetrics?.();
      unsubscribeEngagement?.();
      unsubscribeProgress?.();
      unsubscribeAIUsage?.();
    };
  }, [isConnected, subscribe, emit, filters]);

  // Refresh real-time subscription when filters change
  useEffect(() => {
    if (isConnected) {
      emit('update_subscription', { filters });
    }
  }, [filters, isConnected, emit]);

  // Load initial dashboard data
  const loadDashboardData = React.useCallback(async () => {
    setLoading(true);
    try {
      // Prepare API parameters
      const apiParams = {
        startDate: filters.dateRange.start.toISOString(),
        endDate: filters.dateRange.end.toISOString(),
        courseId: filters.courseId || undefined,
        granularity: filters.timeGranularity as 'hour' | 'day' | 'week' | 'month'
      };

      // Use enhanced API service with Promise.all for parallel requests
      const [analyticsOverview, engagementApiData, progressApiData, aiUsageApiData] = await Promise.all([
        apiService.analytics.getOverview(apiParams),
        apiService.analytics.getEngagement(apiParams),
        apiService.analytics.getProgress(apiParams),
        apiService.analytics.getAIModelsUsage(apiParams)
      ]);

      // Transform API data to match existing component expectations
      const transformedMetrics: AnalyticsMetrics = {
        activeUsers: analyticsOverview.activeStudents,
        totalSessions: analyticsOverview.totalStudents, // Using totalStudents as session proxy
        averageSessionDuration: engagementApiData.sessionDuration,
        contentAnalysisCount: aiUsageApiData.totalRequests,
        aiModelUsage: aiUsageApiData.costTracking.costByModel.reduce((acc, model) => {
          acc[model.model] = model.requestCount;
          return acc;
        }, {} as Record<string, number>),
        engagementScore: analyticsOverview.avgScore,
        timestamp: new Date(),
        // Add trend indicators based on current data
        usersTrend: 'stable',
        sessionTrend: 'stable',
        analysisTrend: 'stable',
        engagementTrend: 'stable'
      };

      const transformedEngagement: EngagementDataPoint[] = engagementApiData.engagementTrends.map(trend => ({
        timestamp: new Date(trend.date),
        pageViews: trend.activeUsers * 5, // Estimated page views
        uniqueUsers: trend.activeUsers,
        analysisRequests: Math.floor(trend.engagement * 10), // Estimated analysis requests
        sessionDuration: engagementApiData.sessionDuration,
        courseId: filters.courseId
      }));

      const transformedProgress: LearningProgressData[] = progressApiData.courseProgress.map(course => ({
        userId: course.courseId, // Using courseId as userId for now
        userName: undefined,
        courseId: course.courseId,
        courseName: course.courseName,
        progressScore: course.averageScore,
        completedActivities: Math.floor(course.completionRate), // Using completion rate as activity count
        timeSpent: engagementApiData.timeOnTask,
        lastActivity: new Date(),
        analysisCount: aiUsageApiData.totalRequests / progressApiData.courseProgress.length // Distribute across courses
      }));

      const transformedAIUsage: AIModelUsageData[] = aiUsageApiData.modelHealth.map(model => ({
        modelName: model.model,
        usageCount: aiUsageApiData.costTracking.costByModel.find(cost => cost.model === model.model)?.requestCount || 0,
        averageProcessingTime: aiUsageApiData.averageResponseTime,
        successRate: model.availability,
        timestamp: new Date(model.lastUpdated),
        costEfficiency: 85 // Default value for now
      }));

      setMetrics(transformedMetrics);
      setEngagementData(transformedEngagement);
      setProgressData(transformedProgress);
      setAIModelUsage(transformedAIUsage);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Enhanced error handling - could add user-facing error message here
      // For now, maintaining existing behavior
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // HTTP polling fallback when WebSocket is not connected
  useEffect(() => {
    if (isConnected) return; // Use WebSocket when available

    console.log('📡 WebSocket not connected, falling back to HTTP polling');
    const interval = setInterval(() => {
      console.log('🔄 Polling for analytics updates');
      loadDashboardData();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, loadDashboardData]);

  // Real-time notification system for significant engagement changes
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeNotification = subscribe('significant_change', (data) => {
      console.log('🚨 Significant analytics change detected:', data);
      
      // Show notification for major changes
      if (data.changeType === 'engagement_spike' && data.percentageIncrease && data.percentageIncrease > 50) {
        console.log(`📈 Engagement spike detected: ${data.percentageIncrease}% increase`);
      }
      
      if (data.changeType === 'completion_milestone' && data.milestone) {
        console.log(`🎯 Completion milestone reached: ${data.milestone}`);
      }
    });

    return () => {
      unsubscribeNotification?.();
    };
  }, [isConnected, subscribe]);

  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      const exportFormat = {
        format: format as 'csv' | 'excel' | 'pdf' | 'json',
        dateRange: {
          start: filters.dateRange.start.toISOString(),
          end: filters.dateRange.end.toISOString()
        },
        includeCharts: true,
        courseIds: filters.courseId ? [filters.courseId] : undefined
      };

      const exportResult = await apiService.analytics.exportData(exportFormat);
      
      // Create download link from the URL provided by the API
      const link = document.createElement('a');
      link.href = exportResult.downloadUrl;
      link.download = exportResult.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export failed:', error);
      // Could add user-facing error notification here
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-8 w-8 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`space-y-6 p-6 ${className}`}
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights into student engagement and learning progress
          </p>
        </div>
        
        {/* Dashboard Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          
          {/* Refresh Button */}
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          {/* Export Options */}
          <Select onValueChange={(value: string) => handleExport(value as 'pdf' | 'csv')}>
            <SelectTrigger className="w-32">
              <Download className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF Report</SelectItem>
              <SelectItem value="csv">CSV Data</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <DatePickerWithRange
              value={filters.dateRange}
              onChange={(range: { start: Date; end: Date }) => setFilters(prev => ({ ...prev, dateRange: range }))}
            />
            
            <Select 
              value={filters.courseId || 'all'} 
              onValueChange={(value: string) => setFilters(prev => ({ ...prev, courseId: value === 'all' ? undefined : value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="course-1">Introduction to AI</SelectItem>
                <SelectItem value="course-2">Machine Learning Basics</SelectItem>
                <SelectItem value="course-3">Computer Vision</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={filters.timeGranularity} 
              onValueChange={(value: string) => setFilters(prev => ({ ...prev, timeGranularity: value as 'hour' | 'day' | 'week' }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">Hourly</SelectItem>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Warning for connection issues */}
      {connectionError && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Real-time updates unavailable. Displaying cached data with periodic refresh.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Users"
          value={metrics?.activeUsers || 0}
          format="number"
          trend={metrics?.usersTrend || 'stable'}
          change={metrics?.usersChange || 0}
          icon={Users}
          realTimeUpdates={isConnected}
        />
        
        <MetricCard
          title="Avg Session Duration"
          value={metrics?.averageSessionDuration || 0}
          format="duration"
          trend={metrics?.sessionTrend || 'stable'}
          change={metrics?.sessionChange || 0}
          icon={Clock}
          realTimeUpdates={isConnected}
        />
        
        <MetricCard
          title="AI Analyses"
          value={metrics?.contentAnalysisCount || 0}
          format="number"
          trend={metrics?.analysisTrend || 'stable'}
          change={metrics?.analysisChange || 0}
          icon={Brain}
          realTimeUpdates={isConnected}
        />
        
        <MetricCard
          title="Engagement Score"
          value={metrics?.engagementScore || 0}
          format="percentage"
          trend={metrics?.engagementTrend || 'stable'}
          change={metrics?.engagementChange || 0}
          icon={Activity}
          realTimeUpdates={isConnected}
        />
      </div>

      {/* Main Analytics Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="ai-usage">AI Usage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EngagementChart 
              data={engagementData}
              timeRange={filters.timeGranularity}
              realTime={isConnected}
            />
            
            <AIModelUsageChart 
              data={aiModelUsage}
              showTrends={true}
            />
          </div>
          
          <RealtimeActivityFeed 
            isConnected={isConnected}
            maxItems={10}
          />
        </TabsContent>
        
        <TabsContent value="engagement" className="space-y-6">
          <EngagementChart 
            data={engagementData}
            timeRange={filters.timeGranularity}
            realTime={isConnected}
            showDetailed={true}
          />
        </TabsContent>
        
        <TabsContent value="progress" className="space-y-6">
          <ProgressChart 
            data={progressData}
            courseId={filters.courseId}
            showIndividualStudents={userRole === 'professor'}
          />
        </TabsContent>
        
        <TabsContent value="ai-usage" className="space-y-6">
          <AIModelUsageChart 
            data={aiModelUsage}
            showTrends={true}
            showPerformanceMetrics={true}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AnalyticsDashboard;
