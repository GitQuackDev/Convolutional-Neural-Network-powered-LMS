/**
 * HTTP Fallback Endpoints for Real-time Features
 * Provides graceful degradation when WebSocket connections fail
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all realtime routes
router.use(authenticateToken as any);

/**
 * GET /api/realtime/messages/:courseId - Polling endpoint for messages
 * Provides message history and new messages when WebSocket is unavailable
 */
router.get('/messages/:courseId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { since, limit = '50' } = req.query;
    
    // TODO: Implement message polling using Prisma (Story 1.7)
    // For now, return mock data structure
    const messages = {
      courseId,
      messages: [],
      lastUpdated: new Date().toISOString(),
      hasMore: false
    };
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * GET /api/realtime/notifications/:userId - Polling endpoint for notifications
 * Provides notification updates when WebSocket is unavailable
 */
router.get('/notifications/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { since, unreadOnly = 'false' } = req.query;
    
    // Verify user can access their own notifications
    const user = (req as any).user;
    if (user?.userId !== userId && user?.role !== 'admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    // TODO: Implement notification polling using Prisma (Story 1.4)
    // For now, return mock data structure
    const notifications = {
      userId,
      notifications: [],
      unreadCount: 0,
      lastUpdated: new Date().toISOString()
    };
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/realtime/progress/:analysisId - Polling endpoint for analysis progress
 * Provides progress updates when WebSocket is unavailable
 */
router.get('/progress/:analysisId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { analysisId } = req.params;
    
    // TODO: Implement progress polling using Prisma and AI service integration
    // For now, return mock data structure
    const progress = {
      analysisId,
      status: 'in_progress',
      progress: 45,
      estimatedTimeRemaining: 120, // seconds
      lastUpdated: new Date().toISOString()
    };
    
    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

/**
 * POST /api/realtime/ping - Connection health check endpoint
 * Tests connectivity and provides fallback detection
 */
router.post('/ping', (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    const pingResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: 'healthy',
      userId: user?.userId,
      latency: Date.now() - (req.body?.timestamp || Date.now())
    };
    
    res.json(pingResponse);
  } catch (error) {
    console.error('Error handling ping:', error);
    res.status(500).json({ error: 'Ping failed' });
  }
});

/**
 * GET /api/realtime/status - WebSocket server status endpoint
 * Provides information about WebSocket availability and fallback options
 */
router.get('/status', (req: Request, res: Response): void => {
  try {
    // Check if WebSocket server is available
    // TODO: Integrate with WebSocketServer instance to get real status
    const status = {
      websocketAvailable: true, // Will be determined dynamically
      httpFallbackEnabled: true,
      serverLoad: 'normal',
      estimatedLatency: 50, // milliseconds
      supportedFeatures: {
        messaging: true,
        notifications: true,
        progressTracking: true,
        collaboration: false // Will be enabled in later stories
      },
      pollingInterval: {
        messages: 5000, // 5 seconds
        notifications: 10000, // 10 seconds
        progress: 2000 // 2 seconds
      }
    };
    
    res.json(status);
  } catch (error) {
    console.error('Error getting realtime status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * POST /api/realtime/messages - Send message via HTTP fallback
 * Allows message sending when WebSocket is unavailable
 */
router.post('/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId, channelId, content, type = 'message_sent' } = req.body;
    const user = (req as any).user;
    const senderId = user?.userId;
    
    if (!senderId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    if (!content || (!courseId && !channelId)) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // TODO: Save message to database and broadcast via WebSocket if available
    // For now, return success response
    const messageResponse = {
      messageId: `msg_${Date.now()}`,
      status: 'sent',
      timestamp: new Date().toISOString(),
      fallbackUsed: true
    };
    
    res.status(201).json(messageResponse);
  } catch (error) {
    console.error('Error sending message via HTTP:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * PUT /api/realtime/notifications/:notificationId/read - Mark notification as read
 * Allows notification management via HTTP fallback
 */
router.put('/notifications/:notificationId/read', async (req: Request, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;
    const user = (req as any).user;
    const userId = user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    // TODO: Update notification status in database
    // For now, return success response
    const updateResponse = {
      notificationId,
      status: 'read',
      updatedAt: new Date().toISOString(),
      fallbackUsed: true
    };
    
    res.json(updateResponse);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

export default router;
