
// This file generates mock data for our performance testing dashboard

export const generateLoadTimeData = (duration: number) => {
  const data = [];
  const points = Math.min(duration, 20); // Cap at 20 data points for cleaner charts
  
  for (let i = 0; i < points; i++) {
    data.push({
      time: (i * (duration / points)).toFixed(1),
      value: Math.random() * 1000 + 200
    });
  }
  return data;
};

export const generateLatencyData = (duration: number) => {
  const data = [];
  const points = Math.min(duration, 20);
  
  for (let i = 0; i < points; i++) {
    data.push({
      time: (i * (duration / points)).toFixed(1),
      value: Math.random() * 100 + 20
    });
  }
  return data;
};

export const generateConcurrentUsersData = (duration: number, maxUsers: number) => {
  const data = [];
  const points = Math.min(duration, 20);
  
  for (let i = 0; i < points; i++) {
    // Gradually increase users until max
    const usersPct = Math.min(1, (i + 1) / points);
    data.push({
      time: (i * (duration / points)).toFixed(1),
      value: Math.floor(usersPct * maxUsers)
    });
  }
  return data;
};

export const generateErrorRateData = (duration: number) => {
  const data = [];
  const points = Math.min(duration, 20);
  
  for (let i = 0; i < points; i++) {
    data.push({
      time: (i * (duration / points)).toFixed(1),
      value: Math.random() * 5 // Error rate as percentage
    });
  }
  return data;
};

export const generateRequestsPerSecondData = (duration: number, users: number) => {
  const data = [];
  const points = Math.min(duration, 20);
  
  for (let i = 0; i < points; i++) {
    // More users = more requests per second
    const baseRps = users * 0.2;
    const variation = Math.random() * 0.4 - 0.2; // ±20% variation
    
    data.push({
      time: (i * (duration / points)).toFixed(1),
      value: baseRps * (1 + variation)
    });
  }
  return data;
};

export const generateStatusCodeDistribution = () => {
  return [
    { name: '200', value: 85 },
    { name: '301', value: 5 },
    { name: '404', value: 3 },
    { name: '500', value: 2 },
    { name: 'Other', value: 5 }
  ];
};

export const generatePerformanceScoreData = () => {
  return {
    overall: Math.floor(Math.random() * 30 + 70), // 70-100
    ttfb: Math.floor(Math.random() * 20 + 80), // 80-100
    fcp: Math.floor(Math.random() * 30 + 70), // 70-100
    lcp: Math.floor(Math.random() * 40 + 60), // 60-100
    ttl: Math.floor(Math.random() * 20 + 80) // 80-100
  };
};

export const generateSummaryData = (testType: string, duration: number, users: number) => {
  let loadTime, rps, errorRate;
  
  switch(testType) {
    case 'load':
      loadTime = Math.random() * 300 + 200; // 200-500ms
      rps = users * 0.1 + Math.random() * 10;
      errorRate = Math.random() * 1; // 0-1%
      break;
    case 'endurance':
      loadTime = Math.random() * 600 + 300; // 300-900ms
      rps = users * 0.1 + Math.random() * 5;
      errorRate = Math.random() * 3; // 0-3%
      break;
    case 'stress':
      loadTime = Math.random() * 1500 + 500; // 500-2000ms
      rps = users * 0.05 + Math.random() * 3;
      errorRate = Math.random() * 8; // 0-8%
      break;
    default:
      loadTime = Math.random() * 500 + 300;
      rps = users * 0.1;
      errorRate = Math.random() * 2;
  }
  
  return {
    avgLoadTime: loadTime.toFixed(2),
    avgLatency: (loadTime * 0.6).toFixed(2),
    peakRps: rps.toFixed(2),
    totalRequests: Math.floor(rps * duration),
    errorRate: errorRate.toFixed(2),
    successRate: (100 - errorRate).toFixed(2)
  };
};
