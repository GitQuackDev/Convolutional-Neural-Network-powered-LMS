import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import passport from 'passport';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// Initialize passport configuration
import './config/passport';

// Import database configuration
import { connectDatabase } from './config/database';

// Import WebSocket server
import { WebSocketServer } from './websocket/WebSocketServer';
import { webSocketService } from './services/WebSocketService';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import courseRoutes from './routes/courses';
import assignmentRoutes from './routes/assignments';
import cnnRoutes from './routes/cnn';
import discussionRoutes from './routes/discussions';
import aiModelsRoutes from './routes/ai-models';
import aiAnalysisRoutes from './routes/ai-analysis';
import realtimeRoutes from './routes/realtime';
import analyticsRoutes from './routes/analytics';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { notFound } from './middleware/notFound';
import { analyticsMiddleware } from './middleware/analytics';

// Import database connection
// import { connectDatabase } from './config/database';

const app = express();
const PORT = process.env['PORT'] || 5000;

// Create HTTP server for WebSocket integration
const httpServer = createServer(app);

// Initialize WebSocket server
const wsServer = new WebSocketServer();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
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

// Initialize passport
app.use(passport.initialize());

// Rate limiting
app.use(rateLimiter);

// Analytics tracking (after auth but before routes)
app.use(analyticsMiddleware.track);

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
app.use('/api/ai-models', aiModelsRoutes);
app.use('/api/ai-analysis', aiAnalysisRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Initialize WebSocket server
    wsServer.initialize(httpServer);
    
    // Initialize WebSocket service with server instance
    const ioInstance = wsServer.getIO();
    if (ioInstance) {
      webSocketService.setIO(ioInstance);
      console.log('🔗 WebSocket service initialized successfully');
    }
    
    // Start HTTP server with WebSocket support
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env['NODE_ENV']}`);
      console.log(`🌐 Frontend URL: ${process.env['FRONTEND_URL']}`);
      console.log(`📱 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 WebSocket server initialized and ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await wsServer.handleGracefulShutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await wsServer.handleGracefulShutdown();
  process.exit(0);
});

startServer();

export default app;
