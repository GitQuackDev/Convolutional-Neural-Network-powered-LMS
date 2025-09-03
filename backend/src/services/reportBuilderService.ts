import { PrismaClient } from '@prisma/client';
import { AdvancedInsightsService } from './advancedInsightsService';
import * as PDFDocument from 'pdfkit';
const createObjectCsvWriter = require('csv-writer').createObjectCsvWriter;
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

export interface ReportRequest {
  title: string;
  description?: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  filters: {
    userId?: string;
    courseId?: string;
    contentType?: string;
    includeInsights?: boolean;
    includePredictions?: boolean;
    includeRecommendations?: boolean;
  };
  format: 'PDF' | 'CSV' | 'JSON';
  sections: ReportSection[];
  aiSummary?: boolean;
  schedulable?: boolean;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'insights' | 'analytics' | 'predictions' | 'recommendations' | 'performance' | 'engagement';
  visualizationType?: 'chart' | 'table' | 'narrative' | 'summary';
  aiEnhanced?: boolean;
}

export interface GeneratedReport {
  id: string;
  title: string;
  format: string;
  filePath: string;
  executiveSummary: string;
  sections: ReportSectionResult[];
  metadata: {
    generatedAt: Date;
    dataRange: { start: Date; end: Date };
    totalInsights: number;
    confidenceScore: number;
  };
}

export interface ReportSectionResult {
  sectionId: string;
  title: string;
  content: any;
  aiSummary?: string;
  visualizations?: any[];
}

/**
 * Advanced Report Builder Service
 * Generates comprehensive PDF/CSV reports with AI-powered insights and summaries
 */
export class ReportBuilderService {
  private prisma: PrismaClient;
  private insightsService: AdvancedInsightsService;
  private aiClient: OpenAI;

