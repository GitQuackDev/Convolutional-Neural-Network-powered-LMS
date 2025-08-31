import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt, { SignOptions } from 'jsonwebtoken';
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

    // Generate tokens
    const jwtSecret = process.env['JWT_SECRET'];
    const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'] || jwtSecret;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env['JWT_EXPIRES_IN'] || '15m' } as SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtRefreshSecret as string,
      { expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d' } as SignOptions
    );

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
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

    // Generate tokens  
    const jwtSecret = process.env['JWT_SECRET'];
    const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'] || jwtSecret;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env['JWT_EXPIRES_IN'] || '15m' } as SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtRefreshSecret as string,
      { expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d' } as SignOptions
    );

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
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

// Refresh token implementation
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const refreshToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'] || process.env['JWT_SECRET'];
    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as any;
    
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

    // Generate new access token
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const newAccessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env['JWT_EXPIRES_IN'] || '15m' } as SignOptions
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtRefreshSecret,
      { expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d' } as SignOptions
    );

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(403).json({
      success: false,
      message: 'Invalid or expired refresh token',
      timestamp: new Date().toISOString()
    });
  }
};

// Google OAuth callback handler
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUserDocument;
    
    if (!user) {
      const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth?error=oauth_failed`);
      return;
    }

    // Generate tokens
    const jwtSecret = process.env['JWT_SECRET'];
    const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'] || jwtSecret;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env['JWT_EXPIRES_IN'] || '15m' } as SignOptions
    );

    const refreshTokenValue = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtRefreshSecret as string,
      { expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d' } as SignOptions
    );

    // Redirect to frontend with tokens
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/callback?access_token=${accessToken}&refresh_token=${refreshTokenValue}`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('OAuth callback error:', error);
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth?error=oauth_error`);
  }
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

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
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

    const userId = (req as any).user?.userId;
    const { firstName, lastName, avatar } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: user.toJSON() },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
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

    const userId = (req as any).user?.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId).select('+password') as IUserDocument;
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify current password
    if (!user.password || !(await user.comparePassword(currentPassword))) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};
