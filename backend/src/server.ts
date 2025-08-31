import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import courseRoutes from './routes/courses';
import assignmentRoutes from './routes/assignments';
import cnnRoutes from './routes/cnn';
import discussionRoutes from './routes/discussions';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { notFound } from './middleware/notFound';

// Import database connection
// import { connectDatabase } from './config/database';

const app = express();
const PORT = process.env['PORT'] || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging
if (process.env['NODE_ENV'] === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
app.use(rateLimiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'LMS CNN Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'],
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/cnn', cnnRoutes);
app.use('/api/discussions', discussionRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    // Temporarily comment out database connection for testing
    // await connectDatabase();
    console.log('⚠️ Database connection skipped for testing');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env['NODE_ENV']}`);
      console.log(`🌐 Frontend URL: ${process.env['FRONTEND_URL']}`);
      console.log(`📱 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;
