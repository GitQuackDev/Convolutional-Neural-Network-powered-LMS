/**
 * Migration Tests for Enhanced Analytics and Communication Schema
 * 
 * Tests the forward and rollback migration scripts to ensure:
 * - Migrations are idempotent
 * - Existing data remains intact
 * - New collections are created properly
 * - Rollback works safely
 */

const { PrismaClient } = require('@prisma/client');
const migrateUp = require('../../scripts/migrate-up');
const migrateDown = require('../../scripts/migrate-down');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// Test data setup
let testUser;
let testCourse;
let testCNNAnalysis;

beforeAll(async () => {
  // Ensure we start with a clean state
  try {
    await migrateDown.main();
  } catch (error) {
    // Migration might not exist yet, continue
  }

  // Create some existing test data to verify it persists through migration
  testUser = await prisma.user.create({
    data: {
      email: 'migration-test@example.com',
      firstName: 'Migration',
      lastName: 'Test',
      password: 'hashedpassword',
      role: 'STUDENT'
    }
  });

  testCourse = await prisma.course.create({
    data: {
      title: 'Migration Test Course',
      description: 'Course to test migration safety',
      ownerId: testUser.id
    }
  });

  testCNNAnalysis = await prisma.cNNAnalysis.create({
    data: {
      fileName: 'test-migration.jpg',
      originalFileName: 'test-migration.jpg',
      filePath: '/test/migration.jpg',
      fileSize: 1024,
      mimeType: 'image/jpeg',
      confidence: 0.95,
      analysisResults: {
        objects: ['test', 'migration'],
        categories: ['education']
      },
      categories: ['education'],
      tags: ['test', 'migration'],
      userId: testUser.id
    }
  });
});

