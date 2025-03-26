
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TestForm from '../components/TestForm';
import ResultsPanel from '../components/ResultsPanel';
import Features from '../components/Features';
import Footer from '../components/Footer';
import { TestConfig } from '../components/TestForm';
import { toast } from "sonner";
import { Play } from 'lucide-react';

const Index = () => {
  const [testStarted, setTestStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  
  const handleStartTest = (config: TestConfig) => {
    setIsLoading(true);
    setTestConfig(config);
    
    // Simulate API call for the test
    toast.loading("Running performance test...", {
      id: "test-running",
    });
    
    setTimeout(() => {
      setIsLoading(false);
      setTestStarted(true);
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
    }, 3000);
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
              <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
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
              
              {testConfig && <ResultsPanel testConfig={testConfig} isVisible={testStarted} />}
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
