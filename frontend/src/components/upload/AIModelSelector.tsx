import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Cpu, Clock, CheckCircle2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AIModelType, AnalysisModelType, AIModelInfo } from '@/types/upload';

interface AIModelSelectorProps {
  selectedModels: Set<AnalysisModelType>;
  onModelsChange: (models: Set<AnalysisModelType>) => void;
  disabled?: boolean;
  className?: string;
}

const AI_MODELS: Record<AIModelType, AIModelInfo> = {
  gpt4: {
    id: 'gpt4',
    name: 'GPT-4 Omni',
    description: 'Advanced reasoning via OpenRouter API',
    estimatedTime: '15-30s',
    capabilities: ['Deep Content Analysis', 'Context Understanding', 'Educational Insights'],
    icon: '🧠',
    provider: 'OpenRouter',
    cost: 'Premium'
  },
  claude: {
    id: 'claude',
    name: 'Claude 3.5 Sonnet',
    description: 'Excellent educational analysis via OpenRouter API',
    estimatedTime: '20-35s',
    capabilities: ['Educational Focus', 'Detailed Explanations', 'Safety Analysis'],
    icon: '🎓',
    provider: 'OpenRouter',
    cost: 'Premium'
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini 2.5 Flash',
    description: 'Fast multimodal analysis - FREE via OpenRouter',
    estimatedTime: '10-25s',
    capabilities: ['Visual Analysis', 'Multimodal Processing', 'Fast Response'],
    icon: '⚡',
    provider: 'OpenRouter',
    cost: 'FREE'
  }
};

const ModelCard: React.FC<{
  modelId: AnalysisModelType;
  isSelected: boolean;
  onToggle: (modelId: AnalysisModelType, selected: boolean) => void;
  disabled?: boolean;
  isCNN?: boolean;
}> = ({ modelId, isSelected, onToggle, disabled, isCNN }) => {
  if (isCNN) {
    return (
      <Card className="relative transition-all duration-200 border-2 border-blue-500 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Cpu className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">CNN Analysis</CardTitle>
                <p className="text-sm text-blue-600">Default & Always Enabled</p>
              </div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 mb-3">
            Advanced computer vision for object detection and categorization
          </p>
          <div className="flex flex-wrap gap-1 mb-3">
            {['Object Detection', 'Categorization', 'Hardware ID'].map((capability) => (
              <Badge key={capability} variant="secondary" className="text-xs">
                {capability}
              </Badge>
            ))}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="w-3 h-3 mr-1" />
            8-12s processing time
          </div>
        </CardContent>
      </Card>
    );
  }

  const modelInfo = AI_MODELS[modelId as AIModelType];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={`relative transition-all duration-200 cursor-pointer border-2 ${
              isSelected 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onToggle(modelId, !isSelected)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <span className="text-lg">{modelInfo.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{modelInfo.name}</CardTitle>
                      {modelInfo.cost === 'FREE' && (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                          FREE
                        </Badge>
                      )}
                      {modelInfo.cost === 'Premium' && (
                        <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{modelInfo.description}</p>
                    {modelInfo.provider && (
                      <p className="text-xs text-gray-500">via {modelInfo.provider}</p>
                    )}
                  </div>
                </div>
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                  isSelected 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-300'
                }`}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1 mb-3">
                {modelInfo.capabilities.map((capability) => (
                  <Badge key={capability} variant="outline" className="text-xs">
                    {capability}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {modelInfo.estimatedTime} processing time
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">{modelInfo.name}</p>
          <p className="text-sm">{modelInfo.description}</p>
          <p className="text-xs text-gray-400 mt-1">
            Estimated processing: {modelInfo.estimatedTime}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  selectedModels,
  onModelsChange,
  disabled = false,
  className = ''
}) => {
  const handleModelToggle = (modelId: AnalysisModelType, selected: boolean) => {
    const newSelection = new Set(selectedModels);
    
    if (selected) {
      newSelection.add(modelId);
    } else {
      newSelection.delete(modelId);
    }
    
    onModelsChange(newSelection);
  };

  const selectedAICount = Array.from(selectedModels).filter(model => model !== 'cnn').length;
  const totalEstimatedTime = selectedAICount * 25; // Average processing time

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>AI Analysis Models</span>
            {selectedAICount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {selectedAICount + 1} model{selectedAICount > 0 ? 's' : ''} selected
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600">
            Select AI models for enhanced content analysis. CNN analysis is always included.
            <span className="block mt-1 text-green-600 font-medium">💡 Tip: Gemini 2.5 Flash is FREE to use!</span>
          </p>
          {selectedAICount > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              Estimated total processing time: ~{totalEstimatedTime}s
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CNN Analysis - Always Selected */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ModelCard
              modelId="cnn"
              isSelected={true}
              onToggle={() => {}} // No-op for CNN
              disabled={false}
              isCNN={true}
            />
          </motion.div>

          {/* AI Models */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Show FREE model first */}
            {['gemini', 'gpt4', 'claude'].map((modelId, index) => (
              <motion.div
                key={modelId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.1 }}
              >
                <ModelCard
                  modelId={modelId as AIModelType}
                  isSelected={selectedModels.has(modelId as AIModelType)}
                  onToggle={handleModelToggle}
                  disabled={disabled}
                />
              </motion.div>
            ))}
          </div>

          {/* Selection Summary */}
          {selectedAICount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Enhanced Analysis Selected</span>
              </div>
              <p className="text-sm text-blue-700">
                Your content will be analyzed by {selectedAICount + 1} AI model{selectedAICount > 0 ? 's' : ''} 
                to provide comprehensive insights. This may take up to {totalEstimatedTime} seconds to complete.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
