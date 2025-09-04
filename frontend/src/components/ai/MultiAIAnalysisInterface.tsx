/**
 * Simplified Multi-AI Analysis Interface
 * Story 2.5: Multi-AI Analysis Interface Development
 */

import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  FileText,
  Settings,
  BarChart3,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { LiveAnalysisProgressCard } from '@/components/analytics/LiveAnalysisProgressCard';

import { cn } from '@/lib/utils';

// Types
interface ModelHealth {
  model: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  latency: number;
  lastChecked: string;
}

// Model Health Status Component
const ModelHealthCard: React.FC<{ health: ModelHealth }> = ({ health }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unavailable': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-4 h-4" />;
      case 'degraded': return <AlertCircle className="w-4 h-4" />;
      case 'unavailable': return <WifiOff className="w-4 h-4" />;
      default: return <Wifi className="w-4 h-4" />;
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-medium">{health.model}</h4>
              <p className="text-sm text-gray-600">Latency: {health.latency}ms</p>
            </div>
          </div>
          
          <div className={cn(
            "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
            getStatusColor(health.status)
          )}>
            {getStatusIcon(health.status)}
            <span className="capitalize">{health.status}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Content Input Component
const ContentInputSection: React.FC<{
  content: string;
  setContent: (content: string) => void;
  contentType: 'text' | 'file' | 'url';
  setContentType: (type: 'text' | 'file' | 'url') => void;
}> = ({ content, setContent, contentType, setContentType }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Content Submission</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={contentType} onValueChange={(value) => setContentType(value as 'text' | 'file' | 'url')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">Text Input</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="url">URL Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-2">
            <Textarea
              placeholder="Enter your content for AI analysis..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </TabsContent>
          
          <TabsContent value="file" className="space-y-2">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Drag and drop files here, or click to browse
              </p>
              <Button variant="outline" className="mt-2">
                Browse Files
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="space-y-2">
            <input
              type="url"
              placeholder="https://example.com/content-to-analyze"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Analysis Progress Component
const AnalysisProgressSection: React.FC<{
  isAnalyzing: boolean;
  progress: number;
  currentStep: string;
}> = ({ isAnalyzing, progress, currentStep }) => {
  if (!isAnalyzing) return null;

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="font-medium">Analysis in Progress...</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{currentStep}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

// Main Component
export const MultiAIAnalysisInterface: React.FC = () => {
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'text' | 'file' | 'url'>('text');
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4', 'claude-3']);
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  // Mock model health data
  const [modelHealth] = useState<ModelHealth[]>([
    { model: 'GPT-4', status: 'healthy', latency: 1200, lastChecked: new Date().toISOString() },
    { model: 'Claude 3', status: 'healthy', latency: 980, lastChecked: new Date().toISOString() },
    { model: 'Gemini Pro', status: 'degraded', latency: 2100, lastChecked: new Date().toISOString() },
  ]);

  const handleStartAnalysis = async () => {
    if (!content.trim()) {
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setCurrentStep('Preparing analysis...');

    // Simulate analysis progress
    const steps = [
      'Validating content...',
      'Initializing AI models...',
      'Running GPT-4 analysis...',
      'Running Claude analysis...',
      'Consolidating results...',
      'Generating insights...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i]);
      setProgress((i + 1) / steps.length * 100);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsAnalyzing(false);
    setCurrentStep('Analysis complete!');
  };

  const canAnalyze = content.trim().length > 0 && selectedModels.length > 0 && !isAnalyzing;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Multi-AI Content Analysis
          </h1>
          <p className="text-gray-600 mt-1">
            Analyze content using multiple AI models for comprehensive insights
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Model Health Status */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              AI Model Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modelHealth.map((health) => (
                <ModelHealthCard key={health.model} health={health} />
              ))}
            </div>
          </div>

          {/* Content Input */}
          <ContentInputSection
            content={content}
            setContent={setContent}
            contentType={contentType}
            setContentType={setContentType}
          />

          {/* Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select AI Models ({selectedModels.length} selected)
                </label>
                <div className="flex flex-wrap gap-2">
                  {['gpt-4', 'claude-3', 'gemini-pro'].map((model) => (
                    <Button
                      key={model}
                  variant={selectedModels.includes(model) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedModels(prev => 
                      prev.includes(model) 
                        ? prev.filter(m => m !== model)
                        : [...prev, model]
                    );
                  }}
                >
                  {model.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Analysis Type</label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="comprehensive">Comprehensive Analysis</option>
              <option value="sentiment">Sentiment Analysis</option>
              <option value="educational">Educational Assessment</option>
              <option value="content-quality">Content Quality Review</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      <AnalysisProgressSection
        isAnalyzing={isAnalyzing}
        progress={progress}
        currentStep={currentStep}
      />

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleStartAnalysis}
                disabled={!canAnalyze}
                size="lg"
                className="px-8"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <BarChart3 className="w-5 h-5 mr-2" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Start Multi-AI Analysis'}
              </Button>
              
              {isAnalyzing && (
                <Button variant="outline" onClick={() => setIsAnalyzing(false)}>
                  Cancel Analysis
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {selectedModels.length} models selected
              </Badge>
              <Badge variant="outline">
                {contentType} input
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Placeholder */}
      {!isAnalyzing && progress > 0 && (
        <Alert>
          <CheckCircle2 className="w-4 h-4" />
          <AlertDescription>
            Analysis completed! Results would be displayed here using the AIAnalysisResultsDisplay component.
          </AlertDescription>
        </Alert>
      )}
        </div>

        {/* Right Column - Live Progress */}
        <div className="xl:col-span-1">
          <LiveAnalysisProgressCard 
            className="sticky top-6"
            maxDisplayJobs={5}
            showCompletedJobs={true}
            onJobComplete={(jobId, results) => {
              console.log('Analysis job completed:', jobId, results);
            }}
          />
        </div>
      </div>
    </div>
  );
};
