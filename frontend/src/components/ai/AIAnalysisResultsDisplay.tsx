/**
 * AI Analysis Results Display Component
 * Story 2.5: Multi-AI Analysis Interface Development
 * 
 * Displays individual model results and consolidated insights with comparison
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  BarChart3,
  Eye,
  Download,
  Share2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { cn } from '@/lib/utils';

// Types for AI analysis results
interface AIModelResult {
  id: string;
  modelName: string;
  status: 'completed' | 'error' | 'timeout';
  processingTime: number;
  confidence: number;
  results: {
    summary: string;
    keyInsights: string[];
    recommendations: string[];
    scores: {
      quality: number;
      relevance: number;
      educational_value: number;
      engagement: number;
    };
    detailed_analysis: {
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
    };
  };
  rawOutput?: string;
  error?: string;
}

interface ConsolidatedInsights {
  overallSummary: string;
  commonFindings: string[];
  conflictingAnalyses: Array<{
    topic: string;
    models: Array<{
      model: string;
      viewpoint: string;
    }>;
  }>;
  consensusRecommendations: string[];
  confidenceScore: number;
  methodologyComparison: Array<{
    aspect: string;
    comparison: string;
  }>;
}

interface MultiAnalysisResult {
  id: string;
  contentTitle: string;
  analysisType: string;
  timestamp: string;
  processingTime: number;
  modelsUsed: string[];
  individualResults: AIModelResult[];
  consolidatedInsights: ConsolidatedInsights;
  metadata: {
    contentType: string;
    contentLength: number;
    analysisParameters: Record<string, unknown>;
  };
}

// Individual Model Result Card Component
const ModelResultCard: React.FC<{
  result: AIModelResult;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ result, isExpanded, onToggleExpand }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'timeout': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'timeout': return <Clock className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="border-2 border-gray-200 hover:border-gray-300 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{result.modelName}</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className={cn(
                  "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                  getStatusColor(result.status)
                )}>
                  {getStatusIcon(result.status)}
                  <span className="capitalize">{result.status}</span>
                </div>
                <span>•</span>
                <span>{result.processingTime}ms</span>
                <span>•</span>
                <span>Confidence: {Math.round(result.confidence * 100)}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleExpand}
            >
              <Eye className="w-4 h-4 mr-1" />
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {result.status === 'error' ? (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Analysis failed: {result.error || 'Unknown error occurred'}
            </AlertDescription>
          </Alert>
        ) : result.status === 'timeout' ? (
          <Alert>
            <Clock className="w-4 h-4" />
            <AlertDescription>
              Analysis timed out. The model took longer than expected to respond.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Summary */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {result.results.summary}
              </p>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(result.results.scores).map(([metric, score]) => (
                <div key={metric} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize">{metric.replace('_', ' ')}</span>
                    <span className="font-mono">{Math.round(score * 100)}%</span>
                  </div>
                  <Progress value={score * 100} className="h-1" />
                </div>
              ))}
            </div>

            {/* Key Insights */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
              <ul className="space-y-1">
                {result.results.keyInsights.slice(0, isExpanded ? undefined : 3).map((insight, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
              {!isExpanded && result.results.keyInsights.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleExpand}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Show {result.results.keyInsights.length - 3} more insights...
                </Button>
              )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-4 border-t"
              >
                {/* Recommendations */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {result.results.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                        <TrendingUp className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Detailed Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-green-700 mb-2 flex items-center">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Strengths
                    </h5>
                    <ul className="space-y-1">
                      {result.results.detailed_analysis.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          • {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-red-700 mb-2 flex items-center">
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      Areas for Improvement
                    </h5>
                    <ul className="space-y-1">
                      {result.results.detailed_analysis.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          • {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Raw Output (if available) */}
                {result.rawOutput && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Raw Model Output</h5>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {result.rawOutput.slice(0, 500)}
                        {result.rawOutput.length > 500 && '...'}
                      </pre>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Consolidated Insights Component
const ConsolidatedInsightsDisplay: React.FC<{
  insights: ConsolidatedInsights;
  modelsUsed: string[];
}> = ({ insights, modelsUsed }) => {
  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-blue-600" />
          <span>Consolidated AI Insights</span>
          <Badge variant="secondary" className="ml-auto">
            {modelsUsed.length} models
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Summary */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overall Analysis Summary
          </h4>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-gray-700 leading-relaxed mb-3">
              {insights.overallSummary}
            </p>
            <div className="flex items-center text-sm text-gray-600">
              <span>Consensus Confidence:</span>
              <div className="flex items-center ml-2">
                <Progress value={insights.confidenceScore * 100} className="w-20 h-2 mr-2" />
                <span className="font-mono">{Math.round(insights.confidenceScore * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Common Findings */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Cross-Model Agreement</h4>
          <div className="space-y-2">
            {insights.commonFindings.map((finding, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{finding}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conflicting Analyses (if any) */}
        {insights.conflictingAnalyses.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
              Differing Perspectives
            </h4>
            <div className="space-y-3">
              {insights.conflictingAnalyses.map((conflict, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border">
                  <h5 className="font-medium text-gray-800 mb-2">{conflict.topic}</h5>
                  <div className="space-y-2">
                    {conflict.models.map((modelView, modelIndex) => (
                      <div key={modelIndex} className="flex items-start space-x-2 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {modelView.model}
                        </Badge>
                        <span className="text-gray-700">{modelView.viewpoint}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consensus Recommendations */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Consensus Recommendations</h4>
          <div className="space-y-2">
            {insights.consensusRecommendations.map((recommendation, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border flex items-start space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Methodology Comparison */}
        {insights.methodologyComparison.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Methodology Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.methodologyComparison.map((comparison, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border">
                  <h6 className="font-medium text-gray-800 text-sm mb-1">
                    {comparison.aspect}
                  </h6>
                  <p className="text-xs text-gray-600">{comparison.comparison}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main Results Display Component
const AIAnalysisResultsDisplay: React.FC<{
  analysisResult: MultiAnalysisResult;
  onExport: (format: 'json' | 'pdf' | 'markdown') => void;
  onShare: () => void;
}> = ({ analysisResult, onExport, onShare }) => {
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('overview');

  const toggleModelExpansion = (modelId: string) => {
    setExpandedModels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(modelId)) {
        newSet.delete(modelId);
      } else {
        newSet.add(modelId);
      }
      return newSet;
    });
  };

  const completedResults = analysisResult.individualResults.filter(r => r.status === 'completed');
  const failedResults = analysisResult.individualResults.filter(r => r.status !== 'completed');

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {analysisResult.contentTitle}
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <span>Analysis Type: {analysisResult.analysisType}</span>
            <span>•</span>
            <span>Completed: {new Date(analysisResult.timestamp).toLocaleString()}</span>
            <span>•</span>
            <span>Processing Time: {analysisResult.processingTime}ms</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('pdf')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{completedResults.length}</p>
                <p className="text-sm text-gray-600">Successful Analyses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{failedResults.length}</p>
                <p className="text-sm text-gray-600">Failed Analyses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(analysisResult.consolidatedInsights.confidenceScore * 100)}%
                </p>
                <p className="text-sm text-gray-600">Overall Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Results */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Consolidated Insights</TabsTrigger>
          <TabsTrigger value="individual">Individual Results ({completedResults.length})</TabsTrigger>
          <TabsTrigger value="comparison">Model Comparison</TabsTrigger>
        </TabsList>

        {/* Consolidated Insights Tab */}
        <TabsContent value="overview" className="space-y-6">
          <ConsolidatedInsightsDisplay
            insights={analysisResult.consolidatedInsights}
            modelsUsed={analysisResult.modelsUsed}
          />
        </TabsContent>

        {/* Individual Results Tab */}
        <TabsContent value="individual" className="space-y-6">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {analysisResult.individualResults.map((result) => (
                <ModelResultCard
                  key={result.id}
                  result={result}
                  isExpanded={expandedModels.has(result.id)}
                  onToggleExpand={() => toggleModelExpansion(result.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Model Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Processing Time Comparison */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Processing Time</h4>
                  <div className="space-y-2">
                    {completedResults.map((result) => (
                      <div key={result.id} className="flex items-center space-x-3">
                        <div className="w-24 text-sm">{result.modelName}</div>
                        <div className="flex-1">
                          <Progress 
                            value={(result.processingTime / Math.max(...completedResults.map(r => r.processingTime))) * 100} 
                            className="h-2" 
                          />
                        </div>
                        <div className="w-16 text-sm font-mono text-right">
                          {result.processingTime}ms
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Confidence Comparison */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Confidence Scores</h4>
                  <div className="space-y-2">
                    {completedResults.map((result) => (
                      <div key={result.id} className="flex items-center space-x-3">
                        <div className="w-24 text-sm">{result.modelName}</div>
                        <div className="flex-1">
                          <Progress value={result.confidence * 100} className="h-2" />
                        </div>
                        <div className="w-16 text-sm font-mono text-right">
                          {Math.round(result.confidence * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Quality Metrics Comparison */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Quality Metrics Average</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['quality', 'relevance', 'educational_value', 'engagement'].map((metric) => (
                      <div key={metric} className="space-y-2">
                        <h5 className="text-sm font-medium capitalize">
                          {metric.replace('_', ' ')}
                        </h5>
                        {completedResults.map((result) => (
                          <div key={result.id} className="flex items-center justify-between text-xs">
                            <span>{result.modelName}</span>
                            <span className="font-mono">
                              {Math.round(result.results.scores[metric as keyof typeof result.results.scores] * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAnalysisResultsDisplay;
