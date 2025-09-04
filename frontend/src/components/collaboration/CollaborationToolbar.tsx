/**
 * Collaboration Toolbar Component
 * Story 2.7: Collaborative Features Integration
 * Task 2.7.1: Unified Collaborative Workspace Development
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

import {
  Play,
  Square,
  Users,
  UserPlus,
  MessageSquare,
  PenTool,
  Video,
  Mic,
  MicOff,
  Volume2,
  Share2,
  Settings,
  MoreHorizontal,
  Hand,
  Highlighter,
  FileText,
  Download,
  Upload,
  BarChart3
} from 'lucide-react';

import { cn } from '@/lib/utils';

export interface CollaborationToolbarProps {
  isRecording: boolean;
  recordingDuration?: number;
  participantCount: number;
  activeTools: string[];
  userPermissions: {
    canRecord: boolean;
    canInvite: boolean;
    canModerate: boolean;
    canAnnotate: boolean;
    canShare: boolean;
  };
  onRecordingToggle: () => void;
  onToolToggle: (tool: string) => void;
  onInviteParticipants: () => void;
  onShareSession: () => void;
  onSettingsOpen: () => void;
  className?: string;
}

/**
 * Collaboration Toolbar - Quick access to collaboration tools
 * Context-aware toolbar that adapts to content type and user permissions
 */
export const CollaborationToolbar: React.FC<CollaborationToolbarProps> = ({
  isRecording,
  recordingDuration = 0,
  participantCount,
  activeTools,
  userPermissions,
  onRecordingToggle,
  onToolToggle,
  onInviteParticipants,
  onShareSession,
  onSettingsOpen,
  className
}) => {
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToolToggle = (tool: string) => {
    onToolToggle(tool);
    toast(`${tool} ${activeTools.includes(tool) ? 'disabled' : 'enabled'}`);
  };

  const handleMicToggle = () => {
    setIsMuted(!isMuted);
    toast(isMuted ? "Microphone enabled" : "Microphone muted");
  };

  const handleVideoToggle = () => {
    setIsVideoEnabled(!isVideoEnabled);
    toast(isVideoEnabled ? "Video disabled" : "Video enabled");
  };

  return (
    <div className={cn("flex items-center justify-between bg-white border-b px-4 py-2", className)}>
      {/* Left Section - Recording Controls */}
      <div className="flex items-center space-x-3">
        {userPermissions.canRecord && (
          <>
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              onClick={onRecordingToggle}
              className="flex items-center space-x-2"
            >
              {isRecording ? (
                <>
                  <Square className="h-4 w-4" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Record</span>
                </>
              )}
            </Button>
            
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-mono text-red-600">
                    {formatDuration(recordingDuration)}
                  </span>
                </div>
                <Badge variant="destructive" className="text-xs">
                  LIVE
                </Badge>
              </div>
            )}
            
            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {/* Audio/Video Controls */}
        <div className="flex items-center space-x-1">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="sm"
            onClick={handleMicToggle}
            className="h-8 w-8 p-0"
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          <Button
            variant={isVideoEnabled ? "default" : "outline"}
            size="sm"
            onClick={handleVideoToggle}
            className="h-8 w-8 p-0"
          >
            <Video className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Volume2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Center Section - Collaboration Tools */}
      <div className="flex items-center space-x-2">
        {/* Core Collaboration Tools */}
        <div className="flex items-center space-x-1">
          <Button
            variant={activeTools.includes('chat') ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolToggle('chat')}
            className="flex items-center space-x-1"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </Button>
          
          {userPermissions.canAnnotate && (
            <Button
              variant={activeTools.includes('annotation') ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolToggle('annotation')}
              className="flex items-center space-x-1"
            >
              <PenTool className="h-4 w-4" />
              <span className="hidden sm:inline">Annotate</span>
            </Button>
          )}
          
          <Button
            variant={activeTools.includes('whiteboard') ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolToggle('whiteboard')}
            className="flex items-center space-x-1"
          >
            <Highlighter className="h-4 w-4" />
            <span className="hidden sm:inline">Board</span>
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Additional Tools Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4 mr-1" />
              Tools
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            <DropdownMenuItem onClick={() => handleToolToggle('poll')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Create Poll
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToolToggle('quiz')}>
              <FileText className="h-4 w-4 mr-2" />
              Quick Quiz
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToolToggle('hand-raise')}>
              <Hand className="h-4 w-4 mr-2" />
              Raise Hand
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToolToggle('screen-share')}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Screen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleToolToggle('file-share')}>
              <Upload className="h-4 w-4 mr-2" />
              Share Files
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToolToggle('export')}>
              <Download className="h-4 w-4 mr-2" />
              Export Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right Section - Session Management */}
      <div className="flex items-center space-x-3">
        {/* Participants Indicator */}
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-600" />
          <Badge variant="outline" className="text-xs">
            {participantCount} online
          </Badge>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Session Actions */}
        <div className="flex items-center space-x-1">
          {userPermissions.canInvite && (
            <Button
              variant="outline"
              size="sm"
              onClick={onInviteParticipants}
              className="flex items-center space-x-1"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Invite</span>
            </Button>
          )}
          
          {userPermissions.canShare && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShareSession}
              className="flex items-center space-x-1"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onSettingsOpen}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CollaborationToolbar;
