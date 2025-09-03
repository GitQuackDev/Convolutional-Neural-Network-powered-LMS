/**
 * WebSocket Connection Manager
 * Handles connection lifecycle, cleanup, and health monitoring
 */

import { Socket } from 'socket.io';
import { SocketData } from './types';

export class ConnectionManager {
  private connections: Map<string, Socket> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private connectionHealth: Map<string, Date> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startHeartbeatMonitoring();
  }

  /**
   * Track a new WebSocket connection
   */
  trackConnection(socket: Socket): void {
    const socketData = socket.data as SocketData;
    if (!socketData?.userId) {
      console.warn('⚠️ Attempting to track connection without user data');
      return;
    }

    const { userId } = socketData;
    const connectionId = socket.id;

    // Store socket reference
    this.connections.set(connectionId, socket);
    
    // Track user connections (users can have multiple connections)
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);
    
    // Update connection health
    this.connectionHealth.set(connectionId, new Date());
    
    // Setup connection event handlers
    this.setupConnectionHandlers(socket);
    
    console.log(`📱 Connection tracked: ${connectionId} for user ${userId}`);
    console.log(`👥 Active connections: ${this.connections.size}`);
  }

  /**
   * Clean up connection when socket disconnects
   */
  cleanupConnection(socketId: string): void {
    const socket = this.connections.get(socketId);
    if (!socket) return;

    const socketData = socket.data as SocketData;
    const userId = socketData?.userId;

    // Remove from connections map
    this.connections.delete(socketId);
    this.connectionHealth.delete(socketId);

    // Remove from user connections
    if (userId && this.userConnections.has(userId)) {
      const userSockets = this.userConnections.get(userId)!;
      userSockets.delete(socketId);
      
      // Remove user entry if no more connections
      if (userSockets.size === 0) {
        this.userConnections.delete(userId);
      }
    }

    console.log(`🗑️ Connection cleaned up: ${socketId}`);
    console.log(`👥 Active connections: ${this.connections.size}`);
  }

  /**
   * Get all active connections for a specific course
   */
  getActiveConnections(courseId?: string): Socket[] {
    if (!courseId) {
      return Array.from(this.connections.values());
    }

    return Array.from(this.connections.values()).filter(socket => {
      const socketData = socket.data as SocketData;
      return socketData?.courseIds?.includes(courseId);
    });
  }

  /**
   * Get all connections for a specific user
   */
  getUserConnections(userId: string): Socket[] {
    const socketIds = this.userConnections.get(userId);
    if (!socketIds) return [];

    return Array.from(socketIds)
      .map(id => this.connections.get(id))
      .filter((socket): socket is Socket => socket !== undefined);
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    totalConnections: number;
    uniqueUsers: number;
    averageConnectionsPerUser: number;
  } {
    const totalConnections = this.connections.size;
    const uniqueUsers = this.userConnections.size;
    const averageConnectionsPerUser = uniqueUsers > 0 ? totalConnections / uniqueUsers : 0;

    return {
      totalConnections,
      uniqueUsers,
      averageConnectionsPerUser: Number(averageConnectionsPerUser.toFixed(2))
    };
  }

  /**
   * Setup connection-specific event handlers
   */
  private setupConnectionHandlers(socket: Socket): void {
    // Handle heartbeat responses
    socket.on('heartbeat_response', () => {
      this.connectionHealth.set(socket.id, new Date());
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id}, reason: ${reason}`);
      this.cleanupConnection(socket.id);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  }

  /**
   * Start heartbeat monitoring for connection health
   */
  private startHeartbeatMonitoring(): void {
    const heartbeatInterval = parseInt(process.env['WEBSOCKET_PING_INTERVAL'] || '25000');
    const timeout = parseInt(process.env['WEBSOCKET_PING_TIMEOUT'] || '60000');

    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const staleConnections: string[] = [];

      // Check for stale connections
      for (const [connectionId, lastSeen] of this.connectionHealth.entries()) {
        const timeSinceLastSeen = now.getTime() - lastSeen.getTime();
        
        if (timeSinceLastSeen > timeout) {
          staleConnections.push(connectionId);
          continue;
        }

        // Send heartbeat ping
        const socket = this.connections.get(connectionId);
        if (socket) {
          socket.emit('heartbeat_ping');
        }
      }

      // Clean up stale connections
      staleConnections.forEach(connectionId => {
        const socket = this.connections.get(connectionId);
        if (socket) {
          console.log(`💔 Disconnecting stale connection: ${connectionId}`);
          socket.disconnect(true);
        }
        this.cleanupConnection(connectionId);
      });

    }, heartbeatInterval);
  }

  /**
   * Get all connections for users in a specific course
   */
  getCourseConnections(courseId: string): Array<{ userId: string; socket: Socket; socketId: string }> {
    const courseConnections: Array<{ userId: string; socket: Socket; socketId: string }> = [];
    
    // Iterate through all user connections
    for (const [userId, socketIds] of this.userConnections.entries()) {
      for (const socketId of socketIds) {
        const socket = this.connections.get(socketId);
        if (socket) {
          // Check if user is connected to this course
          const socketData = socket.data as SocketData;
          if (socketData?.courseIds?.includes(courseId)) {
            courseConnections.push({ userId, socket, socketId });
          }
        }
      }
    }
    
    return courseConnections;
  }

  /**
   * Graceful shutdown - disconnect all connections
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down connection manager...');

    // Clear heartbeat monitoring
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Disconnect all connections gracefully
    const disconnectPromises = Array.from(this.connections.values()).map(socket => {
      return new Promise<void>((resolve) => {
        socket.emit('server_shutdown', { message: 'Server is shutting down' });
        socket.disconnect(true);
        resolve();
      });
    });

    await Promise.all(disconnectPromises);

    // Clear all maps
    this.connections.clear();
    this.userConnections.clear();
    this.connectionHealth.clear();

    console.log('✅ Connection manager shutdown complete');
  }
}
