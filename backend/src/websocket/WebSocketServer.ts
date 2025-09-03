/**
 * WebSocket Server Implementation
 * Main WebSocket server with Socket.io integration for Express.js
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Socket } from 'socket.io';
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData,
  AuthenticatedSocket
} from './types';
import { authenticateSocket } from './AuthMiddleware';
import { ConnectionManager } from './ConnectionManager';
import { EventBroadcaster } from './EventBroadcaster';
import { CollaborationHandler } from './CollaborationHandler';
import { InsightsHandler } from './InsightsHandler';
import { AdvancedInsightsService } from '../services/advancedInsightsService';

export class WebSocketServer {
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > | null = null;
  
  private connectionManager: ConnectionManager | null = null;
  private eventBroadcaster: EventBroadcaster | null = null;
  private insightsHandler: InsightsHandler | null = null;

  /**
   * Initialize WebSocket server with Express.js HTTP server
   */
  initialize(httpServer: HttpServer): void {
    try {
      // Configure CORS origins for WebSocket - match main server CORS
      const allowedOrigins = process.env['NODE_ENV'] === 'development' 
        ? ['http://localhost:5173', 'http://localhost:5174'] 
        : [process.env['FRONTEND_URL'] || 'http://localhost:5173'];

      // Configure Socket.io server
      this.io = new SocketIOServer(httpServer, {
        cors: {
          origin: allowedOrigins,
          methods: ['GET', 'POST'],
          credentials: true
        },
        pingTimeout: parseInt(process.env['WEBSOCKET_PING_TIMEOUT'] || '60000'),
        pingInterval: parseInt(process.env['WEBSOCKET_PING_INTERVAL'] || '25000'),
        maxHttpBufferSize: 1e6, // 1MB
        allowEIO3: true
      });

      // Initialize connection manager and event broadcaster
      this.connectionManager = new ConnectionManager();
      this.eventBroadcaster = new EventBroadcaster(this.io, this.connectionManager);
      
      // Initialize insights handler
      const insightsService = new AdvancedInsightsService();
      this.insightsHandler = new InsightsHandler(
        insightsService,
        this.eventBroadcaster,
        this.connectionManager
      );

      // Setup authentication middleware
      this.io.use(authenticateSocket);

      // Setup connection handlers
      this.setupConnectionHandlers();

      // Setup namespace handlers
      this.setupNamespaces();

      console.log('🚀 WebSocket server initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket server:', error);
      throw error;
    }
  }

  /**
   * Setup main connection handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.io || !this.connectionManager) return;

    this.io.on('connection', (socket: Socket) => {
      const userData = socket.data as SocketData;
      console.log(`🔌 User connected: ${userData.userId} (${userData.userRole})`);

      // Track connection
      this.connectionManager!.trackConnection(socket);

      // Send connection confirmation
      socket.emit('connected', {
        userId: userData.userId,
        timestamp: new Date()
      });

      // Setup socket event handlers
      this.setupSocketHandlers(socket);
    });
  }

  /**
   * Setup individual socket event handlers
   */
  private setupSocketHandlers(socket: Socket): void {
    const userData = socket.data as SocketData;

    // Handle room joining
    socket.on('join_room', (room: string) => {
      // Validate room access (course enrollment, channel permissions, etc.)
      if (this.validateRoomAccess(room, userData.userId)) {
        socket.join(room);
        console.log(`👥 User ${userData.userId} joined room: ${room}`);
      } else {
        socket.emit('error', `Access denied to room: ${room}`);
      }
    });

    // Handle room leaving
    socket.on('leave_room', (room: string) => {
      socket.leave(room);
      console.log(`👋 User ${userData.userId} left room: ${room}`);
    });

    // Handle message sending
    socket.on('send_message', (messageData) => {
      // TODO: Validate message data and save to database
      // TODO: Broadcast message using EventBroadcaster
      console.log(`💬 Message from user ${userData.userId}:`, messageData);
    });

    // Handle notification read status
    socket.on('mark_notification_read', (notificationId: string) => {
      // TODO: Update notification status in database
      console.log(`✅ User ${userData.userId} marked notification ${notificationId} as read`);
    });

    // Handle heartbeat
    socket.on('heartbeat', () => {
      socket.emit('heartbeat_response');
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User ${userData.userId} disconnected: ${reason}`);
      
      // Emit disconnection event
      socket.broadcast.emit('disconnected', {
        userId: userData.userId,
        timestamp: new Date()
      });
    });
  }

  /**
   * Setup WebSocket namespaces for different features
   */
  private setupNamespaces(): void {
    if (!this.io) return;

    // Chat namespace for real-time messaging
    const chatNamespace = this.io.of('/chat');
    chatNamespace.use(authenticateSocket);
    chatNamespace.on('connection', (socket) => {
      console.log('📱 Client connected to chat namespace');
      // TODO: Setup chat-specific handlers (will be implemented in Story 1.7)
    });

    // Notifications namespace
    const notificationNamespace = this.io.of('/notifications');
    notificationNamespace.use(authenticateSocket);
    notificationNamespace.on('connection', (socket) => {
      console.log('🔔 Client connected to notifications namespace');
      // TODO: Setup notification-specific handlers
    });

    // Analytics namespace for real-time analytics and progress
    const analyticsNamespace = this.io.of('/analytics');
    analyticsNamespace.use(authenticateSocket);
    analyticsNamespace.on('connection', (socket) => {
      console.log('📊 Client connected to analytics namespace');
      
      const socketData = socket.data as SocketData;
      if (socketData?.userId && this.insightsHandler) {
        this.insightsHandler.handleConnection(socket, socketData.userId);
        
        // Setup disconnection handler
        socket.on('disconnect', () => {
          if (this.insightsHandler) {
            this.insightsHandler.handleDisconnection(socket, socketData.userId);
          }
        });
      }
    });

    // Collaboration namespace for annotations and collaborative features
    const collaborationNamespace = this.io.of('/collaboration');
    collaborationNamespace.use(authenticateSocket);
    collaborationNamespace.on('connection', (socket) => {
      console.log('🤝 Client connected to collaboration namespace');
      
      // Initialize collaboration handler for this socket
      new CollaborationHandler(socket as AuthenticatedSocket);
    });
  }

  /**
   * Validate if user can access a specific room
   */
  private validateRoomAccess(room: string, userId: string): boolean {
    // Parse room type and ID
    const [roomType, roomId] = room.split(':');
    
    switch (roomType) {
      case 'course':
        // TODO: Check if user is enrolled in course (Story 1.4)
        return true;
      case 'channel':
        // TODO: Check channel permissions (Story 1.7)
        return true;
      case 'user':
        // Users can only join their own user room
        return roomId === userId;
      case 'analysis':
        // TODO: Check if user owns the analysis (Story 1.5)
        return true;
      default:
        return false;
    }
  }

  /**
   * Get WebSocket server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Get connection manager instance
   */
  getConnectionManager(): ConnectionManager | null {
    return this.connectionManager;
  }

  /**
   * Get event broadcaster instance
   */
  getEventBroadcaster(): EventBroadcaster | null {
    return this.eventBroadcaster;
  }

  /**
   * Get insights handler instance
   */
  getInsightsHandler(): InsightsHandler | null {
    return this.insightsHandler;
  }

  /**
   * Get server statistics
   */
  getServerStats(): {
    isInitialized: boolean;
    connectionStats?: ReturnType<ConnectionManager['getConnectionStats']>;
    broadcastStats?: ReturnType<EventBroadcaster['getBroadcastStats']>;
    insightsStats?: any;
  } {
    if (!this.io || !this.connectionManager || !this.eventBroadcaster) {
      return { isInitialized: false };
    }

    return {
      isInitialized: true,
      connectionStats: this.connectionManager.getConnectionStats(),
      broadcastStats: this.eventBroadcaster.getBroadcastStats(),
      insightsStats: this.insightsHandler?.getSubscriptionStats()
    };
  }

  /**
   * Handle graceful shutdown
   */
  async handleGracefulShutdown(): Promise<void> {
    console.log('🛑 WebSocket server shutting down...');

    try {
      // Shutdown connection manager
      if (this.connectionManager) {
        await this.connectionManager.shutdown();
      }

      // Close Socket.io server
      if (this.io) {
        await new Promise<void>((resolve) => {
          this.io!.close(() => {
            console.log('✅ WebSocket server closed');
            resolve();
          });
        });
      }

    } catch (error) {
      console.error('❌ Error during WebSocket server shutdown:', error);
    }
  }
}
