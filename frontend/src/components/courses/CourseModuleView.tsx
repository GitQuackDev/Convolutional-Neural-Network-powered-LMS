import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  FileText,
  Upload,
  Brain,
  Lock,
  Award,
  BookOpen
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import type { CourseDetail, CourseStep } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface CourseModuleViewProps {
  course: CourseDetail;
  onNavigate: (view: string, id?: string) => void;
  onStepComplete: (stepId: string) => void;
}

const getStepIcon = (type: string, isCompleted: boolean, isLocked: boolean) => {
  if (isLocked) return <Lock className="w-4 h-4" />;
  if (isCompleted) return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  
  switch (type) {
    case 'video': return <Play className="w-4 h-4" />;
    case 'content': return <FileText className="w-4 h-4" />;
    case 'upload': return <Upload className="w-4 h-4" />;
    case 'quiz': return <Brain className="w-4 h-4" />;
    case 'assignment': return <FileText className="w-4 h-4" />;
    default: return <Circle className="w-4 h-4" />;
  }
};

const getStepTypeColor = (type: string, isCompleted: boolean, isLocked: boolean) => {
  if (isLocked) return 'text-gray-400';
  if (isCompleted) return 'text-green-600';
  
  switch (type) {
    case 'video': return 'text-blue-600';
    case 'content': return 'text-gray-600';
    case 'upload': return 'text-purple-600';
    case 'quiz': return 'text-orange-600';
    case 'assignment': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const CourseModuleView: React.FC<CourseModuleViewProps> = ({
  course,
  onNavigate,
  onStepComplete
}) => {
  const [expandedModules, setExpandedModules] = useState<string[]>([course.modules[0]?.id || '']);

  // Find the current step based on progress
  const findCurrentStep = () => {
    for (const module of course.modules) {
      for (const step of module.steps) {
        if (step.isCurrent) return step;
      }
    }
    return null;
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleStepClick = (step: CourseStep) => {
    if (step.isLocked) return;
    
    // Handle different step types
    if (step.type === 'upload' || step.type === 'assignment') {
      onNavigate('assignment-submission', step.id);
    }
  };

  const currentStepData = findCurrentStep();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-white border-b">
        <div className="w-full px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('courses')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Courses
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                <p className="text-gray-600 mt-1">{course.instructor}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">Course Progress</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={course.progress * 100} className="w-32" />
                  <span className="text-sm font-medium">
                    {Math.round(course.progress * 100)}%
                  </span>
                </div>
              </div>
              
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {course.estimatedHours}h total
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Module Sidebar */}
          <div className="col-span-4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Course Modules
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  <div className="p-4 space-y-2">
                    {course.modules.map((module, moduleIndex) => (
                      <div key={module.id} className="space-y-2">
                        {/* Module Header */}
                        <button
                          onClick={() => toggleModule(module.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-lg border transition-colors",
                            module.isCompleted 
                              ? "bg-green-50 border-green-200 text-green-900"
                              : module.isLocked
                              ? "bg-gray-50 border-gray-200 text-gray-500"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {module.isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : module.isLocked ? (
                                <Lock className="w-5 h-5 text-gray-400" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                  <span className="text-xs font-medium">{moduleIndex + 1}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm">{module.title}</p>
                              <p className="text-xs text-gray-600">
                                {module.estimatedMinutes} min
                              </p>
                            </div>
                          </div>
                          
                          {expandedModules.includes(module.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        {/* Module Steps */}
                        <AnimatePresence>
                          {expandedModules.includes(module.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-8 space-y-1 pb-2">
                                {module.steps.map((step) => (
                                  <button
                                    key={step.id}
                                    onClick={() => handleStepClick(step)}
                                    disabled={step.isLocked}
                                    className={cn(
                                      "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
                                      step.isCurrent 
                                        ? "bg-blue-50 border border-blue-200"
                                        : step.isCompleted
                                        ? "hover:bg-green-50"
                                        : step.isLocked
                                        ? "cursor-not-allowed opacity-50"
                                        : "hover:bg-gray-50"
                                    )}
                                  >
                                    <div className={cn(
                                      "flex-shrink-0",
                                      getStepTypeColor(step.type, step.isCompleted, step.isLocked)
                                    )}>
                                      {getStepIcon(step.type, step.isCompleted, step.isLocked)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{step.title}</p>
                                      <p className="text-xs text-gray-600">
                                        {step.estimatedTime} min
                                      </p>
                                    </div>
                                    {step.cnnAnalysisEnabled && (
                                      <Brain className="w-3 h-3 text-purple-500" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="col-span-8">
            {currentStepData ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStepIcon(currentStepData.type, currentStepData.isCompleted, currentStepData.isLocked)}
                        {currentStepData.title}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">
                        Estimated time: {currentStepData.estimatedTime} minutes
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {currentStepData.cnnAnalysisEnabled && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          CNN Analysis
                        </Badge>
                      )}
                      
                      <Button
                        onClick={() => onStepComplete(currentStepData.id)}
                        disabled={currentStepData.isCompleted}
                        size="sm"
                      >
                        {currentStepData.isCompleted ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Completed
                          </>
                        ) : (
                          'Mark Complete'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    {currentStepData.content ? (
                      <div dangerouslySetInnerHTML={{ __html: currentStepData.content }} />
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          {getStepIcon(currentStepData.type, false, false)}
                        </div>
                        <p>Content for this step will be loaded here.</p>
                        {currentStepData.type === 'upload' && (
                          <Button 
                            className="mt-4"
                            onClick={() => onNavigate('assignment-submission', currentStepData.id)}
                          >
                            Start Upload Assignment
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Welcome to {course.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Select a module from the sidebar to begin your learning journey.
                  </p>
                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {course.completedSteps}
                      </div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {course.totalSteps}
                      </div>
                      <div className="text-sm text-gray-600">Total Steps</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(course.progress * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">Progress</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
