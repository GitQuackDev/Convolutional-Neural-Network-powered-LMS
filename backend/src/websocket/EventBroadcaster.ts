/**
 * Event Broadcasting Service
 * Handles broadcasting events to WebSocket clients with room management
 */

import { Server } from 'socket.io';
import { MessageEvent, NotificationEvent, ProgressEvent } from './types';
import { ConnectionManager } from './ConnectionManager';

export class EventBroadcaster {
  constructor(
    private io: Server,
    private connectionManager: ConnectionManager
  ) {}

  /**
   * Broadcast message event to appropriate recipients
   */
  broadcastMessage(messageEvent: MessageEvent): void {
    try {
      const { courseId, channelId, senderId } = messageEvent;
      
      // Determine the room to broadcast to
      let room: string;
      if (courseId) {
        room = `course:${courseId}`;
      } else if (channelId) {
        room = `channel:${channelId}`;
      } else {
        console.warn('⚠️ Message event missing courseId and channelId');
        return;
      }

      // Broadcast to room
      this.io.to(room).emit('message', messageEvent);
      
      console.log(`📢 Message broadcasted to room ${room} from user ${senderId}`);
    } catch (error) {
      console.error('❌ Error broadcasting message:', error);
    }
  }

  /**
   * Broadcast notification to specific user or groups
   */
  broadcastNotification(notificationEvent: NotificationEvent): void {
    try {
      const { userId, notificationType, priority } = notificationEvent;
      
      // Send to user's personal room
      const userRoom = `user:${userId}`;
      this.io.to(userRoom).emit('notification', notificationEvent);
      
      // For high priority notifications, also send to all user's active connections
      if (priority === 'HIGH' || priority === 'URGENT') {
        const userConnections = this.connectionManager.getUserConnections(userId);
        userConnections.forEach(socket => {
          socket.emit('notification', notificationEvent);
        });
      }
      
      console.log(`🔔 Notification (${notificationType}) sent to user ${userId}`);
    } catch (error) {
      console.error('❌ Error broadcasting notification:', error);
    }
  }

  /**
   * Broadcast progress update for AI analysis or other long-running tasks
   */
  broadcastProgress(progressEvent: ProgressEvent): void {
    try {
      const { userId, analysisId, type, progress } = progressEvent;
      
      // Send to user's personal room
      const userRoom = `user:${userId}`;
      this.io.to(userRoom).emit('progress', progressEvent);
      
      // If analysis ID is provided, also send to analysis-specific room
      if (analysisId) {
        const analysisRoom = `analysis:${analysisId}`;
        this.io.to(analysisRoom).emit('progress', progressEvent);
      }
      
      const progressText = progress !== undefined ? ` (${progress}%)` : '';
      console.log(`📊 Progress (${type}) broadcasted to user ${userId}${progressText}`);
    } catch (error) {
      console.error('❌ Error broadcasting progress:', error);
    }
  }

  /**
   * Broadcast to all users in a specific course
   */
  broadcastToCourse(courseId: string, event: string, data: any): void {
    try {
      const room = `course:${courseId}`;
      this.io.to(room).emit(event, data);
      
      console.log(`📡 Event '${event}' broadcasted to course ${courseId}`);
    } catch (error) {
      console.error('❌ Error broadcasting to course:', error);
    }
  }

  /**
   * Broadcast to all connected users (system-wide announcements)
   */
  broadcastToAll(event: string, data: any): void {
    try {
      this.io.emit(event, data);
      
      console.log(`📺 Event '${event}' broadcasted to all connected users`);
    } catch (error) {
      console.error('❌ Error broadcasting to all users:', error);
    }
  }

  /**
   * Broadcast to users with specific role
   */
  broadcastToRole(role: 'STUDENT' | 'PROFESSOR' | 'ADMIN', event: string, data: any): void {
    try {
      const connections = this.connectionManager.getActiveConnections();
      
      connections.forEach(socket => {
        if (socket.data?.userRole === role) {
          socket.emit(event, data);
        }
      });
      
      console.log(`👥 Event '${event}' broadcasted to ${role} users`);
    } catch (error) {
      console.error('❌ Error broadcasting to role:', error);
    }
  }

  /**
   * Send private message to specific user
   */
  sendToUser(userId: string, event: string, data: any): void {
    try {
      const userRoom = `user:${userId}`;
      this.io.to(userRoom).emit(event, data);
      
      console.log(`📤 Event '${event}' sent to user ${userId}`);
    } catch (error) {
      console.error('❌ Error sending to user:', error);
    }
  }

  /**
   * Broadcast analytics event for real-time dashboard updates
   */
  broadcastAnalytics(analyticsEvent: { type: string; data: any }): void {
    try {
      // Broadcast to analytics namespace for admin dashboard
      this.io.of('/analytics').emit('analytics-update', analyticsEvent);
      
      console.log(`📊 Analytics event broadcasted: ${analyticsEvent.type}`);
    } catch (error) {
      console.error('❌ Error broadcasting analytics:', error);
    }
  }

  /**
   * Get broadcasting statistics
   */
  getBroadcastStats(): {
    totalRooms: number;
    roomNames: string[];
    connectionsPerRoom: Record<string, number>;
  } {
    const rooms = this.io.sockets.adapter.rooms;
    const roomNames = Array.from(rooms.keys()).filter(name => !name.startsWith('socketio'));
    
    const connectionsPerRoom: Record<string, number> = {};
    roomNames.forEach(roomName => {
      const room = rooms.get(roomName);
      connectionsPerRoom[roomName] = room ? room.size : 0;
    });

    return {
      totalRooms: roomNames.length,
      roomNames,
      connectionsPerRoom
    };
  }
}
