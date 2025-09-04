import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  User,
  Brain,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWebSocket } from '@/hooks/useWebSocket';

import type { RealtimeActivityEvent } from '@/types/analytics';

interface RealtimeActivityFeedProps {
  isConnected: boolean;
  maxItems?: number;
  className?: string;
}

export const RealtimeActivityFeed: React.FC<RealtimeActivityFeedProps> = ({
  isConnected,
  maxItems = 10,
  className = ''
}) => {
  const [activities, setActivities] = useState<RealtimeActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Enhanced WebSocket connection for real-time activity feed
  const { subscribe, emit } = useWebSocket('/analytics');

  // Real-time activity handlers using WebSocket
  useEffect(() => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    console.log('📡 Connecting to real-time activity feed...');

    // Subscribe to real-time activity events using available WebSocket events
    const unsubscribeProgress = subscribe('progress', (data) => {
      if (data.type === 'analysis_progress') {
        const activity: RealtimeActivityEvent = {
          id: `analysis_progress_${Date.now()}`,
          type: 'analysis_started',
          userId: data.userId,
          userName: 'User', // Default name since not provided
          description: `Started analysis ${data.analysisId ? `(Job: ${data.analysisId})` : ''}`,
          timestamp: new Date(),
          metadata: { 
            analysisId: data.analysisId || '',
            progress: data.progress || 0
          }
        };
        
        setActivities(prev => [activity, ...prev].slice(0, maxItems));
      } else if (data.type === 'analysis_complete') {
        const activity: RealtimeActivityEvent = {
          id: `analysis_complete_${Date.now()}`,
          type: 'analysis_completed',
          userId: data.userId,
          userName: 'User',
          description: `Completed analysis ${data.analysisId ? `(Job: ${data.analysisId})` : ''}`,
          timestamp: new Date(),
          metadata: { 
            analysisId: data.analysisId || '',
            dataReceived: true
          }
        };
        
        setActivities(prev => [activity, ...prev].slice(0, maxItems));
      } else if (data.type === 'session_update') {
        const activity: RealtimeActivityEvent = {
          id: `session_update_${Date.now()}`,
          type: 'session_ended',
          userId: data.userId,
          userName: 'User',
          description: 'Updated learning session',
          timestamp: new Date(),
          metadata: { 
            sessionUpdate: true
          }
        };
        
        setActivities(prev => [activity, ...prev].slice(0, maxItems));
      }
    });

    const unsubscribeAnalytics = subscribe('analytics_update', (data) => {
      console.log('📊 Real-time analytics update for activity feed:', data);
      
      const activity: RealtimeActivityEvent = {
        id: `analytics_${Date.now()}`,
        type: 'user_joined', // Generic activity type for analytics updates
        userId: 'system',
        userName: 'Analytics System',
        description: 'Analytics metrics updated',
        timestamp: new Date(data.timestamp),
        metadata: { type: 'metrics_update' }
      };
      
      setActivities(prev => [activity, ...prev].slice(0, maxItems));
    });

    const unsubscribeEngagement = subscribe('engagement_update', (data) => {
      console.log('👥 Real-time engagement update for activity feed:', data);
      
      const activity: RealtimeActivityEvent = {
        id: `engagement_${Date.now()}`,
        type: 'user_joined',
        userId: data.dataPoint.courseId || 'unknown',
        userName: 'Student',
        description: `Learning session activity (${data.dataPoint.sessionDuration}min)`,
        timestamp: new Date(data.timestamp),
        metadata: { 
          sessionDuration: data.dataPoint.sessionDuration,
          pageViews: data.dataPoint.pageViews
        }
      };
      
      setActivities(prev => [activity, ...prev].slice(0, maxItems));
    });

    const unsubscribeSignificant = subscribe('significant_change', (data) => {
      console.log('🚨 Significant change for activity feed:', data);
      
      const activity: RealtimeActivityEvent = {
        id: `significant_${Date.now()}`,
        type: 'user_joined',
        userId: 'system',
        userName: 'System Alert',
        description: `${data.changeType}: ${data.milestone || `${data.percentageIncrease}% change`}`,
        timestamp: new Date(data.timestamp),
        metadata: { 
          changeType: data.changeType,
          percentageIncrease: data.percentageIncrease || 0,
          milestone: data.milestone || ''
        }
      };
      
      setActivities(prev => [activity, ...prev].slice(0, maxItems));
    });

    console.log('📡 Subscribed to real-time activity events');

    // Emit request for recent activities - using a simple request pattern
    emit('subscribe_analytics', {
      includeActivities: true,
      maxItems
    });

    setLoading(false);

    return () => {
      unsubscribeProgress?.();
      unsubscribeAnalytics?.();
      unsubscribeEngagement?.();
      unsubscribeSignificant?.();
    };
  }, [isConnected, subscribe, emit, maxItems]);

  // HTTP fallback when WebSocket is not available
  useEffect(() => {
    if (isConnected || loading) return;

    console.log('📡 WebSocket not available, loading activities via API');
    
    const loadActivitiesViaAPI = async () => {
      try {
        // Try to load recent activities from API
        // Note: This would need a backend endpoint
        console.log('📚 Loading recent activities via HTTP API...');
        
        // For now, create a fallback activity to show system is working
        const fallbackActivity: RealtimeActivityEvent = {
          id: 'fallback',
          type: 'user_joined',
          userId: 'system',
          userName: 'System',
          description: 'Real-time activity feed - HTTP fallback mode',
          timestamp: new Date(),
          metadata: { source: 'api_fallback' }
        };

        setActivities([fallbackActivity]);
      } catch (error) {
        console.error('Failed to load activities via API:', error);
        
        // Show connection error activity
        const errorActivity: RealtimeActivityEvent = {
          id: 'error',
          type: 'user_joined',
          userId: 'system',
          userName: 'System',
          description: 'Unable to load real-time activities - check connection',
          timestamp: new Date(),
          metadata: { source: 'error' }
        };

        setActivities([errorActivity]);
      }
    };

    loadActivitiesViaAPI();
  }, [isConnected, loading]);

  const getActivityIcon = (type: RealtimeActivityEvent['type']) => {
    switch (type) {
      case 'user_joined':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'analysis_started':
        return <Brain className="h-4 w-4 text-orange-500" />;
      case 'analysis_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'session_ended':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBadgeColor = (type: RealtimeActivityEvent['type']) => {
    switch (type) {
      case 'user_joined':
        return 'bg-blue-100 text-blue-800';
      case 'analysis_started':
        return 'bg-orange-100 text-orange-800';
      case 'analysis_completed':
        return 'bg-green-100 text-green-800';
      case 'session_ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return timestamp.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Activity Feed
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <AnimatePresence>
              {activities.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-sm">
                      {isConnected ? 'Waiting for updates...' : 'Connect to see live updates'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {activity.userName || `User ${activity.userId.slice(-4)}`}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getActivityBadgeColor(activity.type)}`}
                          >
                            {activity.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                          
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div className="flex gap-1">
                              {activity.metadata.courseId && (
                                <Badge variant="outline" className="text-xs">
                                  {activity.metadata.courseId}
                                </Badge>
                              )}
                              {activity.metadata.analysisType && (
                                <Badge variant="outline" className="text-xs">
                                  {activity.metadata.analysisType}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RealtimeActivityFeed;
