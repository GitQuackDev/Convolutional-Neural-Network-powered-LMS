import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, MessageSquare, Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';

interface AnnotationAnalytics {
  totalAnnotations: number;
  annotationsByType: { [key: string]: number };
  annotationsByVisibility: { [key: string]: number };
  annotationsByUser: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
  annotationsByDate: Array<{
    date: string;
    count: number;
  }>;
  moderationStats: {
    totalModerated: number;
    flagged: number;
    hidden: number;
    deleted: number;
  };
  engagementMetrics: {
    averageAnnotationsPerUser: number;
    mostActiveDay: string;
    responseRate: number;
  };
}

interface AnnotationAnalyticsDashboardProps {
  contentId?: string;
  contentType?: string;
  courseId?: string;
  userRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
}

export const AnnotationAnalyticsDashboard: React.FC<AnnotationAnalyticsDashboardProps> = ({
  contentId,
  contentType,
  courseId,
  userRole
}) => {
  const [analytics, setAnalytics] = useState<AnnotationAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [exportLoading, setExportLoading] = useState(false);

  // Permissions check
  const canViewAnalytics = ['INSTRUCTOR', 'ADMIN'].includes(userRole);

  const loadAnalytics = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        timeRange,
        ...(contentId && { contentId }),
        ...(contentType && { contentType }),
        ...(courseId && { courseId })
      });

      const response = await fetch(`/api/annotations/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [contentId, contentType, courseId, timeRange]);

  useEffect(() => {
    if (canViewAnalytics) {
      loadAnalytics();
    }
  }, [loadAnalytics, canViewAnalytics]);

  const exportAnalytics = async () => {
    if (!analytics) return;

    setExportLoading(true);
    try {
      const params = new URLSearchParams({
        timeRange,
        format: 'csv',
        ...(contentId && { contentId }),
        ...(contentType && { contentType }),
        ...(courseId && { courseId })
      });

      const response = await fetch(`/api/annotations/analytics/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `annotation-analytics-${timeRange}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Analytics exported successfully');
      } else {
        toast.error('Failed to export analytics');
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export analytics');
    } finally {
      setExportLoading(false);
    }
  };

  if (!canViewAnalytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            You don't have permission to view analytics.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No analytics data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Annotation Analytics</h2>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={exportAnalytics}
            disabled={exportLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportLoading ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Annotations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAnnotations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Active discussions and notes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per User</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.engagementMetrics.averageAnnotationsPerUser.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Engagement level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics.engagementMetrics.responseRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Questions answered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active Day</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.engagementMetrics.mostActiveDay}
            </div>
            <p className="text-xs text-muted-foreground">
              Peak activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Annotation Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Annotations by Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.annotationsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">{count}</div>
                  <div className="w-24 bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(count / analytics.totalAnnotations) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visibility Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.annotationsByVisibility).map(([visibility, count]) => (
              <div key={visibility} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={visibility === 'PUBLIC' ? 'default' : 'secondary'}>
                    {visibility}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">{count}</div>
                  <div className="w-24 bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(count / analytics.totalAnnotations) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.annotationsByUser.slice(0, 10).map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium">{user.userName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{user.count} annotations</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Moderation Statistics */}
      {analytics.moderationStats.totalModerated > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Moderation Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.moderationStats.totalModerated}
                </div>
                <div className="text-sm text-muted-foreground">Total Moderated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {analytics.moderationStats.flagged}
                </div>
                <div className="text-sm text-muted-foreground">Flagged</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {analytics.moderationStats.hidden}
                </div>
                <div className="text-sm text-muted-foreground">Hidden</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {analytics.moderationStats.deleted}
                </div>
                <div className="text-sm text-muted-foreground">Deleted</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.annotationsByDate.slice(0, 14).map((day) => (
              <div key={day.date} className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {new Date(day.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">{day.count}</div>
                  <div className="w-32 bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${Math.max(5, (day.count / Math.max(...analytics.annotationsByDate.map(d => d.count))) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
