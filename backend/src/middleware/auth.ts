import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { UserRole } from '../types';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

// Middleware to authenticate JWT token
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔐 Auth middleware called');
    const authHeader = req.headers['authorization'];
    console.log('🔍 Auth header:', authHeader ? 'Present' : 'Missing');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    console.log('🎫 Token extracted:', token ? `${token.substring(0, 10)}...` : 'No token');

    if (!token) {
      console.log('❌ No token provided');
      res.status(401).json({
        success: false,
        message: 'Access token is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      console.log('❌ JWT_SECRET not configured');
      throw new Error('JWT_SECRET not configured');
    }

    console.log('🔓 Attempting to verify token...');
    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as any;
    console.log('✅ Token verified, decoded:', { userId: decoded.userId, email: decoded.email });
    
    try {
      // Try database user lookup first
      console.log('👤 Looking up user in database...');
      const user = await User.findById(decoded.userId);
      console.log('👤 User found:', user ? 'Yes' : 'No');
      
      if (user) {
        console.log('✅ Authentication successful (database)');
        // Add user info to request
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };
        next();
        return;
      } else {
        console.log('⚠️ User not found in database, checking development mode...');
      }
    } catch (dbError) {
      console.error('⚠️ Database lookup error:', dbError);
      console.log('� Falling back to development mode authentication');
    }
    
    // FALLBACK: Development mode - skip database lookup
    if (process.env['NODE_ENV'] === 'development') {
      console.log('🔧 DEVELOPMENT MODE: Using token authentication without database lookup');
      // Add user info to request directly from token
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
      console.log('✅ Authentication successful (development mode fallback)');
      next();
      return;
    }
    
    // No authentication method worked
    console.log('❌ Authentication failed - user not found and not in development mode');
    res.status(401).json({
      success: false,
      message: 'User not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Authentication error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      console.log('🚫 JWT Error type:', error.name, error.message);
    }
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
  }
};

// Middleware to check user role
export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

// Convenience middleware for common roles
export const requireStudent = requireRole([UserRole.STUDENT]);
export const requireProfessor = requireRole([UserRole.PROFESSOR]);
export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireModerator = requireRole([UserRole.COMMUNITY_MODERATOR, UserRole.REGULAR_MODERATOR]);
export const requireProfessorOrAdmin = requireRole([UserRole.PROFESSOR, UserRole.ADMIN]);
