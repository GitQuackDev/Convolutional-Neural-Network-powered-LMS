import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock,
  Upload,
  MessageSquare,
  TrendingUp,
  FileText,
  Brain,
  Target,
  Calendar,
  Award
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import type { CourseProgress, Assignment, CNNAnalysisResult, QuickAction } from '@/types/dashboard';

interface StudentDashboardProps {
  studentName: string;
  studentAvatar?: string;
  courses: CourseProgress[];
  assignments: Assignment[];
  recentAnalysis: CNNAnalysisResult[];
  onNavigate: (view: string, id?: string) => void;
}

// Mock data - replace with real API calls
const mockQuickActions: QuickAction[] = [
  {
    id: '1',
    title: 'Upload New Content',
    description: 'Analyze images or documents with CNN',
    icon: 'Upload',
    action: 'upload',
    color: 'blue'
  },
  {
    id: '2',
    title: 'Join Discussion',
    description: 'Connect with classmates and instructors',
    icon: 'MessageSquare',
    action: 'discussions',
    color: 'green'
  },
  {
    id: '3',
    title: 'View All Courses',
    description: 'Browse your enrolled courses',
    icon: 'BookOpen',
    action: 'courses',
    color: 'purple'
  }
];

const ProgressRing: React.FC<{ progress: number; size?: number; color?: string }> = ({ 
  progress, 
  size = 60, 
  color = 'blue' 
}) => {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress * circumference);

  const colorClasses = {
    blue: 'stroke-blue-600',
    green: 'stroke-green-600',
    yellow: 'stroke-yellow-500',
    red: 'stroke-red-600'
  };

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-gray-200"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-900">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
};

