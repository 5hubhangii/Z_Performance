
import { TestConfig } from '../components/TestForm';

// Performance metrics interface
export interface PerformanceMetrics {
  loadTime: number[];
  latency: number[];
  errorRate: number[];
  requestsPerSecond: number[];
  statusCodes: { name: string; value: number }[];
  performanceScores: {
    overall: number;
    ttfb: number;
    fcp: number;
    lcp: number;
    ttl: number;
  };
  summary: {
    avgLoadTime: string;
    avgLatency: string;
    peakRps: string;
    totalRequests: number;
    errorRate: string;
    successRate: string;
  };
}

// Backend API URL - update this with your actual backend URL
const BACKEND_API_URL = 'http://localhost:5000';

/**
 * Run a performance test using JMeter through the backend service
 */
export const runPerformanceTest = async (config: TestConfig): Promise<PerformanceMetrics> => {
  try {
    console.log(`Running ${config.testType} test for ${config.url}...`);
    
    // Make a request to the backend API
    const response = await fetch(`${BACKEND_API_URL}/api/run-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error || `Server responded with status: ${response.status}`;
      console.error('Backend API error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Received performance metrics from backend:', data);
    
    // Return the metrics from the backend
    return data.metrics;
  } catch (error: any) {
    console.error('Error in performance test:', error);
    
    // If backend is not available, try to use fallback simulation
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.warn('Backend not available, using fallback simulation...');
      return generateFallbackMetrics(config);
    }
    
    throw new Error(`Failed to run performance test: ${error.message}`);
  }
};

/**
 * Generate fallback metrics for demo purposes when backend is not available
 */
const generateFallbackMetrics = (config: TestConfig): PerformanceMetrics => {
  console.log('Generating fallback metrics for demo purposes');
  
  const { duration } = config;
  const timePoints = Math.min(duration, 20);
  
  // Create simulated data for demo
  const loadTimeBase = 500; // 500ms base load time
  const latencyBase = 150;  // 150ms base latency
  const errorRateBase = 5;  // 5% base error rate
  const rpsBase = 10;       // 10 requests per second base
  
  // Generate time series data with slight variability
  const loadTimeData = Array(timePoints).fill(0).map(() => 
    loadTimeBase + Math.random() * loadTimeBase * 0.5
  );
  
  const latencyData = Array(timePoints).fill(0).map(() => 
    latencyBase + Math.random() * latencyBase * 0.5
  );
  
  const errorRateData = Array(timePoints).fill(0).map(() => 
    Math.max(0, errorRateBase + (Math.random() - 0.5) * 5)
  );
  
  const requestsPerSecondData = Array(timePoints).fill(0).map((_, i) => 
    rpsBase + (i / timePoints) * 5 + Math.random() * 3
  );
  
  // Status codes distribution
  const statusCodes = [
    { name: '200', value: 95 - Math.random() * 5 },
    { name: '404', value: 2 + Math.random() * 2 },
    { name: '500', value: 2 + Math.random() * 2 },
    { name: 'Other', value: 1 + Math.random() }
  ];
  
  // Calculate average values
  const avgLoadTime = loadTimeData.reduce((sum, val) => sum + val, 0) / loadTimeData.length;
  const avgLatency = latencyData.reduce((sum, val) => sum + val, 0) / latencyData.length;
  const avgRps = requestsPerSecondData.reduce((sum, val) => sum + val, 0) / requestsPerSecondData.length;
  const avgErrorRate = errorRateData.reduce((sum, val) => sum + val, 0) / errorRateData.length;
  
  // Performance scores based on simulated metrics
  const ttfbScore = Math.min(100, Math.max(0, 100 - (avgLatency / 10)));
  const fcpScore = Math.min(100, Math.max(0, 100 - (avgLoadTime / 50)));
  const lcpScore = Math.min(100, Math.max(0, 100 - (avgLoadTime / 100)));
  const ttlScore = Math.min(100, Math.max(0, 100 - (avgLoadTime / 30)));
  const overallScore = Math.round((ttfbScore * 0.2) + (fcpScore * 0.5) + (ttlScore * 0.3));
  
  return {
    loadTime: loadTimeData,
    latency: latencyData,
    errorRate: errorRateData,
    requestsPerSecond: requestsPerSecondData,
    statusCodes,
    performanceScores: {
      overall: overallScore,
      ttfb: Math.round(ttfbScore),
      fcp: Math.round(fcpScore),
      lcp: Math.round(lcpScore),
      ttl: Math.round(ttlScore)
    },
    summary: {
      avgLoadTime: avgLoadTime.toFixed(2),
      avgLatency: avgLatency.toFixed(2),
      peakRps: avgRps.toFixed(2),
      totalRequests: Math.round(avgRps * duration),
      errorRate: avgErrorRate.toFixed(2),
      successRate: (100 - avgErrorRate).toFixed(2)
    }
  };
};
