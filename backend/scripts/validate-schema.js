#!/usr/bin/env node

/**
 * Simple validation script to test the new schema models
 * This runs without Jest to validate basic functionality
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function validateSchemaModels() {
  console.log('🧪 Testing new schema models...');
  console.log('=====================================');

  try {
    // Test 1: Create a test user
    console.log('1. Creating test user...');
    const testUser = await prisma.user.create({
      data: {
        email: 'schema-test@example.com',
        firstName: 'Schema',
        lastName: 'Test',
        password: 'hashedpassword',
        role: 'STUDENT'
      }
    });
    console.log('✅ Test user created successfully');

    // Test 2: Create UserAnalytics record
    console.log('2. Testing UserAnalytics model...');
    const analytics = await prisma.userAnalytics.create({
      data: {
        userId: testUser.id,
        sessionId: 'test-session-123',
        pageViews: { dashboard: 5, courses: 3 },
        contentInteractions: { clicks: 15, timeSpent: 1200 },
        cnnAnalysisUsage: { uploads: 2 },
        learningProgress: { modules: 2 }
      }
    });
    console.log('✅ UserAnalytics record created successfully');

    // Test 3: Create SessionMetrics record
    console.log('3. Testing SessionMetrics model...');
    const session = await prisma.sessionMetrics.create({
      data: {
        userId: testUser.id,
        sessionStart: new Date(),
        activeTime: 1800,
        courseInteractions: { views: 3 },
        assignmentProgress: { started: 2 },
        engagementScore: 0.75
      }
    });
    console.log('✅ SessionMetrics record created successfully');

    // Test 4: Create AIAnalysisResults record
    console.log('4. Testing AIAnalysisResults model...');
    const aiAnalysis = await prisma.aIAnalysisResults.create({
      data: {
        fileName: 'test-image.jpg',
        originalFileName: 'test-image.jpg',
        filePath: '/uploads/test-image.jpg',
        userId: testUser.id,
        cnnResults: { objects: ['person', 'laptop'] },
        gpt4Results: { description: 'A person working' },
        consolidatedInsights: { topics: ['education'] },
        processingTime: { total: 5000 },
        confidence: 0.85
      }
    });
    console.log('✅ AIAnalysisResults record created successfully');

    // Test 5: Create a test course for chat
    console.log('5. Creating test course...');
    const testCourse = await prisma.course.create({
      data: {
        title: 'Schema Test Course',
        description: 'Course for schema testing',
        ownerId: testUser.id
      }
    });
    console.log('✅ Test course created successfully');

    // Test 6: Create ChatMessage record
    console.log('6. Testing ChatMessage model...');
    const chatMessage = await prisma.chatMessage.create({
      data: {
        content: 'Hello everyone! How is the assignment going?',
        senderId: testUser.id,
        courseId: testCourse.id,
        messageType: 'TEXT'
      }
    });
    console.log('✅ ChatMessage record created successfully');

    // Test 7: Create Notification record
    console.log('7. Testing Notification model...');
    const notification = await prisma.notification.create({
      data: {
        userId: testUser.id,
        type: 'CNN_ANALYSIS_COMPLETE',
        title: 'Analysis Complete',
        message: 'Your CNN analysis has finished',
        priority: 'NORMAL'
      }
    });
    console.log('✅ Notification record created successfully');

    // Test 8: Test relations and queries
    console.log('8. Testing relations and queries...');
    
    const userWithRelations = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        userAnalytics: true,
        sessionMetrics: true,
        aiAnalysisResults: true,
        sentMessages: true,
        notifications: true
      }
    });
    
    console.log(`✅ User relations working: Analytics(${userWithRelations.userAnalytics.length}), Sessions(${userWithRelations.sessionMetrics.length}), AI Analysis(${userWithRelations.aiAnalysisResults.length}), Messages(${userWithRelations.sentMessages.length}), Notifications(${userWithRelations.notifications.length})`);

    // Test 9: Test indexed queries
    console.log('9. Testing indexed queries...');
    const recentAnalytics = await prisma.userAnalytics.findMany({
      where: { userId: testUser.id },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    console.log(`✅ Indexed query successful: Found ${recentAnalytics.length} analytics records`);

    // Cleanup
    console.log('10. Cleaning up test data...');
    await prisma.userAnalytics.deleteMany({ where: { userId: testUser.id } });
    await prisma.sessionMetrics.deleteMany({ where: { userId: testUser.id } });
    await prisma.aIAnalysisResults.deleteMany({ where: { userId: testUser.id } });
    await prisma.chatMessage.deleteMany({ where: { senderId: testUser.id } });
    await prisma.notification.deleteMany({ where: { userId: testUser.id } });
    await prisma.course.delete({ where: { id: testCourse.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Test data cleaned up successfully');

    console.log('=====================================');
    console.log('🎉 All schema validation tests passed!');
    console.log('✅ New analytics and communication models are working correctly');
    
    return true;

  } catch (error) {
    console.error('=====================================');
    console.error('❌ Schema validation failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation if called directly
if (require.main === module) {
  validateSchemaModels().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { validateSchemaModels };
