#!/usr/bin/env node

/**
 * Forward Migration Script for Enhanced Analytics and Communication Schema
 * 
 * This script creates new collections for analytics and communication features
 * while preserving all existing data and functionality.
 * 
 * Usage: node scripts/migrate-up.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const MIGRATION_VERSION = '1.1.0';
const MIGRATION_NAME = 'enhanced-analytics-communication-schema';

async function createIndexes() {
  console.log('Creating database indexes for new collections...');
  
  try {
    // UserAnalytics indexes
    await prisma.$runCommandRaw({
      createIndexes: 'user_analytics',
      indexes: [
        {
          key: { userId: 1, timestamp: -1 },
          name: 'user_analytics_userId_timestamp_idx'
        }
      ]
    });

    // SessionMetrics indexes
    await prisma.$runCommandRaw({
      createIndexes: 'session_metrics',
      indexes: [
        {
          key: { userId: 1, sessionStart: -1 },
          name: 'session_metrics_userId_sessionStart_idx'
        }
      ]
    });

    // AIAnalysisResults indexes
    await prisma.$runCommandRaw({
      createIndexes: 'ai_analysis_results',
      indexes: [
        {
          key: { userId: 1, fileName: 1, createdAt: -1 },
          name: 'ai_analysis_results_userId_fileName_createdAt_idx'
        }
      ]
    });

    // ChatMessage indexes
    await prisma.$runCommandRaw({
      createIndexes: 'chat_messages',
      indexes: [
        {
          key: { courseId: 1, createdAt: -1 },
          name: 'chat_messages_courseId_createdAt_idx'
        },
        {
          key: { senderId: 1, createdAt: -1 },
          name: 'chat_messages_senderId_createdAt_idx'
        }
      ]
    });

    // Notification indexes
    await prisma.$runCommandRaw({
      createIndexes: 'notifications',
      indexes: [
        {
          key: { userId: 1, isRead: 1, createdAt: -1 },
          name: 'notifications_userId_isRead_createdAt_idx'
        }
      ]
    });

    console.log('✅ All indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
}

async function validateCollections() {
  console.log('Validating new collections exist...');
  
  try {
    // Test each new collection by attempting to count documents
    const collections = [
      'user_analytics',
      'session_metrics', 
      'ai_analysis_results',
      'chat_messages',
      'notifications'
    ];

    for (const collection of collections) {
      const count = await prisma.$runCommandRaw({
        count: collection
      });
      console.log(`✅ Collection '${collection}' validated (${count.n || 0} documents)`);
    }
  } catch (error) {
    console.error('❌ Error validating collections:', error);
    throw error;
  }
}

async function recordMigration() {
  console.log('Recording migration in system config...');
  
  try {
    await prisma.systemConfig.upsert({
      where: { key: `migration_${MIGRATION_VERSION}` },
      update: {
        value: {
          version: MIGRATION_VERSION,
          name: MIGRATION_NAME,
          appliedAt: new Date().toISOString(),
          status: 'completed'
        }
      },
      create: {
        key: `migration_${MIGRATION_VERSION}`,
        value: {
          version: MIGRATION_VERSION,
          name: MIGRATION_NAME,
          appliedAt: new Date().toISOString(),
          status: 'completed'
        }
      }
    });
    
    console.log('✅ Migration recorded successfully');
  } catch (error) {
    console.error('❌ Error recording migration:', error);
    throw error;
  }
}

async function verifyExistingData() {
  console.log('Verifying existing data integrity...');
  
  try {
    // Verify key existing collections are still accessible
    const userCount = await prisma.user.count();
    const courseCount = await prisma.course.count();
    const cnnAnalysisCount = await prisma.cNNAnalysis.count();
    
    console.log(`✅ Existing data verified:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Courses: ${courseCount}`);
    console.log(`   - CNN Analyses: ${cnnAnalysisCount}`);
    
    if (userCount === 0) {
      console.warn('⚠️ Warning: No users found - this may be expected for new installations');
    }
  } catch (error) {
    console.error('❌ Error verifying existing data:', error);
    throw error;
  }
}

async function main() {
  console.log(`🚀 Starting migration: ${MIGRATION_NAME} (v${MIGRATION_VERSION})`);
  console.log('=====================================');
  
  try {
    // Check if migration already applied
    const existingMigration = await prisma.systemConfig.findUnique({
      where: { key: `migration_${MIGRATION_VERSION}` }
    });
    
    if (existingMigration && existingMigration.value.status === 'completed') {
      console.log('⚠️ Migration already applied. Skipping...');
      return;
    }

    // Step 1: Verify existing data integrity
    await verifyExistingData();
    
    // Step 2: Create indexes for new collections
    await createIndexes();
    
    // Step 3: Validate new collections exist and are accessible
    await validateCollections();
    
    // Step 4: Record successful migration
    await recordMigration();
    
    console.log('=====================================');
    console.log('✅ Migration completed successfully!');
    console.log(`✅ New collections are ready for analytics and communication features`);
    
  } catch (error) {
    console.error('=====================================');
    console.error('❌ Migration failed:', error);
    console.error('❌ Please check the error above and resolve before proceeding');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  MIGRATION_VERSION,
  MIGRATION_NAME
};
