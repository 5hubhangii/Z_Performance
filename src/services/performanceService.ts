
import { TestConfig } from '../components/TestForm';

// Performance metrics interface based on Lighthouse data structure
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

/**
 * Run a performance test using Google PageSpeed Insights API (Lighthouse)
 */
export const runPerformanceTest = async (config: TestConfig): Promise<PerformanceMetrics> => {
  try {
    const { url, testType } = config;
    
    // PageSpeed Insights API endpoint with Lighthouse data
    const apiKey = 'AIzaSyDmwQHHKW5X4zTVytDaTkRKVh-eJFzHzZ0'; // This is a public API key for PageSpeed Insights
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}`;
    
    console.log(`Running ${testType} test for ${url}...`);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('API Error:', data);
      throw new Error(data.error?.message || 'Failed to fetch performance data');
    }
    
    // Process and transform Lighthouse data
    return processLighthouseData(data, config);
  } catch (error) {
    console.error('Error running performance test:', error);
    throw error;
  }
};

/**
 * Process raw Lighthouse data into our application's format
 */
const processLighthouseData = (data: any, config: TestConfig): PerformanceMetrics => {
  const { testType, duration, users } = config;
  
  // Extract audit data from Lighthouse results
  const audits = data.lighthouseResult?.audits || {};
  const categories = data.lighthouseResult?.categories || {};
  
  // Extract timing metrics
  const ttfb = audits['server-response-time']?.numericValue || 0;
  const fcp = audits['first-contentful-paint']?.numericValue || 0;
  const lcp = audits['largest-contentful-paint']?.numericValue || 0;
  const totalBlockingTime = audits['total-blocking-time']?.numericValue || 0;
  const speedIndex = audits['speed-index']?.numericValue || 0;
  
  // Calculate overall performance score (0-100)
  const overallScore = Math.round((categories.performance?.score || 0) * 100);
  
  // Generate time series data (we'll simulate this based on Lighthouse snapshots)
  // In a real backend, you'd run tests multiple times or use a test that provides time series data
  const timePoints = Math.min(duration, 20);
  const loadTimeData = generateTimeSeriesData(timePoints, fcp, lcp);
  const latencyData = generateTimeSeriesData(timePoints, ttfb, ttfb * 1.5);
  
  // Estimate error rate from performance score (just an approximation)
  const estimatedErrorRate = Math.max(0, (100 - overallScore) / 20);
  const errorRateData = generateTimeSeriesData(timePoints, estimatedErrorRate * 0.8, estimatedErrorRate * 1.2);
  
  // Estimate requests per second based on resources
  const resourceCount = data.lighthouseResult?.audits['resource-summary']?.details?.items?.reduce(
    (sum: number, item: any) => sum + (item.requestCount || 0), 0) || 10;
  const estimatedRps = resourceCount / (lcp / 1000);
  const rpsData = generateTimeSeriesData(timePoints, estimatedRps * 0.8, estimatedRps * 1.2);
  
  // Create status code distribution (approximate from Lighthouse data)
  const statusCodes = [
    { name: '200', value: 95 - estimatedErrorRate },
    { name: '301', value: 3 },
    { name: '404', value: estimatedErrorRate / 3 },
    { name: '500', value: estimatedErrorRate * 2 / 3 },
    { name: 'Other', value: 2 }
  ];
  
  // Create performance scores
  const performanceScores = {
    overall: overallScore,
    ttfb: Math.min(100, Math.max(0, 100 - ttfb / 10)),
    fcp: Math.min(100, Math.max(0, 100 - fcp / 50)),
    lcp: Math.min(100, Math.max(0, 100 - lcp / 100)),
    ttl: Math.min(100, Math.max(0, 100 - totalBlockingTime / 30))
  };
  
  // Summary data
  const summary = {
    avgLoadTime: (lcp).toFixed(2),
    avgLatency: (ttfb).toFixed(2),
    peakRps: estimatedRps.toFixed(2),
    totalRequests: Math.floor(estimatedRps * duration),
    errorRate: estimatedErrorRate.toFixed(2),
    successRate: (100 - estimatedErrorRate).toFixed(2)
  };
  
  return {
    loadTime: loadTimeData,
    latency: latencyData,
    errorRate: errorRateData,
    requestsPerSecond: rpsData,
    statusCodes,
    performanceScores,
    summary
  };
};

/**
 * Generate time series data for charts
 */
const generateTimeSeriesData = (
  points: number, 
  minValue: number, 
  maxValue: number
): number[] => {
  const data = [];
  
  for (let i = 0; i < points; i++) {
    // Some randomness but trending generally upward to simulate load
    const progress = i / points;
    const base = minValue + (maxValue - minValue) * progress;
    const jitter = (maxValue - minValue) * 0.2 * (Math.random() - 0.5);
    data.push(base + jitter);
  }
  
  return data;
};