  constructor() {
    this.prisma = new PrismaClient();
    this.insightsService = new AdvancedInsightsService();
    this.aiClient = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'] || process.env['OPENROUTER_API_KEY'],
      baseURL: process.env['OPENROUTER_API_KEY'] ? 'https://openrouter.ai/api/v1' : undefined
    });
  }

  /**
   * Generate a comprehensive report based on request specifications
   */
  async generateReport(request: ReportRequest): Promise<GeneratedReport> {
    try {
      console.log(`Starting report generation: ${request.title}`);
      
      // 1. Gather all required data
      const reportData = await this.gatherReportData(request);
      
      // 2. Process sections with AI enhancement
      const processedSections = await this.processSections(request.sections, reportData);
      
      // 3. Generate AI-powered executive summary
      const executiveSummary = request.aiSummary 
        ? await this.generateExecutiveSummary(reportData, processedSections)
        : this.generateBasicSummary(reportData);
      
      // 4. Create the actual report file
      const filePath = await this.createReportFile(request, processedSections, executiveSummary);
      
      // 5. Save report metadata to database
      const savedReport = await this.saveReportToDatabase({
        title: request.title,
        format: request.format,
        filePath: filePath,
        executiveSummary: executiveSummary,
        sections: processedSections,
        timeRange: request.timeRange,
        filters: request.filters
      });

      return {
        id: savedReport.id,
        title: request.title,
        format: request.format,
        filePath: filePath,
        executiveSummary: executiveSummary,
        sections: processedSections,
        metadata: {
          generatedAt: new Date(),
          dataRange: request.timeRange,
          totalInsights: reportData.insights?.length || 0,
          confidenceScore: this.calculateAverageConfidence(reportData)
        }
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error(`Failed to generate report: ${error}`);
    }
  }

  /**
   * Gather all data needed for the report
   */
  private async gatherReportData(request: ReportRequest): Promise<any> {
    const data: any = {};

    // Get insights if requested
    if (request.filters.includeInsights) {
      if (request.filters.userId) {
        data.insights = await this.insightsService.getUserInsights(
          request.filters.userId,
          request.timeRange
        );
      } else if (request.filters.courseId) {
        data.insights = await this.insightsService.getCourseInsights(
          request.filters.courseId,
          request.timeRange
        );
      } else {
        data.insights = [];
      }
    }

    // Get predictions if requested
    if (request.filters.includePredictions) {
      data.predictions = await this.insightsService.generatePredictiveInsights(
        [], // historicalData placeholder
        []  // aiInsights placeholder
      );
    }

    // Get recommendations if requested
    if (request.filters.includeRecommendations) {
      if (request.filters.userId) {
        data.recommendations = await this.insightsService.getRecommendations(
          request.filters.userId
        );
      } else {
        data.recommendations = [];
      }
    }

    // Get analytics data
    data.analytics = await this.insightsService['analyticsService'].getAggregatedData({
      startDate: request.timeRange.start,
      endDate: request.timeRange.end,
      userId: request.filters.userId,
      courseId: request.filters.courseId
    });

    return data;
  }

  /**
   * Process each report section with optional AI enhancement
   */
  private async processSections(sections: ReportSection[], data: any): Promise<ReportSectionResult[]> {
    const results: ReportSectionResult[] = [];

    for (const section of sections) {
      const sectionData = this.extractSectionData(section, data);
      
      let aiSummary = undefined;
      if (section.aiEnhanced) {
        aiSummary = await this.generateSectionSummary(section, sectionData);
      }

      results.push({
        sectionId: section.id,
        title: section.title,
        content: sectionData,
        aiSummary: aiSummary || '',
        visualizations: this.generateVisualizationData(section, sectionData)
      });
    }

    return results;
  }

  /**
   * Extract relevant data for a specific section
   */
  private extractSectionData(section: ReportSection, data: any): any {
    switch (section.type) {
      case 'insights':
        return data.insights || [];
      case 'predictions':
        return data.predictions || [];
      case 'recommendations':
        return data.recommendations || [];
      case 'analytics':
        return data.analytics || {};
      case 'performance':
        return this.extractPerformanceData(data);
      case 'engagement':
        return this.extractEngagementData(data);
      default:
        return {};
    }
  }

  /**
   * Generate AI-powered section summary
   */
  private async generateSectionSummary(section: ReportSection, sectionData: any): Promise<string> {
    try {
      const prompt = `
        Generate a concise professional summary for the "${section.title}" section of an educational report.
        
        Section Type: ${section.type}
        Data: ${JSON.stringify(sectionData, null, 2)}
        
        Provide:
        1. Key findings and insights
        2. Notable trends or patterns
        3. Actionable recommendations
        4. Areas of concern or success
        
        Keep it professional, clear, and actionable for educational administrators.
        Maximum 200 words.
      `;

      const response = await this.aiClient.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300
      });

      return response.choices[0]?.message?.content || 'Summary generation failed';
    } catch (error) {
      console.error('Error generating section summary:', error);
      return 'AI summary unavailable';
    }
  }

  /**
   * Generate AI-powered executive summary
   */
  private async generateExecutiveSummary(data: any, sections: ReportSectionResult[]): Promise<string> {
    try {
      const prompt = `
        Create a comprehensive executive summary for an educational analytics report.
        
        Available Data:
        - Insights: ${data.insights?.length || 0} items
        - Predictions: ${data.predictions?.length || 0} items  
        - Recommendations: ${data.recommendations?.length || 0} items
        - Analytics: ${JSON.stringify(data.analytics)}
        
        Section Summaries:
        ${sections.map(s => `${s.title}: ${s.aiSummary || 'No summary'}`).join('\n')}
        
        Provide an executive summary that includes:
        1. Overall assessment of educational performance
        2. Key strategic insights and recommendations
        3. Critical areas requiring immediate attention
        4. Success highlights and positive trends
        5. Next steps and priorities
        
        Write for educational leaders and administrators.
        Maximum 500 words, professional tone.
      `;

      const response = await this.aiClient.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 700
      });

      return response.choices[0]?.message?.content || 'Executive summary generation failed';
    } catch (error) {
      console.error('Error generating executive summary:', error);
      return this.generateBasicSummary(data);
    }
  }

  /**
   * Generate basic summary without AI
   */
  private generateBasicSummary(data: any): string {
    const insightCount = data.insights?.length || 0;
    const predictionCount = data.predictions?.length || 0;
    const recommendationCount = data.recommendations?.length || 0;

    return `
Executive Summary

This report contains ${insightCount} insights, ${predictionCount} predictions, and ${recommendationCount} recommendations based on comprehensive educational data analysis.

Key Metrics:
- Total Insights Generated: ${insightCount}
- Predictive Forecasts: ${predictionCount}
- Actionable Recommendations: ${recommendationCount}
- Analysis Period: ${data.analytics?.timeRange?.start} to ${data.analytics?.timeRange?.end}

The analysis covers user engagement patterns, content interactions, performance metrics, and learning outcomes to provide actionable intelligence for educational improvement.
    `.trim();
  }

  /**
   * Create the actual report file (PDF, CSV, or JSON)
   */
  private async createReportFile(
    request: ReportRequest, 
    sections: ReportSectionResult[], 
    executiveSummary: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${request.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
    
    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    switch (request.format) {
      case 'PDF':
        return await this.createPDFReport(filename, request, sections, executiveSummary);
      case 'CSV':
        return await this.createCSVReport(filename, request, sections, executiveSummary);
      case 'JSON':
        return await this.createJSONReport(filename, request, sections, executiveSummary);
      default:
        throw new Error(`Unsupported report format: ${request.format}`);
    }
  }

  /**
   * Create PDF report
   */
  private async createPDFReport(
    filename: string, 
    request: ReportRequest, 
    sections: ReportSectionResult[], 
    executiveSummary: string
  ): Promise<string> {
    const filePath = path.join(process.cwd(), 'reports', `${filename}.pdf`);
    const doc = new (PDFDocument as any)();
    
    doc.pipe(fs.createWriteStream(filePath));

    // Title page
    doc.fontSize(24).text(request.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Executive Summary
    doc.fontSize(18).text('Executive Summary');
    doc.moveDown();
    doc.fontSize(12).text(executiveSummary);
    doc.addPage();

    // Sections
    for (const section of sections) {
      doc.fontSize(16).text(section.title);
      doc.moveDown();
      
      if (section.aiSummary) {
        doc.fontSize(14).text('AI Summary:');
        doc.fontSize(12).text(section.aiSummary);
        doc.moveDown();
      }
      
      doc.fontSize(14).text('Data:');
      doc.fontSize(10).text(JSON.stringify(section.content, null, 2));
      doc.addPage();
    }

    doc.end();
    return filePath;
  }

  /**
   * Create CSV report
   */
  private async createCSVReport(
    filename: string, 
    request: ReportRequest, 
    sections: ReportSectionResult[], 
    executiveSummary: string
  ): Promise<string> {
    const filePath = path.join(process.cwd(), 'reports', `${filename}.csv`);
    
    // Flatten all data into CSV format
    const csvData: any[] = [];
    
    // Add executive summary row
    csvData.push({
      section: 'Executive Summary',
      title: 'Overall Assessment',
      content: executiveSummary,
      ai_summary: '',
      generated_at: new Date().toISOString()
    });

    // Add section data
    for (const section of sections) {
      if (Array.isArray(section.content)) {
        section.content.forEach((item: any, index: number) => {
          csvData.push({
            section: section.title,
            title: `${section.title} Item ${index + 1}`,
            content: JSON.stringify(item),
            ai_summary: section.aiSummary || '',
            generated_at: new Date().toISOString()
          });
        });
      } else {
        csvData.push({
          section: section.title,
          title: section.title,
          content: JSON.stringify(section.content),
          ai_summary: section.aiSummary || '',
          generated_at: new Date().toISOString()
        });
      }
    }

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'section', title: 'Section' },
        { id: 'title', title: 'Title' },
        { id: 'content', title: 'Content' },
        { id: 'ai_summary', title: 'AI Summary' },
        { id: 'generated_at', title: 'Generated At' }
      ]
    });

    await csvWriter.writeRecords(csvData);
    return filePath;
  }

  /**
   * Create JSON report
   */
  private async createJSONReport(
    filename: string, 
    request: ReportRequest, 
    sections: ReportSectionResult[], 
    executiveSummary: string
  ): Promise<string> {
    const filePath = path.join(process.cwd(), 'reports', `${filename}.json`);
    
    const jsonReport = {
      title: request.title,
      description: request.description,
      generated_at: new Date().toISOString(),
      time_range: request.timeRange,
      filters: request.filters,
      executive_summary: executiveSummary,
      sections: sections,
      metadata: {
        format: request.format,
        total_sections: sections.length,
        ai_enhanced: sections.filter(s => s.aiSummary).length
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(jsonReport, null, 2));
    return filePath;
  }

  /**
   * Save report metadata to database
   */
  private async saveReportToDatabase(reportData: any): Promise<any> {
    try {
      return await this.prisma.advancedReport.create({
        data: {
          name: reportData.title,
          templateId: reportData.templateId || 'default',
          filters: reportData.filters,
          sections: reportData.sections,
          executiveSummary: reportData.executiveSummary,
          recommendations: reportData.recommendations || [],
          format: reportData.format as any,
          generatedBy: reportData.generatedBy,
          downloadUrl: reportData.filePath,
          isScheduled: false
        }
      });
    } catch (error) {
      console.error('Error saving report to database:', error);
      throw new Error('Failed to save report metadata');
    }
  }

  /**
   * Extract performance-specific data
   */
  private extractPerformanceData(data: any): any {
    return {
      overall_performance: data.analytics?.performanceMetrics || {},
      trends: data.insights?.filter((i: any) => i.type === 'PERFORMANCE_TREND') || [],
      predictions: data.predictions?.filter((p: any) => p.type === 'PERFORMANCE_TREND') || []
    };
  }

  /**
   * Extract engagement-specific data
   */
  private extractEngagementData(data: any): any {
    return {
      engagement_metrics: data.analytics?.userEngagement || {},
      patterns: data.insights?.filter((i: any) => i.type === 'ENGAGEMENT_PATTERN') || [],
      predictions: data.predictions?.filter((p: any) => p.type === 'ENGAGEMENT_PATTERN') || []
    };
  }

  /**
   * Generate visualization data for charts/graphs
   */
  private generateVisualizationData(section: ReportSection, sectionData: any): any[] {
    if (!section.visualizationType) return [];

    // This would integrate with charting libraries in a full implementation
    return [{
      type: section.visualizationType,
      data: sectionData,
      config: {
        title: section.title,
        generated_at: new Date().toISOString()
      }
    }];
  }

  /**
   * Calculate average confidence score across all insights
   */
  private calculateAverageConfidence(data: any): number {
    const allItems = [
      ...(data.insights || []),
      ...(data.predictions || []),
      ...(data.recommendations || [])
    ];

    if (allItems.length === 0) return 0;

    const totalConfidence = allItems.reduce((sum: number, item: any) => {
      return sum + (item.confidence || 0);
    }, 0);

    return Math.round((totalConfidence / allItems.length) * 100) / 100;
  }

  /**
   * Get all available reports
   */
  async getReports(filters?: any): Promise<any[]> {
    try {
      return await this.prisma.advancedReport.findMany({
        where: filters,
        orderBy: { generatedAt: 'desc' }
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw new Error('Failed to fetch reports');
    }
  }

  /**
   * Delete a report and its file
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      const report = await this.prisma.advancedReport.findUnique({
        where: { id: reportId }
      });

      if (report) {
        // Delete file if it exists
        if (report.downloadUrl) {
          const filePath = report.downloadUrl.replace('/uploads/', '');
          const fullPath = path.join(process.cwd(), 'uploads', filePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }

        // Delete database record
        await this.prisma.advancedReport.delete({
          where: { id: reportId }
        });
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      throw new Error('Failed to delete report');
    }
  }
}
