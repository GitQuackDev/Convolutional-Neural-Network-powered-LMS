import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User, { IUserDocument } from '../models/User';
import { UserRole } from '../types';

// Register user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { email, password, firstName, lastName, role = UserRole.STUDENT } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      isEmailVerified: false
    });

    await user.save();

    // Generate token
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      timestamp: new Date().toISOString()
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password') as IUserDocument;
    
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Generate token
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      timestamp: new Date().toISOString()
    });
  }
};

// Refresh token (simplified for now)
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({
    success: false,
    message: 'Token refresh not implemented yet',
    timestamp: new Date().toISOString()
  });
};

// Logout (client-side token removal)
export const logout = (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Logout successful. Please remove token from client storage.',
    timestamp: new Date().toISOString()
  });
};

// Get current user
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: { user: user.toJSON() },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};
