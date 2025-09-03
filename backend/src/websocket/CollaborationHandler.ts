import { annotationService } from '../services/annotationService';
import { AnnotationEvent, AuthenticatedSocket } from './types';

// Define enums as constants for runtime validation
const AnnotationContentType = {
  PDF: 'PDF',
  VIDEO: 'VIDEO', 
  TEXT: 'TEXT',
  IMAGE: 'IMAGE'
} as const;

const AnnotationType = {
  COMMENT: 'COMMENT',
  QUESTION: 'QUESTION',
  HIGHLIGHT: 'HIGHLIGHT',
  SUGGESTION: 'SUGGESTION',
  BOOKMARK: 'BOOKMARK'
} as const;

const AnnotationVisibility = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  INSTRUCTOR_ONLY: 'INSTRUCTOR_ONLY'
} as const;

class CollaborationHandler {
  private socket: AuthenticatedSocket;

  constructor(socket: AuthenticatedSocket) {
    this.socket = socket;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    console.log(`🤝 Setting up collaboration handlers for user ${this.socket.userId}`);

    // Handle joining content for annotation collaboration
    this.socket.on('join_content', this.handleJoinContent.bind(this));
    
    // Handle leaving content
    this.socket.on('leave_content', this.handleLeaveContent.bind(this));
    
    // Handle creating annotations
    this.socket.on('create_annotation', this.handleCreateAnnotation.bind(this));
    
    // Handle updating annotations
    this.socket.on('update_annotation', this.handleUpdateAnnotation.bind(this));
    
    // Handle deleting annotations
    this.socket.on('delete_annotation', this.handleDeleteAnnotation.bind(this));
    
    // Handle resolving annotations
    this.socket.on('resolve_annotation', this.handleResolveAnnotation.bind(this));

    // Handle disconnection
    this.socket.on('disconnect', this.handleDisconnect.bind(this));

    console.log(`✅ Collaboration handlers set up for user ${this.socket.userId}`);
  }