const CourseProgressCard: React.FC<{ 
  course: CourseProgress; 
  onClick: () => void;
}> = ({ course, onClick }) => {
  const getColorClass = (color: string) => {
    switch (color) {
      case 'green': return 'border-green-200 hover:border-green-300';
      case 'yellow': return 'border-yellow-200 hover:border-yellow-300';
      case 'red': return 'border-red-200 hover:border-red-300';
      default: return 'border-blue-200 hover:border-blue-300';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={`cursor-pointer transition-all duration-200 ${getColorClass(course.color)}`}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">{course.name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {course.modulesCompleted} of {course.totalModules} modules
              </p>
            </div>
            <ProgressRing 
              progress={course.completion} 
              size={50} 
              color={course.color}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {course.nextDeadline && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              Next: {new Date(course.nextDeadline).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AssignmentCard: React.FC<{ 
  assignment: Assignment; 
  onClick: () => void;
}> = ({ assignment, onClick }) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'overdue': return 'border-l-red-500 bg-red-50';
      case 'due_today': return 'border-l-orange-500 bg-orange-50';
      case 'due_week': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_started': return 'Start';
      case 'in_progress': return 'Continue';
      case 'ready_to_submit': return 'Submit';
      case 'submitted': return 'View';
      default: return 'Open';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-green-100 text-green-800';
      case 'ready_to_submit': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={`border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md ${getUrgencyColor(assignment.urgency)}`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 line-clamp-1">{assignment.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{assignment.courseName}</p>
              <div className="flex items-center text-sm text-gray-500 mt-2">
                <Clock className="w-4 h-4 mr-2" />
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </div>
              {assignment.progress > 0 && assignment.status !== 'submitted' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-900">{Math.round(assignment.progress * 100)}%</span>
                  </div>
                  <Progress value={assignment.progress * 100} className="h-2" />
                </div>
              )}
            </div>
            <div className="ml-4 flex flex-col items-end space-y-2">
              <Badge className={getStatusColor(assignment.status)}>
                {getStatusText(assignment.status)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CNNAnalysisItem: React.FC<{ 
  analysis: CNNAnalysisResult; 
  onClick: () => void;
}> = ({ analysis, onClick }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="flex items-start space-x-3 p-3 bg-white rounded-lg border hover:shadow-md cursor-pointer transition-all duration-200"
      onClick={onClick}
    >
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        {analysis.thumbnail ? (
          <img 
            src={analysis.thumbnail} 
            alt={analysis.fileName}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <FileText className="w-6 h-6 text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-gray-900 line-clamp-1">{analysis.fileName}</h4>
          <Badge className={getConfidenceColor(analysis.confidence)}>
            {Math.round(analysis.confidence * 100)}%
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {analysis.insights.slice(0, 2).join(', ')}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {new Date(analysis.timestamp).toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
};

const QuickActionCard: React.FC<{ 
  action: QuickAction; 
  onClick: () => void;
}> = ({ action, onClick }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Upload': return <Upload className="w-6 h-6" />;
      case 'MessageSquare': return <MessageSquare className="w-6 h-6" />;
      case 'BookOpen': return <BookOpen className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'green': return 'bg-green-600 hover:bg-green-700 text-white';
      case 'purple': return 'bg-purple-600 hover:bg-purple-700 text-white';
      default: return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={onClick}
        className={`w-full h-auto p-4 flex flex-col items-center space-y-2 ${getColorClass(action.color)}`}
        variant="default"
      >
        {getIcon(action.icon)}
        <div className="text-center">
          <div className="font-semibold">{action.title}</div>
          <div className="text-xs opacity-90">{action.description}</div>
        </div>
      </Button>
    </motion.div>
  );
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  studentName,
  studentAvatar,
  courses,
  assignments,
  recentAnalysis,
  onNavigate
}) => {
  const totalCourses = courses.length;
  const averageProgress = courses.reduce((sum, course) => sum + course.completion, 0) / totalCourses;
  const pendingAssignments = assignments.filter(a => a.status !== 'submitted').length;

  const urgentAssignments = assignments
    .filter(a => a.urgency === 'overdue' || a.urgency === 'due_today')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const upcomingAssignments = assignments
    .filter(a => a.urgency === 'due_week' || a.urgency === 'future')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  return (
    <div className="w-full space-y-8">
      {/* Welcome Header */}
      <div className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-background border border-border/40 rounded-xl p-6"
        >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16 border-2 border-border">
              <AvatarImage src={studentAvatar} alt={studentName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {studentName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Welcome back, {studentName}!</h1>
              <p className="text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{totalCourses}</div>
                <div className="text-sm text-muted-foreground">Active Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{pendingAssignments}</div>
                <div className="text-sm text-muted-foreground">Pending Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{Math.round(averageProgress * 100)}%</div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
              </div>
            </div>
          </div>
        </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
        {/* Left Column - Progress & Assignments */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course Progress */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
                Course Progress
              </h2>
              <Button 
                variant="outline" 
                onClick={() => onNavigate('courses')}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <CourseProgressCard
                  key={course.id}
                  course={course}
                  onClick={() => onNavigate('course-detail', course.id)}
                />
              ))}
            </div>
          </motion.section>

          {/* Active Assignments */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Target className="w-6 h-6 mr-3 text-orange-600" />
                Active Assignments
              </h2>
            </div>
            
            {urgentAssignments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Urgent - Due Soon
                </h3>
                <div className="space-y-3">
                  {urgentAssignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onClick={() => onNavigate('assignment', assignment.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Upcoming</h3>
              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onClick={() => onNavigate('assignment', assignment.id)}
                  />
                ))}
              </div>
            </div>
          </motion.section>
        </div>

        {/* Right Column - Analysis & Actions */}
        <div className="space-y-8">
          {/* Recent CNN Analysis */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-purple-600" />
                  Recent Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentAnalysis.slice(0, 5).map((analysis) => (
                  <CNNAnalysisItem
                    key={analysis.id}
                    analysis={analysis}
                    onClick={() => onNavigate('analysis', analysis.id)}
                  />
                ))}
                {recentAnalysis.length > 5 && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-blue-600"
                    onClick={() => onNavigate('analysis')}
                  >
                    View All Analysis Results
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.section>

          {/* Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2 text-green-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockQuickActions.map((action) => (
                  <QuickActionCard
                    key={action.id}
                    action={action}
                    onClick={() => onNavigate(action.action)}
                  />
                ))}
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </div>
    </div>
  );
};
