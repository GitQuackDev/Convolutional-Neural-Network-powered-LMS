/**
 * Enhanced AI Results Display Component
 * Story 2.6: AI Progress Tracking and Results Display Enhancement
 * Task 2.6.2: Comprehensive Results Display Interface
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  Filter,
  Search,
  Star,
  Clock,
  Zap,
  Target,
  Award,
  BookOpen,
  Layers
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

import type { AIModelType } from '@/types/progressTracking';

import { cn } from '@/lib/utils';

// Enhanced result types
interface DetailedModelResult {
  model: AIModelType;
  status: 'completed' | 'error';
  confidence: number;
  processingTime: number;
  results: {
    summary: string;
    keyInsights: string[];
    entities: ExtractedEntity[];
    sentimentAnalysis?: SentimentResult;
    topics: TopicAnalysis[];
    recommendations: string[];
    metadata: AnalysisMetadata;
  };
  error?: string;
}

interface ExtractedEntity {
  text: string;
  type: 'person' | 'organization' | 'location' | 'concept' | 'date' | 'other';
  confidence: number;
  startPosition: number;
  endPosition: number;
  context?: string;
}

interface SentimentResult {
  overall: 'positive' | 'negative' | 'neutral';
  confidence: number;
  aspects: Array<{
    aspect: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }>;
}

interface TopicAnalysis {
  topic: string;
  relevance: number;
  keywords: string[];
  frequency: number;
}

interface AnalysisMetadata {
  version: string;
  timestamp: Date;
  tokenCount: number;
  language: string;
  complexity: 'low' | 'medium' | 'high';
  readabilityScore?: number;
}

interface ConsolidatedInsights {
  combinedSummary: string;
  consensusInsights: string[];
  conflictingFindings: ConflictAnalysis[];
  highConfidenceEntities: ExtractedEntity[];
  synthesizedRecommendations: string[];
  overallAssessment: string;
  confidenceScore: number;
}

interface ConflictAnalysis {
  topic: string;
  models: AIModelType[];
  conflictType: 'interpretation' | 'confidence' | 'classification' | 'recommendation';
  severity: 'low' | 'medium' | 'high';
  description: string;
  resolution?: string;
}

interface EnhancedAnalysisResults {
  analysisId: string;
  overallConfidence: number;
  processingTime: number;
  modelResults: Record<AIModelType, DetailedModelResult>;
  consolidatedInsights: ConsolidatedInsights;
  comparisons: ModelComparison[];
  exportOptions: ExportConfiguration[];
  metadata: {
    analysisType: string;
    modelsUsed: AIModelType[];
    startTime: Date;
    completionTime: Date;
    fileInfo: {
      name: string;
      size: number;
      type: string;
    };
  };
}

interface ModelComparison {
  models: [AIModelType, AIModelType];
  similarity: number;
  differences: string[];
  agreementAreas: string[];
  conflictAreas: ConflictAnalysis[];
}

interface ExportConfiguration {
  format: 'pdf' | 'json' | 'csv' | 'html';
  name: string;
  description: string;
  includeMetadata: boolean;
  includeModelComparisons: boolean;
  includeConsolidatedInsights: boolean;
}

interface EnhancedAIResultsDisplayProps {
  results: EnhancedAnalysisResults;
  className?: string;
  showMetadata?: boolean;
  showComparisons?: boolean;
  showExportOptions?: boolean;
  onExport?: (format: ExportConfiguration['format']) => void;
  onShare?: () => void;
  onFavorite?: () => void;
}

// Model Icon Component
const ModelIcon: React.FC<{ model: AIModelType; size?: 'sm' | 'md' | 'lg' }> = ({ 
  model, 
  size = 'md' 
}) => {
  const getIcon = () => {
    switch (model) {
      case 'gpt-4': return '🧠';
      case 'claude-3': return '🎭';
      case 'gemini-pro': return '💎';
      default: return '🤖';
    }
  };

  const sizeClass = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  }[size];

  return <span className={sizeClass}>{getIcon()}</span>;
};

// Confidence Indicator Component
const ConfidenceIndicator: React.FC<{ 
  confidence: number; 
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ confidence, label, size = 'md' }) => {
  const getColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }[size];

  return (
    <div className="flex items-center space-x-2">
      {label && <span className="text-sm text-gray-600">{label}:</span>}
      <Badge className={cn(sizeClasses, getColor(confidence))}>
        {confidence.toFixed(1)}%
      </Badge>
    </div>
  );
};

// Entity Display Component
const EntityDisplay: React.FC<{ 
  entities: ExtractedEntity[];
  maxDisplay?: number;
}> = ({ entities, maxDisplay = 10 }) => {
  const [showAll, setShowAll] = useState(false);
  
  const displayEntities = showAll ? entities : entities.slice(0, maxDisplay);
  
  const getEntityColor = (type: ExtractedEntity['type']) => {
    switch (type) {
      case 'person': return 'bg-blue-100 text-blue-800';
      case 'organization': return 'bg-purple-100 text-purple-800';
      case 'location': return 'bg-green-100 text-green-800';
      case 'concept': return 'bg-orange-100 text-orange-800';
      case 'date': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {displayEntities.map((entity, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Badge 
              className={cn("cursor-help", getEntityColor(entity.type))}
              title={`Type: ${entity.type}, Confidence: ${entity.confidence.toFixed(1)}%`}
            >
              {entity.text}
            </Badge>
          </motion.div>
        ))}
      </div>
      
      {entities.length > maxDisplay && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show Less' : `Show ${entities.length - maxDisplay} More`}
        </Button>
      )}
    </div>
  );
};

// Individual Model Result Card
const ModelResultCard: React.FC<{ 
  result: DetailedModelResult;
  expanded?: boolean;
  onToggleExpand?: () => void;
}> = ({ result, expanded = false, onToggleExpand }) => {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ModelIcon model={result.model} size="lg" />
            <div>
              <CardTitle className="text-lg">{result.model.toUpperCase()}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={result.status === 'completed' ? 
                  'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }>
                  {result.status}
                </Badge>
                <ConfidenceIndicator confidence={result.confidence} size="sm" />
              </div>
            </div>
          </div>
          
          <div className="text-right text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(result.processingTime)}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {result.status === 'error' && result.error && (
          <Alert className="border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {result.error}
            </AlertDescription>
          </Alert>
        )}

        {result.status === 'completed' && (
          <>
            {/* Summary */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Summary</span>
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {result.results.summary}
              </p>
            </div>

            {/* Key Insights */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Key Insights ({result.results.keyInsights.length})</span>
              </h4>
              <ul className="space-y-1">
                {result.results.keyInsights.slice(0, expanded ? undefined : 3).map((insight, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
              {result.results.keyInsights.length > 3 && !expanded && (
                <Button variant="ghost" size="sm" onClick={onToggleExpand}>
                  Show {result.results.keyInsights.length - 3} more insights
                </Button>
              )}
            </div>

            {/* Entities */}
            {result.results.entities.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center space-x-2">
                  <Layers className="h-4 w-4" />
                  <span>Entities ({result.results.entities.length})</span>
                </h4>
                <EntityDisplay entities={result.results.entities} />
              </div>
            )}

            {/* Sentiment Analysis */}
            {result.results.sentimentAnalysis && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Sentiment Analysis</span>
                </h4>
                <div className="flex items-center space-x-4">
                  <Badge className={
                    result.results.sentimentAnalysis.overall === 'positive' ? 'bg-green-100 text-green-800' :
                    result.results.sentimentAnalysis.overall === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {result.results.sentimentAnalysis.overall}
                  </Badge>
                  <ConfidenceIndicator 
                    confidence={result.results.sentimentAnalysis.confidence} 
                    size="sm" 
                  />
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.results.recommendations.length > 0 && expanded && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>Recommendations</span>
                </h4>
                <ul className="space-y-1">
                  {result.results.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <span className="text-green-500 mt-1">→</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metadata */}
            {expanded && (
              <div className="pt-3 border-t">
                <h4 className="font-semibold text-sm text-gray-600 mb-2">Analysis Metadata</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Tokens: {result.results.metadata.tokenCount.toLocaleString()}</div>
                  <div>Language: {result.results.metadata.language}</div>
                  <div>Complexity: {result.results.metadata.complexity}</div>
                  <div>Version: {result.results.metadata.version}</div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Main Enhanced AI Results Display Component
export const EnhancedAIResultsDisplay: React.FC<EnhancedAIResultsDisplayProps> = ({
  results,
  className,
  showComparisons = true,
  showExportOptions = true,
  onExport,
  onShare,
  onFavorite
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'comparison' | 'insights'>('overview');
  const [expandedModels, setExpandedModels] = useState<Set<AIModelType>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Filter results based on search
  const filteredResults = useMemo(() => {
    if (!searchTerm) return results;
    
    const searchLower = searchTerm.toLowerCase();
    const filteredModelResults = {} as Partial<Record<AIModelType, DetailedModelResult>>;
    
    Object.entries(results.modelResults).forEach(([model, result]) => {
      const searchableText = [
        result.results.summary,
        ...result.results.keyInsights,
        ...result.results.recommendations,
        ...result.results.entities.map(e => e.text)
      ].join(' ').toLowerCase();
      
      if (searchableText.includes(searchLower)) {
        filteredModelResults[model as AIModelType] = result;
      }
    });

    return {
      ...results,
      modelResults: filteredModelResults as Record<AIModelType, DetailedModelResult>
    };
  }, [results, searchTerm]);

  const toggleModelExpansion = (model: AIModelType) => {
    setExpandedModels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(model)) {
        newSet.delete(model);
      } else {
        newSet.add(model);
      }
      return newSet;
    });
  };

  const modelResultsArray = Object.entries(filteredResults.modelResults);
  const completedModels = modelResultsArray.filter(([, result]) => result.status === 'completed');
  const errorModels = modelResultsArray.filter(([, result]) => result.status === 'error');

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Brain className="h-6 w-6" />
            <span>Analysis Results</span>
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Models: {results.metadata.modelsUsed.length}</span>
            <span>•</span>
            <span>Duration: {Math.floor(results.processingTime / 1000)}s</span>
            <span>•</span>
            <ConfidenceIndicator 
              confidence={results.overallConfidence} 
              label="Overall Confidence"
              size="sm"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onFavorite}>
            <Star className="h-4 w-4 mr-1" />
            Favorite
          </Button>
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          {showExportOptions && (
            <Button variant="outline" size="sm" onClick={() => onExport?.('pdf')}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search insights, entities, recommendations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-1" />
          Filter
        </Button>
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-semibold">{completedModels.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-semibold">{errorModels.length}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-semibold">
                  {Object.values(filteredResults.modelResults)
                    .reduce((acc, result) => acc + (result.results?.keyInsights?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Insights</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Model Results</TabsTrigger>
          {showComparisons && <TabsTrigger value="comparison">Comparison</TabsTrigger>}
          <TabsTrigger value="insights">Consolidated</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {modelResultsArray.map(([model, result]) => (
              <ModelResultCard
                key={model}
                result={result}
                expanded={expandedModels.has(model as AIModelType)}
                onToggleExpand={() => toggleModelExpansion(model as AIModelType)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Individual Model Results Tab */}
        <TabsContent value="models" className="space-y-6">
          {modelResultsArray.map(([model, result]) => (
            <ModelResultCard
              key={model}
              result={result}
              expanded={true}
            />
          ))}
        </TabsContent>

        {/* Comparison Tab */}
        {showComparisons && (
          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Comparison Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  Comparison view implementation coming in next task...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Consolidated Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Consolidated Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Combined Summary</h4>
                <p className="text-gray-700 leading-relaxed">
                  {results.consolidatedInsights.combinedSummary}
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Consensus Insights</h4>
                <ul className="space-y-1">
                  {results.consolidatedInsights.consensusInsights.map((insight, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Synthesized Recommendations</h4>
                <ul className="space-y-1">
                  {results.consolidatedInsights.synthesizedRecommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Award className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
