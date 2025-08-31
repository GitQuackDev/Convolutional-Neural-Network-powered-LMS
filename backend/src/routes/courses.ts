import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All course routes require authentication
router.use(authenticateToken as any);

// Get all courses
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get courses endpoint - to be implemented',
    data: [],
    timestamp: new Date().toISOString()
  });
});

// Get course by ID
router.get('/:id', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get course by ID endpoint - to be implemented',
    data: null,
    timestamp: new Date().toISOString()
  });
});

// Create course
router.post('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Create course endpoint - to be implemented',
    timestamp: new Date().toISOString()
  });
});

export default router;
