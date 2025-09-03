/**
 * WebSocket Service for Real-time Communication
 * Provides a centralized way to emit events to WebSocket clients
 */

import { Server as SocketIOServer } from 'socket.io';
import type { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData 
} from '../websocket/types';
import type { AnalysisProgress, AIModelType } from '../types';

export class WebSocketService {
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > | null = null;

  constructor(io?: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
    this.io = io || null;
  }

  /**
   * Set the WebSocket server instance
   */
  setIO(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): void {
    this.io = io;
  }

  /**
   * Emit analysis progress update to analytics namespace
   */
  emitAnalysisProgress(userId: string, progress: AnalysisProgress): void {
    if (!this.io) {
      console.warn('WebSocket server not initialized, skipping progress update');
      return;
    }

    try {
      // Get the latest model being processed from the modelProgress
      const modelProgressEntries = Object.entries(progress.modelProgress);
      const latestModel = modelProgressEntries.length > 0 ? modelProgressEntries[0] : null;
      
      // Emit to analytics namespace for the specific user
      this.io.of('/analytics').to(`user:${userId}`).emit('progress', {
        type: 'analysis_progress',
        userId: userId,
        analysisId: progress.analysisId,
        progress: progress.overallProgress,
        modelType: latestModel ? latestModel[0] : undefined,
        status: latestModel ? latestModel[1].status : 'processing',
        data: {
          analysisId: progress.analysisId,
          overallProgress: progress.overallProgress,
          modelProgress: progress.modelProgress,
          timestamp: new Date()
        }
      });
      
    } catch (error) {
      console.error('Failed to emit analysis progress:', error);
    }
  }

  /**
   * Emit model-specific progress update
   */
  emitModelProgress(
    userId: string, 
    analysisId: string, 
    model: AIModelType, 
    progress: number, 
    status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled'
  ): void {
    if (!this.io) {
      console.warn('WebSocket server not initialized, skipping model progress update');
      return;
    }

    try {
      this.io.of('/analytics').to(`user:${userId}`).emit('progress', {
        type: 'analysis_progress',
        userId: userId,
        analysisId: analysisId,
        progress: progress,
        modelType: model,
        status: status,
        data: {
          model,
          progress,
          status,
          timestamp: new Date()
        }
      });
      
    } catch (error) {
      console.error('Failed to emit model progress:', error);
    }
  }

  /**
   * Emit analysis completion event
   */
  emitAnalysisComplete(userId: string, analysisId: string, results: any): void {
    if (!this.io) {
      console.warn('WebSocket server not initialized, skipping completion event');
      return;
    }

    try {
      this.io.of('/analytics').to(`user:${userId}`).emit('progress', {
        type: 'analysis_complete',
        userId: userId,
        analysisId: analysisId,
        progress: 100,
        data: {
          results,
          timestamp: new Date()
        }
      });
      
      console.log(`✅ Emitted analysis complete for ${analysisId}`);
    } catch (error) {
      console.error('Failed to emit analysis completion:', error);
    }
  }

  /**
   * Emit analysis error event
   */
  emitAnalysisError(userId: string, analysisId: string, error: string): void {
    if (!this.io) {
      console.warn('WebSocket server not initialized, skipping error event');
      return;
    }

    try {
      this.io.of('/analytics').to(`user:${userId}`).emit('error', error);
      
      console.log(`❌ Emitted analysis error for ${analysisId}: ${error}`);
    } catch (error) {
      console.error('Failed to emit analysis error:', error);
    }
  }

  /**
   * Emit analysis cancellation event
   */
  emitAnalysisCancelled(userId: string, analysisId: string): void {
    if (!this.io) {
      console.warn('WebSocket server not initialized, skipping cancellation event');
      return;
    }

    try {
      this.io.of('/analytics').to(`user:${userId}`).emit('progress', {
        type: 'analysis_progress',
        userId: userId,
        analysisId: analysisId,
        progress: 0,
        data: {
          cancelled: true,
          timestamp: new Date()
        }
      });
      
      console.log(`⏹️ Emitted analysis cancelled for ${analysisId}`);
    } catch (error) {
      console.error('Failed to emit analysis cancellation:', error);
    }
  }
}

// Export a singleton instance
export const webSocketService = new WebSocketService();
