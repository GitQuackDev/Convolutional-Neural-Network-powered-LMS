/**
 * Communication Feature Types
 * Types and interfaces for in-context chat and messaging features
 */

export interface ChatMessage {
  id: string;
  content: string;
  messageType: MessageType;
  senderId: string;
  courseId?: string;
  channelId?: string;
  isEdited: boolean;
  editedAt?: Date;
  readBy: string[];
  createdAt: Date;
  sender: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    role: 'student' | 'professor' | 'admin';
  };
}

export const MessageType = {
  TEXT: 'TEXT',
  FILE: 'FILE',
  SYSTEM: 'SYSTEM'
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType];

export interface OnlineUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'student' | 'professor' | 'admin';
  lastSeen: Date;
  isTyping: boolean;
}

export interface ChatPermissions {
  canSend: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canModerate: boolean;
  canViewHistory: boolean;
}

export interface CourseContext {
  courseId: string;
  userRole: 'student' | 'professor' | 'admin';
  isEnrolled: boolean;
  permissions: ChatPermissions;
}

export interface InContextChatProps {
  courseId: string;
  moduleId?: string;
  contentId?: string;
  context: 'course' | 'module' | 'content';
  embedded?: boolean;
  initiallyExpanded?: boolean;
  className?: string;
}

export interface ChatWidgetProps {
  courseId: string;
  position: 'sidebar' | 'overlay' | 'inline' | 'bottom';
  collapsible?: boolean;
  showParticipants?: boolean;
  className?: string;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId: string;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  className?: string;
}

export interface MessageInputProps {
  onSendMessage: (content: string, type: MessageType) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export interface ChatUserListProps {
  users: OnlineUser[];
  currentUserId: string;
  showTypingIndicator?: boolean;
  className?: string;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  onlineUsers: OnlineUser[];
  isConnected: boolean;
  isTyping: boolean;
  sendMessage: (content: string, type: MessageType) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  loadHistory: (before?: Date, limit?: number) => Promise<ChatMessage[]>;
  markAsRead: (messageId: string) => void;
  setTyping: (typing: boolean) => void;
}

export interface ChatWebSocketEvents {
  'message_sent': (message: ChatMessage) => void;
  'message_edited': (messageId: string, content: string, editedAt: Date) => void;
  'message_deleted': (messageId: string) => void;
  'user_typing': (userId: string, isTyping: boolean) => void;
  'user_joined': (user: OnlineUser) => void;
  'user_left': (userId: string) => void;
  'user_online_status': (userId: string, isOnline: boolean) => void;
}

export const ChatIntegrationModes = {
  SIDEBAR: 'sidebar',
  OVERLAY: 'overlay', 
  INLINE: 'inline',
  BOTTOM: 'bottom'
} as const;

export type ChatIntegrationMode = typeof ChatIntegrationModes[keyof typeof ChatIntegrationModes];

export interface ChatNotificationProps {
  newMessageCount: number;
  lastMessage?: ChatMessage;
  muted?: boolean;
  onMarkAllRead: () => void;
  className?: string;
}
