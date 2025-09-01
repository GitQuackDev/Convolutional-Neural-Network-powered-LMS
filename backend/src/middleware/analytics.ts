import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
// import { AnalyticsService } from '../services/AnalyticsService';

export interface AnalyticsData {
  userId?: string | undefined;
  sessionId: string;
  action: string;
  resource: string;
  metadata?: any;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

// Extend Request interface to include analytics data
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      startTime?: number;
      analyticsData?: AnalyticsData;
    }
  }
}

export class AnalyticsMiddleware {
  private excludedPaths: Set<string>;

  constructor() {
    // Paths to exclude from analytics tracking
    this.excludedPaths = new Set([
      '/health',
      '/api/analytics',
      '/favicon.ico',
      '/robots.txt'
    ]);
  }

  /**
   * Main analytics middleware for request tracking
   */
  public track = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Skip analytics for excluded paths
      if (this.shouldExcludeRequest(req)) {
        return next();
      }

      // Generate or retrieve session ID
      req.sessionId = this.getOrCreateSessionId(req);
      
      // Record request start time for duration calculation
      req.startTime = Date.now();

      // Extract user context from JWT (if authenticated)
      const userId = this.extractUserId(req);

      // Prepare analytics data
      req.analyticsData = {
        userId: userId || undefined,
        sessionId: req.sessionId,
        action: this.determineAction(req),
        resource: req.originalUrl || req.url,
        metadata: this.extractMetadata(req),
        ipAddress: this.getClientIP(req),
        userAgent: req.get('User-Agent') || undefined
      };

      // Set up response completion handler
      this.setupResponseHandler(req, res);

      next();
    } catch (error) {
      console.error('❌ Analytics middleware error:', error);
      // Don't block request on analytics failure
      next();
    }
  };

  /**
   * Specialized CNN analysis tracking
   */
  public trackCNNAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.analyticsData) {
        req.analyticsData.action = 'cnn_analysis';
        req.analyticsData.metadata = {
          ...req.analyticsData.metadata,
          analysisType: 'cnn_request',
          fileSize: req.get('content-length'),
          contentType: req.get('content-type')
        };
      }
      next();
    } catch (error) {
      console.error('❌ CNN Analytics tracking error:', error);
      next();
    }
  };

  /**
   * Track page views specifically
   */
  public trackPageView = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.analyticsData) {
        req.analyticsData.action = 'page_view';
        req.analyticsData.metadata = {
          ...req.analyticsData.metadata,
          referrer: req.get('Referer'),
          userAgent: req.get('User-Agent')
        };
      }
      next();
    } catch (error) {
      console.error('❌ Page view tracking error:', error);
      next();
    }
  };

  /**
   * Check if request should be excluded from analytics
   */
  private shouldExcludeRequest(req: Request): boolean {
    const path = req.path || req.url;
    return this.excludedPaths.has(path) || 
           path.startsWith('/static') || 
           path.startsWith('/assets');
  }

  /**
   * Get or create session ID for the user
   */
  private getOrCreateSessionId(req: Request): string {
    // Try to get from existing session
    if (req.sessionId) {
      return req.sessionId;
    }

    // Try to get from headers or cookies
    const sessionFromHeader = req.get('X-Session-ID');
    if (sessionFromHeader) {
      return sessionFromHeader;
    }

    // Generate new session ID
    return uuidv4();
  }

  /**
   * Extract user ID from JWT token
   */
  private extractUserId(req: Request): string | null {
    try {
      // Assuming user is attached to request after auth middleware
      return (req as any).user?.id || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Determine action type based on request
   */
  private determineAction(req: Request): string {
    const method = req.method.toLowerCase();
    const path = req.path || req.url;

    if (path.includes('/api/auth')) return 'authentication';
    if (path.includes('/api/cnn')) return 'cnn_analysis';
    if (path.includes('/api/courses')) return 'course_interaction';
    if (path.includes('/api/assignments')) return 'assignment_interaction';
    if (path.includes('/api/discussions')) return 'discussion_interaction';
    
    // Default actions by HTTP method
    switch (method) {
      case 'get': return 'view';
      case 'post': return 'create';
      case 'put':
      case 'patch': return 'update';
      case 'delete': return 'delete';
      default: return 'request';
    }
  }

  /**
   * Extract relevant metadata from request
   */
  private extractMetadata(req: Request): any {
    return {
      method: req.method,
      path: req.path || req.url,
      query: req.query,
      contentType: req.get('content-type'),
      contentLength: req.get('content-length'),
      origin: req.get('origin'),
      referer: req.get('referer')
    };
  }

  /**
   * Get client IP address safely
   */
  private getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIp = req.headers['x-real-ip'] as string;
    const remoteAddress = req.socket.remoteAddress;
    
    const ip = forwarded || realIp || remoteAddress || 'unknown';
    const ipString = Array.isArray(ip) ? ip[0] : ip.toString();
    return ipString.split(',')[0].trim();
  }

  /**
   * Setup response completion handler to record analytics
   */
  private setupResponseHandler(req: Request, res: Response): void {
    const finishAnalytics = async () => {
      try {
        if (req.analyticsData && req.startTime) {
          const duration = Date.now() - req.startTime;
          
          // Log analytics data for now (will implement database recording later)
          console.log(`📊 Analytics: ${req.analyticsData.action} - ${req.analyticsData.resource} (${duration}ms)`);
          console.log(`📊 User: ${req.analyticsData.userId || 'anonymous'}, Session: ${req.analyticsData.sessionId}`);
          console.log(`📊 Status: ${res.statusCode}, IP: ${req.analyticsData.ipAddress}`);
        }
      } catch (error) {
        console.error('❌ Failed to record analytics:', error);
      }
    };

    // Handle response finish event
    res.on('finish', finishAnalytics);
  }

  /**
   * Extract device information from user agent
   */
  private extractDeviceInfo(userAgent?: string): any {
    if (!userAgent) return {};

    return {
      userAgent,
      isMobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
      browser: this.extractBrowser(userAgent),
      os: this.extractOS(userAgent)
    };
  }

  /**
   * Extract browser from user agent
   */
  private extractBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Extract OS from user agent
   */
  private extractOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }
}

// Export singleton instance
export const analyticsMiddleware = new AnalyticsMiddleware();
