// Global test setup for Jest
// This file runs before all test files

const { PrismaClient } = require('@prisma/client');

// Global test configuration
global.prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// Global test timeout
jest.setTimeout(30000);

// Global cleanup
afterAll(async () => {
  if (global.prisma) {
    await global.prisma.$disconnect();
  }
});
