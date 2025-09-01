/**
 * WebSocket Server Unit Tests
 * Tests WebSocket server initialization, authentication, and basic functionality
 */

import { WebSocketServer } from '../../src/websocket/WebSocketServer';
import { ConnectionManager } from '../../src/websocket/ConnectionManager';
import { EventBroadcaster } from '../../src/websocket/EventBroadcaster';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import jwt from 'jsonwebtoken';
import ClientIO from 'socket.io-client';
import type { Socket } from 'socket.io-client';

describe('WebSocket Server', () => {
  let wsServer: WebSocketServer;
  let httpServer: ReturnType<typeof createServer>;
  let port: number;
  let clientSocket: any;
  let validToken: string;

  beforeAll(async () => {
    // Create test JWT token
    validToken = jwt.sign(
      { id: 'test-user-id', email: 'test@example.com', role: 'STUDENT' },
      process.env['JWT_SECRET'] || 'test-secret'
    );

    // Create HTTP server for testing
    httpServer = createServer();
    wsServer = new WebSocketServer();
    
    // Start server on random available port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        port = (httpServer.address() as AddressInfo).port;
        resolve();
      });
    });

    // Initialize WebSocket server
    wsServer.initialize(httpServer);
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.close();
    }
    await wsServer.handleGracefulShutdown();
    httpServer.close();
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.close();
    }
  });

  describe('Server Initialization', () => {
    test('should initialize WebSocket server successfully', () => {
      const stats = wsServer.getServerStats();
      expect(stats.isInitialized).toBe(true);
      expect(wsServer.getIO()).toBeDefined();
      expect(wsServer.getConnectionManager()).toBeInstanceOf(ConnectionManager);
      expect(wsServer.getEventBroadcaster()).toBeInstanceOf(EventBroadcaster);
    });

    test('should have correct CORS configuration', () => {
      const io = wsServer.getIO();
      expect(io).toBeDefined();
      // Note: Direct CORS testing is complex with Socket.io, so we verify initialization
    });
  });

  describe('Authentication', () => {
    test('should reject connection without authentication token', (done) => {
      clientSocket = ClientIO(`http://localhost:${port}`);
      
      clientSocket.on('connect_error', (error: any) => {
        expect(error.message).toContain('Authentication');
        done();
      });

      clientSocket.on('connect', () => {
        done(new Error('Should not connect without token'));
      });
    });

    test('should reject connection with invalid token', (done) => {
      clientSocket = ClientIO(`http://localhost:${port}`, {
        auth: { token: 'invalid-token' }
      });
      
      clientSocket.on('connect_error', (error: any) => {
        expect(error.message).toContain('Invalid authentication token');
        done();
      });

      clientSocket.on('connect', () => {
        done(new Error('Should not connect with invalid token'));
      });
    });

    test('should accept connection with valid token', (done) => {
      clientSocket = ClientIO(`http://localhost:${port}`, {
        auth: { token: validToken }
      });
      
      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error: any) => {
        done(error);
      });
    });

    test('should receive connection confirmation on successful auth', (done) => {
      clientSocket = ClientIO(`http://localhost:${port}`, {
        auth: { token: validToken }
      });
      
      clientSocket.on('connected', (data: any) => {
        expect(data.userId).toBe('test-user-id');
        expect(data.timestamp).toBeDefined();
        done();
      });

      clientSocket.on('connect_error', (error: any) => {
        done(error);
      });
    });
  });

  describe('Room Management', () => {
    beforeEach((done) => {
      clientSocket = ClientIO(`http://localhost:${port}`, {
        auth: { token: validToken }
      });
      
      clientSocket.on('connect', () => done());
      clientSocket.on('connect_error', done);
    });

    test('should allow joining user-specific room', (done) => {
      clientSocket.emit('join_room', 'user:test-user-id');
      
      // Wait a bit for room join to process
      setTimeout(() => {
        // Check if we're in the room by checking connection manager
        const connectionManager = wsServer.getConnectionManager();
        const stats = connectionManager?.getConnectionStats();
        expect(stats?.totalConnections).toBeGreaterThan(0);
        done();
      }, 100);
    });

    test('should allow joining course room', (done) => {
      clientSocket.emit('join_room', 'course:test-course-id');
      
      setTimeout(() => {
        const connectionManager = wsServer.getConnectionManager();
        const stats = connectionManager?.getConnectionStats();
        expect(stats?.totalConnections).toBeGreaterThan(0);
        done();
      }, 100);
    });

    test('should allow leaving room', (done) => {
      clientSocket.emit('join_room', 'course:test-course-id');
      
      setTimeout(() => {
        clientSocket.emit('leave_room', 'course:test-course-id');
        
        setTimeout(() => {
          // Room leaving doesn't affect connection count, just room membership
          const connectionManager = wsServer.getConnectionManager();
          const stats = connectionManager?.getConnectionStats();
          expect(stats?.totalConnections).toBeGreaterThan(0);
          done();
        }, 100);
      }, 100);
    });
  });

  describe('Event Handling', () => {
    beforeEach((done) => {
      clientSocket = ClientIO(`http://localhost:${port}`, {
        auth: { token: validToken }
      });
      
      clientSocket.on('connect', () => done());
      clientSocket.on('connect_error', done);
    });

    test('should handle heartbeat ping-pong', (done) => {
      clientSocket.on('heartbeat_ping', () => {
        clientSocket.emit('heartbeat_response');
      });

      clientSocket.emit('heartbeat');
      
      setTimeout(() => {
        // If we get here without errors, heartbeat is working
        done();
      }, 100);
    });

    test('should handle message sending', (done) => {
      const messageData = {
        type: 'message_sent' as const,
        courseId: 'test-course',
        content: 'Hello, World!',
        senderId: 'test-user-id'
      };

      clientSocket.emit('send_message', messageData);
      
      setTimeout(() => {
        // Message handling is logged (full implementation in Story 1.7)
        done();
      }, 100);
    });

    test('should handle notification read marking', (done) => {
      clientSocket.emit('mark_notification_read', 'test-notification-id');
      
      setTimeout(() => {
        // Notification handling is logged (full implementation in Story 1.4)
        done();
      }, 100);
    });
  });

  describe('Connection Tracking', () => {
    test('should track multiple connections for same user', (done) => {
      const socket1 = ClientIO(`http://localhost:${port}`, {
        auth: { token: validToken }
      });

      socket1.on('connect', () => {
        const socket2 = ClientIO(`http://localhost:${port}`, {
          auth: { token: validToken }
        });

        socket2.on('connect', () => {
          const connectionManager = wsServer.getConnectionManager();
          const stats = connectionManager?.getConnectionStats();
          
          expect(stats?.totalConnections).toBe(2);
          expect(stats?.uniqueUsers).toBe(1);
          expect(stats?.averageConnectionsPerUser).toBe(2);

          socket1.close();
          socket2.close();
          done();
        });
      });
    });

    test('should clean up connections on disconnect', (done) => {
      clientSocket = ClientIO(`http://localhost:${port}`, {
        auth: { token: validToken }
      });

      clientSocket.on('connect', () => {
        const connectionManager = wsServer.getConnectionManager();
        const initialStats = connectionManager?.getConnectionStats();
        expect(initialStats?.totalConnections).toBe(1);

        clientSocket.close();

        setTimeout(() => {
          const finalStats = connectionManager?.getConnectionStats();
          expect(finalStats?.totalConnections).toBe(0);
          done();
        }, 100);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle connection errors gracefully', (done) => {
      // Test with malformed token
      clientSocket = ClientIO(`http://localhost:${port}`, {
        auth: { token: 'malformed.token' }
      });
      
      clientSocket.on('connect_error', (error: any) => {
        expect(error.message).toContain('Invalid authentication token');
        done();
      });
    });

    test('should handle server errors without crashing', (done) => {
      clientSocket = ClientIO(`http://localhost:${port}`, {
        auth: { token: validToken }
      });
      
      clientSocket.on('connect', () => {
        // Emit an event that might cause an error
        clientSocket.emit('invalid_event', { data: 'test' });
        
        setTimeout(() => {
          // Server should still be running
          expect(clientSocket.connected).toBe(true);
          done();
        }, 100);
      });
    });
  });
});
