import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Clock,
  FileText,
  Upload,
  Brain,
  CheckCircle2,
  AlertCircle,
  Target,
  Calendar,
  User
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ContentUploadInterface } from '@/components/upload';

import type { CNNAnalysisResult } from '@/types/upload';
import { cn } from '@/lib/utils';

interface AssignmentDetail {
  id: string;
  title: string;
  description: string;
  courseTitle: string;
  dueDate: string;
  pointsWorth: number;
  requirements: string[];
  submissionTypes: string[];
  allowedAttempts: number;
  currentAttempts: number;
  isLate: boolean;
  estimatedTime: number;
}

interface AssignmentSubmissionProps {
  assignment?: AssignmentDetail;
  onNavigate: (view: string, id?: string) => void;
  onSubmissionComplete: (result: CNNAnalysisResult) => void;
}

// Mock assignment data - this would come from props or API
const mockAssignment: AssignmentDetail = {
  id: 'assignment-cv-analysis',
  title: 'Computer Vision Algorithm Analysis',
  description: 'Upload an image or diagram related to computer vision algorithms and analyze the CNN-generated insights. Write a brief summary of the findings.',
  courseTitle: 'Computer Vision Fundamentals',
  dueDate: '2025-09-05T23:59:00Z',
  pointsWorth: 100,
  requirements: [
    'Upload at least one relevant image (algorithm diagram, code snippet, or example)',
    'Include a written analysis of CNN insights (min 200 words)',
    'Demonstrate understanding of computer vision concepts',
    'Reference at least one course module in your analysis'
  ],
  submissionTypes: ['image', 'document'],
  allowedAttempts: 3,
  currentAttempts: 0,
  isLate: false,
  estimatedTime: 45
};

export const AssignmentSubmission: React.FC<AssignmentSubmissionProps> = ({
  assignment = mockAssignment,
  onNavigate,
  onSubmissionComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<CNNAnalysisResult[]>([]);

  const handleUploadComplete = (result: CNNAnalysisResult) => {
    console.log('Assignment upload completed:', result);
    setUploadedFiles(prev => [...prev, result]);
    onSubmissionComplete(result);
  };

  const handleFinalSubmission = () => {
    setIsSubmitting(true);
    // Simulate submission process
    setTimeout(() => {
      setIsSubmitting(false);
      onNavigate('course-detail');
    }, 2000);
  };

  const getDueDateStatus = () => {
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDue < 0) return { color: 'red', text: 'Overdue', urgent: true };
    if (hoursUntilDue < 24) return { color: 'orange', text: 'Due soon', urgent: true };
    if (hoursUntilDue < 72) return { color: 'yellow', text: 'Due this week', urgent: false };
    return { color: 'green', text: 'Plenty of time', urgent: false };
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Assignment Header */}
      <div className="bg-white border-b">
        <div className="w-full px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('course-detail')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Course
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="text-sm text-gray-600">{assignment.courseTitle}</div>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
              <p className="text-gray-600 mb-4">{assignment.description}</p>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>{assignment.pointsWorth} points</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span>~{assignment.estimatedTime} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span>Attempt {assignment.currentAttempts + 1} of {assignment.allowedAttempts}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm text-gray-600">Due Date</span>
              </div>
              <Badge 
                variant={dueDateStatus.urgent ? "destructive" : "secondary"}
                className="flex items-center gap-1"
              >
                {dueDateStatus.urgent && <AlertCircle className="w-3 h-3" />}
                {new Date(assignment.dueDate).toLocaleDateString()}
              </Badge>
              <p className={cn(
                "text-xs mt-1",
                dueDateStatus.color === 'red' ? "text-red-600" :
                dueDateStatus.color === 'orange' ? "text-orange-600" :
                dueDateStatus.color === 'yellow' ? "text-yellow-600" :
                "text-green-600"
              )}>
                {dueDateStatus.text}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Requirements Sidebar */}
          <div className="col-span-4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Assignment Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
                  <ul className="space-y-2">
                    {assignment.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Accepted File Types:</h4>
                  <div className="flex flex-wrap gap-1">
                    {assignment.submissionTypes.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-900">CNN Analysis</span>
                  </div>
                  <p className="text-xs text-purple-700">
                    Your uploads will be automatically analyzed to provide insights and help with your assignment.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Submission Area */}
          <div className="col-span-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Submit Your Work
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Upload Interface */}
                <ContentUploadInterface
                  courseId={assignment.courseTitle}
                  assignmentId={assignment.id}
                  onUploadComplete={handleUploadComplete}
                  maxFileSize={10 * 1024 * 1024} // 10MB
                  acceptedFileTypes={['.jpg', '.jpeg', '.png', '.pdf', '.docx']}
                />

                {/* Upload Summary */}
                {uploadedFiles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">
                        Files Uploaded Successfully
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mb-4">
                      {uploadedFiles.length} file(s) uploaded with CNN analysis complete.
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleFinalSubmission}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Submit Assignment
                          </>
                        )}
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        Save as Draft
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
