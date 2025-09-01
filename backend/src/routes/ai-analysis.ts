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
    console.log('🚀 AI Analysis route called');
    console.log('📁 File received:', req.file ? 'Yes' : 'No');
    console.log('📋 Request body:', req.body);
    
    if (!req.file) {
      console.log('❌ No file uploaded');
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    let selectedModels = req.body.selectedModels;
    
    // Parse selectedModels if it's a string (from FormData)
    if (typeof selectedModels === 'string') {
      try {
        selectedModels = JSON.parse(selectedModels);
      } catch (e) {
        console.log('❌ Failed to parse selectedModels:', selectedModels);
        res.status(400).json({ error: 'Invalid selectedModels format' });
        return;
      }
    }
    
    console.log('🤖 Selected models:', selectedModels);
    
    if (!selectedModels || !Array.isArray(selectedModels) || selectedModels.length === 0) {
      console.log('❌ No AI models selected or invalid format');
      res.status(400).json({ error: 'No AI models selected' });
      return;
    }

    // Create analysis request
    const analysisRequest = {
      fileId: `upload_${Date.now()}_${req.file.originalname}`,
      selectedModels,
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      fileType: req.file.mimetype
    };

    console.log('📦 Analysis request created:', {
      fileId: analysisRequest.fileId,
      selectedModels: analysisRequest.selectedModels,
      fileName: analysisRequest.fileName,
      fileType: analysisRequest.fileType,
      fileSize: req.file.buffer.length
    });

    // Add to request body for controller
    req.body = analysisRequest;

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
router.get('/:analysisId/progress', aiAnalysisController.getAnalysisProgress.bind(aiAnalysisController));

/**
 * GET /api/ai-analysis/:analysisId/consolidated
 * Get consolidated insights for completed analysis
 */
router.get('/:analysisId/consolidated', (req, res) => aiAnalysisController.getConsolidatedInsights(req, res));

/**
 * POST /api/ai-analysis/:analysisId/cancel
 * Cancel an ongoing analysis
 */
router.post('/:analysisId/cancel', (req, res) => aiAnalysisController.cancelAnalysis(req as any, res));

/**
 * POST /api/ai-analysis/regenerate
 * Regenerate analysis for specific AI models
 */
router.post('/regenerate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { selectedModels, originalAnalysisId } = req.body;
    
    if (!selectedModels || !Array.isArray(selectedModels) || selectedModels.length === 0) {
      res.status(400).json({ error: 'No AI models selected for regeneration' });
      return;
    }

    // Create new analysis request for regeneration
    const analysisRequest = {
      fileId: `regen_${originalAnalysisId}_${Date.now()}`,
      selectedModels,
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      fileType: req.file.mimetype
    };

    req.body = analysisRequest;
    await aiAnalysisController.analyzeWithMultipleAI(req as any, res);
  } catch (error) {
    console.error('Analysis regeneration route error:', error);
    res.status(500).json({ 
      error: 'Regeneration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
