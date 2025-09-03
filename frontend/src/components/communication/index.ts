/**
 * Communication Components
 * Exports for in-context chat and messaging features
 */

export { InContextChat } from './InContextChat';
export { ChatWidget } from './ChatWidget';
export { MessageBubble } from './MessageBubble';
export { MessageInput } from './MessageInput';
export { ChatUserList } from './ChatUserList';

// Re-export types for convenience
export type {
  InContextChatProps,
  ChatWidgetProps,
  MessageBubbleProps,
  MessageInputProps,
  ChatUserListProps,
  ChatMessage,
  OnlineUser,
  ChatPermissions,
  CourseContext,
  UseChatReturn,
  ChatWebSocketEvents,
  ChatNotificationProps
} from '@/types/communication';

export {
  MessageType,
  ChatIntegrationModes
} from '@/types/communication';
