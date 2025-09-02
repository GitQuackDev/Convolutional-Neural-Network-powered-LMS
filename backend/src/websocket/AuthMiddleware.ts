/**
 * WebSocket Authentication Middleware
 * Integrates with existing JWT token system for WebSocket connections
 */

import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SocketData } from './types';

interface JWTPayload {
  userId: string;
  email: string;
  role: 'STUDENT' | 'PROFESSOR' | 'ADMIN';
  iat: number;
  exp: number;
}

/**
 * WebSocket authentication middleware using existing JWT system
 * Validates token from connection handshake and sets user data
 */
export const authenticateSocket = async (
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    // Get token from handshake auth or query
    const token = 
      socket.handshake.auth['token'] || 
      socket.handshake.headers.authorization?.replace('Bearer ', '') ||
      socket.handshake.query['token'] as string;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token using existing secret
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      return next(new Error('JWT secret not configured'));
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // Set authenticated user data on socket
    const socketData: SocketData = {
      userId: decoded.userId,
      userRole: decoded.role,
      courseIds: [], // Will be populated based on user's enrolled courses
    };

    socket.data = socketData;
    
    // Join user to their personal room for private notifications
    socket.join(`user:${decoded.userId}`);
    
    // Log successful authentication
    console.log(`🔐 WebSocket authenticated: User ${decoded.userId} (${decoded.role})`);
    
    next();
  } catch (error) {
    console.error('❌ WebSocket authentication failed:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Invalid authentication token'));
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Authentication token expired'));
    }
    
    next(new Error('Authentication failed'));
  }
};

/**
 * Role-based access control for WebSocket namespaces
 */
export const authorizeNamespace = (
  requiredRoles: Array<'STUDENT' | 'PROFESSOR' | 'ADMIN'>
) => {
  return (socket: Socket, next: (err?: Error) => void): void => {
    const userRole = socket.data?.userRole;
    
    if (!userRole) {
      return next(new Error('User role not found'));
    }
    
    if (!requiredRoles.includes(userRole)) {
      return next(new Error(`Access denied. Required roles: ${requiredRoles.join(', ')}`));
    }
    
    next();
  };
};

/**
 * Course-based access control for room joining
 */
export const authorizeCourseAccess = (courseId: string, userId: string): boolean => {
  // TODO: Implement course enrollment check using Prisma
  // For now, allow all authenticated users (will be enhanced in Story 1.4)
  return true;
};

/**
 * Validate user can access specific chat channel
 */
export const authorizeChannelAccess = (channelId: string, userId: string): boolean => {
  // TODO: Implement channel permission check using Prisma
  // For now, allow all authenticated users (will be enhanced in Story 1.7)
  return true;
};
