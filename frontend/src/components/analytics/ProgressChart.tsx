import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, Users, Award, Clock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import type { LearningProgressData } from '@/types/analytics';

interface CourseProgressAccumulator {
  name: string;
  totalStudents: number;
  avgProgress: number;
  totalActivities: number;
  totalTime: number;
  totalAnalyses: number;
}

interface ProgressChartProps {
  data: LearningProgressData[];
  courseId?: string;
  showIndividualStudents?: boolean;
  className?: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  data,
  courseId,
  showIndividualStudents = false,
  className = ''
}) => {
  const chartData = useMemo(() => {
    if (showIndividualStudents) {
      return data
        .filter(item => !courseId || item.courseId === courseId)
        .map(item => ({
          name: item.userName || `User ${item.userId.slice(-4)}`,
          progress: item.progressScore,
          activities: item.completedActivities,
          timeSpent: Math.round(item.timeSpent / 3600), // Convert to hours
          analyses: item.analysisCount
        }))
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 20); // Show top 20 students
    } else {
      // Aggregate by course
      const courseProgress = data.reduce((acc, item) => {
        const key = item.courseName || item.courseId;
        if (!acc[key]) {
          acc[key] = {
            name: key,
            totalStudents: 0,
            avgProgress: 0,
            totalActivities: 0,
            totalTime: 0,
            totalAnalyses: 0
          };
        }
        acc[key].totalStudents += 1;
        acc[key].avgProgress += item.progressScore;
        acc[key].totalActivities += item.completedActivities;
        acc[key].totalTime += item.timeSpent;
        acc[key].totalAnalyses += item.analysisCount;
        return acc;
      }, {} as Record<string, CourseProgressAccumulator>);

      return Object.values(courseProgress).map((course: CourseProgressAccumulator) => ({
        name: course.name,
        progress: Math.round(course.avgProgress / course.totalStudents),
        students: course.totalStudents,
        avgActivities: Math.round(course.totalActivities / course.totalStudents),
        avgTimeSpent: Math.round(course.totalTime / course.totalStudents / 3600), // Hours
        avgAnalyses: Math.round(course.totalAnalyses / course.totalStudents)
      }));
    }
  }, [data, courseId, showIndividualStudents]);

  const overallStats = useMemo(() => {
    const totalStudents = data.length;
    const avgProgress = data.reduce((sum, item) => sum + item.progressScore, 0) / totalStudents;
    const avgActivities = data.reduce((sum, item) => sum + item.completedActivities, 0) / totalStudents;
    const avgTimeSpent = data.reduce((sum, item) => sum + item.timeSpent, 0) / totalStudents / 3600;
    
    return {
      totalStudents,
      avgProgress: Math.round(avgProgress),
      avgActivities: Math.round(avgActivities),
      avgTimeSpent: Math.round(avgTimeSpent)
    };
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${entry.name === 'progress' ? '%' : ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`space-y-6 ${className}`}
    >
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Students</span>
            </div>
            <div className="text-2xl font-bold">{overallStats.totalStudents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Avg Progress</span>
            </div>
            <div className="text-2xl font-bold">{overallStats.avgProgress}%</div>
            <Progress value={overallStats.avgProgress} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Avg Activities</span>
            </div>
            <div className="text-2xl font-bold">{overallStats.avgActivities}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Avg Time (hrs)</span>
            </div>
            <div className="text-2xl font-bold">{overallStats.avgTimeSpent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {showIndividualStudents ? 'Student Progress' : 'Course Progress'}
            </CardTitle>
            <Badge variant="outline">
              {chartData.length} {showIndividualStudents ? 'Students' : 'Courses'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {showIndividualStudents ? (
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="progress"
                    fill="#3b82f6"
                    name="Progress %"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="activities"
                    fill="#10b981"
                    name="Activities"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="progress"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Avg Progress %"
                  />
                  <Line
                    type="monotone"
                    dataKey="students"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Students"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProgressChart;
