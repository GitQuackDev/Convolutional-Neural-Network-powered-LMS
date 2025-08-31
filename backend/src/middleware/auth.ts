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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
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
