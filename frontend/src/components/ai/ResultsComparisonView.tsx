/**
 * Results Comparison View Component
 * Story 2.6: AI Progress Tracking and Results Display Enhancement
 * Task 2.6.2: Comprehensive Results Display Interface
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Equal,
  BarChart3,
  Filter,
  ArrowLeftRight
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { AIModelType } from '@/types/progressTracking';

import { cn } from '@/lib/utils';

// Comparison-specific interfaces
interface ComparisonResult {
  model1: AIModelType;
  model2: AIModelType;
  similarity: number;
  agreements: ComparisonPoint[];
  differences: ComparisonPoint[];
  conflicts: ConflictPoint[];
  summary: string;
}

interface ComparisonPoint {
  category: 'insight' | 'entity' | 'sentiment' | 'recommendation' | 'topic';
  content: string;
  confidence: number;
  models: AIModelType[];
}

interface ConflictPoint {
  category: 'interpretation' | 'confidence' | 'classification' | 'recommendation';
  description: string;
  model1Perspective: string;
  model2Perspective: string;
  severity: 'low' | 'medium' | 'high';
  resolution?: string;
}

interface EntityComparison {
  text: string;
  models: Array<{
    model: AIModelType;
    type: string;
    confidence: number;
    context?: string;
  }>;
  consensus: 'agree' | 'disagree' | 'partial';
}

interface SentimentComparison {
  models: Array<{
    model: AIModelType;
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }>;
  consensus: boolean;
  averageConfidence: number;
}

interface ResultsComparisonViewProps {
  modelResults: Array<{
    model: AIModelType;
    results: {
      summary: string;
      keyInsights: string[];
      entities: Array<{
        text: string;
        type: string;
        confidence: number;
        context?: string;
      }>;
      sentimentAnalysis?: {
        overall: 'positive' | 'negative' | 'neutral';
        confidence: number;
      };
      recommendations: string[];
    };
    confidence: number;
  }>;
  className?: string;
  showDetailedDiff?: boolean;
  onConflictResolve?: (conflict: ConflictPoint, resolution: string) => void;
}

// Model Icon Helper
const ModelIcon: React.FC<{ model: AIModelType; size?: 'sm' | 'md' }> = ({ 
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

  const sizeClass = size === 'sm' ? 'text-sm' : 'text-lg';
  return <span className={sizeClass}>{getIcon()}</span>;
};

// Similarity Score Component
const SimilarityScore: React.FC<{ 
  score: number; 
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ score, label, size = 'md' }) => {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="h-4 w-4" />;
    if (score >= 60) return <Equal className="h-4 w-4" />;
    if (score >= 40) return <TrendingDown className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }[size];

  return (
    <div className="flex items-center space-x-2">
      {label && <span className="text-sm text-gray-600">{label}:</span>}
      <Badge className={cn(sizeClasses, getColor(score), "flex items-center space-x-1")}>
        {getIcon(score)}
        <span>{score.toFixed(1)}%</span>
      </Badge>
    </div>
  );
};

// Entity Comparison Grid
const EntityComparisonGrid: React.FC<{
  entities: EntityComparison[];
  maxDisplay?: number;
}> = ({ entities, maxDisplay = 20 }) => {
  const [showAll, setShowAll] = useState(false);
  
  const displayEntities = showAll ? entities : entities.slice(0, maxDisplay);

  const getConsensusColor = (consensus: EntityComparison['consensus']) => {
    switch (consensus) {
      case 'agree': return 'border-green-200 bg-green-50';
      case 'partial': return 'border-yellow-200 bg-yellow-50';
      case 'disagree': return 'border-red-200 bg-red-50';
    }
  };

  const getTypeColor = (type: string) => {
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
    <div className="space-y-4">
      <div className="grid gap-3">
        {displayEntities.map((entity, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "p-3 border rounded-lg",
              getConsensusColor(entity.consensus)
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="font-medium text-gray-900">{entity.text}</div>
              <Badge className={cn(
                entity.consensus === 'agree' ? 'bg-green-100 text-green-800' :
                entity.consensus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              )}>
                {entity.consensus}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {entity.models.map((modelData, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center space-x-2">
                    <ModelIcon model={modelData.model} size="sm" />
                    <span className="text-sm font-medium">{modelData.model}</span>
                  </div>
                  <div className="text-right">
                    <Badge className={cn("text-xs", getTypeColor(modelData.type))}>
                      {modelData.type}
                    </Badge>
                    <div className="text-xs text-gray-600 mt-1">
                      {modelData.confidence.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {entities.length > maxDisplay && (
        <Button 
          variant="outline" 
          onClick={() => setShowAll(!showAll)}
          className="w-full"
        >
          {showAll ? 'Show Less' : `Show ${entities.length - maxDisplay} More Entities`}
        </Button>
      )}
    </div>
  );
};

// Conflict Resolution Panel
const ConflictResolutionPanel: React.FC<{
  conflicts: ConflictPoint[];
  onResolve?: (conflict: ConflictPoint, resolution: string) => void;
}> = ({ conflicts, onResolve }) => {
  const getSeverityColor = (severity: ConflictPoint['severity']) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
    }
  };

  const getSeverityIcon = (severity: ConflictPoint['severity']) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium': return <TrendingDown className="h-4 w-4 text-yellow-600" />;
      case 'low': return <TrendingUp className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {conflicts.map((conflict, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn("p-4 border rounded-lg", getSeverityColor(conflict.severity))}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getSeverityIcon(conflict.severity)}
              <h4 className="font-semibold capitalize">{conflict.category} Conflict</h4>
            </div>
            <Badge className={cn(
              conflict.severity === 'high' ? 'bg-red-100 text-red-800' :
              conflict.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            )}>
              {conflict.severity}
            </Badge>
          </div>

          <p className="text-gray-700 mb-4">{conflict.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded border">
              <h5 className="font-medium text-blue-700 mb-2">Model A Perspective</h5>
              <p className="text-sm text-gray-700">{conflict.model1Perspective}</p>
            </div>
            <div className="p-3 bg-white rounded border">
              <h5 className="font-medium text-purple-700 mb-2">Model B Perspective</h5>
              <p className="text-sm text-gray-700">{conflict.model2Perspective}</p>
            </div>
          </div>

          {conflict.resolution && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <h5 className="font-medium text-green-700 mb-2">Suggested Resolution</h5>
              <p className="text-sm text-green-700">{conflict.resolution}</p>
            </div>
          )}

          {!conflict.resolution && onResolve && (
            <div className="mt-4 flex justify-end">
              <Button 
                size="sm" 
                onClick={() => onResolve(conflict, "AI-suggested resolution")}
              >
                Generate Resolution
              </Button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

// Main Results Comparison View Component
export const ResultsComparisonView: React.FC<ResultsComparisonViewProps> = ({
  modelResults,
  className,
  onConflictResolve
}) => {
  const [selectedModels, setSelectedModels] = useState<[AIModelType, AIModelType] | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'entities' | 'sentiment' | 'conflicts'>('overview');

  // Generate comparisons between models
  const comparisons = useMemo(() => {
    const results: ComparisonResult[] = [];
    
    for (let i = 0; i < modelResults.length; i++) {
      for (let j = i + 1; j < modelResults.length; j++) {
        const model1 = modelResults[i];
        const model2 = modelResults[j];
        
        // Calculate similarity based on common insights and entities
        const commonInsights = model1.results.keyInsights.filter(insight =>
          model2.results.keyInsights.some(insight2 => 
            insight.toLowerCase().includes(insight2.toLowerCase().split(' ')[0]) ||
            insight2.toLowerCase().includes(insight.toLowerCase().split(' ')[0])
          )
        ).length;
        
        const totalInsights = Math.max(model1.results.keyInsights.length, model2.results.keyInsights.length);
        const similarity = totalInsights > 0 ? (commonInsights / totalInsights) * 100 : 0;

        results.push({
          model1: model1.model,
          model2: model2.model,
          similarity,
          agreements: [],
          differences: [],
          conflicts: [],
          summary: `${model1.model} and ${model2.model} show ${similarity.toFixed(1)}% similarity in their analysis.`
        });
      }
    }
    
    return results;
  }, [modelResults]);

  // Generate entity comparisons
  const entityComparisons = useMemo(() => {
    const entityMap = new Map<string, EntityComparison>();
    
    modelResults.forEach(({ model, results }) => {
      results.entities.forEach(entity => {
        const key = entity.text.toLowerCase();
        if (!entityMap.has(key)) {
          entityMap.set(key, {
            text: entity.text,
            models: [],
            consensus: 'agree'
          });
        }
        
        const comparison = entityMap.get(key)!;
        comparison.models.push({
          model,
          type: entity.type,
          confidence: entity.confidence,
          context: entity.context
        });
        
        // Determine consensus
        const types = comparison.models.map(m => m.type);
        const uniqueTypes = new Set(types);
        comparison.consensus = uniqueTypes.size === 1 ? 'agree' : 
                             uniqueTypes.size === 2 ? 'partial' : 'disagree';
      });
    });
    
    return Array.from(entityMap.values());
  }, [modelResults]);

  // Generate sentiment comparison
  const sentimentComparison = useMemo<SentimentComparison>(() => {
    const models = modelResults
      .filter(result => result.results.sentimentAnalysis)
      .map(result => ({
        model: result.model,
        sentiment: result.results.sentimentAnalysis!.overall,
        confidence: result.results.sentimentAnalysis!.confidence
      }));

    const sentiments = models.map(m => m.sentiment);
    const uniqueSentiments = new Set(sentiments);
    const consensus = uniqueSentiments.size === 1;
    const averageConfidence = models.reduce((sum, m) => sum + m.confidence, 0) / models.length;

    return {
      models,
      consensus,
      averageConfidence
    };
  }, [modelResults]);

  const handleModelPairSelect = (model1: AIModelType, model2: AIModelType) => {
    setSelectedModels([model1, model2]);
  };

  const selectedComparison = selectedModels ? 
    comparisons.find(c => 
      (c.model1 === selectedModels[0] && c.model2 === selectedModels[1]) ||
      (c.model1 === selectedModels[1] && c.model2 === selectedModels[0])
    ) : null;

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <GitCompare className="h-6 w-6" />
            <span>Model Comparison Analysis</span>
          </h2>
          <p className="text-gray-600">
            Compare results across {modelResults.length} AI models to identify patterns and conflicts
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      {/* Model Pair Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowLeftRight className="h-5 w-5" />
            <span>Select Models to Compare</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisons.map((comparison, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedComparison === comparison ? "border-blue-500 bg-blue-50" : "hover:border-gray-300"
                  )}
                  onClick={() => handleModelPairSelect(comparison.model1, comparison.model2)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <ModelIcon model={comparison.model1} size="sm" />
                        <span className="text-sm font-medium">{comparison.model1}</span>
                      </div>
                      <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                      <div className="flex items-center space-x-2">
                        <ModelIcon model={comparison.model2} size="sm" />
                        <span className="text-sm font-medium">{comparison.model2}</span>
                      </div>
                    </div>
                    
                    <SimilarityScore score={comparison.similarity} size="sm" />
                    
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                      {comparison.summary}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison */}
      {selectedComparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ModelIcon model={selectedComparison.model1} />
                <span>{selectedComparison.model1.toUpperCase()}</span>
                <ArrowLeftRight className="h-5 w-5 text-gray-400" />
                <ModelIcon model={selectedComparison.model2} />
                <span>{selectedComparison.model2.toUpperCase()}</span>
              </div>
              <SimilarityScore score={selectedComparison.similarity} />
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="entities">Entities</TabsTrigger>
                <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
                <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Model Results Side by Side */}
                  {[selectedComparison.model1, selectedComparison.model2].map(model => {
                    const modelResult = modelResults.find(r => r.model === model);
                    if (!modelResult) return null;

                    return (
                      <Card key={model}>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <ModelIcon model={model} />
                            <span>{model.toUpperCase()}</span>
                            <Badge className="bg-blue-100 text-blue-800">
                              {modelResult.confidence.toFixed(1)}%
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Summary</h4>
                            <p className="text-sm text-gray-700">{modelResult.results.summary}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Key Insights</h4>
                            <ul className="space-y-1">
                              {modelResult.results.keyInsights.slice(0, 3).map((insight, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start space-x-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  <span>{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Recommendations</h4>
                            <ul className="space-y-1">
                              {modelResult.results.recommendations.slice(0, 2).map((rec, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start space-x-2">
                                  <span className="text-green-500 mt-1">→</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="entities">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Entity Comparison</h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                        <span>Agree</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                        <span>Partial</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                        <span>Disagree</span>
                      </div>
                    </div>
                  </div>
                  
                  <EntityComparisonGrid entities={entityComparisons} />
                </div>
              </TabsContent>

              <TabsContent value="sentiment">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sentiment Analysis Comparison</h3>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-4">Model Sentiments</h4>
                          <div className="space-y-3">
                            {sentimentComparison.models.map(model => (
                              <div key={model.model} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <div className="flex items-center space-x-2">
                                  <ModelIcon model={model.model} size="sm" />
                                  <span className="font-medium">{model.model}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge className={
                                    model.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                    model.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }>
                                    {model.sentiment}
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    {model.confidence.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-4">Consensus Analysis</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <span>Consensus</span>
                              <Badge className={sentimentComparison.consensus ? 
                                'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }>
                                {sentimentComparison.consensus ? 'Yes' : 'No'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <span>Average Confidence</span>
                              <span className="font-medium">
                                {sentimentComparison.averageConfidence.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="conflicts">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Analysis Conflicts & Resolutions</h3>
                  
                  {selectedComparison.conflicts.length > 0 ? (
                    <ConflictResolutionPanel 
                      conflicts={selectedComparison.conflicts}
                      onResolve={onConflictResolve}
                    />
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h4 className="font-semibold text-green-700 mb-2">No Conflicts Detected</h4>
                        <p className="text-gray-600">
                          The selected models show strong agreement in their analysis.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Comparison Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(comparisons.reduce((sum, c) => sum + c.similarity, 0) / comparisons.length).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Average Similarity</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {entityComparisons.filter(e => e.consensus === 'agree').length}
              </div>
              <div className="text-sm text-gray-600">Entity Agreements</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {entityComparisons.filter(e => e.consensus === 'partial').length}
              </div>
              <div className="text-sm text-gray-600">Partial Agreements</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {entityComparisons.filter(e => e.consensus === 'disagree').length}
              </div>
              <div className="text-sm text-gray-600">Disagreements</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
