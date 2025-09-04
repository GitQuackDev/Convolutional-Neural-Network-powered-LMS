/**
 * Analysis Quick Preview Component
 * Story 2.6: AI Progress Tracking and Results Display Enhancement
 * Task 2.6.3: Analysis History and Management System
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  X,
  Download,
  Star,
  Clock,
  Calendar,
  FileText,
  Brain,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Hash,
  Target,
  Lightbulb,
  Award,
  BarChart3,
  MessageSquare,
  Share2,
  ExternalLink
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

import type { AIModelType } from '@/types/progressTracking';
import type { AnalysisHistoryEntry } from './AnalysisHistoryManager';
import { cn } from '@/lib/utils';

// Quick preview interfaces
interface AnalysisPreviewData {
  analysisId: string;
  fileName: string;
  status: AnalysisHistoryEntry['status'];
  summary: string;
  keyInsights: string[];
  modelsUsed: AIModelType[];
  overallConfidence: number;
  processingTime: number;
  createdAt: Date;
  completedAt?: Date;
  fileSize: number;
  fileType: string;
  tags: string[];
  
  // Quick metrics
  entityCount: number;
  topicCount: number;
  sentimentScore?: number;
  readabilityScore?: number;
  complexityLevel: 'low' | 'medium' | 'high';
  
  // Model-specific previews
  modelResults: {
    [K in AIModelType]?: {
      confidence: number;
      processingTime: number;
      keyFinding: string;
      status: 'completed' | 'failed' | 'partial';
    };
  };
  
  // Preview highlights
  topEntities: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
  
  topTopics: Array<{
    name: string;
    score: number;
    relevance: number;
  }>;
  
  qualityIndicators: {
    consistency: number;
    completeness: number;
    clarity: number;
    actionability: number;
  };
}

interface AnalysisQuickPreviewProps {
  analysisId: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullView?: (analysisId: string) => void;
  onDownload?: (analysisId: string) => void;
  onToggleFavorite?: (analysisId: string) => void;
  onShare?: (analysisId: string) => void;
  className?: string;
}

// Status indicator component
const StatusBadge: React.FC<{ status: AnalysisHistoryEntry['status'] }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Completed' };
      case 'failed':
        return { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Failed' };
      case 'partial':
        return { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Partial' };
      case 'processing':
        return { color: 'bg-blue-100 text-blue-800', icon: Loader2, label: 'Processing' };
      case 'cancelled':
        return { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Unknown' };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge className={cn("flex items-center space-x-1", config.color)}>
      <Icon className={cn("h-3 w-3", status === 'processing' && "animate-spin")} />
      <span>{config.label}</span>
    </Badge>
  );
};

// Model result card component
const ModelResultCard: React.FC<{
  model: AIModelType;
  result: NonNullable<AnalysisPreviewData['modelResults'][AIModelType]>;
}> = ({ model, result }) => {
  const getModelIcon = (model: AIModelType) => {
    switch (model) {
      case 'gpt-4': return '🧠';
      case 'claude-3': return '🎭';
      case 'gemini-pro': return '💎';
      default: return '🤖';
    }
  };

  const getModelName = (model: AIModelType) => {
    switch (model) {
      case 'gpt-4': return 'GPT-4';
      case 'claude-3': return 'Claude 3';
      case 'gemini-pro': return 'Gemini Pro';
      default: return String(model).toUpperCase();
    }
  };

  return (
    <div className="p-3 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getModelIcon(model)}</span>
          <span className="font-medium">{getModelName(model)}</span>
        </div>
        <Badge className={cn(
          result.status === 'completed' ? 'bg-green-100 text-green-800' :
          result.status === 'failed' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        )}>
          {result.confidence.toFixed(1)}%
        </Badge>
      </div>
      
      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
        {result.keyFinding}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>{Math.round(result.processingTime / 1000)}s</span>
        </span>
        <span className="capitalize">{result.status}</span>
      </div>
    </div>
  );
};

// Entity preview component
const EntityPreview: React.FC<{
  entities: AnalysisPreviewData['topEntities'];
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ entities, isExpanded, onToggle }) => {
  const getEntityTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'person': return 'bg-blue-100 text-blue-800';
      case 'organization': return 'bg-purple-100 text-purple-800';
      case 'location': return 'bg-green-100 text-green-800';
      case 'date': return 'bg-orange-100 text-orange-800';
      case 'concept': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left"
      >
        <h4 className="font-medium flex items-center space-x-2">
          <Hash className="h-4 w-4" />
          <span>Key Entities ({entities.length})</span>
        </h4>
        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {entities.slice(0, 6).map((entity, index) => (
              <motion.div
                key={`${entity.text}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-2 bg-white border rounded"
              >
                <div className="flex items-center space-x-2">
                  <Badge className={getEntityTypeColor(entity.type)}>
                    {entity.type}
                  </Badge>
                  <span className="font-medium">{entity.text}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {entity.confidence.toFixed(1)}%
                </span>
              </motion.div>
            ))}
            {entities.length > 6 && (
              <div className="text-sm text-gray-600 text-center py-1">
                +{entities.length - 6} more entities
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Topic preview component
const TopicPreview: React.FC<{
  topics: AnalysisPreviewData['topTopics'];
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ topics, isExpanded, onToggle }) => {
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left"
      >
        <h4 className="font-medium flex items-center space-x-2">
          <Target className="h-4 w-4" />
          <span>Key Topics ({topics.length})</span>
        </h4>
        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {topics.slice(0, 5).map((topic, index) => (
              <motion.div
                key={`${topic.name}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{topic.name}</span>
                  <span className="text-sm text-gray-600">
                    {topic.score.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={topic.relevance * 100} className="flex-1 h-2" />
                  <span className="text-xs text-gray-500 w-12">
                    {(topic.relevance * 100).toFixed(0)}%
                  </span>
                </div>
              </motion.div>
            ))}
            {topics.length > 5 && (
              <div className="text-sm text-gray-600 text-center py-1">
                +{topics.length - 5} more topics
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Quality indicators component
const QualityIndicators: React.FC<{
  indicators: AnalysisPreviewData['qualityIndicators'];
}> = ({ indicators }) => {
  const qualityMetrics = [
    { key: 'consistency', label: 'Consistency', value: indicators.consistency },
    { key: 'completeness', label: 'Completeness', value: indicators.completeness },
    { key: 'clarity', label: 'Clarity', value: indicators.clarity },
    { key: 'actionability', label: 'Actionability', value: indicators.actionability }
  ];

  return (
    <div className="space-y-3">
      <h4 className="font-medium flex items-center space-x-2">
        <Award className="h-4 w-4" />
        <span>Quality Indicators</span>
      </h4>
      
      <div className="grid grid-cols-2 gap-3">
        {qualityMetrics.map(metric => (
          <div key={metric.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{metric.label}</span>
              <span className="text-sm text-gray-600">{metric.value.toFixed(1)}%</span>
            </div>
            <Progress value={metric.value} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Analysis Quick Preview component
export const AnalysisQuickPreview: React.FC<AnalysisQuickPreviewProps> = ({
  analysisId,
  isOpen,
  onClose,
  onOpenFullView,
  onDownload,
  onToggleFavorite,
  onShare,
  className
}) => {
  const [entitiesExpanded, setEntitiesExpanded] = useState(false);
  const [topicsExpanded, setTopicsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real implementation, this would be fetched based on analysisId
  const previewData: AnalysisPreviewData = {
    analysisId,
    fileName: "Advanced_ML_Research_Paper.pdf",
    status: "completed",
    summary: "This research paper presents a comprehensive analysis of advanced machine learning techniques, focusing on deep learning architectures and their applications in natural language processing. The study evaluates multiple neural network approaches and provides insights into optimization strategies for large-scale language models.",
    keyInsights: [
      "Deep learning models show 15% improvement in accuracy over traditional methods",
      "Transformer architectures demonstrate superior performance in NLP tasks",
      "Computational efficiency can be improved through pruning techniques",
      "Multi-modal approaches show promising results for complex reasoning tasks"
    ],
    modelsUsed: ['gpt-4', 'claude-3', 'gemini-pro'],
    overallConfidence: 87.5,
    processingTime: 45000,
    createdAt: new Date('2024-01-15T10:30:00'),
    completedAt: new Date('2024-01-15T10:31:15'),
    fileSize: 2458000,
    fileType: "application/pdf",
    tags: ["research", "machine-learning", "nlp", "deep-learning"],
    entityCount: 42,
    topicCount: 8,
    sentimentScore: 0.72,
    readabilityScore: 78,
    complexityLevel: "high",
    modelResults: {
      'gpt-4': {
        confidence: 89.2,
        processingTime: 15000,
        keyFinding: "Strong focus on transformer architectures with detailed mathematical foundations",
        status: "completed"
      },
      'claude-3': {
        confidence: 86.8,
        processingTime: 18000,
        keyFinding: "Comprehensive evaluation methodology with statistical significance testing",
        status: "completed"
      },
      'gemini-pro': {
        confidence: 86.5,
        processingTime: 12000,
        keyFinding: "Novel approaches to computational efficiency in large language models",
        status: "completed"
      }
    },
    topEntities: [
      { text: "Transformer", type: "concept", confidence: 95.2 },
      { text: "BERT", type: "technology", confidence: 92.8 },
      { text: "GPT", type: "technology", confidence: 91.5 },
      { text: "Neural Networks", type: "concept", confidence: 89.7 },
      { text: "Stanford University", type: "organization", confidence: 87.3 },
      { text: "Natural Language Processing", type: "concept", confidence: 86.9 }
    ],
    topTopics: [
      { name: "Deep Learning Architectures", score: 0.92, relevance: 0.89 },
      { name: "Natural Language Processing", score: 0.88, relevance: 0.85 },
      { name: "Model Optimization", score: 0.76, relevance: 0.78 },
      { name: "Computational Efficiency", score: 0.72, relevance: 0.74 },
      { name: "Performance Evaluation", score: 0.68, relevance: 0.71 }
    ],
    qualityIndicators: {
      consistency: 85.2,
      completeness: 91.8,
      clarity: 78.5,
      actionability: 82.3
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const handleAction = async (action: string) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'fullView':
          onOpenFullView?.(analysisId);
          break;
        case 'download':
          onDownload?.(analysisId);
          break;
        case 'favorite':
          onToggleFavorite?.(analysisId);
          break;
        case 'share':
          onShare?.(analysisId);
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold truncate" title={previewData.fileName}>
                {previewData.fileName}
              </h2>
              <StatusBadge status={previewData.status} />
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{previewData.createdAt.toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <FileText className="h-3 w-3" />
                <span>{formatFileSize(previewData.fileSize)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(previewData.processingTime)}</span>
              </span>
              <Badge className="bg-blue-100 text-blue-800">
                {previewData.overallConfidence.toFixed(1)}% confidence
              </Badge>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Analysis Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{previewData.summary}</p>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>Key Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {previewData.keyInsights.map((insight, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-2"
                  >
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-gray-700">{insight}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Model Results */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>Model Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(previewData.modelResults).map(([model, result]) => (
                  <ModelResultCard
                    key={model}
                    model={model as AIModelType}
                    result={result!}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entities and Topics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Content Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EntityPreview
                  entities={previewData.topEntities}
                  isExpanded={entitiesExpanded}
                  onToggle={() => setEntitiesExpanded(!entitiesExpanded)}
                />
                
                <Separator />
                
                <TopicPreview
                  topics={previewData.topTopics}
                  isExpanded={topicsExpanded}
                  onToggle={() => setTopicsExpanded(!topicsExpanded)}
                />
              </CardContent>
            </Card>

            {/* Quality Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quality Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <QualityIndicators indicators={previewData.qualityIndicators} />
                
                <Separator className="my-4" />
                
                {/* Additional Metrics */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Content Metrics</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Entities</span>
                      <Badge variant="outline">{previewData.entityCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Topics</span>
                      <Badge variant="outline">{previewData.topicCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sentiment</span>
                      <Badge className={cn(
                        previewData.sentimentScore && previewData.sentimentScore > 0.6 ? 'bg-green-100 text-green-800' :
                        previewData.sentimentScore && previewData.sentimentScore > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      )}>
                        {previewData.sentimentScore ? (previewData.sentimentScore * 100).toFixed(0) + '%' : 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Readability</span>
                      <Badge variant="outline">{previewData.readabilityScore}/100</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tags */}
          {previewData.tags.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {previewData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-sm">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center space-x-2">
            <Badge className="bg-gray-100 text-gray-700">
              Complexity: {previewData.complexityLevel}
            </Badge>
            <Badge className="bg-gray-100 text-gray-700">
              {previewData.modelsUsed.length} models
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handleAction('share')}
              disabled={isLoading}
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleAction('favorite')}
              disabled={isLoading}
            >
              <Star className="h-4 w-4 mr-1" />
              Favorite
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleAction('download')}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            
            <Button
              onClick={() => handleAction('fullView')}
              disabled={isLoading}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open Full View
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
