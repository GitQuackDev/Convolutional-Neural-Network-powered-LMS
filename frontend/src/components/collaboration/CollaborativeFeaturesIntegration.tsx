/**
 * Story 2.7: Collaborative Features Integration - Main Component
 * Integrates collaborative annotations (Story 1.8) with real-time communication (Story 1.7)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CollaborativeWorkspace } from './CollaborativeWorkspace';
import { CollaborationToolbar } from './CollaborationToolbar';
import { IntegratedChatAnnotation } from './IntegratedChatAnnotation';

import {
  Users,
  MessageSquare,
  PenTool,
  BarChart3,
  Calendar,
  Settings,
  Play,
  UserPlus
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface CollaborativeFeaturesIntegrationProps {
  courseId?: string;
  contentId?: string;
  contentType?: 'course_module' | 'ai_analysis' | 'assignment' | 'discussion';
  initialMode?: 'workspace' | 'dashboard' | 'session';
  className?: string;
}

/**
 * Story 2.7: Collaborative Features Integration
 * Main component that brings together all collaborative features
 */
export const CollaborativeFeaturesIntegration: React.FC<CollaborativeFeaturesIntegrationProps> = ({
  contentId = 'content-456',
  contentType = 'course_module',
  initialMode = 'workspace',
  className
}) => {
  const [activeMode, setActiveMode] = useState(initialMode);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Sample data for demonstration
  const [workspace, setWorkspace] = useState<CollaborativeWorkspace>({
    sessionId: 'session-789',
    contentId,
    contentType,
    participants: [
      {
        userId: 'user-1',
        userName: 'Dr. Sarah Johnson',
        role: 'instructor' as const,
        status: 'active' as const,
        permissions: {
          canAnnotate: true,
          canChat: true,
          canModerate: true,
          canRecord: true,
          canInvite: true,
          canEditContent: true
        },
        lastActivity: new Date(),
        contributions: {
          messagesCount: 12,
          annotationsCount: 5,
          timeActive: 3600,
          lastContribution: new Date(),
          engagementScore: 95
        },
        isTyping: false,
        isSpeaking: false,
        isMuted: false
      },
      {
        userId: 'user-2',
        userName: 'Alex Chen',
        role: 'student' as const,
        status: 'active' as const,
        permissions: {
          canAnnotate: true,
          canChat: true,
          canModerate: false,
          canRecord: false,
          canInvite: false,
          canEditContent: false
        },
        lastActivity: new Date(),
        contributions: {
          messagesCount: 8,
          annotationsCount: 3,
          timeActive: 2400,
          lastContribution: new Date(),
          engagementScore: 78
        },
        isTyping: true,
        isSpeaking: false,
        isMuted: false
      },
      {
        userId: 'user-3',
        userName: 'Maria Garcia',
        role: 'student' as const,
        status: 'idle' as const,
        permissions: {
          canAnnotate: true,
          canChat: true,
          canModerate: false,
          canRecord: false,
          canInvite: false,
          canEditContent: false
        },
        lastActivity: new Date(Date.now() - 300000), // 5 minutes ago
        contributions: {
          messagesCount: 4,
          annotationsCount: 7,
          timeActive: 1800,
          lastContribution: new Date(Date.now() - 300000),
          engagementScore: 82
        },
        isTyping: false,
        isSpeaking: false,
        isMuted: false
      }
    ],
    activeTools: [
      {
        type: 'chat' as const,
        isActive: true,
        configuration: { isVisible: true, permissions: [], settings: {} },
        participants: ['user-1', 'user-2', 'user-3'],
        unreadCount: 2
      },
      {
        type: 'annotation' as const,
        isActive: true,
        configuration: { isVisible: true, permissions: [], settings: {} },
        participants: ['user-1', 'user-2', 'user-3']
      }
    ],
    mode: 'discussion' as const,
    settings: {
      allowAnonymousParticipation: false,
      requireModeration: true,
      enableRecording: true,
      maxParticipants: 25,
      collaborationMode: 'moderated' as const
    },
    isRecording: false
  });

  const [messages] = useState([
    {
      id: 'msg-1',
      content: 'Welcome to our collaborative analysis session! Let\'s discuss the AI results.',
      authorId: 'user-1',
      authorName: 'Dr. Sarah Johnson',
      timestamp: new Date(Date.now() - 600000),
      type: 'text' as const
    },
    {
      id: 'msg-2',
      content: 'I found the confidence scores interesting. Should we annotate the visualization?',
      authorId: 'user-2',
      authorName: 'Alex Chen',
      timestamp: new Date(Date.now() - 300000),
      type: 'text' as const
    },
    {
      id: 'msg-3',
      content: '@annotation:ann-1 Great point about the model comparison!',
      authorId: 'user-3',
      authorName: 'Maria Garcia',
      timestamp: new Date(Date.now() - 120000),
      type: 'annotation_reference' as const
    }
  ]);

  const [annotations] = useState([
    {
      id: 'ann-1',
      content: 'The GPT-4 model shows 94% confidence here, significantly higher than Claude-3',
      position: { x: 150, y: 200 },
      authorId: 'user-2',
      authorName: 'Alex Chen',
      timestamp: new Date(Date.now() - 400000),
      relatedMessages: ['msg-3'],
      isResolved: false
    },
    {
      id: 'ann-2',
      content: 'This correlation pattern needs further investigation',
      position: { x: 300, y: 150 },
      authorId: 'user-3',
      authorName: 'Maria Garcia',
      timestamp: new Date(Date.now() - 180000),
      relatedMessages: [],
      isResolved: true
    }
  ]);

  // Recording timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const handleWorkspaceUpdate = (updates: Partial<typeof workspace>) => {
    setWorkspace(prev => ({ ...prev, ...updates }));
  };

  const handleParticipantAction = (participantId: string, action: string) => {
    console.log('Participant action:', participantId, action);
  };

  const handleToolActivate = (toolType: string) => {
    console.log('Tool activated:', toolType);
  };

  const handleModeChange = (mode: 'focus' | 'discussion' | 'review' | 'presentation') => {
    setWorkspace(prev => ({ ...prev, mode }));
  };

  const handleRecordingToggle = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setRecordingDuration(0);
    }
    setWorkspace(prev => ({ ...prev, isRecording: !isRecording }));
  };

  const userPermissions = {
    canRecord: true,
    canInvite: true,
    canModerate: true,
    canAnnotate: true,
    canShare: true
  };

  const handleSendMessage = (content: string) => {
    console.log('Sending message:', content);
  };

  const handleCreateAnnotation = (content: string, position: { x: number; y: number }) => {
    console.log('Creating annotation:', content, position);
  };

  const handleMessageReply = (messageId: string, content: string) => {
    console.log('Replying to message:', messageId, content);
  };

  return (
    <div className={cn("h-screen flex flex-col bg-gray-50", className)}>
      {/* Main Navigation */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-blue-600" />
                <span>Collaborative Learning Environment</span>
                <Badge variant="outline">Story 2.7</Badge>
              </div>
              
              <div className="flex space-x-1">
                {[
                  { id: 'workspace', label: 'Workspace', icon: Users },
                  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                  { id: 'session', label: 'Session', icon: Calendar }
                ].map(({ id, label, icon: Icon }) => (
                  <Button
                    key={id}
                    variant={activeMode === id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveMode(id as 'workspace' | 'dashboard' | 'session')}
                    className="flex items-center space-x-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-1" />
                Invite
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Collaboration Toolbar */}
      <CollaborationToolbar
        isRecording={isRecording}
        recordingDuration={recordingDuration}
        participantCount={workspace.participants.length}
        activeTools={workspace.activeTools.map(tool => tool.type)}
        userPermissions={userPermissions}
        onRecordingToggle={handleRecordingToggle}
        onToolToggle={handleToolActivate}
        onInviteParticipants={() => console.log('Invite participants')}
        onShareSession={() => console.log('Share session')}
        onSettingsOpen={() => console.log('Open settings')}
      />

      {/* Main Content Area */}
      <div className="flex-1">
        <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as 'workspace' | 'dashboard' | 'session')} className="h-full flex flex-col">
          {/* Workspace Mode - Main collaborative environment */}
          <TabsContent value="workspace" className="flex-1 m-0">
            <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-0">
              {/* Main Content with Collaborative Features */}
              <div className="lg:col-span-2">
                <CollaborativeWorkspace
                  workspace={workspace}
                  onWorkspaceUpdate={handleWorkspaceUpdate}
                  onParticipantAction={handleParticipantAction}
                  onToolActivate={handleToolActivate}
                  onModeChange={handleModeChange}
                  className="h-full"
                />
              </div>
              
              {/* Integrated Chat-Annotation Panel */}
              <div className="border-l bg-white">
                <IntegratedChatAnnotation
                  messages={messages}
                  annotations={annotations}
                  currentUserId="user-current"
                  contentId={contentId}
                  contentType={contentType}
                  onSendMessage={handleSendMessage}
                  onCreateAnnotation={handleCreateAnnotation}
                  onMessageReply={handleMessageReply}
                  onAnnotationDiscuss={() => {}}
                  onReferenceContent={() => {}}
                  className="h-full"
                />
              </div>
            </div>
          </TabsContent>

          {/* Dashboard Mode - Analytics and management */}
          <TabsContent value="dashboard" className="flex-1 m-0 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Collaboration Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {workspace.participants.length}
                      </div>
                      <div className="text-sm text-gray-600">Active Participants</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {messages.length + annotations.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Contributions</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(workspace.participants.reduce((acc, p) => acc + p.contributions.engagementScore, 0) / workspace.participants.length)}%
                      </div>
                      <div className="text-sm text-gray-600">Avg Engagement</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <div className="font-medium">Latest Messages</div>
                      <div className="text-gray-600 mt-1">
                        {messages.slice(-3).map(msg => (
                          <div key={msg.id} className="truncate">
                            {msg.authorName}: {msg.content.slice(0, 30)}...
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-medium">Recent Annotations</div>
                      <div className="text-gray-600 mt-1">
                        {annotations.slice(-2).map(ann => (
                          <div key={ann.id} className="truncate">
                            {ann.authorName}: {ann.content.slice(0, 30)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PenTool className="h-5 w-5" />
                    <span>Collaboration Tools</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workspace.activeTools.map(tool => (
                      <div key={tool.type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{tool.type}</span>
                        <Badge variant={tool.isActive ? "default" : "secondary"}>
                          {tool.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Session Mode - Session management */}
          <TabsContent value="session" className="flex-1 m-0 p-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>Session Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Session Management
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Manage collaborative sessions, recordings, and scheduled events.
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div>• Session scheduling and calendar integration</div>
                    <div>• Recording management and playback</div>
                    <div>• Participant management and permissions</div>
                    <div>• Session templates and workflows</div>
                    <div>• Analytics and assessment tools</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CollaborativeFeaturesIntegration;
