import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Copy,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Star,
  Lightbulb,
  Target,
  BarChart3,
  Download,
  Award,
  Clock
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

import type { 
  MultiAnalysisResult, 
  AIAnalysisResult, 
  AIModelType,
  ConfidenceLevel,
  ConsolidatedInsights,
  ObjectDetection,
  EntityExtraction
} from '@/types/upload';
import { cn } from '@/lib/utils';

// Export functionality for comprehensive analysis reports
const exportAnalysisReport = (result: MultiAnalysisResult) => {
  const reportData = {
    timestamp: new Date().toISOString(),
    uploadId: result.uploadId,
    analysisResults: {
      cnn: result.cnnResults,
      ai: result.aiResults,
      consolidated: result.consolidatedInsights
    },
    summary: {
      modelsUsed: Object.keys(result.aiResults || {}),
      totalProcessingTime: calculateTotalProcessingTime(result),
      overallConfidence: calculateOverallConfidence(result),
      keyInsights: result.consolidatedInsights?.commonFindings || []
    }
  };

  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analysis-report-${result.uploadId}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Calculate total processing time across all models
const calculateTotalProcessingTime = (result: MultiAnalysisResult): number => {
  let total = 0;
  if (result.cnnResults?.processingTime) {
    total += result.cnnResults.processingTime;
  }
  if (result.aiResults) {
    Object.values(result.aiResults).forEach(aiResult => {
      total += aiResult.processingTime;
    });
  }
  return total;
};

// Calculate overall confidence score across all models
const calculateOverallConfidence = (result: MultiAnalysisResult): number => {
  const confidences: number[] = [];
  
  if (result.aiResults) {
    Object.values(result.aiResults).forEach(aiResult => {
      confidences.push(aiResult.confidence);
    });
  }
  
  if (result.consolidatedInsights?.confidenceScore) {
    confidences.push(result.consolidatedInsights.confidenceScore);
  }

  return confidences.length > 0 ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length : 0;
};

// Enhanced model comparison analysis
const generateModelComparison = (result: MultiAnalysisResult) => {
  if (!result.aiResults || typeof result.aiResults !== 'object') return null;

  const models = Object.keys(result.aiResults) as AIModelType[];
  if (models.length === 0) return null;

  // Ensure all models have valid data before proceeding
  const validModels = models.filter(model => {
    const modelResult = result.aiResults![model];
    return modelResult && 
           typeof modelResult === 'object' &&
           typeof modelResult.confidence === 'number' &&
           typeof modelResult.processingTime === 'number' &&
           modelResult.results;
  });
  
  if (validModels.length === 0) return null;

  const comparison = {
    performance: validModels.map(model => {
      const modelResult = result.aiResults![model];
      return {
        model,
        confidence: modelResult.confidence,
        processingTime: modelResult.processingTime,
        insightCount: modelResult.results?.insights?.length || 0,
        entityCount: modelResult.results?.entities?.length || 0
      };
    }),
    bestPerformer: validModels.length > 0 ? validModels.reduce((best, current) => 
      result.aiResults![current].confidence > result.aiResults![best].confidence ? current : best
    ) : null,
    fastestModel: validModels.length > 0 ? validModels.reduce((fastest, current) => 
      result.aiResults![current].processingTime < result.aiResults![fastest].processingTime ? current : fastest
    ) : null
  };

  return comparison;
};

interface MultiAnalysisResultsProps {
  result: MultiAnalysisResult;
  className?: string;
}

const getConfidenceLevel = (confidence: number): ConfidenceLevel => {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
};

const getConfidenceBadgeVariant = (level: ConfidenceLevel) => {
  switch (level) {
    case 'high': return 'default';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
  }
};

const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
  const level = getConfidenceLevel(confidence);
  const percentage = Math.round(confidence * 100);
  
  return (
    <Badge variant={getConfidenceBadgeVariant(level)} className="ml-2">
      {percentage}%
    </Badge>
  );
};

const AIModelIcon: React.FC<{ model: AIModelType }> = ({ model }) => {
  const icons = {
    gpt4: '🧠',
    claude: '🎓', 
    gemini: '⚡'
  };
  
  return <span className="text-lg">{icons[model]}</span>;
};

const EntityCard: React.FC<{ entity: EntityExtraction }> = ({ entity }) => (
  <Card className="p-3">
    <div className="flex items-center justify-between mb-2">
      <span className="font-medium">{entity.entity}</span>
      <ConfidenceBadge confidence={entity.confidence} />
    </div>
    <div className="text-xs text-gray-500 mb-1">
      Type: <Badge variant="outline" className="text-xs">{entity.type}</Badge>
    </div>
    <p className="text-sm text-gray-600">{entity.context}</p>
  </Card>
);

const AIResultCard: React.FC<{ model: AIModelType; result: AIAnalysisResult }> = ({ model, result }) => {
  const [expanded, setExpanded] = useState(false);

  // Ensure we have valid result data
  if (!result || !result.results) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AIModelIcon model={model} />
              </div>
              <div>
                <CardTitle className="text-lg capitalize">{model}</CardTitle>
                <p className="text-sm text-red-600">No results available</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AIModelIcon model={model} />
            </div>
            <div>
              <CardTitle className="text-lg capitalize">{model}</CardTitle>
              <p className="text-sm text-gray-600">
                {result.analysisType?.replace('_', ' ') || 'analysis'} • {(result.processingTime || 0).toFixed(1)}s
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ConfidenceBadge confidence={result.confidence || 0} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    Analysis Summary
                  </h4>
                  <MarkdownRenderer 
                    content={result.results?.description || 'No description available'}
                    variant="sm"
                    className="text-sm text-gray-600 leading-relaxed"
                  />
                </div>

                {/* Insights */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                    <Lightbulb className="w-4 h-4 mr-1" />
                    Key Insights
                  </h4>
                  <div className="space-y-2">
                    {result.results?.insights && result.results.insights.length > 0 ? (
                      result.results.insights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <MarkdownRenderer 
                            content={insight}
                            variant="sm"
                            className="text-sm text-gray-600 flex-1"
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No insights generated</p>
                    )}
                  </div>
                </div>

                {/* Entities */}
                {result.results?.entities && result.results.entities.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Identified Entities
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {result.results.entities.map((entity, index) => (
                        <EntityCard key={index} entity={entity} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {result.results?.recommendations && result.results.recommendations.length > 0 ? (
                      result.results.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <MarkdownRenderer 
                            content={rec}
                            variant="sm"
                            className="text-sm text-gray-600 flex-1"
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No recommendations available</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

const ConsolidatedInsightsCard: React.FC<{ insights: ConsolidatedInsights }> = ({ insights }) => {
  // Check if this is an authentication error
  const isAuthError = insights.summary.includes('Authentication required');
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {isAuthError ? (
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          ) : (
            <TrendingUp className="w-5 h-5 text-purple-500" />
          )}
          <span>{isAuthError ? 'Authentication Required' : 'Consolidated AI Insights'}</span>
          {!isAuthError && <ConfidenceBadge confidence={insights.confidenceScore} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">
            {isAuthError ? 'Access Denied' : 'Summary'}
          </h4>
          <MarkdownRenderer 
            content={insights.summary}
            variant="sm"
            className={`text-sm leading-relaxed ${isAuthError ? 'text-orange-600' : 'text-gray-600'}`}
          />
        </div>

        <Separator />

        {/* Recommended Actions - always show for auth errors */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
            <Target className="w-4 h-4 mr-1 text-blue-500" />
            {isAuthError ? 'Required Actions' : 'Recommended Actions'}
          </h4>
          <div className="space-y-2">
            {insights.recommendedActions.map((action, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Target className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isAuthError ? 'text-orange-500' : 'text-blue-500'}`} />
                <MarkdownRenderer 
                  content={action}
                  variant="sm"
                  className={`text-sm flex-1 ${isAuthError ? 'text-orange-600 font-medium' : 'text-gray-600'}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Only show other sections if not an auth error */}
        {!isAuthError && (
          <>
            {/* Common Findings */}
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
                Common Findings
              </h4>
              <div className="space-y-2">
                {insights.commonFindings.map((finding, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <MarkdownRenderer 
                      content={finding}
                      variant="sm"
                      className="text-sm text-gray-600 flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Conflicting Analyses */}
            {insights.conflictingAnalyses.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1 text-orange-500" />
                  Conflicting Analyses
                </h4>
                <div className="space-y-3">
                  {insights.conflictingAnalyses.map((conflict, index) => (
                    <Card key={index} className="p-3 bg-orange-50 border-orange-200">
                      <div className="mb-2">
                        <span className="font-medium text-sm">{conflict.finding}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {conflict.models.map(model => (
                          <Badge key={model} variant="outline" className="text-xs">
                            {model}: {Math.round(conflict.confidence[model] * 100)}%
                          </Badge>
                        ))}
                      </div>
                      <MarkdownRenderer 
                        content={conflict.resolution}
                        variant="sm"
                        className="text-xs text-gray-600"
                      />
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Separator />
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Import existing CNN components from the original file
const ObjectDetectionResults: React.FC<{ detections: ObjectDetection[] }> = ({ detections }) => (
  <div className="space-y-3">
    {detections.map((detection, index) => (
      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-3">
          <Cpu className="w-5 h-5 text-blue-500" />
          <div>
            <p className="font-medium">{detection.label}</p>
            <p className="text-xs text-gray-500">
              Detected at ({detection.boundingBox.x}, {detection.boundingBox.y})
            </p>
          </div>
        </div>
        <ConfidenceBadge confidence={detection.confidence} />
      </div>
    ))}
  </div>
);

export const MultiAnalysisResults: React.FC<MultiAnalysisResultsProps> = ({ 
  result, 
  className = '' 
}) => {
  // Safely get AI models and check for valid results
  const aiModels = result.aiResults && typeof result.aiResults === 'object' 
    ? Object.keys(result.aiResults).filter(key => 
        result.aiResults![key as AIModelType] && 
        typeof result.aiResults![key as AIModelType] === 'object' &&
        result.aiResults![key as AIModelType].results
      ) as AIModelType[] 
    : [];
    
  const hasAIResults = aiModels.length > 0;
  const hasCNNResults = !!result.cnnResults;
  const hasConsolidated = !!result.consolidatedInsights;

  // Set default tab based on available results
  const getDefaultTab = () => {
    if (hasConsolidated) return 'consolidated';
    if (hasAIResults) return 'ai-models';
    if (hasCNNResults) return 'cnn';
    return 'comparison';
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification here
  };

  // Debug logging to help identify issues
  console.log('🔍 MultiAnalysisResults Debug:', {
    result,
    aiModels,
    hasAIResults,
    hasConsolidated,
    aiResultsType: typeof result.aiResults,
    aiResultsKeys: result.aiResults ? Object.keys(result.aiResults) : 'none',
    defaultTab: getDefaultTab()
  });

  // If no results available, show a helpful message
  if (!hasAIResults && !hasCNNResults && !hasConsolidated) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center space-y-4">
            <Brain className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-600">
                No Analysis Results Available
              </p>
              <p className="text-sm text-gray-500">
                Results are being processed or an error occurred. Please try again.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("h-full", className)}
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <CardTitle>Enhanced AI Analysis Results</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {hasAIResults ? `${aiModels.length + (hasCNNResults ? 1 : 0)} models` : 'CNN only'}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy analysis data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exportAnalysisReport(result)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export comprehensive report</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              {hasConsolidated && (
                <TabsTrigger value="consolidated">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>Consolidated</span>
                  </div>
                </TabsTrigger>
              )}
              {hasAIResults && (
                <TabsTrigger value="ai-models">
                  <div className="flex items-center space-x-1">
                    <Brain className="w-4 h-4" />
                    <span>AI Models</span>
                  </div>
                </TabsTrigger>
              )}
              {hasCNNResults && (
                <TabsTrigger value="cnn">
                  <div className="flex items-center space-x-1">
                    <Cpu className="w-4 h-4" />
                    <span>CNN</span>
                  </div>
                </TabsTrigger>
              )}
              <TabsTrigger value="comparison">
                <div className="flex items-center space-x-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>Compare</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[500px] mt-4">
              {hasConsolidated && (
                <TabsContent value="consolidated" className="mt-0">
                  <ConsolidatedInsightsCard insights={result.consolidatedInsights!} />
                </TabsContent>
              )}
              
              {hasAIResults && (
                <TabsContent value="ai-models" className="mt-0">
                  <div className="space-y-4">
                    {aiModels.map(model => {
                      const modelResult = result.aiResults![model];
                      if (!modelResult) {
                        return (
                          <Card key={model} className="p-4">
                            <div className="text-center text-gray-500">
                              No results available for {model}
                            </div>
                          </Card>
                        );
                      }
                      return (
                        <AIResultCard 
                          key={model}
                          model={model}
                          result={modelResult}
                        />
                      );
                    })}
                  </div>
                </TabsContent>
              )}
              
              {hasCNNResults && (
                <TabsContent value="cnn" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Cpu className="w-5 h-5 text-blue-500" />
                        <span>CNN Analysis</span>
                        <Badge variant="outline">
                          {result.cnnResults!.processingTime}ms
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ObjectDetectionResults detections={result.cnnResults!.analysis.objectDetection} />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
              
              <TabsContent value="comparison" className="mt-0">
                <div className="space-y-6">
                  {/* Overall Analysis Summary */}
                  {(hasAIResults || hasCNNResults) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Award className="w-5 h-5 text-yellow-500" />
                          <span>Analysis Summary</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">Total Processing Time: {calculateTotalProcessingTime(result).toFixed(1)}s</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Overall Confidence: {Math.round(calculateOverallConfidence(result) * 100)}%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span className="text-sm">Models Used: {(hasAIResults ? aiModels.length : 0) + (hasCNNResults ? 1 : 0)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Enhanced Model Comparison */}
                  {(hasAIResults || hasCNNResults) && (() => {
                    try {
                      const comparison = generateModelComparison(result);
                      
                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <BarChart3 className="w-5 h-5 text-green-500" />
                              <span>Model Performance Comparison</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-6">
                              {/* Performance Leaders */}
                              {comparison && comparison.bestPerformer && comparison.fastestModel && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                  <Card className="p-4 border-green-200 bg-green-50">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Target className="w-5 h-5 text-green-600" />
                                      <span className="font-medium text-green-800">Highest Confidence</span>
                                    </div>
                                    <div className="text-sm text-green-700">
                                      <p className="font-semibold capitalize">{comparison.bestPerformer}</p>
                                      <p>{Math.round(result.aiResults![comparison.bestPerformer].confidence * 100)}% confidence</p>
                                    </div>
                                  </Card>
                                  
                                  <Card className="p-4 border-blue-200 bg-blue-50">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Clock className="w-5 h-5 text-blue-600" />
                                      <span className="font-medium text-blue-800">Fastest Processing</span>
                                    </div>
                                    <div className="text-sm text-blue-700">
                                      <p className="font-semibold capitalize">{comparison.fastestModel}</p>
                                      <p>{result.aiResults![comparison.fastestModel].processingTime.toFixed(1)}s processing time</p>
                                    </div>
                                  </Card>
                                </div>
                              )}

                            {/* Detailed Model Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {hasCNNResults && (
                                <Card className="p-4 border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <Cpu className="w-5 h-5 text-blue-500" />
                                      <span className="font-medium">CNN</span>
                                    </div>
                                    <Badge variant="secondary">Traditional</Badge>
                                  </div>
                                  <div className="text-sm space-y-2">
                                    <div className="flex justify-between">
                                      <span>Processing:</span>
                                      <span>{result.cnnResults!.processingTime}ms</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Objects:</span>
                                      <span>{result.cnnResults!.analysis.objectDetection.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Categories:</span>
                                      <span>{result.cnnResults!.analysis.categorization.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Hardware:</span>
                                      <span>{result.cnnResults!.analysis.hardwareIdentification.length}</span>
                                    </div>
                                  </div>
                                </Card>
                              )}
                              
                              {hasAIResults && aiModels.map(model => (
                                <Card key={model} className="p-4 border-purple-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <AIModelIcon model={model} />
                                      <span className="font-medium capitalize">{model}</span>
                                    </div>
                                    <ConfidenceBadge confidence={result.aiResults![model].confidence} />
                                  </div>
                                  <div className="text-sm space-y-2">
                                    <div className="flex justify-between">
                                      <span>Confidence:</span>
                                      <span>{Math.round(result.aiResults![model].confidence * 100)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Processing:</span>
                                      <span>{result.aiResults![model].processingTime.toFixed(1)}s</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Insights:</span>
                                      <span>{result.aiResults![model].results.insights.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Entities:</span>
                                      <span>{result.aiResults![model].results.entities.length}</span>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                            
                            {/* Confidence Analysis Chart Placeholder */}
                            {hasAIResults && (
                              <Card className="p-4">
                                <CardTitle className="text-sm mb-3 flex items-center space-x-2">
                                  <TrendingUp className="w-4 h-4" />
                                  <span>Confidence Analysis</span>
                                </CardTitle>
                                <div className="space-y-2">
                                  {aiModels.map(model => {
                                    const confidence = result.aiResults![model].confidence;
                                    return (
                                      <div key={model} className="flex items-center space-x-3">
                                        <span className="text-sm w-16 capitalize">{model}:</span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className="bg-gradient-to-r from-red-400 via-yellow-400 to-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${confidence * 100}%` }}
                                          />
                                        </div>
                                        <span className="text-sm w-12 text-right">{Math.round(confidence * 100)}%</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </Card>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                    } catch (error) {
                      console.error('Error rendering model comparison:', error);
                      return (
                        <Card>
                          <CardContent>
                            <div className="text-center py-4 text-gray-500">
                              Unable to display model comparison. No valid analysis results available.
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                  })()}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};
