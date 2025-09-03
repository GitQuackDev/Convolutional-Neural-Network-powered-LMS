import { useState } from 'react';
import { ContentUploadInterface } from '@/components';
import { MainNavigation } from '@/components/navigation';
import { StudentDashboard } from '@/components/dashboard';
import { CourseModuleView } from '@/components/courses';
import { AssignmentSubmission } from '@/components/assignments';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import type { CNNAnalysisResult } from '@/types/upload';
import { mockCourses, mockAssignments, mockAnalysisResults, mockCourseDetail } from '@/data/mockData';

export function DashboardApp() {
  const [activeView, setActiveView] = useState('dashboard');
  const { user } = useAuth();
  
  const handleUploadComplete = (result: CNNAnalysisResult) => {
    console.log('Upload completed:', result);
    // Here you would typically save the result to your backend
  };

  const handleNavigate = (view: string, id?: string) => {
    setActiveView(view);
    
    if (id) {
      console.log(`Navigating to ${view} with ID: ${id}`);
    }
  };

  const handleStepComplete = (stepId: string) => {
    console.log(`Step completed: ${stepId}`);
    // Here you would typically update the backend
  };

  // Map user role to navigation component expected roles
  const mapUserRole = (role?: string): 'student' | 'professor' | 'admin' => {
    switch (role) {
      case 'professor':
        return 'professor';
      case 'admin':
        return 'admin';
      default:
        return 'student';
    }
  };

  const renderCurrentView = () => {
    switch (activeView) {
      case 'upload':
        return (
          <ContentUploadInterface
            courseId="demo-course-123"
            assignmentId="demo-assignment-456"
            onUploadComplete={handleUploadComplete}
          />
        );
      case 'dashboard':
        return (
          <StudentDashboard
            studentName={user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email || 'Student'}
            studentAvatar="/api/placeholder/64/64"
            courses={mockCourses}
            assignments={mockAssignments}
            recentAnalysis={mockAnalysisResults}
            onNavigate={handleNavigate}
          />
        );
      case 'courses':
        return (
          <div className="w-full px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">My Courses</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mockCourses.map((course) => (
                <Card 
                  key={course.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleNavigate('course-detail', course.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {course.name}
                      <Badge variant="secondary">
                        {Math.round(course.completion * 100)}%
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {course.modulesCompleted} of {course.totalModules} modules completed
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Progress value={course.completion * 100} className="mb-3" />
                    {course.nextDeadline && (
                      <p className="text-sm text-gray-500">
                        Next deadline: {new Date(course.nextDeadline).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'course-detail':
        return (
          <CourseModuleView
            course={mockCourseDetail}
            onNavigate={handleNavigate}
            onStepComplete={handleStepComplete}
          />
        );
      case 'assignment-submission':
        return (
          <AssignmentSubmission
            assignment={undefined} // Will use mock data
            onNavigate={handleNavigate}
            onSubmissionComplete={(result) => {
              console.log('Assignment submitted:', result);
              // Handle submission completion
            }}
          />
        );
      case 'discussions':
        return (
          <div className="w-full px-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Discussions</h1>
            <p className="text-gray-600">Discussion forum coming soon...</p>
          </div>
        );
      case 'professor-analytics':
        // Only professors and admins can access analytics
        if (user?.role === 'professor' || user?.role === 'admin') {
          return <AnalyticsDashboard userRole={user.role as 'professor' | 'admin'} />;
        }
        return (
          <div className="w-full px-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access analytics.</p>
          </div>
        );
      case 'professor-dashboard':
        return (
          <div className="w-full px-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Professor Dashboard</h1>
            <p className="text-gray-600">Professor dashboard coming soon...</p>
          </div>
        );
      case 'professor-courses':
        return (
          <div className="w-full px-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Courses</h1>
            <p className="text-gray-600">Course management coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="w-full px-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome</h1>
            <p className="text-gray-600">Select a section from the navigation above.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation
        userRole={mapUserRole(user?.role)}
        userName={user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email || 'Student'}
        activeView={activeView}
        onNavigate={handleNavigate}
        notificationCount={3}
      />
      
      <main>
        {renderCurrentView()}
      </main>
    </div>
  );
}
