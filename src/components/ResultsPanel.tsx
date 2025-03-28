
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestConfig } from './TestForm';
import { PerformanceMetrics } from '../services/performanceService';

interface ResultsPanelProps {
  testConfig: TestConfig;
  isVisible: boolean;
  metrics?: PerformanceMetrics; // Real performance metrics from API
}

const COLORS = ['#f97316', '#78c6fa', '#46c93a', '#e11d48', '#a855f7'];

const ResultsPanel: React.FC<ResultsPanelProps> = ({ testConfig, isVisible, metrics }) => {
  if (!isVisible) return null;
  
  const { url, testType, users, duration } = testConfig;
  
  if (!metrics) {
    return (
      <div className="w-full flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No data available</p>
          <p className="text-sm text-muted-foreground">Please run a test to see results</p>
        </div>
      </div>
    );
  }

  // Transform data for charts
  const loadTimeData = metrics.loadTime.map((value, index) => ({
    time: (index * (duration / metrics.loadTime.length)).toFixed(1),
    value
  }));
  
  const latencyData = metrics.latency.map((value, index) => ({
    time: (index * (duration / metrics.latency.length)).toFixed(1),
    value
  }));
  
  const concurrentUsersData = Array(metrics.loadTime.length).fill(0).map((_, index) => {
    const usersPct = Math.min(1, (index + 1) / metrics.loadTime.length);
    return {
      time: (index * (duration / metrics.loadTime.length)).toFixed(1),
      value: Math.floor(usersPct * users)
    };
  });
  
  const errorRateData = metrics.errorRate.map((value, index) => ({
    time: (index * (duration / metrics.errorRate.length)).toFixed(1),
    value
  }));
  
  const requestsPerSecondData = metrics.requestsPerSecond.map((value, index) => ({
    time: (index * (duration / metrics.requestsPerSecond.length)).toFixed(1),
    value
  }));

  return (
    <div className={`w-full space-y-8 ${isVisible ? 'animate-fade-in' : 'hidden'}`}>
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Test Results Summary</CardTitle>
          <CardDescription>
            {testType.charAt(0).toUpperCase() + testType.slice(1)} test for {url} with {users} users over {duration} seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Average Load Time</p>
              <p className="text-3xl font-bold text-orange-500">{metrics.summary.avgLoadTime} ms</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Requests Per Second</p>
              <p className="text-3xl font-bold text-orange-500">{metrics.summary.peakRps}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Success Rate</p>
              <p className="text-3xl font-bold text-orange-500">{metrics.summary.successRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="timeseries" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8">
          <TabsTrigger value="timeseries">Time Series</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeseries" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Page Load Time (ms)</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={loadTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ value: 'Load Time (ms)', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#f97316" 
                      strokeWidth={2} 
                      dot={{ fill: '#f97316', strokeWidth: 1, r: 4 }} 
                      activeDot={{ r: 6, fill: '#f97316', stroke: 'white', strokeWidth: 2 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Latency (ms)</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={latencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#78c6fa" 
                      strokeWidth={2} 
                      dot={{ fill: '#78c6fa', strokeWidth: 1, r: 4 }} 
                      activeDot={{ r: 6, fill: '#78c6fa', stroke: 'white', strokeWidth: 2 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Concurrent Users</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={concurrentUsersData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ value: 'Users', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#46c93a" 
                      strokeWidth={2} 
                      dot={{ fill: '#46c93a', strokeWidth: 1, r: 4 }} 
                      activeDot={{ r: 6, fill: '#46c93a', stroke: 'white', strokeWidth: 2 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Requests Per Second</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={requestsPerSecondData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ value: 'Requests/sec', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#a855f7" 
                      strokeWidth={2} 
                      dot={{ fill: '#a855f7', strokeWidth: 1, r: 4 }} 
                      activeDot={{ r: 6, fill: '#a855f7', stroke: 'white', strokeWidth: 2 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Overall Performance Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-72">
                <div className="relative w-44 h-44 mb-4">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl font-bold">{metrics.performanceScores.overall}</span>
                  </div>
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="10" 
                      className="text-secondary/50" 
                    />
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="10" 
                      strokeDasharray={`${2 * Math.PI * 45 * metrics.performanceScores.overall/100} ${2 * Math.PI * 45 * (100-metrics.performanceScores.overall)/100}`} 
                      className="text-orange-500" 
                    />
                  </svg>
                </div>
                <p className="text-xl text-muted-foreground text-center">
                  {metrics.performanceScores.overall >= 90 ? 'Excellent' : 
                   metrics.performanceScores.overall >= 80 ? 'Good' : 
                   metrics.performanceScores.overall >= 70 ? 'Average' : 'Needs Improvement'}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 h-72 flex flex-col justify-center">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Time to First Byte (TTFB)</p>
                    <p className="text-sm font-medium">{metrics.performanceScores.ttfb}</p>
                  </div>
                  <Progress value={metrics.performanceScores.ttfb} className="h-2 bg-secondary/50">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${metrics.performanceScores.ttfb}%` }}></div>
                  </Progress>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">First Contentful Paint (FCP)</p>
                    <p className="text-sm font-medium">{metrics.performanceScores.fcp}</p>
                  </div>
                  <Progress value={metrics.performanceScores.fcp} className="h-2 bg-secondary/50">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${metrics.performanceScores.fcp}%` }}></div>
                  </Progress>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Largest Contentful Paint (LCP)</p>
                    <p className="text-sm font-medium">{metrics.performanceScores.lcp}</p>
                  </div>
                  <Progress value={metrics.performanceScores.lcp} className="h-2 bg-secondary/50">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${metrics.performanceScores.lcp}%` }}></div>
                  </Progress>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Time to Load (TTL)</p>
                    <p className="text-sm font-medium">{metrics.performanceScores.ttl}</p>
                  </div>
                  <Progress value={metrics.performanceScores.ttl} className="h-2 bg-secondary/50">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${metrics.performanceScores.ttl}%` }}></div>
                  </Progress>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="distribution" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>HTTP Status Code Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.statusCodes}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {metrics.statusCodes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => {
                        return [typeof value === 'number' ? `${value.toFixed(0)}%` : `${value}%`, 'Percentage'];
                      }}
                      contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={errorRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ value: 'Error Rate (%)', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip 
                      formatter={(value) => {
                        return [typeof value === 'number' ? `${value.toFixed(2)}%` : `${value}%`, 'Error Rate'];
                      }}
                      contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }} 
                    />
                    <Bar dataKey="value" fill="#e11d48" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResultsPanel;
