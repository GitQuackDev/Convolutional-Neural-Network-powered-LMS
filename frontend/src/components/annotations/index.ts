// Annotation System Components Export
// Task 4: Annotation Management and Controls - Integration File

export { AnnotationOverlay } from './AnnotationOverlay';
export { AnnotationManagement } from './AnnotationManagement';
export { AnnotationAnalyticsDashboard } from './AnnotationAnalyticsDashboard';
export { ContentAnnotationViewer } from './ContentAnnotationViewer';

// Re-export types for easy import
export type { 
  AnnotationData, 
  AnnotationPosition
} from './AnnotationOverlay';

export type { 
  ModerationAnnotation 
} from './AnnotationManagement';

/**
 * Complete Annotation System Integration
 * 
 * Usage Examples:
 * 
 * 1. Basic Content with Annotations:
 * ```tsx
 * import { ContentAnnotationViewer } from '@/components/annotations';
 * 
 * <ContentAnnotationViewer
 *   contentId="content-123"
 *   contentType="PDF"
 *   contentUrl="/api/content/content-123"
 *   userRole="STUDENT"
 *   courseId="course-456"
 * />
 * ```
 * 
 * 2. Instructor Management Interface:
 * ```tsx
 * import { AnnotationManagement } from '@/components/annotations';
 * 
 * <AnnotationManagement
 *   contentId="content-123"
 *   contentType="PDF"
 *   userRole="INSTRUCTOR"
 * />
 * ```
 * 
 * 3. Analytics Dashboard:
 * ```tsx
 * import { AnnotationAnalyticsDashboard } from '@/components/annotations';
 * 
 * <AnnotationAnalyticsDashboard
 *   contentId="content-123"
 *   contentType="PDF"
 *   courseId="course-456"
 *   userRole="INSTRUCTOR"
 * />
 * ```
 * 
 * 4. Custom Overlay Integration:
 * ```tsx
 * import { AnnotationOverlay } from '@/components/annotations';
 * 
 * <div className="relative">
 *   <YourContentComponent />
 *   <AnnotationOverlay
 *     contentId="content-123"
 *     contentType="PDF"
 *     userRole="STUDENT"
 *     onAnnotationCreate={handleCreate}
 *     onAnnotationUpdate={handleUpdate}
 *     onAnnotationDelete={handleDelete}
 *   />
 * </div>
 * ```
 */

// System Features Implemented:
// ✅ Real-time collaborative annotations
// ✅ WebSocket integration for live updates
// ✅ Moderation and management controls
// ✅ Permission-based access (STUDENT/INSTRUCTOR/ADMIN)
// ✅ Analytics and reporting
// ✅ Multiple annotation types (COMMENT, QUESTION, SUGGESTION, HIGHLIGHT, BOOKMARK)
// ✅ Visibility controls (PUBLIC, COURSE, INSTRUCTOR_ONLY, PRIVATE)
// ✅ Bulk moderation operations
// ✅ Export functionality
// ✅ Filtering and search capabilities
// ✅ Content type support (PDF, VIDEO, DOCUMENT, IMAGE, TEXT)
