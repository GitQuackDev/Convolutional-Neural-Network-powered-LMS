/**
 * Consolidated Insights Panel Component
 * Story 2.6: AI Progress Tracking and Results Display Enhancement
 * Task 2.6.2: Comprehensive Results Display Interface
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Award,
  Target,
  Zap,
  Brain,
  BarChart3,
  BookOpen,
  Star,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Download,
  Share2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

import type { AIModelType } from '@/types/progressTracking';

import { cn } from '@/lib/utils';

// Consolidated insights interfaces
interface ConsolidatedInsights {
  combinedSummary: string;
  consensusInsights: ConsensusInsight[];
  conflictingFindings: ConflictingFinding[];
  highConfidenceEntities: HighConfidenceEntity[];
  synthesizedRecommendations: SynthesizedRecommendation[];
  overallAssessment: string;
  confidenceScore: number;
  qualityMetrics: QualityMetrics;
}

interface ConsensusInsight {
  insight: string;
  supportingModels: AIModelType[];
  confidence: number;
  category: 'content' | 'structure' | 'quality' | 'readability' | 'engagement';
  importance: 'high' | 'medium' | 'low';
  evidence: string[];
}

interface ConflictingFinding {
  topic: string;
  perspectives: Array<{
    model: AIModelType;
    position: string;
    confidence: number;
    reasoning: string;
  }>;
  resolutionStrategy: 'majority_rule' | 'confidence_weighted' | 'expert_review' | 'context_dependent';
  suggestedResolution?: string;
  impact: 'high' | 'medium' | 'low';
}

interface HighConfidenceEntity {
  text: string;
  type: string;
  averageConfidence: number;
  modelAgreement: number; // percentage of models that agree
  occurrenceCount: number;
  context: string[];
  significance: 'critical' | 'important' | 'notable' | 'minor';
}

interface SynthesizedRecommendation {
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  category: 'improvement' | 'optimization' | 'maintenance' | 'enhancement';
  feasibility: 'easy' | 'moderate' | 'challenging';
  impact: 'high' | 'medium' | 'low';
  supportingModels: AIModelType[];
  actionItems: string[];
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

interface QualityMetrics {
  overallQuality: number;
  consistency: number;
  completeness: number;
  reliability: number;
  novelty: number;
  actionability: number;
}

interface ConsolidatedInsightsPanelProps {
  insights: ConsolidatedInsights;
  className?: string;
  showMetrics?: boolean;
  showConflicts?: boolean;
  allowVoting?: boolean;
  onInsightVote?: (insightId: string, vote: 'up' | 'down') => void;
  onRecommendationAction?: (recommendationId: string, action: string) => void;
  onExport?: (format: 'pdf' | 'json' | 'markdown') => void;
}

// Quality Score Component
const QualityScore: React.FC<{ 
  score: number; 
  label: string;
  description?: string;
}> = ({ score, label, description }) => {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <Badge className={getColor(score)}>
          {score.toFixed(1)}%
        </Badge>
      </div>
      <Progress value={score} className="h-2" />
      {description && (
        <p className="text-xs text-gray-600">{description}</p>
      )}
    </div>
  );
};

// Consensus Insight Card
const ConsensusInsightCard: React.FC<{
  insight: ConsensusInsight;
  index: number;
  allowVoting?: boolean;
  onVote?: (vote: 'up' | 'down') => void;
}> = ({ insight, index, allowVoting, onVote }) => {
  const getImportanceColor = (importance: ConsensusInsight['importance']) => {
    switch (importance) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
    }
  };

  const getCategoryIcon = (category: ConsensusInsight['category']) => {
    switch (category) {
      case 'content': return <BookOpen className="h-4 w-4" />;
      case 'structure': return <BarChart3 className="h-4 w-4" />;
      case 'quality': return <Star className="h-4 w-4" />;
      case 'readability': return <Target className="h-4 w-4" />;
      case 'engagement': return <Zap className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const ModelIcon: React.FC<{ model: AIModelType }> = ({ model }) => {
    const getIcon = () => {
      switch (model) {
        case 'gpt-4': return '🧠';
        case 'claude-3': return '🎭';
        case 'gemini-pro': return '💎';
        default: return '🤖';
      }
    };
    return <span className="text-sm">{getIcon()}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn("p-4 border rounded-lg", getImportanceColor(insight.importance))}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getCategoryIcon(insight.category)}
          <span className="font-semibold capitalize">{insight.category}</span>
          <Badge className={cn(
            insight.importance === 'high' ? 'bg-red-100 text-red-800' :
            insight.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          )}>
            {insight.importance}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className="bg-white text-gray-700">
            {insight.confidence.toFixed(1)}%
          </Badge>
          {allowVoting && (
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onVote?.('up')}
                className="h-8 w-8 p-0"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onVote?.('down')}
                className="h-8 w-8 p-0"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Insight Content */}
      <p className="text-gray-800 mb-3 leading-relaxed">{insight.insight}</p>

      {/* Supporting Models */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Supported by:</span>
          <div className="flex items-center space-x-1">
            {insight.supportingModels.map(model => (
              <ModelIcon key={model} model={model} />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            ({insight.supportingModels.length} models)
          </span>
        </div>
      </div>

      {/* Evidence */}
      {insight.evidence.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Supporting Evidence:</h5>
          <ul className="space-y-1">
            {insight.evidence.slice(0, 2).map((evidence, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start space-x-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{evidence}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

// Synthesized Recommendation Card
const SynthesizedRecommendationCard: React.FC<{
  recommendation: SynthesizedRecommendation;
  index: number;
  onAction?: (action: string) => void;
}> = ({ recommendation, index, onAction }) => {
  const getPriorityColor = (priority: SynthesizedRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
    }
  };

  const getFeasibilityIcon = (feasibility: SynthesizedRecommendation['feasibility']) => {
    switch (feasibility) {
      case 'easy': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'moderate': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'challenging': return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getTimeframeColor = (timeframe: SynthesizedRecommendation['timeframe']) => {
    switch (timeframe) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'short_term': return 'bg-orange-100 text-orange-800';
      case 'medium_term': return 'bg-blue-100 text-blue-800';
      case 'long_term': return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn("p-4 border rounded-lg", getPriorityColor(recommendation.priority))}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Award className="h-5 w-5" />
          <span className="font-semibold capitalize">{recommendation.category}</span>
          <Badge className={cn(
            recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
            recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          )}>
            {recommendation.priority} priority
          </Badge>
        </div>
        
        <Badge className={getTimeframeColor(recommendation.timeframe)}>
          {recommendation.timeframe.replace('_', ' ')}
        </Badge>
      </div>

      {/* Recommendation Content */}
      <p className="text-gray-800 mb-4 leading-relaxed">{recommendation.recommendation}</p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          {getFeasibilityIcon(recommendation.feasibility)}
          <div>
            <div className="text-sm font-medium">Feasibility</div>
            <div className="text-xs text-gray-600 capitalize">{recommendation.feasibility}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <TrendingUp className={cn("h-4 w-4", 
            recommendation.impact === 'high' ? 'text-green-600' :
            recommendation.impact === 'medium' ? 'text-yellow-600' : 'text-blue-600'
          )} />
          <div>
            <div className="text-sm font-medium">Impact</div>
            <div className="text-xs text-gray-600 capitalize">{recommendation.impact}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Brain className="h-4 w-4 text-purple-600" />
          <div>
            <div className="text-sm font-medium">Models</div>
            <div className="text-xs text-gray-600">{recommendation.supportingModels.length}</div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      {recommendation.actionItems.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Action Items:</h5>
          <ul className="space-y-1">
            {recommendation.actionItems.map((action, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start space-x-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
        <Button 
          size="sm" 
          onClick={() => onAction?.('implement')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Plan Implementation
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onAction?.('details')}
        >
          View Details
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onAction?.('defer')}
        >
          Defer
        </Button>
      </div>
    </motion.div>
  );
};

// Main Consolidated Insights Panel Component
export const ConsolidatedInsightsPanel: React.FC<ConsolidatedInsightsPanelProps> = ({
  insights,
  className,
  showMetrics = true,
  showConflicts = true,
  allowVoting = false,
  onInsightVote,
  onRecommendationAction,
  onExport
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'recommendations' | 'conflicts' | 'metrics'>('overview');
  const [insightFilter, setInsightFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [recommendationFilter, setRecommendationFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Filter insights by importance
  const filteredInsights = useMemo(() => {
    if (insightFilter === 'all') return insights.consensusInsights;
    return insights.consensusInsights.filter(insight => insight.importance === insightFilter);
  }, [insights.consensusInsights, insightFilter]);

  // Filter recommendations by priority
  const filteredRecommendations = useMemo(() => {
    if (recommendationFilter === 'all') return insights.synthesizedRecommendations;
    return insights.synthesizedRecommendations.filter(rec => rec.priority === recommendationFilter);
  }, [insights.synthesizedRecommendations, recommendationFilter]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    return {
      totalInsights: insights.consensusInsights.length,
      highPriorityInsights: insights.consensusInsights.filter(i => i.importance === 'high').length,
      totalRecommendations: insights.synthesizedRecommendations.length,
      highPriorityRecommendations: insights.synthesizedRecommendations.filter(r => r.priority === 'high').length,
      conflictCount: insights.conflictingFindings.length,
      highConfidenceEntities: insights.highConfidenceEntities.filter(e => e.averageConfidence >= 80).length
    };
  }, [insights]);

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Lightbulb className="h-6 w-6" />
            <span>Consolidated Insights</span>
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{summaryStats.totalInsights} insights</span>
            <span>•</span>
            <span>{summaryStats.totalRecommendations} recommendations</span>
            <span>•</span>
            <Badge className="bg-blue-100 text-blue-800">
              {insights.confidenceScore.toFixed(1)}% confidence
            </Badge>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => onExport?.('pdf')}>
            <Download className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{summaryStats.totalInsights}</div>
                <div className="text-sm text-gray-600">Total Insights</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{summaryStats.totalRecommendations}</div>
                <div className="text-sm text-gray-600">Recommendations</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{summaryStats.conflictCount}</div>
                <div className="text-sm text-gray-600">Conflicts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{summaryStats.highConfidenceEntities}</div>
                <div className="text-sm text-gray-600">Key Entities</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          {showConflicts && <TabsTrigger value="conflicts">Conflicts</TabsTrigger>}
          {showMetrics && <TabsTrigger value="metrics">Metrics</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Combined Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{insights.combinedSummary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overall Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{insights.overallAssessment}</p>
            </CardContent>
          </Card>

          {/* Top Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Top Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.consensusInsights
                .filter(insight => insight.importance === 'high')
                .slice(0, 3)
                .map((insight, index) => (
                  <ConsensusInsightCard
                    key={index}
                    insight={insight}
                    index={index}
                    allowVoting={allowVoting}
                    onVote={(vote) => onInsightVote?.(index.toString(), vote)}
                  />
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Consensus Insights</h3>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={insightFilter}
                onChange={(e) => setInsightFilter(e.target.value as typeof insightFilter)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All Insights</option>
                <option value="high">High Importance</option>
                <option value="medium">Medium Importance</option>
                <option value="low">Low Importance</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredInsights.map((insight, index) => (
              <ConsensusInsightCard
                key={index}
                insight={insight}
                index={index}
                allowVoting={allowVoting}
                onVote={(vote) => onInsightVote?.(index.toString(), vote)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Synthesized Recommendations</h3>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={recommendationFilter}
                onChange={(e) => setRecommendationFilter(e.target.value as typeof recommendationFilter)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All Recommendations</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredRecommendations.map((recommendation, index) => (
              <SynthesizedRecommendationCard
                key={index}
                recommendation={recommendation}
                index={index}
                onAction={(action) => onRecommendationAction?.(index.toString(), action)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Conflicts Tab */}
        {showConflicts && (
          <TabsContent value="conflicts" className="space-y-4">
            <h3 className="text-lg font-semibold">Conflicting Findings</h3>
            
            {insights.conflictingFindings.length > 0 ? (
              <div className="space-y-4">
                {insights.conflictingFindings.map((conflict, index) => (
                  <Card key={index} className="border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold">{conflict.topic}</h4>
                        <Badge className={cn(
                          conflict.impact === 'high' ? 'bg-red-100 text-red-800' :
                          conflict.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        )}>
                          {conflict.impact} impact
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {conflict.perspectives.map((perspective, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded">
                            <div className="font-medium mb-2">
                              {perspective.model.toUpperCase()} 
                              <span className="ml-2 text-sm text-gray-600">
                                ({perspective.confidence.toFixed(1)}%)
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{perspective.position}</p>
                          </div>
                        ))}
                      </div>
                      
                      {conflict.suggestedResolution && (
                        <Alert>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Suggested Resolution:</strong> {conflict.suggestedResolution}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h4 className="font-semibold text-green-700 mb-2">No Conflicts Detected</h4>
                  <p className="text-gray-600">
                    All models show strong consensus in their analysis.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Metrics Tab */}
        {showMetrics && (
          <TabsContent value="metrics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <QualityScore 
                  score={insights.qualityMetrics.overallQuality}
                  label="Overall Quality"
                  description="Comprehensive assessment of analysis quality"
                />
                <QualityScore 
                  score={insights.qualityMetrics.consistency}
                  label="Consistency"
                  description="Agreement level across different models"
                />
                <QualityScore 
                  score={insights.qualityMetrics.completeness}
                  label="Completeness"
                  description="Coverage of all important aspects"
                />
                <QualityScore 
                  score={insights.qualityMetrics.reliability}
                  label="Reliability"
                  description="Confidence in findings and recommendations"
                />
                <QualityScore 
                  score={insights.qualityMetrics.novelty}
                  label="Novelty"
                  description="Uniqueness and originality of insights"
                />
                <QualityScore 
                  score={insights.qualityMetrics.actionability}
                  label="Actionability"
                  description="Practical applicability of recommendations"
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
