/**
 * Collaborative Workspace Component
 * Story 2.7: Collaborative Features Integration
 * Task 2.7.1: Unified Collaborative Workspace Development
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

import {
  Users,
  MessageSquare,
  PenTool,
  Settings,
  MoreHorizontal,
  Clock,
  Activity,
  Volume2,
  VolumeX,
  Crown,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

import { cn } from '@/lib/utils';

// Enhanced type definitions for collaborative workspace
export interface CollaborativeWorkspace {
  sessionId: string;
  contentId: string;
  contentType: 'course_module' | 'ai_analysis' | 'assignment' | 'discussion';
  participants: CollaborationParticipant[];
  activeTools: CollaborationTool[];
  mode: 'focus' | 'discussion' | 'review' | 'presentation';
  settings: WorkspaceSettings;
  isRecording: boolean;
  recordingStartTime?: Date;
}

export interface CollaborationParticipant {
  userId: string;
  userName: string;
  avatar?: string;
  role: 'student' | 'instructor' | 'ta' | 'admin';
  status: 'active' | 'idle' | 'away' | 'offline';
  permissions: CollaborationPermissions;
  lastActivity: Date;
  contributions: ParticipationMetrics;
  isTyping?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
}

export interface CollaborationTool {
  type: 'chat' | 'annotation' | 'whiteboard' | 'poll' | 'quiz' | 'breakout';
  isActive: boolean;
  configuration: ToolConfiguration;
  participants: string[];
  unreadCount?: number;
}

export interface CollaborationPermissions {
  canAnnotate: boolean;
  canChat: boolean;
  canModerate: boolean;
  canRecord: boolean;
  canInvite: boolean;
  canEditContent: boolean;
}

export interface ParticipationMetrics {
  messagesCount: number;
  annotationsCount: number;
  timeActive: number;
  lastContribution: Date;
  engagementScore: number;
}

export interface WorkspaceSettings {
  allowAnonymousParticipation: boolean;
  requireModeration: boolean;
  enableRecording: boolean;
  maxParticipants: number;
  collaborationMode: 'open' | 'moderated' | 'instructor_led';
}

export interface ToolConfiguration {
  isVisible: boolean;
  permissions: string[];
  settings: Record<string, unknown>;
}

interface CollaborativeWorkspaceProps {
  workspace: CollaborativeWorkspace;
  onWorkspaceUpdate: (workspace: Partial<CollaborativeWorkspace>) => void;
  onParticipantAction: (participantId: string, action: string, data?: Record<string, unknown>) => void;
  onToolActivate: (toolType: string, configuration?: ToolConfiguration) => void;
  onModeChange: (mode: CollaborativeWorkspace['mode']) => void;
  className?: string;
}

/**
 * Collaborative Workspace - Unified collaboration interface
 * Integrates chat, annotations, and collaboration tools
 */
