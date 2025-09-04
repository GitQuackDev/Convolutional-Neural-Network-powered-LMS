/**
 * Analysis Export Manager Component
 * Story 2.6: AI Progress Tracking and Results Display Enhancement
 * Task 2.6.4: Export and Sharing Implementation
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  CheckCircle2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import { cn } from '@/lib/utils';

// Export configuration interfaces
export interface ExportConfiguration {
  format: 'pdf' | 'json' | 'csv' | 'html';
  includeMetadata: boolean;
  includeModelComparisons: boolean;
  includeConsolidatedInsights: boolean;
  includeRawResults: boolean;
  includeVisualizations: boolean;
  customSections?: string[];
  reportTemplate: 'standard' | 'academic' | 'executive' | 'technical' | 'custom';
  
  // PDF-specific options
  pdfOptions?: {
    pageSize: 'A4' | 'Letter' | 'Legal';
    orientation: 'portrait' | 'landscape';
    includeTableOfContents: boolean;
    includeAppendices: boolean;
    colorScheme: 'color' | 'grayscale';
    compressionLevel: 'low' | 'medium' | 'high';
  };
  
  // CSV-specific options
  csvOptions?: {
    delimiter: ',' | ';' | '\t';
    encoding: 'UTF-8' | 'UTF-16' | 'ASCII';
    includeHeaders: boolean;
    flattenStructure: boolean;
  };
}

interface ExportJob {
  id: string;
  analysisId: string;
  configuration: ExportConfiguration;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: Date;
  completionTime?: Date;
  downloadUrl?: string;
  errorMessage?: string;
  fileSize?: number;
  estimatedTimeRemaining?: number;
}

interface AnalysisExportManagerProps {
  analysisIds: string[];
  onExportComplete?: (job: ExportJob) => void;
  onExportError?: (error: string) => void;
  className?: string;
}

/**
 * Analysis Export Manager Component
 * Handles multi-format export with professional report generation
 */
export const AnalysisExportManager: React.FC<AnalysisExportManagerProps> = ({
  analysisIds,
  onExportComplete,
  className
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportConfiguration['format']>('pdf');
  const [configuration, setConfiguration] = useState<ExportConfiguration>({
    format: 'pdf',
    includeMetadata: true,
    includeModelComparisons: true,
    includeConsolidatedInsights: true,
    includeRawResults: false,
    includeVisualizations: true,
    reportTemplate: 'standard'
  });
  
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);

  // Mock export job management
  const handleStartExport = useCallback(() => {
    const newJob: ExportJob = {
      id: `export-${Date.now()}`,
      analysisId: analysisIds[0] || 'default',
      configuration: { ...configuration, format: selectedFormat },
      status: 'pending',
      progress: 0,
      startTime: new Date()
    };

    setExportJobs(prev => [...prev, newJob]);
    onExportComplete?.(newJob);
  }, [selectedFormat, configuration, analysisIds, onExportComplete]);

  const updateConfiguration = useCallback((updates: Partial<ExportConfiguration>) => {
    setConfiguration(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['pdf', 'json', 'csv', 'html'] as const).map(format => (
                <motion.div
                  key={format}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "p-4 border-2 rounded-lg cursor-pointer transition-all duration-200",
                    selectedFormat === format ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                  onClick={() => {
                    setSelectedFormat(format);
                    updateConfiguration({ format });
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{format.toUpperCase()}</span>
                    {selectedFormat === format && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Basic Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include Sections</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="metadata"
                  checked={configuration.includeMetadata}
                  onCheckedChange={(checked) => updateConfiguration({ includeMetadata: !!checked })}
                />
                <Label htmlFor="metadata" className="text-sm">Analysis Metadata</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="comparisons"
                  checked={configuration.includeModelComparisons}
                  onCheckedChange={(checked) => updateConfiguration({ includeModelComparisons: !!checked })}
                />
                <Label htmlFor="comparisons" className="text-sm">Model Comparisons</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="insights"
                  checked={configuration.includeConsolidatedInsights}
                  onCheckedChange={(checked) => updateConfiguration({ includeConsolidatedInsights: !!checked })}
                />
                <Label htmlFor="insights" className="text-sm">Consolidated Insights</Label>
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {analysisIds.length} analysis{analysisIds.length !== 1 ? 'es' : ''} selected
            </div>
            <Button 
              onClick={handleStartExport}
              disabled={analysisIds.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Start Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      {exportJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Export History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exportJobs.map(job => (
                <div key={job.id} className="p-3 border rounded-lg bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">{job.configuration.format.toUpperCase()}</span>
                    </div>
                    <Badge variant="outline">{job.configuration.reportTemplate}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};