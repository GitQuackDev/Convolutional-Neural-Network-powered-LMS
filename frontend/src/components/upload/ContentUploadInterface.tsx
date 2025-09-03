import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  Zap,
  Brain,
  BookOpen,
  Cpu,
  CircuitBoard
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useFileUpload } from '@/hooks/useFileUpload';
import { useCNNAnalysis } from '@/hooks/useCNNAnalysis';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { AIModelSelector } from './AIModelSelector';
import { MultiAnalysisResults } from './MultiAnalysisResults';
import { EnhancedProgressDisplay } from './EnhancedProgressDisplay';
import type { ContentUploadProps, CNNAnalysisResult, ConfidenceLevel, AnalysisModelType, AIModelType } from '@/types/upload';
import { cn } from '@/lib/utils';

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

const ObjectDetectionResults: React.FC<{ detections: CNNAnalysisResult['analysis']['objectDetection'] }> = ({ detections }) => (
  <div className="space-y-3">
    {detections.map((detection, index) => (
      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-3">
          <CircuitBoard className="w-5 h-5 text-blue-500" />
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

const CategorizationResults: React.FC<{ categories: CNNAnalysisResult['analysis']['categorization'] }> = ({ categories }) => (
  <div className="space-y-3">
    {categories.map((category, index) => (
      <div key={index} className="p-3 border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-green-500" />
            <p className="font-medium">{category.category}</p>
          </div>
          <ConfidenceBadge confidence={category.confidence} />
        </div>
        <div className="flex flex-wrap gap-1">
          {category.subcategories.map((sub, subIndex) => (
            <Badge key={subIndex} variant="outline" className="text-xs">
              {sub}
            </Badge>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const HardwareResults: React.FC<{ hardware: CNNAnalysisResult['analysis']['hardwareIdentification'] }> = ({ hardware }) => (
  <div className="space-y-4">
    {hardware.map((item, index) => (
      <Card key={index}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-lg">{item.component}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {Object.entries(item.specifications).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="font-medium text-gray-600">{key}:</span>
                <span className="ml-1 text-gray-900">{value}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Compatibility:</p>
            <div className="flex flex-wrap gap-1">
              {item.compatibility.map((comp, compIndex) => (
                <Badge key={compIndex} variant="secondary" className="text-xs">
                  {comp}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const WikipediaResults: React.FC<{ articles: CNNAnalysisResult['analysis']['wikipediaData']['articles'] }> = ({ articles }) => (
  <div className="space-y-3">
    {articles.map((article, index) => (
      <Card key={index}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-lg">{article.title}</h4>
            <div className="flex items-center space-x-2">
              <ConfidenceBadge confidence={article.relevanceScore} />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={article.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View on Wikipedia</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{article.excerpt}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);

const AnalysisResults: React.FC<{ result: CNNAnalysisResult }> = ({ result }) => {
  const [activeTab, setActiveTab] = useState('objects');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification here
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <CardTitle>AI Analysis Results</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {result.processingTime}ms
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="objects">Objects</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="hardware">Hardware</TabsTrigger>
              <TabsTrigger value="wikipedia">Wikipedia</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[400px] mt-4">
              <TabsContent value="objects" className="mt-0">
                <ObjectDetectionResults detections={result.analysis.objectDetection} />
              </TabsContent>
              
              <TabsContent value="categories" className="mt-0">
                <CategorizationResults categories={result.analysis.categorization} />
              </TabsContent>
              
              <TabsContent value="hardware" className="mt-0">
                <HardwareResults hardware={result.analysis.hardwareIdentification} />
              </TabsContent>
              
              <TabsContent value="wikipedia" className="mt-0">
                <WikipediaResults articles={result.analysis.wikipediaData.articles} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const ContentUploadInterface: React.FC<ContentUploadProps> = ({
  onUploadComplete,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  aiModelsEnabled = true,
  defaultModels = ['cnn', 'gemini']
}) => {
  const {
    files,
    isDragging,
    setIsDragging,
    addFiles,
    simulateUpload
  } = useFileUpload();
  
  const { startAnalysis, getAnalysisResult } = useCNNAnalysis();
  const { 
    startMultiAnalysis, 
    getMultiAnalysisResult, 
    getAnalysisProgress,
    isWebSocketConnected
  } = useAIAnalysis();
  
  const [selectedFileForAnalysis, setSelectedFileForAnalysis] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<Set<AnalysisModelType>>(new Set(defaultModels));

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFiles = await addFiles(acceptedFiles);
    
    // Start upload simulation for each file
    uploadedFiles.forEach(async (file) => {
      await simulateUpload(file);
      
      // Start analysis based on selected models
      if (selectedModels.size === 1 && selectedModels.has('cnn')) {
        // CNN only analysis (legacy mode)
        const analysisResult = await startAnalysis(file);
        if (analysisResult) {
          onUploadComplete(analysisResult);
          setSelectedFileForAnalysis(file.id);
        }
      } else {
        // Multi-AI analysis
        let cnnResult = undefined;
        if (selectedModels.has('cnn')) {
          cnnResult = await startAnalysis(file);
          if (cnnResult) {
            onUploadComplete(cnnResult);
          }
        }
        
        // Start multi-AI analysis
        const aiModels = Array.from(selectedModels).filter(model => model !== 'cnn') as AIModelType[];
        const multiResult = await startMultiAnalysis(file, aiModels, cnnResult);
        if (multiResult) {
          setSelectedFileForAnalysis(file.id);
        }
      }
    });
  }, [addFiles, simulateUpload, startAnalysis, startMultiAnalysis, onUploadComplete, selectedModels]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    accept: {
      'image/*': [],
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': []
    },
    maxSize: maxFileSize
  });

  const analysisResult = selectedFileForAnalysis ? getAnalysisResult(selectedFileForAnalysis) : null;
  const multiAnalysisResult = selectedFileForAnalysis ? getMultiAnalysisResult(selectedFileForAnalysis) : null;
  const completedFiles = files.filter(file => file.status === 'completed');
  
  // Get progress for the currently selected file
  const currentProgress = selectedFileForAnalysis ? getAnalysisProgress(selectedFileForAnalysis) : null;

  // Debug logging for results rendering
  console.log('🎯 DEBUG: ContentUploadInterface rendering state:', {
    selectedFileForAnalysis,
    multiAnalysisResult,
    hasAiResults: multiAnalysisResult?.aiResults ? Object.keys(multiAnalysisResult.aiResults).length : 0,
    hasConsolidatedInsights: !!multiAnalysisResult?.consolidatedInsights,
    overallStatus: multiAnalysisResult?.overallStatus,
    aiResultsKeys: multiAnalysisResult?.aiResults ? Object.keys(multiAnalysisResult.aiResults) : [],
    aiResultsContent: multiAnalysisResult?.aiResults
  });

  // Determine which result to show - prefer multi-analysis if available
  const hasMultiAnalysis = multiAnalysisResult && (multiAnalysisResult.aiResults || multiAnalysisResult.consolidatedInsights);
  
  console.log('🔍 DEBUG: Rendering decision:', {
    hasMultiAnalysis,
    conditionCheck: {
      hasMultiAnalysisResult: !!multiAnalysisResult,
      hasAiResults: !!(multiAnalysisResult?.aiResults),
      hasConsolidatedInsights: !!(multiAnalysisResult?.consolidatedInsights),
      aiResultsNotEmpty: multiAnalysisResult?.aiResults ? Object.keys(multiAnalysisResult.aiResults).length > 0 : false
    }
  });

  // Additional check for AI results content
  if (multiAnalysisResult?.aiResults) {
    Object.entries(multiAnalysisResult.aiResults).forEach(([model, result]) => {
      console.log(`🤖 DEBUG: ${model} result:`, {
        hasResult: !!result,
        hasResults: !!result?.results,
        hasDescription: !!result?.results?.description,
        hasInsights: !!result?.results?.insights,
        insightCount: result?.results?.insights?.length || 0
      });
    });
  }
  const hasActiveAnalysis = currentProgress && Object.keys(currentProgress.modelProgress).length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload Content for AI Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
              isDragActive || isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            )}
          >
            <input {...getInputProps()} />
            <motion.div
              animate={{ scale: isDragActive ? 1.05 : 1 }}
              className="flex flex-col items-center space-y-4"
            >
              <Upload className={cn(
                "w-12 h-12",
                isDragActive ? "text-blue-500" : "text-gray-400"
              )} />
              <div>
                <p className="text-lg font-medium">
                  {isDragActive ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to select files
                </p>
              </div>
              <div className="text-xs text-gray-400">
                <p>Supports: Images, PDF, Word documents</p>
                <p>Max file size: {Math.round(maxFileSize / (1024 * 1024))}MB</p>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* AI Model Selection */}
      {aiModelsEnabled && (
        <AIModelSelector
          selectedModels={selectedModels}
          onModelsChange={setSelectedModels}
          disabled={files.some(file => file.status === 'uploading' || file.status === 'processing')}
        />
      )}

      {/* Upload History and Analysis Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload History */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {files.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No files uploaded yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={cn(
                          "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                          selectedFileForAnalysis === file.id 
                            ? "border-blue-500 bg-blue-50" 
                            : "bg-white hover:bg-gray-50",
                          file.status === 'completed' && "cursor-pointer"
                        )}
                        onClick={() => {
                          if (file.status === 'completed') {
                            setSelectedFileForAnalysis(file.id);
                          }
                        }}
                      >
                        {file.preview ? (
                          <img src={file.preview} alt={file.file.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <FileIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.file.name}</p>
                          <div className="flex items-center space-x-2">
                            {file.status === 'uploading' && (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                <span className="text-xs text-gray-500">Uploading... {file.progress}%</span>
                              </>
                            )}
                            {file.status === 'processing' && (
                              <>
                                <Brain className="w-4 h-4 animate-pulse text-purple-500" />
                                <span className="text-xs text-gray-500">Analyzing with AI...</span>
                              </>
                            )}
                            {file.status === 'completed' && (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-xs text-gray-500">Click to view analysis</span>
                              </>
                            )}
                            {file.status === 'error' && (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-xs text-red-500">{file.error || 'Upload failed'}</span>
                              </>
                            )}
                          </div>
                          
                          {file.status === 'uploading' && (
                            <Progress value={file.progress} className="mt-2 h-1" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results */}
        <div className="lg:col-span-2">
          {/* Enhanced Progress Display for Active Analysis */}
          {hasActiveAnalysis && currentProgress && (
            <div className="mb-6">
              <EnhancedProgressDisplay 
                progress={currentProgress} 
                isConnected={isWebSocketConnected} 
              />
            </div>
          )}
          
          {hasMultiAnalysis ? (
            <MultiAnalysisResults result={multiAnalysisResult!} />
          ) : analysisResult ? (
            <AnalysisResults result={analysisResult} />
          ) : completedFiles.length > 0 ? (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center space-y-4">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-600">
                      Select an upload to view analysis
                    </p>
                    <p className="text-sm text-gray-500">
                      Click on any completed upload from the history to see AI insights
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center space-y-4">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-600">
                      Enhanced AI Analysis Results
                    </p>
                    <p className="text-sm text-gray-500">
                      Upload a file and select AI models to see comprehensive insights
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
