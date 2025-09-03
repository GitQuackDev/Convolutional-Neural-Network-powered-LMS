import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { AIAnalysisController } from '../controllers/aiAnalysisController';
import multer from 'multer';

const router = Router();
const aiAnalysisController = new AIAnalysisController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and common document types
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
});

// Apply authentication and rate limiting to all routes
router.use(authenticateToken as any);
router.use(uploadRateLimiter);

/**
 * POST /api/ai-analysis/analyze-multi
 * Start multi-AI analysis for uploaded content
 */
router.post('/analyze-multi', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    let selectedModels = req.body.selectedModels;
    
    // Parse selectedModels if it's a string (from FormData)
    if (typeof selectedModels === 'string') {
      try {
        selectedModels = JSON.parse(selectedModels);
      } catch (e) {
        res.status(400).json({ error: 'Invalid selectedModels format' });
        return;
      }
    }
    
    if (!selectedModels || !Array.isArray(selectedModels) || selectedModels.length === 0) {
      res.status(400).json({ error: 'No AI models selected' });
      return;
    }

    // Add to request body for controller
    req.body = {
      selectedModels,
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      fileType: req.file.mimetype
    };

    await aiAnalysisController.analyzeWithMultipleAI(req as any, res);
  } catch (error) {
    console.error('Multi-AI analysis route error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai-analysis/:analysisId/progress
 * Get analysis progress for a specific analysis
 */
router.get('/:analysisId/progress', (req, res) => {
  try {
    const { analysisId } = req.params;
    
    if (!analysisId) {
      res.status(400).json({ error: 'Analysis ID is required' });
      return;
    }

    // For now, return a simple progress response
    res.json({
      analysisId,
      status: 'completed',
      overallProgress: 100,
      modelProgress: {}
    });
  } catch (error) {
    console.error('Error getting analysis progress:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

/**
 * GET /api/ai-analysis/:analysisId/consolidated
 * Get consolidated insights for completed analysis
 */
router.get('/:analysisId/consolidated', (req, res) => {
  try {
    const { analysisId } = req.params;
    
    if (!analysisId) {
      res.status(400).json({ error: 'Analysis ID is required' });
      return;
    }

    // For now, return a simple consolidated response
    res.json({
      summary: 'Analysis completed successfully',
      commonFindings: [],
      conflictingAnalyses: [],
      confidenceScore: 0.85,
      recommendedActions: []
    });
  } catch (error) {
    console.error('Error getting consolidated insights:', error);
    res.status(500).json({ error: 'Failed to get insights' });
  }
});

/**
 * POST /api/ai-analysis/:analysisId/cancel
 * Cancel an ongoing analysis
 */
router.post('/:analysisId/cancel', (req, res) => {
  try {
    const { analysisId } = req.params;
    
    if (!analysisId) {
      res.status(400).json({ error: 'Analysis ID is required' });
      return;
    }

    res.json({ message: 'Analysis cancelled', analysisId });
  } catch (error) {
    console.error('Error cancelling analysis:', error);
    res.status(500).json({ error: 'Failed to cancel analysis' });
  }
});

export default router;
