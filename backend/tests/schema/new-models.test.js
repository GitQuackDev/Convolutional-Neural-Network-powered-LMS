/**
 * Test suite for new analytics and communication schema models
 * 
 * Tests the new collections added in migration v1.1.0:
 * - UserAnalytics
 * - SessionMetrics  
 * - AIAnalysisResults
 * - ChatMessage
 * - Notification
 */

const { PrismaClient } = require('@prisma/client');

// Use test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// Mock user for testing
let testUser;
let testCourse;

beforeAll(async () => {
  // Create test user
  testUser = await prisma.user.create({
    data: {
      email: 'test-schema@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'hashedpassword',
      role: 'STUDENT'
    }
  });

  // Create test course
  testCourse = await prisma.course.create({
    data: {
      title: 'Test Course',
      description: 'Test course for schema validation',
      ownerId: testUser.id
    }
  });
});

afterAll(async () => {
  // Cleanup test data
  try {
    await prisma.userAnalytics.deleteMany({ where: { userId: testUser.id } });
    await prisma.sessionMetrics.deleteMany({ where: { userId: testUser.id } });
    await prisma.aIAnalysisResults.deleteMany({ where: { userId: testUser.id } });
    await prisma.chatMessage.deleteMany({ where: { senderId: testUser.id } });
    await prisma.notification.deleteMany({ where: { userId: testUser.id } });
    await prisma.course.delete({ where: { id: testCourse.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  } catch (error) {
    console.warn('Cleanup warning:', error.message);
  }
  
  await prisma.$disconnect();
});

describe('UserAnalytics Model', () => {
  test('should create user analytics record', async () => {
    const analyticsData = {
      userId: testUser.id,
      sessionId: 'test-session-123',
      pageViews: {
        '/dashboard': 5,
        '/courses': 3,
        '/assignments': 2
      },
      contentInteractions: {
        clicks: 15,
        scrollDepth: 0.8,
        timeSpent: 1200
      },
      cnnAnalysisUsage: {
        uploadsCount: 2,
        analysisRequests: 3
      },
      learningProgress: {
        completedModules: 2,
        totalModules: 5,
        progressPercent: 0.4
      }
    };

    const analytics = await prisma.userAnalytics.create({
      data: analyticsData
    });

    expect(analytics).toBeDefined();
    expect(analytics.userId).toBe(testUser.id);
    expect(analytics.sessionId).toBe('test-session-123');
    expect(analytics.pageViews).toEqual(analyticsData.pageViews);
    expect(analytics.timestamp).toBeInstanceOf(Date);
  });

  test('should retrieve analytics with user relation', async () => {
    // First create analytics data to retrieve
    const analyticsData = {
      userId: testUser.id,
      sessionId: 'test-session-relation',
      pageViews: { '/dashboard': 1 },
      contentInteractions: { clicks: 5 },
      cnnAnalysisUsage: { uploadsCount: 1 },
      learningProgress: { completedModules: 1 }
    };

    const createdAnalytics = await prisma.userAnalytics.create({
      data: analyticsData
    });

    // Now retrieve with user relation
    const analytics = await prisma.userAnalytics.findUnique({
      where: { id: createdAnalytics.id },
      include: { user: true }
    });

    expect(analytics).toBeDefined();
    expect(analytics).not.toBeNull();
    if (analytics) {
      expect(analytics.user).toBeDefined();
      expect(analytics.user.email).toBe('test-schema@example.com');
    }
  });
});

describe('SessionMetrics Model', () => {
  test('should create session metrics record', async () => {
    const sessionData = {
      userId: testUser.id,
      sessionStart: new Date(),
      activeTime: 1800, // 30 minutes
      courseInteractions: {
        courseViews: 3,
        moduleCompletions: 1
      },
      assignmentProgress: {
        started: 2,
        submitted: 1
      },
      engagementScore: 0.75
    };

    const session = await prisma.sessionMetrics.create({
      data: sessionData
    });

    expect(session).toBeDefined();
    expect(session.userId).toBe(testUser.id);
    expect(session.activeTime).toBe(1800);
    expect(session.engagementScore).toBe(0.75);
  });

  test('should update session end time', async () => {
    // First create a session to update
    const sessionData = {
      userId: testUser.id,
      sessionStart: new Date(),
      activeTime: 1800,
      courseInteractions: { courseViews: 3 },
      assignmentProgress: { started: 2 },
      engagementScore: 0.75
    };

    const session = await prisma.sessionMetrics.create({
      data: sessionData
    });

    // Now update the session end time
    const endTime = new Date();
    const updatedSession = await prisma.sessionMetrics.update({
      where: { id: session.id },
      data: { sessionEnd: endTime }
    });

    expect(updatedSession.sessionEnd).toEqual(endTime);
  });
});

describe('AIAnalysisResults Model', () => {
  test('should create AI analysis results record', async () => {
    const analysisData = {
      fileName: 'test-image.jpg',
      originalFileName: 'test-image.jpg',
      filePath: '/uploads/test-image.jpg',
      userId: testUser.id,
      cnnResults: {
        objects: ['person', 'laptop'],
        confidence: 0.9
      },
      gpt4Results: {
        description: 'A person working on a laptop',
        concepts: ['learning', 'technology']
      },
      consolidatedInsights: {
        mainTopics: ['education', 'technology'],
        suggestedTags: ['study', 'computer']
      },
      processingTime: {
        cnn: 2000,
        gpt4: 3000,
        total: 5000
      },
      confidence: 0.85
    };

    const analysis = await prisma.aIAnalysisResults.create({
      data: analysisData
    });

    expect(analysis).toBeDefined();
    expect(analysis.fileName).toBe('test-image.jpg');
    expect(analysis.confidence).toBe(0.85);
    expect(analysis.cnnResults).toEqual(analysisData.cnnResults);
    expect(analysis.consolidatedInsights).toEqual(analysisData.consolidatedInsights);
  });

  test('should query by user and filename', async () => {
    const analysis = await prisma.aIAnalysisResults.findFirst({
      where: {
        userId: testUser.id,
        fileName: 'test-image.jpg'
      }
    });

    expect(analysis).toBeDefined();
    expect(analysis.originalFileName).toBe('test-image.jpg');
  });
});

describe('ChatMessage Model', () => {
  test('should create chat message', async () => {
    const messageData = {
      content: 'Hello everyone! How is the assignment going?',
      senderId: testUser.id,
      courseId: testCourse.id,
      messageType: 'TEXT'
    };

    const message = await prisma.chatMessage.create({
      data: messageData
    });

    expect(message).toBeDefined();
    expect(message.content).toBe(messageData.content);
    expect(message.senderId).toBe(testUser.id);
    expect(message.courseId).toBe(testCourse.id);
    expect(message.messageType).toBe('TEXT');
    expect(message.isEdited).toBe(false);
  });

  test('should retrieve messages with sender and course relations', async () => {
    const message = await prisma.chatMessage.findFirst({
      where: { senderId: testUser.id },
      include: { 
        sender: true,
        course: true 
      }
    });

    expect(message).toBeDefined();
    expect(message.sender.email).toBe('test-schema@example.com');
    expect(message.course.title).toBe('Test Course');
  });

  test('should update message as edited', async () => {
    const message = await prisma.chatMessage.findFirst({
      where: { senderId: testUser.id }
    });

    const updatedMessage = await prisma.chatMessage.update({
      where: { id: message.id },
      data: {
        content: 'Hello everyone! How is the assignment going? (edited)',
        isEdited: true,
        editedAt: new Date()
      }
    });

    expect(updatedMessage.isEdited).toBe(true);
    expect(updatedMessage.editedAt).toBeInstanceOf(Date);
    expect(updatedMessage.content).toContain('(edited)');
  });
});

describe('Notification Model', () => {
  test('should create notification', async () => {
    const notificationData = {
      userId: testUser.id,
      type: 'CNN_ANALYSIS_COMPLETE',
      title: 'Analysis Complete',
      message: 'Your CNN analysis has finished processing',
      data: {
        fileName: 'test-image.jpg',
        confidence: 0.9
      },
      priority: 'NORMAL'
    };

    const notification = await prisma.notification.create({
      data: notificationData
    });

    expect(notification).toBeDefined();
    expect(notification.type).toBe('CNN_ANALYSIS_COMPLETE');
    expect(notification.title).toBe('Analysis Complete');
    expect(notification.isRead).toBe(false);
    expect(notification.priority).toBe('NORMAL');
  });

  test('should mark notification as read', async () => {
    const notification = await prisma.notification.findFirst({
      where: { userId: testUser.id }
    });

    const readTime = new Date();
    const updatedNotification = await prisma.notification.update({
      where: { id: notification.id },
      data: {
        isRead: true,
        readAt: readTime
      }
    });

    expect(updatedNotification.isRead).toBe(true);
    expect(updatedNotification.readAt).toEqual(readTime);
  });

  test('should query unread notifications', async () => {
    // Create another unread notification
    await prisma.notification.create({
      data: {
        userId: testUser.id,
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: 'You have a new message',
        priority: 'HIGH'
      }
    });

    const unreadNotifications = await prisma.notification.findMany({
      where: {
        userId: testUser.id,
        isRead: false
      }
    });

    expect(unreadNotifications.length).toBeGreaterThan(0);
    expect(unreadNotifications.every(n => !n.isRead)).toBe(true);
  });
});

describe('Schema Indexes and Performance', () => {
  test('should efficiently query user analytics by userId and timestamp', async () => {
    const start = Date.now();
    
    const analytics = await prisma.userAnalytics.findMany({
      where: { userId: testUser.id },
      orderBy: { timestamp: 'desc' },
      take: 10
    });
    
    const queryTime = Date.now() - start;
    
    expect(analytics).toBeDefined();
    expect(queryTime).toBeLessThan(1000); // Should be fast with proper indexing
  });

  test('should efficiently query chat messages by course', async () => {
    const start = Date.now();
    
    const messages = await prisma.chatMessage.findMany({
      where: { courseId: testCourse.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    const queryTime = Date.now() - start;
    
    expect(messages).toBeDefined();
    expect(queryTime).toBeLessThan(1000);
  });
});