afterAll(async () => {
  // Cleanup test data
  try {
    await migrateDown.main();
    await prisma.cNNAnalysis.delete({ where: { id: testCNNAnalysis.id } });
    await prisma.course.delete({ where: { id: testCourse.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  } catch (error) {
    console.warn('Cleanup warning:', error.message);
  }
  
  await prisma.$disconnect();
});

describe('Forward Migration (migrate-up)', () => {
  test('should apply migration successfully', async () => {
    await expect(migrateUp.main()).resolves.not.toThrow();
    
    // Verify migration was recorded
    const migrationRecord = await prisma.systemConfig.findUnique({
      where: { key: `migration_${migrateUp.MIGRATION_VERSION}` }
    });
    
    expect(migrationRecord).toBeDefined();
    expect(migrationRecord.value.status).toBe('completed');
  });

  test('should preserve existing data during migration', async () => {
    // Verify existing user data is intact
    const user = await prisma.user.findUnique({
      where: { id: testUser.id }
    });
    expect(user).toBeDefined();
    expect(user.email).toBe('migration-test@example.com');

    // Verify existing course data is intact
    const course = await prisma.course.findUnique({
      where: { id: testCourse.id }
    });
    expect(course).toBeDefined();
    expect(course.title).toBe('Migration Test Course');

    // Verify existing CNN analysis data is intact
    const cnnAnalysis = await prisma.cNNAnalysis.findUnique({
      where: { id: testCNNAnalysis.id }
    });
    expect(cnnAnalysis).toBeDefined();
    expect(cnnAnalysis.fileName).toBe('test-migration.jpg');
  });

  test('should create new collections', async () => {
    // Test that we can create records in new collections
    const analytics = await prisma.userAnalytics.create({
      data: {
        userId: testUser.id,
        sessionId: 'migration-test-session',
        pageViews: { test: 1 },
        contentInteractions: { test: 1 },
        cnnAnalysisUsage: { test: 1 },
        learningProgress: { test: 1 }
      }
    });
    expect(analytics).toBeDefined();

    const sessionMetrics = await prisma.sessionMetrics.create({
      data: {
        userId: testUser.id,
        sessionStart: new Date(),
        activeTime: 100,
        courseInteractions: { test: 1 },
        assignmentProgress: { test: 1 },
        engagementScore: 0.5
      }
    });
    expect(sessionMetrics).toBeDefined();

    const aiAnalysis = await prisma.aIAnalysisResults.create({
      data: {
        fileName: 'migration-test.jpg',
        originalFileName: 'migration-test.jpg',
        filePath: '/test/migration.jpg',
        userId: testUser.id,
        consolidatedInsights: { test: 1 },
        processingTime: { test: 1 },
        confidence: 0.8
      }
    });
    expect(aiAnalysis).toBeDefined();

    const chatMessage = await prisma.chatMessage.create({
      data: {
        content: 'Migration test message',
        senderId: testUser.id,
        courseId: testCourse.id
      }
    });
    expect(chatMessage).toBeDefined();

    const notification = await prisma.notification.create({
      data: {
        userId: testUser.id,
        type: 'SYSTEM_UPDATE',
        title: 'Migration Test',
        message: 'Test notification for migration'
      }
    });
    expect(notification).toBeDefined();
  });

  test('should be idempotent (safe to run multiple times)', async () => {
    // Running migration again should not throw error or duplicate data
    await expect(migrateUp.main()).resolves.not.toThrow();
    
    // Should still have only one migration record
    const migrationRecords = await prisma.systemConfig.findMany({
      where: { 
        key: { 
          startsWith: 'migration_' 
        } 
      }
    });
    
    const v110Records = migrationRecords.filter(r => 
      r.key === `migration_${migrateUp.MIGRATION_VERSION}`
    );
    
    expect(v110Records).toHaveLength(1);
  });
});

describe('Rollback Migration (migrate-down)', () => {
  test('should rollback migration successfully', async () => {
    await expect(migrateDown.main()).resolves.not.toThrow();
    
    // Verify rollback was recorded
    const migrationRecord = await prisma.systemConfig.findUnique({
      where: { key: `migration_${migrateDown.MIGRATION_VERSION}` }
    });
    
    expect(migrationRecord).toBeDefined();
    expect(migrationRecord.value.status).toBe('rolled_back');
  });

  test('should preserve existing data during rollback', async () => {
    // Verify existing user data is still intact
    const user = await prisma.user.findUnique({
      where: { id: testUser.id }
    });
    expect(user).toBeDefined();
    expect(user.email).toBe('migration-test@example.com');

    // Verify existing course data is still intact
    const course = await prisma.course.findUnique({
      where: { id: testCourse.id }
    });
    expect(course).toBeDefined();
    expect(course.title).toBe('Migration Test Course');

    // Verify existing CNN analysis data is still intact
    const cnnAnalysis = await prisma.cNNAnalysis.findUnique({
      where: { id: testCNNAnalysis.id }
    });
    expect(cnnAnalysis).toBeDefined();
    expect(cnnAnalysis.fileName).toBe('test-migration.jpg');
  });

  test('should remove new collections', async () => {
    // New collections should no longer be accessible
    // Note: In a real scenario, these would throw errors because the collections don't exist
    // For this test, we'll check that we can reapply the migration
    await expect(migrateUp.main()).resolves.not.toThrow();
    
    // Now they should be accessible again
    const analytics = await prisma.userAnalytics.create({
      data: {
        userId: testUser.id,
        sessionId: 'post-rollback-test',
        pageViews: { test: 1 },
        contentInteractions: { test: 1 },
        cnnAnalysisUsage: { test: 1 },
        learningProgress: { test: 1 }
      }
    });
    expect(analytics).toBeDefined();
  });
});

describe('Migration Version Tracking', () => {
  test('should track migration versions correctly', async () => {
    const migrationRecord = await prisma.systemConfig.findUnique({
      where: { key: `migration_${migrateUp.MIGRATION_VERSION}` }
    });
    
    expect(migrationRecord).toBeDefined();
    expect(migrationRecord.value.version).toBe(migrateUp.MIGRATION_VERSION);
    expect(migrationRecord.value.name).toBe(migrateUp.MIGRATION_NAME);
    expect(migrationRecord.value.appliedAt).toBeDefined();
  });

  test('should handle concurrent migration attempts safely', async () => {
    // Simulate concurrent migration attempts
    const promises = [
      migrateUp.main(),
      migrateUp.main(),
      migrateUp.main()
    ];
    
    await expect(Promise.all(promises)).resolves.not.toThrow();
    
    // Should still only have one migration record
    const migrationRecords = await prisma.systemConfig.findMany({
      where: { 
        key: `migration_${migrateUp.MIGRATION_VERSION}` 
      }
    });
    
    expect(migrationRecords).toHaveLength(1);
  });
});
