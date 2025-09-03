import { useState, useEffect, useCallback } from 'react';
import { annotationService } from '../../services/annotationService';
import type { CreateAnnotationRequest, AnnotationFilter } from '../../services/annotationService';
import type { AnnotationData, AnnotationPosition } from '../../components/annotations/AnnotationOverlay';

interface UseAnnotationsOptions {
  contentId: string;
  contentType: string;
  autoLoad?: boolean;
  pollInterval?: number;
}

interface UseAnnotationsReturn {
  annotations: AnnotationData[];
  isLoading: boolean;
  isVisible: boolean;
  error: string | null;
  stats: {
    totalAnnotations: number;
    resolvedAnnotations: number;
    annotationsByType: Record<string, number>;
    recentActivity: number;
  } | null;
  
  // Actions
  createAnnotation: (position: AnnotationPosition, text: string, type?: string) => Promise<void>;
  updateAnnotation: (annotationId: string, text: string) => Promise<void>;
  deleteAnnotation: (annotationId: string) => Promise<void>;
  resolveAnnotation: (annotationId: string) => Promise<void>;
  replyToAnnotation: (parentId: string, text: string) => Promise<void>;
  toggleVisibility: () => void;
  refreshAnnotations: () => Promise<void>;
  loadStats: () => Promise<void>;
  setFilter: (filter: Partial<AnnotationFilter>) => void;
}

export const useAnnotations = ({
  contentId,
  contentType,
  autoLoad = true,
  pollInterval = 30000, // 30 seconds
}: UseAnnotationsOptions): UseAnnotationsReturn => {
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UseAnnotationsReturn['stats']>(null);
  const [filter, setFilterState] = useState<Partial<AnnotationFilter>>({});

  // Load annotations
  const loadAnnotations = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      const response = await annotationService.getAnnotations({
        contentId,
        contentType,
        ...filter,
      });

      if (response.success && response.annotations) {
        setAnnotations(response.annotations);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load annotations';
      setError(errorMessage);
      console.error('Error loading annotations:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [contentId, contentType, filter]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await annotationService.getAnnotationStats(contentId, contentType);
      if (response.success && response.stats) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Error loading annotation stats:', err);
    }
  }, [contentId, contentType]);

  // Create annotation
  const createAnnotation = useCallback(async (
    position: AnnotationPosition,
    text: string,
    type: string = 'COMMENT'
  ) => {
    try {
      setError(null);

      const annotationData: CreateAnnotationRequest = {
        contentId,
        contentType,
        text,
        position,
        annotationType: type,
        visibility: 'COURSE',
      };

      const response = await annotationService.createAnnotation(annotationData);
      
      if (response.success && response.annotation) {
        setAnnotations(prev => [response.annotation!, ...prev]);
        await loadStats(); // Update stats
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create annotation';
      setError(errorMessage);
      throw err;
    }
  }, [contentId, contentType, loadStats]);

  // Update annotation
  const updateAnnotation = useCallback(async (annotationId: string, text: string) => {
    try {
      setError(null);

      const response = await annotationService.updateAnnotation(annotationId, { text });
      
      if (response.success && response.annotation) {
        setAnnotations(prev => 
          prev.map(annotation => 
            annotation.id === annotationId ? response.annotation! : annotation
          )
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update annotation';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Delete annotation
  const deleteAnnotation = useCallback(async (annotationId: string) => {
    try {
      setError(null);

      const response = await annotationService.deleteAnnotation(annotationId);
      
      if (response.success) {
        setAnnotations(prev => prev.filter(annotation => annotation.id !== annotationId));
        await loadStats(); // Update stats
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete annotation';
      setError(errorMessage);
      throw err;
    }
  }, [loadStats]);

  // Resolve annotation
  const resolveAnnotation = useCallback(async (annotationId: string) => {
    try {
      setError(null);

      const response = await annotationService.resolveAnnotation(annotationId);
      
      if (response.success && response.annotation) {
        setAnnotations(prev => 
          prev.map(annotation => 
            annotation.id === annotationId ? response.annotation! : annotation
          )
        );
        await loadStats(); // Update stats
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve annotation';
      setError(errorMessage);
      throw err;
    }
  }, [loadStats]);

  // Reply to annotation
  const replyToAnnotation = useCallback(async (parentId: string, text: string) => {
    try {
      setError(null);

      const replyData: CreateAnnotationRequest = {
        contentId,
        contentType,
        text,
        position: { x: 0, y: 0, width: 0, height: 0 }, // Replies don't need position
        annotationType: 'COMMENT',
        visibility: 'COURSE',
      };

      const response = await annotationService.createReply(parentId, replyData);
      
      if (response.success && response.annotation) {
        // Add reply to the parent annotation
        setAnnotations(prev => 
          prev.map(annotation => {
            if (annotation.id === parentId) {
              return {
                ...annotation,
                replies: [...(annotation.replies || []), response.annotation!],
              };
            }
            return annotation;
          })
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create reply';
      setError(errorMessage);
      throw err;
    }
  }, [contentId, contentType]);

  // Toggle visibility
  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  // Refresh annotations
  const refreshAnnotations = useCallback(async () => {
    await loadAnnotations();
    await loadStats();
  }, [loadAnnotations, loadStats]);

  // Set filter
  const setFilter = useCallback((newFilter: Partial<AnnotationFilter>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
  }, []);

  // Auto-load annotations on mount and when dependencies change
  useEffect(() => {
    if (autoLoad && contentId && contentType) {
      loadAnnotations();
      loadStats();
    }
  }, [autoLoad, contentId, contentType, loadAnnotations, loadStats]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (!pollInterval || pollInterval <= 0) return;

    const interval = setInterval(() => {
      loadAnnotations(false); // Don't show loading spinner for background updates
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, loadAnnotations]);

  return {
    annotations,
    isLoading,
    isVisible,
    error,
    stats,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    resolveAnnotation,
    replyToAnnotation,
    toggleVisibility,
    refreshAnnotations,
    loadStats,
    setFilter,
  };
};
