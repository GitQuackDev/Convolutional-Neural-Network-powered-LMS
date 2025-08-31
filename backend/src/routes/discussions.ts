import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All discussion routes require authentication
router.use(authenticateToken as any);

// Get discussions
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get discussions endpoint - to be implemented',
    data: [],
    timestamp: new Date().toISOString()
  });
});

// Create discussion
router.post('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Create discussion endpoint - to be implemented',
    timestamp: new Date().toISOString()
  });
});

export default router;
