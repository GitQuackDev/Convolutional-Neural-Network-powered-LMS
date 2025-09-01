/**
 * AI Models Routes
 * Story 1.2: AI Model Service Infrastructure
 * 
 * REST API routes for AI model services
 */

import { Router } from 'express';
import {
  analyzeContent,
  getServiceHealth,
  getServiceMetrics,
  getEnabledServices,
  updateConfiguration,
  compareServices
} from '../controllers/aiModelsController';

const router = Router();

// Note: Authentication middleware will be applied at the app level or per route as needed

// POST /api/ai-models/analyze - Analyze content using AI services
router.post('/analyze', analyzeContent);

// GET /api/ai-models/health - Get health status of all services
router.get('/health', getServiceHealth);
// GET /api/ai-models/health/:serviceType - Get health status of specific service
router.get('/health/:serviceType', getServiceHealth);

// GET /api/ai-models/metrics - Get metrics for all services
router.get('/metrics', getServiceMetrics);
// GET /api/ai-models/metrics/:serviceType - Get metrics for specific service
router.get('/metrics/:serviceType', getServiceMetrics);

// GET /api/ai-models/services - Get list of enabled services
router.get('/services', getEnabledServices);

// PUT /api/ai-models/config - Update AI service configuration
router.put('/config', updateConfiguration);

// POST /api/ai-models/compare - Compare analysis results from multiple services
router.post('/compare', compareServices);

export default router;
