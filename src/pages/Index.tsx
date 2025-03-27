
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TestForm from '../components/TestForm';
import ResultsPanel from '../components/ResultsPanel';
import Features from '../components/Features';
import Footer from '../components/Footer';
import { TestConfig } from '../components/TestForm';
import { toast } from "sonner";
import { Play, AlertCircle } from 'lucide-react';
import { runPerformanceTest, PerformanceMetrics } from '../services/performanceService';

const Index = () => {
  const [testStarted, setTestStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | undefined>(undefined);
  const [testError, setTestError] = useState<string | null>(null);
  
  useEffect(() => {
    // Cleanup timer on component unmount
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);
  
  const handleStartTest = async (config: TestConfig) => {
    setIsLoading(true);
    setTestConfig(config);
    setTimeRemaining(config.duration);
    setTestError(null);
    
    // Notify user that test is starting
    toast.loading(`Running performance test for ${config.duration} seconds...`, {
      id: "test-running",
    });
    
    try {
      console.log('Starting performance test for:', config.url);
      
      // Run the performance test
      const metrics = await runPerformanceTest(config);
      console.log('Test completed successfully, metrics:', metrics);
      setPerformanceMetrics(metrics);
      
      // Set up a timer that updates every second to simulate test running time
      const intervalId = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            // Time is up, clear interval and finish test
            clearInterval(intervalId);
            completeTest(config);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setTimer(intervalId);
    } catch (error: any) {
      console.error('Error running test:', error);
      const errorMessage = error?.message || "Failed to run performance test";
      setTestError(errorMessage);
      
      toast.error("Test failed", {
        id: "test-running",
        description: errorMessage,
      });
      
      setIsLoading(false);
      setTestStarted(false);
    }
  };
  
  const completeTest = (config: TestConfig) => {
    setIsLoading(false);
    setTestStarted(true);
    setTimer(null);
    
    toast.success("Test completed successfully", {
      id: "test-running",
      description: `${config.testType} test for ${config.url} completed`,
    });
    
    // Scroll to results
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <Hero />
      
      <section id="test-form" className="py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Start Testing Your Application</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enter your website URL or API endpoint to begin testing. 
              Configure test parameters to match your specific requirements.
            </p>
          </div>
          
          <TestForm onStartTest={handleStartTest} />
        </div>
      </section>
      
      <section id="results" className="py-16 bg-gradient-to-b from-white to-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-t-orange-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-lg font-medium">Running performance test...</p>
              {timeRemaining !== null && (
                <p className="text-sm text-orange-500 font-medium mt-2">
                  Time remaining: {timeRemaining} seconds
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">Please wait while we analyze the results</p>
            </div>
          ) : testError ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-4">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-2xl font-medium mb-2">Test Failed</h3>
              <p className="text-muted-foreground max-w-lg mb-4">
                {testError}
              </p>
              <p className="text-muted-foreground max-w-lg">
                Please try a different URL or check that the site allows cross-origin requests.
              </p>
            </div>
          ) : !testStarted ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-4">
              <Play className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-2xl font-medium mb-2">Ready to start testing</h3>
              <p className="text-muted-foreground max-w-lg">
                Enter your URL and configure test parameters above, then click "Start Test" to begin 
                analyzing your application's performance.
              </p>
            </div>
          ) : (
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Test Results</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Detailed analysis of your application's performance under the specified conditions.
                </p>
              </div>
              
              {testConfig && (
                <ResultsPanel 
                  testConfig={testConfig} 
                  isVisible={testStarted} 
                  metrics={performanceMetrics}
                />
              )}
            </div>
          )}
        </div>
      </section>
      
      <Features />
      
      <Footer />
    </div>
  );
};

export default Index;
