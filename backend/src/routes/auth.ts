import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, refreshToken, logout, me } from '../controllers/authController';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Input validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('role').optional().isIn(['student', 'professor', 'admin', 'community_moderator', 'regular_moderator'])
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

// Auth routes with rate limiting
router.post('/register', authRateLimiter as any, registerValidation, register);
router.post('/login', authRateLimiter as any, loginValidation, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticateToken as any, me);

export default router;
