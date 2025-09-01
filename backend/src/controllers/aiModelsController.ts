/**
 * AI Models Controller
 * Story 1.2: AI Model Service Infrastructure
 * 
 * Provides REST API endpoints for AI model services
 */

import { Request, Response } from 'express';
import { AIServiceManager } from '../services/aiModels/AIServiceManager';
import { createAIServiceManagerConfig, validateAIServiceConfig } from '../config/aiServices';
import { AIServiceType } from '../services/aiModels/types';

let aiServiceManager: AIServiceManager;

// Initialize AI Service Manager
const initializeAIServiceManager = async (): Promise<AIServiceManager> => {
  if (!aiServiceManager) {
    const config = createAIServiceManagerConfig();
    validateAIServiceConfig(config);
    aiServiceManager = new AIServiceManager(config);
    await aiServiceManager.initialize();
  }
  return aiServiceManager;
};

// Analyze content using AI services
export const analyzeContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, contentType, preferredService } = req.body;

    // Validate required fields
    if (!content || typeof content !== 'string') {
      res.status(400).json({ 
        success: false, 
        error: 'Content is required and must be a string' 
      });
      return;
    }

    if (!contentType || typeof contentType !== 'string') {
      res.status(400).json({ 
        success: false, 
        error: 'Content type is required and must be a string' 
      });
      return;
    }

    // Validate preferred service if provided
    if (preferredService && !['gpt4', 'claude', 'gemini'].includes(preferredService)) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid preferred service. Must be one of: gpt4, claude, gemini' 
      });
      return;
    }

    const manager = await initializeAIServiceManager();
    const result = await manager.analyzeContent(content, contentType, preferredService as AIServiceType);

    res.json(result);
  } catch (error) {
    console.error('Error in analyzeContent:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
};

// Get health status of AI services
export const getServiceHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceType } = req.params;

    const manager = await initializeAIServiceManager();
    
    if (serviceType) {
      // Validate service type
      if (!['gpt4', 'claude', 'gemini'].includes(serviceType)) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid service type. Must be one of: gpt4, claude, gemini' 
        });
        return;
      }

      const health = await manager.getServiceHealth(serviceType as AIServiceType);
      res.json({ success: true, health });
    } else {
      const allHealth = await manager.getServiceHealth();
      res.json({ success: true, health: allHealth });
    }
  } catch (error) {
    console.error('Error in getServiceHealth:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
};

// Get metrics for AI services
export const getServiceMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceType } = req.params;

    const manager = await initializeAIServiceManager();
    
    if (serviceType) {
      // Validate service type
      if (!['gpt4', 'claude', 'gemini'].includes(serviceType)) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid service type. Must be one of: gpt4, claude, gemini' 
        });
        return;
      }

      const metrics = await manager.getServiceMetrics(serviceType as AIServiceType);
      res.json({ success: true, metrics });
    } else {
      const allMetrics = await manager.getServiceMetrics();
      res.json({ success: true, metrics: allMetrics });
    }
  } catch (error) {
    console.error('Error in getServiceMetrics:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
};

// Get enabled services
export const getEnabledServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const manager = await initializeAIServiceManager();
    const enabledServices = manager.getEnabledServices();
    
    res.json({ 
      success: true, 
      enabledServices,
      count: enabledServices.length 
    });
  } catch (error) {
    console.error('Error in getEnabledServices:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
};

// Update AI service configuration (hot reload)
export const updateConfiguration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { enabledServices, fallbackOrder, defaultService } = req.body;

    const manager = await initializeAIServiceManager();
    
    const updateConfig: any = {};
    if (enabledServices) updateConfig.enabledServices = enabledServices;
    if (fallbackOrder) updateConfig.fallbackOrder = fallbackOrder;
    if (defaultService) updateConfig.defaultService = defaultService;

    await manager.updateConfiguration(updateConfig);
    
    res.json({ 
      success: true, 
      message: 'Configuration updated successfully',
      enabledServices: manager.getEnabledServices()
    });
  } catch (error) {
    console.error('Error in updateConfiguration:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
};

// Analyze content with multiple services for comparison
export const compareServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, contentType, services } = req.body;

    // Validate required fields
    if (!content || typeof content !== 'string') {
      res.status(400).json({ 
        success: false, 
        error: 'Content is required and must be a string' 
      });
      return;
    }

    if (!contentType || typeof contentType !== 'string') {
      res.status(400).json({ 
        success: false, 
        error: 'Content type is required and must be a string' 
      });
      return;
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      res.status(400).json({ 
        success: false, 
        error: 'Services array is required and must not be empty' 
      });
      return;
    }

    // Validate all services
    const validServices = ['gpt4', 'claude', 'gemini'];
    for (const service of services) {
      if (!validServices.includes(service)) {
        res.status(400).json({ 
          success: false, 
          error: `Invalid service: ${service}. Must be one of: ${validServices.join(', ')}` 
        });
        return;
      }
    }

    const manager = await initializeAIServiceManager();
    const results: any = {};
    const errors: any = {};

    // Run analysis on each requested service
    await Promise.allSettled(
      services.map(async (service: AIServiceType) => {
        try {
          results[service] = await manager.analyzeContent(content, contentType, service);
        } catch (error) {
          errors[service] = error instanceof Error ? error.message : 'Unknown error';
        }
      })
    );

    res.json({ 
      success: true, 
      results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      comparison: {
        totalServices: services.length,
        successfulServices: Object.keys(results).length,
        failedServices: Object.keys(errors).length
      }
    });
  } catch (error) {
    console.error('Error in compareServices:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
};

// Cleanup resources (for graceful shutdown)
export const cleanup = async (): Promise<void> => {
  if (aiServiceManager) {
    await aiServiceManager.cleanup();
  }
};