  private async handleJoinContent(data: { contentId: string; contentType: string }): Promise<void> {
    try {
      const { contentId, contentType } = data;
      const room = `content:${contentId}:${contentType}`;
      
      // Join the content-specific room
      await this.socket.join(room);
      
      console.log(`👥 User ${this.socket.userId} joined content room: ${room}`);
      
      // Notify other users in the room
      this.socket.to(room).emit('connected', {
        userId: this.socket.userId,
        timestamp: new Date(),
      });

      // Send confirmation to the user
      this.socket.emit('connected', {
        userId: this.socket.userId,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error joining content room:', error);
      this.socket.emit('error', 'Failed to join content collaboration');
    }
  }

  private async handleLeaveContent(data: { contentId: string; contentType: string }): Promise<void> {
    try {
      const { contentId, contentType } = data;
      const room = `content:${contentId}:${contentType}`;
      
      // Leave the content-specific room
      await this.socket.leave(room);
      
      console.log(`👋 User ${this.socket.userId} left content room: ${room}`);
      
      // Notify other users in the room
      this.socket.to(room).emit('disconnected', {
        userId: this.socket.userId,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error leaving content room:', error);
      this.socket.emit('error', 'Failed to leave content collaboration');
    }
  }

  private async handleCreateAnnotation(data: Omit<AnnotationEvent, 'annotationId' | 'timestamp'>): Promise<void> {
    try {
      // Validate annotation type enums
      if (!Object.values(AnnotationContentType).includes(data.contentType as any)) {
        this.socket.emit('error', 'Invalid content type');
        return;
      }

      if (!Object.values(AnnotationType).includes(data.annotationType as any)) {
        this.socket.emit('error', 'Invalid annotation type');
        return;
      }

      if (!Object.values(AnnotationVisibility).includes(data.visibility as any)) {
        this.socket.emit('error', 'Invalid visibility setting');
        return;
      }

      // Create annotation using the service
      const annotation = await annotationService.createAnnotation({
        contentId: data.contentId,
        contentType: data.contentType as any,
        authorId: this.socket.userId,
        text: data.text || '',
        position: data.position,
        annotationType: data.annotationType as any,
        visibility: data.visibility as any,
      });

      // Create the event data
      const annotationEvent: AnnotationEvent = {
        type: 'annotation_created',
        annotationId: annotation.id,
        contentId: data.contentId,
        contentType: data.contentType,
        authorId: this.socket.userId,
        courseId: data.courseId || '', // Provide default empty string
        text: data.text || '', // Provide default empty string
        position: data.position,
        annotationType: data.annotationType,
        visibility: data.visibility,
        timestamp: new Date(),
      };

      // Broadcast to all users in the content room
      const room = `content:${data.contentId}:${data.contentType}`;
      this.socket.to(room).emit('annotation', annotationEvent);
      
      // Send confirmation to the creator
      this.socket.emit('annotation', annotationEvent);

      console.log(`📝 Annotation created by user ${this.socket.userId} in content ${data.contentId}`);
    } catch (error) {
      console.error('Error creating annotation:', error);
      this.socket.emit('error', 'Failed to create annotation');
    }
  }

  private async handleUpdateAnnotation(data: { annotationId: string; text: string }): Promise<void> {
    try {
      // Update annotation using the service
      const annotation = await annotationService.updateAnnotation(
        data.annotationId,
        { text: data.text },
        this.socket.userId
      );

      // Create the event data
      const annotationEvent: AnnotationEvent = {
        type: 'annotation_updated',
        annotationId: annotation.id,
        contentId: annotation.contentId,
        contentType: annotation.contentType,
        authorId: annotation.authorId,
        text: data.text,
        position: annotation.position as any,
        annotationType: annotation.annotationType,
        visibility: annotation.visibility,
        timestamp: new Date(),
      };

      // Broadcast to all users in the content room
      const room = `content:${annotation.contentId}:${annotation.contentType}`;
      this.socket.to(room).emit('annotation', annotationEvent);
      
      // Send confirmation to the updater
      this.socket.emit('annotation', annotationEvent);

      console.log(`✏️ Annotation ${data.annotationId} updated by user ${this.socket.userId}`);
    } catch (error) {
      console.error('Error updating annotation:', error);
      this.socket.emit('error', 'Failed to update annotation');
    }
  }

  private async handleDeleteAnnotation(annotationId: string): Promise<void> {
    try {
      // First get the annotation to know the content details
      const annotations = await annotationService.getAnnotations(
        { contentId: '' }, // We'll need to modify this
        this.socket.userId,
        this.socket.userRole,
        1,
        1
      );

      // For now, we'll handle this differently - we need the annotation details before deletion
      // This is a design consideration that should be addressed in the service
      
      // Delete annotation using the service
      await annotationService.deleteAnnotation(annotationId, this.socket.userId, this.socket.userRole);

      // Create a simplified event for deletion (we don't have all the original data)
      const annotationEvent = {
        type: 'annotation_deleted' as const,
        annotationId,
        authorId: this.socket.userId,
        timestamp: new Date(),
      };

      // Note: We can't broadcast to the specific content room because we don't have content info
      // This is a limitation that should be addressed by modifying the delete service to return content info
      console.log(`🗑️ Annotation ${annotationId} deleted by user ${this.socket.userId}`);
      
      // Send confirmation to the deleter
      this.socket.emit('annotation', annotationEvent as any);
    } catch (error) {
      console.error('Error deleting annotation:', error);
      this.socket.emit('error', 'Failed to delete annotation');
    }
  }

  private async handleResolveAnnotation(annotationId: string): Promise<void> {
    try {
      // Resolve annotation using the service
      const annotation = await annotationService.resolveAnnotation(
        annotationId,
        this.socket.userId,
        this.socket.userRole
      );

      // Create the event data
      const annotationEvent: AnnotationEvent = {
        type: 'annotation_resolved',
        annotationId: annotation.id,
        contentId: annotation.contentId,
        contentType: annotation.contentType,
        authorId: annotation.authorId,
        position: annotation.position as any,
        annotationType: annotation.annotationType,
        visibility: annotation.visibility,
        isResolved: true,
        timestamp: new Date(),
      };

      // Broadcast to all users in the content room
      const room = `content:${annotation.contentId}:${annotation.contentType}`;
      this.socket.to(room).emit('annotation', annotationEvent);
      
      // Send confirmation to the resolver
      this.socket.emit('annotation', annotationEvent);

      console.log(`✅ Annotation ${annotationId} resolved by user ${this.socket.userId}`);
    } catch (error) {
      console.error('Error resolving annotation:', error);
      this.socket.emit('error', 'Failed to resolve annotation');
    }
  }

  private handleDisconnect(): void {
    console.log(`👋 User ${this.socket.userId} disconnected from collaboration`);
  }
}

export { CollaborationHandler };
