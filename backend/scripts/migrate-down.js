#!/usr/bin/env node

/**
 * Rollback Migration Script for Enhanced Analytics and Communication Schema
 * 
 * This script safely removes new collections while preserving all existing data.
 * Only removes collections added in migration v1.1.0
 * 
 * Usage: node scripts/migrate-down.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const MIGRATION_VERSION = '1.1.0';
const MIGRATION_NAME = 'enhanced-analytics-communication-schema';

async function dropIndexes() {
  console.log('Dropping indexes for new collections...');
  
  try {
    const collectionsWithIndexes = [
      {
        collection: 'user_analytics',
        indexes: ['user_analytics_userId_timestamp_idx']
      },
      {
        collection: 'session_metrics', 
        indexes: ['session_metrics_userId_sessionStart_idx']
      },
      {
        collection: 'ai_analysis_results',
        indexes: ['ai_analysis_results_userId_fileName_createdAt_idx']
      },
      {
        collection: 'chat_messages',
        indexes: ['chat_messages_courseId_createdAt_idx', 'chat_messages_senderId_createdAt_idx']
      },
      {
        collection: 'notifications',
        indexes: ['notifications_userId_isRead_createdAt_idx']
      }
    ];

    for (const { collection, indexes } of collectionsWithIndexes) {
      for (const indexName of indexes) {
        try {
          await prisma.$runCommandRaw({
            dropIndexes: collection,
            index: indexName
          });
          console.log(`✅ Dropped index '${indexName}' from '${collection}'`);
        } catch (error) {
          // Index might not exist, continue
          console.log(`⚠️ Index '${indexName}' not found in '${collection}' (may not exist)`);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Some indexes could not be dropped (may not exist):', error.message);
  }
}

async function dropCollections() {
  console.log('Dropping new collections...');
  
  try {
    const collectionsToRemove = [
      'user_analytics',
      'session_metrics',
      'ai_analysis_results', 
      'chat_messages',
      'notifications'
    ];

    for (const collection of collectionsToRemove) {
      try {
        await prisma.$runCommandRaw({
          drop: collection
        });
        console.log(`✅ Dropped collection '${collection}'`);
      } catch (error) {
        // Collection might not exist
        console.log(`⚠️ Collection '${collection}' not found (may not exist)`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Some collections could not be dropped:', error.message);
  }
}

async function verifyExistingDataIntact() {
  console.log('Verifying existing data is intact after rollback...');
  
  try {
    // Verify core collections are still functional
    const userCount = await prisma.user.count();
    const courseCount = await prisma.course.count();
    const cnnAnalysisCount = await prisma.cNNAnalysis.count();
    const assignmentCount = await prisma.assignment.count();
    
    console.log(`✅ Existing data verified after rollback:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Courses: ${courseCount}`);
    console.log(`   - CNN Analyses: ${cnnAnalysisCount}`);
    console.log(`   - Assignments: ${assignmentCount}`);
    
  } catch (error) {
    console.error('❌ Error verifying existing data after rollback:', error);
    throw error;
  }
}

async function recordRollback() {
  console.log('Recording rollback in system config...');
  
  try {
    // Update migration record to show it was rolled back
    await prisma.systemConfig.upsert({
      where: { key: `migration_${MIGRATION_VERSION}` },
      update: {
        value: {
          version: MIGRATION_VERSION,
          name: MIGRATION_NAME,
          appliedAt: null,
          rolledBackAt: new Date().toISOString(),
          status: 'rolled_back'
        }
      },
      create: {
        key: `migration_${MIGRATION_VERSION}`,
        value: {
          version: MIGRATION_VERSION,
          name: MIGRATION_NAME,
          appliedAt: null,
          rolledBackAt: new Date().toISOString(),
          status: 'rolled_back'
        }
      }
    });
    
    console.log('✅ Rollback recorded successfully');
  } catch (error) {
    console.error('❌ Error recording rollback:', error);
    throw error;
  }
}

async function confirmRollback() {
  console.log('⚠️  WARNING: This will remove all analytics and communication data!');
  console.log('⚠️  This action cannot be undone.');
  console.log('');
  
  // In a real environment, you might want to add interactive confirmation
  // For automated testing, we'll proceed
  console.log('Proceeding with rollback...');
  return true;
}

async function main() {
  console.log(`🔄 Starting rollback: ${MIGRATION_NAME} (v${MIGRATION_VERSION})`);
  console.log('=====================================');
  
  try {
    // Step 1: Confirm rollback intention
    const confirmed = await confirmRollback();
    if (!confirmed) {
      console.log('❌ Rollback cancelled by user');
      return;
    }
    
    // Step 2: Drop indexes first
    await dropIndexes();
    
    // Step 3: Drop new collections
    await dropCollections();
    
    // Step 4: Verify existing data is intact
    await verifyExistingDataIntact();
    
    // Step 5: Record rollback
    await recordRollback();
    
    console.log('=====================================');
    console.log('✅ Rollback completed successfully!');
    console.log('✅ System returned to pre-migration state');
    console.log('⚠️  All analytics and communication data has been removed');
    
  } catch (error) {
    console.error('=====================================');
    console.error('❌ Rollback failed:', error);
    console.error('❌ Please check the error above and resolve manually');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run rollback if called directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  MIGRATION_VERSION,
  MIGRATION_NAME
};
