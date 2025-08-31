import { Router } from 'express';
import { body } from 'express-validator';
import passport from 'passport';
import { register, login, refreshToken, logout, me, googleCallback, updateProfile, changePassword } from '../controllers/authController';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Input validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().escape(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1 }).escape().withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).escape().withMessage('Last name is required'),
  body('role').optional().isIn(['student', 'professor', 'admin', 'community_moderator', 'regular_moderator'])
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().escape(),
  body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ min: 1 }).escape().withMessage('First name must not be empty'),
  body('lastName').optional().trim().isLength({ min: 1 }).escape().withMessage('Last name must not be empty'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];

// Auth routes with rate limiting
router.post('/register', authRateLimiter as any, registerValidation, register);
router.post('/login', authRateLimiter as any, loginValidation, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticateToken as any, me);
router.put('/profile', authenticateToken as any, updateProfileValidation, updateProfile);
router.post('/change-password', authenticateToken as any, changePasswordValidation, changePassword);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: `${process.env['FRONTEND_URL']}/auth?error=oauth_failed` }),
  googleCallback
);

export default router;
