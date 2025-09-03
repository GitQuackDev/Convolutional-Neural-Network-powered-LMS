import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Brain, Zap, CheckCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { AIModelUsageData } from '@/types/analytics';

interface ModelPerformanceAccumulator {
  name: string;
  totalUsage: number;
  totalProcessingTime: number;
  totalSuccessRate: number;
  count: number;
}

interface ProcessedModelData {
  name: string;
  usage: number;
  avgProcessingTime: number;
  avgSuccessRate: number;
  efficiency: number;
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  payload: ProcessedModelData;
}

interface AIModelUsageChartProps {
  data: AIModelUsageData[];
  showTrends?: boolean;
  showPerformanceMetrics?: boolean;
  className?: string;
}

const COLORS = {
  'GPT-4': '#3b82f6',
  'Claude': '#8b5cf6',
  'Gemini': '#10b981',
  'DeepSeek': '#f59e0b',
  'CNN': '#ef4444'
};

export const AIModelUsageChart: React.FC<AIModelUsageChartProps> = ({
  data,
  showTrends = false,
  showPerformanceMetrics = false,
  className = ''
}) => {
  const pieChartData = useMemo(() => {
    const modelUsage = data.reduce((acc, item) => {
      if (!acc[item.modelName]) {
        acc[item.modelName] = 0;
      }
      acc[item.modelName] += item.usageCount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(modelUsage).map(([name, count]) => ({
      name,
      value: count,
      color: COLORS[name as keyof typeof COLORS] || '#64748b'
    }));
  }, [data]);

  const performanceData = useMemo(() => {
    const modelPerformance = data.reduce((acc, item) => {
      if (!acc[item.modelName]) {
        acc[item.modelName] = {
          name: item.modelName,
          totalUsage: 0,
          totalProcessingTime: 0,
          totalSuccessRate: 0,
          count: 0
        };
      }
      acc[item.modelName].totalUsage += item.usageCount;
      acc[item.modelName].totalProcessingTime += item.averageProcessingTime;
      acc[item.modelName].totalSuccessRate += item.successRate;
      acc[item.modelName].count += 1;
      return acc;
    }, {} as Record<string, ModelPerformanceAccumulator>);

    return Object.values(modelPerformance).map((model: ModelPerformanceAccumulator) => ({
      name: model.name,
      usage: model.totalUsage,
      avgProcessingTime: Math.round(model.totalProcessingTime / model.count),
      avgSuccessRate: Math.round(model.totalSuccessRate / model.count),
      efficiency: Math.round((model.totalSuccessRate / model.count) / (model.totalProcessingTime / model.count) * 100)
    }));
  }, [data]);

  const topPerformer = useMemo(() => {
    if (performanceData.length === 0) return null;
    return performanceData.reduce((best, current) => 
      current.efficiency > best.efficiency ? current : best
    );
  }, [performanceData]);

  const fastestModel = useMemo(() => {
    if (performanceData.length === 0) return null;
    return performanceData.reduce((fastest, current) => 
      current.avgProcessingTime < fastest.avgProcessingTime ? current : fastest
    );
  }, [performanceData]);

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
              {`${entry.name}: ${entry.value}${entry.name.includes('Rate') ? '%' : entry.name.includes('Time') ? 'ms' : ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<TooltipPayload>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = pieChartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p style={{ color: data.color }}>
            Usage: {data.value.toLocaleString()} ({percentage}%)
          </p>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Model Usage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Usage Distribution Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usage Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Model Statistics */}
                <div className="space-y-4">
                  {topPerformer && (
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Top Performer</span>
                        </div>
                        <div className="text-lg font-bold">{topPerformer.name}</div>
                        <div className="text-sm text-green-600">
                          {topPerformer.efficiency}% efficiency score
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {fastestModel && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-blue-800">
                          <Zap className="h-4 w-4" />
                          <span className="font-medium">Fastest Model</span>
                        </div>
                        <div className="text-lg font-bold">{fastestModel.name}</div>
                        <div className="text-sm text-blue-600">
                          {fastestModel.avgProcessingTime}ms average
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-muted-foreground">Total Analyses</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {pieChartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              {showPerformanceMetrics && (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="avgSuccessRate" fill="#10b981" name="Success Rate %" />
                      <Bar dataKey="avgProcessingTime" fill="#f59e0b" name="Avg Time (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Performance Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {performanceData.map((model) => (
                  <Card key={model.name}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{model.name}</span>
                        <Badge 
                          style={{ backgroundColor: COLORS[model.name as keyof typeof COLORS] || '#64748b' }}
                          className="text-white border-0"
                        >
                          {model.usage}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>Success Rate</span>
                            <span>{model.avgSuccessRate}%</span>
                          </div>
                          <Progress value={model.avgSuccessRate} className="h-2" />
                        </div>
                        
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Avg Time</span>
                          <span>{model.avgProcessingTime}ms</span>
                        </div>
                        
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Efficiency</span>
                          <span>{model.efficiency}/100</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              {showTrends && (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="usage" fill="#3b82f6" name="Total Usage" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AIModelUsageChart;
