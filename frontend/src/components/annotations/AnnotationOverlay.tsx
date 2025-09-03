import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Edit, 
  Trash2, 
  Reply, 
  Eye, 
  EyeOff,
  Check,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Types for annotation data
export interface AnnotationPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  page?: number;
}

export interface AnnotationData {
  id: string;
  contentId: string;
  contentType: string;
  text: string;
  position: AnnotationPosition;
  annotationType: 'COMMENT' | 'QUESTION' | 'SUGGESTION' | 'HIGHLIGHT' | 'DRAWING' | 'BOOKMARK';
  visibility: 'PRIVATE' | 'COURSE' | 'INSTRUCTORS' | 'STUDY_GROUP' | 'PUBLIC';
  isResolved: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
  };
  replies?: AnnotationData[];
  createdAt: string;
  editedAt?: string;
  isEdited: boolean;
}

interface AnnotationOverlayProps {
  contentId: string;
  contentType: string;
  annotations: AnnotationData[];
  isVisible: boolean;
  isReadOnly?: boolean;
  onAnnotationCreate?: (position: AnnotationPosition, text: string, type: string) => void;
  onAnnotationUpdate?: (annotationId: string, text: string) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  onAnnotationResolve?: (annotationId: string) => void;
  onAnnotationReply?: (parentId: string, text: string) => void;
  onToggleVisibility?: () => void;
  className?: string;
}

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  annotations,
  isVisible,
  isReadOnly = false,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  onAnnotationResolve,
  onAnnotationReply,
  onToggleVisibility,
  className
}) => {
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isCreatingAnnotation, setIsCreatingAnnotation] = useState(false);
  const [newAnnotationPosition, setNewAnnotationPosition] = useState<AnnotationPosition | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [annotationText, setAnnotationText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const currentUser = { id: 'current-user-id' }; // TODO: Get from auth context

  // Handle content click for creating annotations
  const handleContentClick = useCallback((event: React.MouseEvent) => {
    if (isReadOnly || !onAnnotationCreate) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const position: AnnotationPosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      width: 0,
      height: 0,
    };

    setNewAnnotationPosition(position);
    setIsCreatingAnnotation(true);
    setAnnotationText('');
  }, [isReadOnly, onAnnotationCreate]);

  // Handle creating new annotation
  const handleCreateAnnotation = useCallback((type: string = 'COMMENT') => {
    if (!newAnnotationPosition || !annotationText.trim() || !onAnnotationCreate) return;

    onAnnotationCreate(newAnnotationPosition, annotationText.trim(), type);
    setIsCreatingAnnotation(false);
    setNewAnnotationPosition(null);
    setAnnotationText('');
  }, [newAnnotationPosition, annotationText, onAnnotationCreate]);

  // Handle editing annotation
  const handleEditAnnotation = useCallback((annotationId: string) => {
    const annotation = annotations.find(a => a.id === annotationId);
    if (!annotation || !onAnnotationUpdate) return;

    setEditingAnnotation(annotationId);
    setAnnotationText(annotation.text);
  }, [annotations, onAnnotationUpdate]);

  // Handle saving edited annotation
  const handleSaveEdit = useCallback(() => {
    if (!editingAnnotation || !annotationText.trim() || !onAnnotationUpdate) return;

    onAnnotationUpdate(editingAnnotation, annotationText.trim());
    setEditingAnnotation(null);
    setAnnotationText('');
  }, [editingAnnotation, annotationText, onAnnotationUpdate]);

  // Handle replying to annotation
  const handleReply = useCallback((parentId: string) => {
    if (!replyText.trim() || !onAnnotationReply) return;

    onAnnotationReply(parentId, replyText.trim());
    setReplyingTo(null);
    setReplyText('');
  }, [replyText, onAnnotationReply]);

  // Get annotation type color
  const getAnnotationColor = (type: string) => {
    switch (type) {
      case 'QUESTION': return 'bg-blue-500';
      case 'SUGGESTION': return 'bg-green-500';
      case 'HIGHLIGHT': return 'bg-yellow-500';
      case 'BOOKMARK': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Get annotation type icon
  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'QUESTION': return '?';
      case 'SUGGESTION': return '💡';
      case 'HIGHLIGHT': return '✨';
      case 'BOOKMARK': return '📌';
      default: return '💬';
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={overlayRef}
      className={cn('relative w-full h-full pointer-events-none', className)}
      onClickCapture={handleContentClick}
    >
      {/* Annotation markers */}
      {annotations.map((annotation) => (
        <div
          key={annotation.id}
          className="absolute pointer-events-auto"
          style={{
            left: annotation.position.x,
            top: annotation.position.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={selectedAnnotation === annotation.id ? 'default' : 'secondary'}
                size="sm"
                className={cn(
                  'w-8 h-8 rounded-full p-0 shadow-lg',
                  getAnnotationColor(annotation.annotationType),
                  annotation.isResolved && 'opacity-60',
                  'hover:scale-110 transition-transform'
                )}
                onClick={() => setSelectedAnnotation(annotation.id)}
              >
                <span className="text-xs text-white font-bold">
                  {getAnnotationIcon(annotation.annotationType)}
                </span>
              </Button>
            </PopoverTrigger>
            
            <PopoverContent className="w-80 p-0" side="right" align="start">
              <div className="space-y-3 p-4">
                {/* Annotation header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={annotation.author.avatar} />
                      <AvatarFallback className="text-xs">
                        {annotation.author.firstName[0]}{annotation.author.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {annotation.author.firstName} {annotation.author.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(annotation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Badge variant="secondary" className="text-xs">
                      {annotation.annotationType.toLowerCase()}
                    </Badge>
                    {annotation.isResolved && (
                      <Badge variant="outline" className="text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Annotation content */}
                <div className="space-y-2">
                  {editingAnnotation === annotation.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={annotationText}
                        onChange={(e) => setAnnotationText(e.target.value)}
                        placeholder="Edit your annotation..."
                        className="min-h-[60px]"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAnnotation(null)}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{annotation.text}</p>
                  )}
                  
                  {annotation.isEdited && (
                    <p className="text-xs text-muted-foreground italic">
                      (edited)
                    </p>
                  )}
                </div>

                {/* Annotation actions */}
                {!isReadOnly && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReplyingTo(annotation.id)}
                      >
                        <Reply className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                      
                      {annotation.author.id === currentUser.id && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditAnnotation(annotation.id)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onAnnotationDelete?.(annotation.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {!annotation.isResolved && onAnnotationResolve && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAnnotationResolve(annotation.id)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                )}

                {/* Reply section */}
                {replyingTo === annotation.id && (
                  <div className="space-y-2 pt-2 border-t">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="min-h-[60px]"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleReply(annotation.id)}
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {annotation.replies && annotation.replies.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium mb-2">
                      Replies ({annotation.replies.length})
                    </p>
                    <ScrollArea className="max-h-32">
                      <div className="space-y-2">
                        {annotation.replies.map((reply) => (
                          <div key={reply.id} className="text-xs space-y-1">
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={reply.author.avatar} />
                                <AvatarFallback className="text-xs">
                                  {reply.author.firstName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {reply.author.firstName}
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs ml-6">{reply.text}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ))}

      {/* New annotation creation */}
      {isCreatingAnnotation && newAnnotationPosition && (
        <div
          className="absolute pointer-events-auto z-50"
          style={{
            left: newAnnotationPosition.x,
            top: newAnnotationPosition.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <Card className="w-80 shadow-lg">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Add Annotation</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCreatingAnnotation(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <Textarea
                value={annotationText}
                onChange={(e) => setAnnotationText(e.target.value)}
                placeholder="Write your annotation..."
                className="min-h-[80px]"
                autoFocus
              />
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCreateAnnotation('COMMENT')}
                    disabled={!annotationText.trim()}
                  >
                    💬 Comment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCreateAnnotation('QUESTION')}
                    disabled={!annotationText.trim()}
                  >
                    ? Question
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCreateAnnotation('SUGGESTION')}
                    disabled={!annotationText.trim()}
                  >
                    💡 Suggest
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleCreateAnnotation()}
                  disabled={!annotationText.trim()}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Annotation visibility toggle */}
      {onToggleVisibility && (
        <div className="absolute top-4 right-4 pointer-events-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleVisibility}
            className="shadow-lg"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="ml-1 text-xs">
              Annotations ({annotations.length})
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};
