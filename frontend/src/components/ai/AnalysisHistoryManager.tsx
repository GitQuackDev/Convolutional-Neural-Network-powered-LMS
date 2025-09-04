/**
 * Analysis History Manager Component
 * Story 2.6: AI Progress Tracking and Results Display Enhancement
 * Task 2.6.3: Analysis History and Management System
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Star,
  MoreVertical,
  Download,
  Trash2,
  RotateCcw,
  Eye,
  CheckSquare,
  Square,
  SortAsc,
  SortDesc,
  Brain,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Archive,
  Tag
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import type { AIModelType } from '@/types/progressTracking';
import { cn } from '@/lib/utils';

// Analysis history interfaces
export interface AnalysisHistoryEntry {
  analysisId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  modelsUsed: AIModelType[];
  status: 'completed' | 'failed' | 'partial' | 'processing' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  processingTime?: number;
  overallConfidence?: number;
  resultSummary: string;
  quickInsights: string[];
  isFavorite: boolean;
  tags: string[];
  errorMessage?: string;
  metadata: {
    userId: string;
    version: string;
    analysisType: 'content' | 'sentiment' | 'entities' | 'comprehensive';
    originalSize: number;
    processedSize: number;
  };
}

export interface AnalysisFilter {
  dateRange?: { start: Date; end: Date };
  models?: AIModelType[];
  status?: AnalysisHistoryEntry['status'][];
  fileTypes?: string[];
  searchQuery?: string;
  confidenceThreshold?: number;
  favoritesOnly?: boolean;
  tags?: string[];
  sortBy: 'date' | 'confidence' | 'processingTime' | 'fileName' | 'fileSize';
  sortOrder: 'asc' | 'desc';
}

interface BulkOperation {
  type: 'delete' | 'export' | 'reanalyze' | 'favorite' | 'unfavorite' | 'tag' | 'archive';
  selectedIds: Set<string>;
  progress?: number;
  isProcessing?: boolean;
}

interface AnalysisHistoryManagerProps {
  analyses: AnalysisHistoryEntry[];
  isLoading?: boolean;
  onAnalysisSelect?: (analysisId: string) => void;
  onAnalysisPreview?: (analysisId: string) => void;
  onBulkOperation?: (operation: BulkOperation) => Promise<void>;
  onFilterChange?: (filter: AnalysisFilter) => void;
  onRefresh?: () => void;
  className?: string;
}

// Status indicator component
const StatusIndicator: React.FC<{ status: AnalysisHistoryEntry['status'] }> = ({ status }) => {
  const getStatusConfig = (status: AnalysisHistoryEntry['status']) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-green-600 bg-green-100', label: 'Completed' };
      case 'failed':
        return { icon: AlertCircle, color: 'text-red-600 bg-red-100', label: 'Failed' };
      case 'partial':
        return { icon: AlertCircle, color: 'text-yellow-600 bg-yellow-100', label: 'Partial' };
      case 'processing':
        return { icon: Loader2, color: 'text-blue-600 bg-blue-100', label: 'Processing' };
      case 'cancelled':
        return { icon: AlertCircle, color: 'text-gray-600 bg-gray-100', label: 'Cancelled' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600 bg-gray-100', label: 'Unknown' };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium", config.color)}>
      <Icon className={cn("h-3 w-3", status === 'processing' && "animate-spin")} />
      <span>{config.label}</span>
    </div>
  );
};

// File type icon component
const FileTypeIcon: React.FC<{ fileType: string; className?: string }> = ({ fileType, className }) => {
  const getIcon = () => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '📄';
    if (type.includes('doc')) return '📝';
    if (type.includes('txt')) return '📋';
    if (type.includes('image') || type.includes('png') || type.includes('jpg')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    return '📁';
  };

  return <span className={className}>{getIcon()}</span>;
};

// Model badges component
const ModelBadges: React.FC<{ models: AIModelType[] }> = ({ models }) => {
  const getModelColor = (model: AIModelType) => {
    switch (model) {
      case 'gpt-4': return 'bg-purple-100 text-purple-800';
      case 'claude-3': return 'bg-orange-100 text-orange-800';
      case 'gemini-pro': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {models.map(model => (
        <Badge key={model} className={cn("text-xs", getModelColor(model))}>
          {model.toUpperCase()}
        </Badge>
      ))}
    </div>
  );
};

// Analysis entry card component
const AnalysisEntryCard: React.FC<{
  analysis: AnalysisHistoryEntry;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onPreview: (id: string) => void;
  onAction: (id: string, action: string) => void;
}> = ({ analysis, isSelected, onSelect, onToggleSelect, onPreview, onAction }) => {
  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "border rounded-lg transition-all duration-200 hover:shadow-md",
        isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(analysis.analysisId)}
              className="mt-1"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <FileTypeIcon fileType={analysis.fileType} className="text-lg" />
                <h3 
                  className="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600"
                  onClick={() => onSelect(analysis.analysisId)}
                  title={analysis.fileName}
                >
                  {analysis.fileName}
                </h3>
                {analysis.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{formatFileSize(analysis.fileSize)}</span>
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(analysis.createdAt)}</span>
                </span>
                {analysis.processingTime && (
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(analysis.processingTime)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <StatusIndicator status={analysis.status} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPreview(analysis.analysisId)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Quick Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction(analysis.analysisId, 'download')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Results
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction(analysis.analysisId, 'reanalyze')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Re-analyze
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onAction(analysis.analysisId, analysis.isFavorite ? 'unfavorite' : 'favorite')}
                >
                  <Star className={cn("h-4 w-4 mr-2", analysis.isFavorite && "fill-current")} />
                  {analysis.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction(analysis.analysisId, 'archive')}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onAction(analysis.analysisId, 'delete')}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Models and Confidence */}
          <div className="flex items-center justify-between">
            <ModelBadges models={analysis.modelsUsed} />
            {analysis.overallConfidence && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Confidence:</span>
                <Badge className="bg-green-100 text-green-800">
                  {analysis.overallConfidence.toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>

          {/* Summary */}
          <p className="text-sm text-gray-700 line-clamp-2">
            {analysis.resultSummary}
          </p>

          {/* Quick Insights */}
          {analysis.quickInsights.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-600">Key Insights:</span>
              <div className="flex flex-wrap gap-1">
                {analysis.quickInsights.slice(0, 3).map((insight, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {insight.length > 30 ? `${insight.slice(0, 30)}...` : insight}
                  </Badge>
                ))}
                {analysis.quickInsights.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{analysis.quickInsights.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {analysis.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              <Tag className="h-3 w-3 text-gray-500" />
              <div className="flex flex-wrap gap-1">
                {analysis.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {analysis.errorMessage && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 text-sm">
                {analysis.errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Main Analysis History Manager component
export const AnalysisHistoryManager: React.FC<AnalysisHistoryManagerProps> = ({
  analyses,
  isLoading = false,
  onAnalysisSelect,
  onAnalysisPreview,
  onBulkOperation,
  onFilterChange,
  onRefresh,
  className
}) => {
  const [filter, setFilter] = useState<AnalysisFilter>({
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOperation, setBulkOperation] = useState<BulkOperation | null>(null);

  // Filter and sort analyses
  const filteredAnalyses = useMemo(() => {
    let filtered = [...analyses];

    // Apply filters
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(analysis => 
        analysis.fileName.toLowerCase().includes(query) ||
        analysis.resultSummary.toLowerCase().includes(query) ||
        analysis.quickInsights.some(insight => insight.toLowerCase().includes(query))
      );
    }

    if (filter.status && filter.status.length > 0) {
      filtered = filtered.filter(analysis => filter.status!.includes(analysis.status));
    }

    if (filter.models && filter.models.length > 0) {
      filtered = filtered.filter(analysis => 
        analysis.modelsUsed.some(model => filter.models!.includes(model))
      );
    }

    if (filter.fileTypes && filter.fileTypes.length > 0) {
      filtered = filtered.filter(analysis => 
        filter.fileTypes!.some(type => analysis.fileType.toLowerCase().includes(type.toLowerCase()))
      );
    }

    if (filter.confidenceThreshold !== undefined) {
      filtered = filtered.filter(analysis => 
        analysis.overallConfidence && analysis.overallConfidence >= filter.confidenceThreshold!
      );
    }

    if (filter.favoritesOnly) {
      filtered = filtered.filter(analysis => analysis.isFavorite);
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(analysis => 
        analysis.tags.some(tag => filter.tags!.includes(tag))
      );
    }

    if (filter.dateRange) {
      filtered = filtered.filter(analysis => 
        analysis.createdAt >= filter.dateRange!.start && 
        analysis.createdAt <= filter.dateRange!.end
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const multiplier = filter.sortOrder === 'asc' ? 1 : -1;
      
      switch (filter.sortBy) {
        case 'date':
          return (a.createdAt.getTime() - b.createdAt.getTime()) * multiplier;
        case 'confidence':
          return ((a.overallConfidence || 0) - (b.overallConfidence || 0)) * multiplier;
        case 'processingTime':
          return ((a.processingTime || 0) - (b.processingTime || 0)) * multiplier;
        case 'fileName':
          return a.fileName.localeCompare(b.fileName) * multiplier;
        case 'fileSize':
          return (a.fileSize - b.fileSize) * multiplier;
        default:
          return 0;
      }
    });

    return filtered;
  }, [analyses, filter]);

  // Handle filter updates
  const updateFilter = useCallback((updates: Partial<AnalysisFilter>) => {
    const newFilter = { ...filter, ...updates };
    setFilter(newFilter);
    onFilterChange?.(newFilter);
  }, [filter, onFilterChange]);

  // Handle selection
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredAnalyses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAnalyses.map(a => a.analysisId)));
    }
  }, [filteredAnalyses, selectedIds.size]);

  const handleToggleSelect = useCallback((id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }, [selectedIds]);

  // Handle bulk operations
  const handleBulkOperation = useCallback(async (type: BulkOperation['type']) => {
    if (selectedIds.size === 0) return;

    const operation: BulkOperation = {
      type,
      selectedIds: new Set(selectedIds),
      isProcessing: true,
      progress: 0
    };

    setBulkOperation(operation);
    
    try {
      await onBulkOperation?.(operation);
      setSelectedIds(new Set());
    } finally {
      setBulkOperation(null);
    }
  }, [selectedIds, onBulkOperation]);

  // Get summary statistics
  const summaryStats = useMemo(() => {
    return {
      total: analyses.length,
      completed: analyses.filter(a => a.status === 'completed').length,
      failed: analyses.filter(a => a.status === 'failed').length,
      favorites: analyses.filter(a => a.isFavorite).length,
      avgConfidence: analyses.filter(a => a.overallConfidence)
        .reduce((sum, a) => sum + (a.overallConfidence || 0), 0) / 
        Math.max(1, analyses.filter(a => a.overallConfidence).length)
    };
  }, [analyses]);

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Archive className="h-6 w-6" />
            <span>Analysis History</span>
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{summaryStats.total} total</span>
            <span>•</span>
            <span>{summaryStats.completed} completed</span>
            <span>•</span>
            <span>{summaryStats.favorites} favorites</span>
            {summaryStats.avgConfidence > 0 && (
              <>
                <span>•</span>
                <span>{summaryStats.avgConfidence.toFixed(1)}% avg confidence</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RotateCcw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters & Search</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => updateFilter({
                searchQuery: '',
                status: undefined,
                models: undefined,
                fileTypes: undefined,
                confidenceThreshold: undefined,
                favoritesOnly: false,
                tags: undefined,
                dateRange: undefined
              })}
            >
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by filename, summary, or insights..."
              value={filter.searchQuery || ''}
              onChange={(e) => updateFilter({ searchQuery: e.target.value })}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between">
                  <span>Status</span>
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                {['completed', 'failed', 'partial', 'processing', 'cancelled'].map(status => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={filter.status?.includes(status as AnalysisHistoryEntry['status']) || false}
                    onCheckedChange={(checked) => {
                      const currentStatus = filter.status || [];
                      if (checked) {
                        updateFilter({ status: [...currentStatus, status as AnalysisHistoryEntry['status']] });
                      } else {
                        updateFilter({ status: currentStatus.filter(s => s !== status) });
                      }
                    }}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Models Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between">
                  <span>Models</span>
                  <Brain className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by AI Models</DropdownMenuLabel>
                {['gpt-4', 'claude-3', 'gemini-pro'].map(model => (
                  <DropdownMenuCheckboxItem
                    key={model}
                    checked={filter.models?.includes(model as AIModelType) || false}
                    onCheckedChange={(checked) => {
                      const currentModels = filter.models || [];
                      if (checked) {
                        updateFilter({ models: [...currentModels, model as AIModelType] });
                      } else {
                        updateFilter({ models: currentModels.filter(m => m !== model) });
                      }
                    }}
                  >
                    {model.toUpperCase()}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between">
                  <span>Sort</span>
                  {filter.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuRadioGroup 
                  value={filter.sortBy}
                  onValueChange={(value) => updateFilter({ sortBy: value as AnalysisFilter['sortBy'] })}
                >
                  <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="confidence">Confidence</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="processingTime">Processing Time</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="fileName">File Name</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="fileSize">File Size</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup 
                  value={filter.sortOrder}
                  onValueChange={(value) => updateFilter({ sortOrder: value as AnalysisFilter['sortOrder'] })}
                >
                  <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Favorites Toggle */}
            <Button
              variant={filter.favoritesOnly ? "default" : "outline"}
              onClick={() => updateFilter({ favoritesOnly: !filter.favoritesOnly })}
            >
              <Star className={cn("h-4 w-4 mr-2", filter.favoritesOnly && "fill-current")} />
              Favorites
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Operations */}
      {selectedIds.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-blue-900">
                  {selectedIds.size} analysis{selectedIds.size > 1 ? 'es' : ''} selected
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                  Clear Selection
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => handleBulkOperation('export')}
                  disabled={bulkOperation?.isProcessing}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleBulkOperation('favorite')}
                  disabled={bulkOperation?.isProcessing}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Favorite
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleBulkOperation('reanalyze')}
                  disabled={bulkOperation?.isProcessing}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Re-analyze
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleBulkOperation('delete')}
                  disabled={bulkOperation?.isProcessing}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>

            {bulkOperation?.isProcessing && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm text-blue-700 mb-1">
                  <span>Processing {bulkOperation.type} operation...</span>
                  <span>{bulkOperation.progress?.toFixed(0) || 0}%</span>
                </div>
                <Progress value={bulkOperation.progress || 0} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Analysis Results ({filteredAnalyses.length})
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredAnalyses.length === 0}
              >
                {selectedIds.size === filteredAnalyses.length ? (
                  <CheckSquare className="h-4 w-4 mr-1" />
                ) : (
                  <Square className="h-4 w-4 mr-1" />
                )}
                Select All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading analysis history...</span>
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No analyses found</h3>
              <p className="text-gray-600 mb-4">
                {filter.searchQuery || filter.status || filter.models ? 
                  'Try adjusting your filters to see more results.' :
                  'Start by running your first AI analysis.'
                }
              </p>
              {(filter.searchQuery || filter.status || filter.models) && (
                <Button 
                  variant="outline" 
                  onClick={() => updateFilter({
                    searchQuery: '',
                    status: undefined,
                    models: undefined,
                    fileTypes: undefined,
                    confidenceThreshold: undefined,
                    favoritesOnly: false,
                    tags: undefined,
                    dateRange: undefined
                  })}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredAnalyses.map(analysis => (
                  <AnalysisEntryCard
                    key={analysis.analysisId}
                    analysis={analysis}
                    isSelected={selectedIds.has(analysis.analysisId)}
                    onSelect={onAnalysisSelect || (() => {})}
                    onToggleSelect={handleToggleSelect}
                    onPreview={onAnalysisPreview || (() => {})}
                    onAction={(id, action) => {
                      // Handle individual actions
                      console.log(`Action ${action} on analysis ${id}`);
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
