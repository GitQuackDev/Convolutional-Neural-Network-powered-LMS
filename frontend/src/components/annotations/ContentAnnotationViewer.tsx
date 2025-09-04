import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Settings, BarChart3, Eye, Users } from 'lucide-react';
// import { AnnotationOverlay } from './AnnotationOverlay';
import { AnnotationManagement } from './AnnotationManagement';
import { AnnotationAnalyticsDashboard } from './AnnotationAnalyticsDashboard';
import { apiService } from '@/services/apiService';
import type { AnnotationData } from './AnnotationOverlay';

interface ContentAnnotationViewerProps {
  contentId: string;
  contentType: 'PDF' | 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'TEXT';
  contentUrl?: string;
  contentElement?: React.ReactNode;
  courseId?: string;
  userRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  initialTab?: 'view' | 'manage' | 'analytics';
  showTabs?: boolean;
  className?: string;
}

export const ContentAnnotationViewer: React.FC<ContentAnnotationViewerProps> = ({
  contentId,
  contentType,
  contentUrl,
  contentElement,
  courseId,
  userRole,
  initialTab = 'view',
  showTabs = true,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [annotations] = useState<AnnotationData[]>([]);
  const [annotationStats, setAnnotationStats] = useState({
    total: 0,
    byType: {} as Record<string, number>,
    unresolved: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Permissions
  const canManage = ['INSTRUCTOR', 'ADMIN'].includes(userRole);
  const canViewAnalytics = ['INSTRUCTOR', 'ADMIN'].includes(userRole);

  const loadAnnotationStats = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Use the enhanced API service instead of direct fetch
      const annotations = await apiService.annotations.getAnnotations(contentId);
      
      // Calculate stats from the returned annotations
      const annotationStats = {
        total: annotations.length,
        byType: annotations.reduce((acc, annotation) => {
          acc[annotation.type] = (acc[annotation.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        unresolved: annotations.filter(annotation => 
          annotation.type === 'question' && !annotation.replies?.length
        ).length
      };
      
      setAnnotationStats(annotationStats);
    } catch (error) {
      console.error('Error loading annotation stats:', error);
      // Enhanced error handling with user-friendly message
      setAnnotationStats({
        total: 0,
        byType: {},
        unresolved: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    loadAnnotationStats();
  }, [loadAnnotationStats]);

  const renderContent = () => {
    if (contentElement) {
      return contentElement;
    }

    if (contentUrl) {
      switch (contentType) {
        case 'PDF':
          return (
            <iframe
              src={contentUrl}
              className="w-full h-full border-0"
              title="PDF Content"
            />
          );
        case 'VIDEO':
          return (
            <video
              src={contentUrl}
              controls
              className="w-full h-auto"
            />
          );
        case 'IMAGE':
          return (
            <img
              src={contentUrl}
              alt="Content"
              className="w-full h-auto object-contain"
            />
          );
        case 'DOCUMENT':
        case 'TEXT':
          return (
            <iframe
              src={contentUrl}
              className="w-full h-full border-0"
              title="Document Content"
            />
          );
        default:
          return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Content preview not available
            </div>
          );
      }
    }

    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No content provided
      </div>
    );
  };

  const getStatsDisplay = () => {
    if (isLoading) return 'Loading...';
    if (annotationStats.total === 0) return 'No annotations';
    
    const typeEntries = Object.entries(annotationStats.byType);
    const topTypes = typeEntries
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([type, count]) => `${count} ${type.toLowerCase()}`)
      .join(', ');
    
    return `${annotationStats.total} total${topTypes ? ` • ${topTypes}` : ''}`;
  };

  if (!showTabs) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full">
          {renderContent()}
        </div>
        {/* Note: AnnotationOverlay needs to be integrated separately */}
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'view' | 'manage' | 'analytics')} className="w-full">
        <div className="flex items-center justify-between border-b">
          <TabsList className="grid w-auto grid-cols-3">
            <TabsTrigger value="view" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Content & Annotations
            </TabsTrigger>
            {canManage && (
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Manage
              </TabsTrigger>
            )}
            {canViewAnalytics && (
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex items-center gap-4 px-4 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              {getStatsDisplay()}
            </div>
            {annotationStats.unresolved > 0 && (
              <Badge variant="secondary">
                {annotationStats.unresolved} unresolved
              </Badge>
            )}
          </div>
        </div>

        <TabsContent value="view" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <Card className="h-[80vh]">
                <CardContent className="p-0 h-full">
                  <div className="relative w-full h-full">
                    {renderContent()}
                    {/* TODO: Integrate AnnotationOverlay with proper callback handling */}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="h-[80vh]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Users className="w-5 h-5 mr-2" />
                    Discussion
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(80vh-4rem)]">
                    <div className="p-4 space-y-4">
                      {annotations.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No annotations yet</p>
                          <p className="text-xs">Click on content to add annotations</p>
                        </div>
                      ) : (
                        annotations.map((annotation) => (
                          <div key={annotation.id} className="space-y-2 p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {annotation.annotationType}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(annotation.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm">{annotation.text}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{annotation.author.firstName} {annotation.author.lastName}</span>
                              {annotation.isResolved && (
                                <Badge variant="default" className="text-xs">Resolved</Badge>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {canManage && (
          <TabsContent value="manage" className="mt-0">
            <div className="p-6">
              <AnnotationManagement
                contentId={contentId}
                contentType={contentType}
                userRole={userRole}
              />
            </div>
          </TabsContent>
        )}

        {canViewAnalytics && (
          <TabsContent value="analytics" className="mt-0">
            <div className="p-6">
              <AnnotationAnalyticsDashboard
                contentId={contentId}
                contentType={contentType}
                courseId={courseId}
                userRole={userRole}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
