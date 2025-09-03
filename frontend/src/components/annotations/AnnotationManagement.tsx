import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff, Flag, Trash2, CheckCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';
import type { AnnotationData } from './AnnotationOverlay';

export interface ModerationAnnotation extends AnnotationData {
  isHidden?: boolean;
  isFlagged?: boolean;
  moderationStatus?: string;
  moderationReason?: string;
  moderatedAt?: string;
  moderatedBy?: string;
}

interface AnnotationFilters {
  visibility: string;
  annotationType: string;
  status: string;
  author: string;
  dateRange: string;
}

interface AnnotationManagementProps {
  contentId: string;
  contentType: string;
  userRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
}

export const AnnotationManagement: React.FC<AnnotationManagementProps> = ({
  contentId,
  contentType,
  userRole
}) => {
  const [annotations, setAnnotations] = useState<ModerationAnnotation[]>([]);
  const [filteredAnnotations, setFilteredAnnotations] = useState<ModerationAnnotation[]>([]);
  const [selectedAnnotations, setSelectedAnnotations] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<AnnotationFilters>({
    visibility: 'all',
    annotationType: 'all',
    status: 'all',
    author: '',
    dateRange: '7d'
  });
  const [moderationDialog, setModerationDialog] = useState<{
    isOpen: boolean;
    annotationId: string | null;
    action: string;
  }>({
    isOpen: false,
    annotationId: null,
    action: ''
  });
  const [moderationReason, setModerationReason] = useState('');

  // Permissions check
  const canModerate = ['INSTRUCTOR', 'ADMIN'].includes(userRole);

  const loadAnnotations = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        contentId,
        contentType,
        limit: '100'
      });

      const response = await fetch(`/api/annotations?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnnotations(data.annotations || []);
      } else {
        toast.error('Failed to load annotations');
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
      toast.error('Failed to load annotations');
    } finally {
      setIsLoading(false);
    }
  }, [contentId, contentType]);

  const applyFilters = React.useCallback(() => {
    let filtered = [...annotations];

    // Filter by visibility
    if (filters.visibility !== 'all') {
      filtered = filtered.filter(annotation => annotation.visibility === filters.visibility);
    }

    // Filter by annotation type
    if (filters.annotationType !== 'all') {
      filtered = filtered.filter(annotation => annotation.annotationType === filters.annotationType);
    }

    // Filter by status
    if (filters.status !== 'all') {
      switch (filters.status) {
        case 'resolved':
          filtered = filtered.filter(annotation => annotation.isResolved);
          break;
        case 'unresolved':
          filtered = filtered.filter(annotation => !annotation.isResolved);
          break;
        case 'flagged':
          filtered = filtered.filter(annotation => annotation.isFlagged);
          break;
        case 'hidden':
          filtered = filtered.filter(annotation => annotation.isHidden);
          break;
      }
    }

    // Filter by author
    if (filters.author) {
      const authorQuery = filters.author.toLowerCase();
      filtered = filtered.filter(annotation => 
        annotation.author.firstName.toLowerCase().includes(authorQuery) ||
        annotation.author.lastName.toLowerCase().includes(authorQuery)
      );
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (filters.dateRange) {
        case '24h':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filtered = filtered.filter(annotation => 
        new Date(annotation.createdAt) >= cutoffDate
      );
    }

    setFilteredAnnotations(filtered);
  }, [annotations, filters]);

  React.useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleAnnotationSelect = (annotationId: string, selected: boolean) => {
    const newSelected = new Set(selectedAnnotations);
    if (selected) {
      newSelected.add(annotationId);
    } else {
      newSelected.delete(annotationId);
    }
    setSelectedAnnotations(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(filteredAnnotations.map(a => a.id));
      setSelectedAnnotations(allIds);
    } else {
      setSelectedAnnotations(new Set());
    }
  };

  const handleModerationAction = async (action: string, annotationId?: string) => {
    if (!canModerate) {
      toast.error('Insufficient permissions');
      return;
    }

    const ids = annotationId ? [annotationId] : Array.from(selectedAnnotations);
    if (ids.length === 0) {
      toast.error('No annotations selected');
      return;
    }

    try {
      let response;
      
      if (ids.length === 1) {
        // Single annotation moderation
        response = await fetch(`/api/annotations/${ids[0]}/moderate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            action,
            reason: moderationReason
          })
        });
      } else {
        // Bulk moderation
        response = await fetch('/api/annotations/bulk/moderate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            annotationIds: ids,
            action,
            reason: moderationReason
          })
        });
      }

      if (response.ok) {
        toast.success(`Annotation(s) ${action} successfully`);
        loadAnnotations();
        setSelectedAnnotations(new Set());
        setModerationDialog({ isOpen: false, annotationId: null, action: '' });
        setModerationReason('');
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${action} annotation(s)`);
      }
    } catch (error) {
      console.error('Error moderating annotation:', error);
      toast.error(`Failed to ${action} annotation(s)`);
    }
  };

  const handleVisibilityChange = async (annotationId: string, visibility: string) => {
    try {
      const response = await fetch(`/api/annotations/${annotationId}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ visibility })
      });

      if (response.ok) {
        toast.success('Visibility updated successfully');
        loadAnnotations();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update visibility');
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  const getStatusBadge = (annotation: ModerationAnnotation) => {
    if (annotation.isFlagged) {
      return <Badge variant="destructive"><Flag className="w-3 h-3 mr-1" />Flagged</Badge>;
    }
    if (annotation.isHidden) {
      return <Badge variant="secondary"><EyeOff className="w-3 h-3 mr-1" />Hidden</Badge>;
    }
    if (annotation.isResolved) {
      return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
    }
    return <Badge variant="outline">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Filter className="w-5 h-5 mr-2" />
            Annotation Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Select value={filters.visibility} onValueChange={(value) => setFilters(prev => ({ ...prev, visibility: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="COURSE">Course</SelectItem>
                <SelectItem value="INSTRUCTOR_ONLY">Instructors Only</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.annotationType} onValueChange={(value) => setFilters(prev => ({ ...prev, annotationType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="COMMENT">Comments</SelectItem>
                <SelectItem value="QUESTION">Questions</SelectItem>
                <SelectItem value="SUGGESTION">Suggestions</SelectItem>
                <SelectItem value="HIGHLIGHT">Highlights</SelectItem>
                <SelectItem value="BOOKMARK">Bookmarks</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Filter by author..."
              value={filters.author}
              onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
            />

            <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {canModerate && selectedAnnotations.size > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedAnnotations.size} annotation(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModerationDialog({ isOpen: true, annotationId: null, action: 'hide' })}
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModerationDialog({ isOpen: true, annotationId: null, action: 'flag' })}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Flag
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setModerationDialog({ isOpen: true, annotationId: null, action: 'delete' })}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Annotations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Annotations ({filteredAnnotations.length})</span>
            {canModerate && (
              <Checkbox
                checked={selectedAnnotations.size === filteredAnnotations.length && filteredAnnotations.length > 0}
                onCheckedChange={handleSelectAll}
              />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading annotations...</div>
          ) : filteredAnnotations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No annotations found matching your filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {canModerate && (
                        <Checkbox
                          checked={selectedAnnotations.has(annotation.id)}
                          onCheckedChange={(checked) => handleAnnotationSelect(annotation.id, checked as boolean)}
                        />
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {annotation.author.firstName} {annotation.author.lastName}
                          </span>
                          <Badge variant="outline">{annotation.annotationType}</Badge>
                          {getStatusBadge(annotation)}
                        </div>
                        <p className="text-sm text-muted-foreground">{annotation.text}</p>
                        <div className="text-xs text-muted-foreground">
                          {new Date(annotation.createdAt).toLocaleString()}
                          {annotation.moderationReason && (
                            <span className="ml-2 text-orange-600">
                              • Reason: {annotation.moderationReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {canModerate && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={annotation.visibility}
                          onValueChange={(value) => handleVisibilityChange(annotation.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PUBLIC">Public</SelectItem>
                            <SelectItem value="COURSE">Course</SelectItem>
                            <SelectItem value="INSTRUCTOR_ONLY">Instructors Only</SelectItem>
                            <SelectItem value="PRIVATE">Private</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModerationDialog({ 
                            isOpen: true, 
                            annotationId: annotation.id, 
                            action: annotation.isHidden ? 'show' : 'hide' 
                          })}
                        >
                          {annotation.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModerationDialog({ 
                            isOpen: true, 
                            annotationId: annotation.id, 
                            action: annotation.isFlagged ? 'unflag' : 'flag' 
                          })}
                        >
                          <Flag className={`w-4 h-4 ${annotation.isFlagged ? 'text-red-500' : ''}`} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Moderation Dialog */}
      <Dialog 
        open={moderationDialog.isOpen} 
        onOpenChange={(open) => !open && setModerationDialog({ isOpen: false, annotationId: null, action: '' })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderationDialog.action.charAt(0).toUpperCase() + moderationDialog.action.slice(1)} Annotation(s)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {moderationDialog.annotationId 
                ? 'Are you sure you want to perform this moderation action on this annotation?'
                : `Are you sure you want to ${moderationDialog.action} ${selectedAnnotations.size} selected annotation(s)?`
              }
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                placeholder="Enter a reason for this moderation action..."
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setModerationDialog({ isOpen: false, annotationId: null, action: '' })}
              >
                Cancel
              </Button>
              <Button
                variant={moderationDialog.action === 'delete' ? 'destructive' : 'default'}
                onClick={() => handleModerationAction(moderationDialog.action, moderationDialog.annotationId || undefined)}
              >
                {moderationDialog.action.charAt(0).toUpperCase() + moderationDialog.action.slice(1)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