export const CollaborativeWorkspace: React.FC<CollaborativeWorkspaceProps> = ({
  workspace,
  onWorkspaceUpdate,
  onParticipantAction,
  onToolActivate,
  onModeChange,
  className
}) => {
  const { toast } = useToast();
  const [selectedTool, setSelectedTool] = useState<string>('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Real-time participant updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      const updatedParticipants = workspace.participants.map(p => ({
        ...p,
        lastActivity: p.status === 'active' ? new Date() : p.lastActivity
      }));
      
      onWorkspaceUpdate({ participants: updatedParticipants });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [workspace.participants, onWorkspaceUpdate]);

  const handleToolSelect = (toolType: string) => {
    setSelectedTool(toolType);
    onToolActivate(toolType);
  };

  const handleModeChange = (mode: CollaborativeWorkspace['mode']) => {
    onModeChange(mode);
    toast(`Switched to ${mode} mode`);
  };

  const handleParticipantAction = (participantId: string, action: string) => {
    onParticipantAction(participantId, action);
    
    const participant = workspace.participants.find(p => p.userId === participantId);
    if (participant) {
      toast(`${action} applied to ${participant.userName}`);
    }
  };

  const getParticipantStatusIcon = (status: CollaborationParticipant['status']) => {
    switch (status) {
      case 'active': return <Activity className="h-3 w-3 text-green-500" />;
      case 'idle': return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'away': return <Clock className="h-3 w-3 text-orange-500" />;
      case 'offline': return <div className="h-3 w-3 rounded-full bg-gray-400" />;
    }
  };

  const activeParticipants = workspace.participants.filter(p => p.status === 'active');

  return (
    <div className={cn("flex h-full bg-gray-50", className)}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Collaboration Toolbar */}
        <Card className="rounded-none border-x-0 border-t-0">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Collaborative Session</span>
                  <Badge variant={workspace.isRecording ? "destructive" : "secondary"}>
                    {workspace.isRecording ? "Recording" : workspace.mode}
                  </Badge>
                </div>
                
                <Separator orientation="vertical" className="h-6" />
                
                {/* Mode Switcher */}
                <div className="flex space-x-1">
                  {(['focus', 'discussion', 'review', 'presentation'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={workspace.mode === mode ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleModeChange(mode)}
                      className="capitalize"
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  {sidebarCollapsed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {sidebarCollapsed ? 'Show' : 'Hide'} Sidebar
                </Button>
                
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
                
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Area - This would integrate with existing content components */}
        <div className="flex-1 p-6">
          <Card className="h-full">
            <CardContent className="p-6 h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <Users className="h-16 w-16 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Collaborative Content Area</h3>
                  <p className="text-gray-600 mt-2">
                    This area integrates with existing course content, AI analysis results,
                    and assignment interfaces to provide collaborative features.
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-gray-500">
                    <div>• Real-time collaborative annotations</div>
                    <div>• Integrated chat discussions</div>
                    <div>• Shared content review and analysis</div>
                    <div>• Collaborative AI result interpretation</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Collaborative Sidebar */}
      {!sidebarCollapsed && (
        <div className="w-80 border-l bg-white flex flex-col">
          {/* Participants Header */}
          <Card className="rounded-none border-x-0 border-t-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Participants ({workspace.participants.length})</span>
                </div>
                <Badge variant="outline">
                  {activeParticipants.length} active
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Collaboration Tools Tabs */}
          <Tabs value={selectedTool} onValueChange={handleToolSelect} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-3 mx-4 mt-4">
              <TabsTrigger value="chat" className="flex items-center space-x-1">
                <MessageSquare className="h-3 w-3" />
                <span>Chat</span>
                {workspace.activeTools.find(t => t.type === 'chat')?.unreadCount && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                    {workspace.activeTools.find(t => t.type === 'chat')?.unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              
              <TabsTrigger value="annotation" className="flex items-center space-x-1">
                <PenTool className="h-3 w-3" />
                <span>Notes</span>
              </TabsTrigger>
              
              <TabsTrigger value="participants" className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>People</span>
              </TabsTrigger>
            </TabsList>

            {/* Chat Tool */}
            <TabsContent value="chat" className="flex-1 px-4 pb-4">
              <Card className="h-full">
                <CardContent className="p-4 h-full flex flex-col">
                  <div className="flex-1 mb-4">
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Integrated chat interface</p>
                      <p className="text-xs mt-1">Real-time messaging with annotation integration</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>• Context-aware messaging</div>
                      <div>• Annotation references</div>
                      <div>• Message threading</div>
                      <div>• File sharing integration</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Annotation Tool */}
            <TabsContent value="annotation" className="flex-1 px-4 pb-4">
              <Card className="h-full">
                <CardContent className="p-4 h-full flex flex-col">
                  <div className="flex-1 mb-4">
                    <div className="text-center py-8 text-gray-500">
                      <PenTool className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Collaborative annotations</p>
                      <p className="text-xs mt-1">Real-time collaborative content annotation</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>• Real-time collaboration</div>
                      <div>• Annotation discussions</div>
                      <div>• Version tracking</div>
                      <div>• Moderation controls</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Participants Panel */}
            <TabsContent value="participants" className="flex-1 px-4 pb-4">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {workspace.participants.map((participant) => (
                    <Card key={participant.userId} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                              {participant.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1">
                              {getParticipantStatusIcon(participant.status)}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium truncate">
                                {participant.userName}
                              </p>
                              {participant.role === 'instructor' && (
                                <Crown className="h-3 w-3 text-yellow-500" />
                              )}
                              {participant.role === 'ta' && (
                                <Shield className="h-3 w-3 text-blue-500" />
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {participant.role}
                              </Badge>
                              {participant.isTyping && (
                                <Badge variant="secondary" className="text-xs">
                                  typing...
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          {participant.isMuted ? (
                            <VolumeX className="h-3 w-3 text-gray-400" />
                          ) : (
                            <Volume2 className="h-3 w-3 text-gray-600" />
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleParticipantAction(participant.userId, 'more_options')}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Participation Metrics */}
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
                        <div className="text-center">
                          <div className="font-medium">{participant.contributions.messagesCount}</div>
                          <div>Messages</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{participant.contributions.annotationsCount}</div>
                          <div>Notes</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{Math.round(participant.contributions.engagementScore)}%</div>
                          <div>Engaged</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default CollaborativeWorkspace;
