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

  // Mock activities for demonstration
  useEffect(() => {
    if (isConnected) {
      const mockActivities: RealtimeActivityEvent[] = [
        {
          id: '1',
          type: 'user_joined',
          userId: 'user123',
          userName: 'Sarah Chen',
          description: 'Joined course "Introduction to AI"',
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          metadata: { courseId: 'ai-101' }
        },
        {
          id: '2',
          type: 'analysis_started',
          userId: 'user456',
          userName: 'Mike Johnson',
          description: 'Started CNN analysis on image dataset',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          metadata: { analysisType: 'cnn', fileName: 'dataset.zip' }
        },
        {
          id: '3',
          type: 'analysis_completed',
          userId: 'user789',
          userName: 'Emily Rodriguez',
          description: 'Completed GPT-4 text analysis',
          timestamp: new Date(Date.now() - 8 * 60 * 1000),
          metadata: { analysisType: 'gpt4', confidence: 0.92 }
        },
        {
          id: '4',
          type: 'session_ended',
          userId: 'user321',
          userName: 'David Kim',
          description: 'Ended 2.5 hour learning session',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          metadata: { duration: 9000 }
        }
      ];

      setActivities(mockActivities);

      // Simulate real-time updates
      const interval = setInterval(() => {
        const activityTypes: Array<RealtimeActivityEvent['type']> = ['user_joined', 'analysis_started', 'analysis_completed', 'session_ended'];
        const newActivity: RealtimeActivityEvent = {
          id: Date.now().toString(),
          type: activityTypes[Math.floor(Math.random() * 4)],
          userId: `user${Math.floor(Math.random() * 1000)}`,
          userName: ['Alex Thompson', 'Lisa Wang', 'Carlos Martinez', 'Nina Patel'][Math.floor(Math.random() * 4)],
          description: 'Performed a learning activity',
          timestamp: new Date(),
          metadata: {}
        };

        setActivities(prev => {
          const updated = [newActivity, ...prev].slice(0, maxItems);
          return updated;
        });
      }, 30000); // Add new activity every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, maxItems]);

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
