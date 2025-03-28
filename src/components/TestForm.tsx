
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Play, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TestFormProps {
  onStartTest: (testConfig: TestConfig) => void;
}

export interface TestConfig {
  url: string;
  testType: 'load' | 'endurance' | 'stress';
  users: number;
  duration: number;
}

const TestForm: React.FC<TestFormProps> = ({ onStartTest }) => {
  const [url, setUrl] = useState('');
  const [testType, setTestType] = useState<'load' | 'endurance' | 'stress'>('load');
  const [users, setUsers] = useState(50);
  const [duration, setDuration] = useState(30);
  const [isApiEndpoint, setIsApiEndpoint] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setUrlError(null);
    
    try {
      // Basic URL validation
      if (newUrl && !newUrl.startsWith('http')) {
        setUrlError("URL must start with http:// or https://");
        return;
      }
      
      // Additional URL validation if not empty
      if (newUrl) {
        new URL(newUrl);
      }
      
      // Check if it looks like an API endpoint
      const isApi = newUrl.includes('/api/') || 
                    newUrl.includes('.json') || 
                    newUrl.includes('graphql') ||
                    newUrl.toLowerCase().includes('endpoint') ||
                    newUrl.toLowerCase().includes('service');
      setIsApiEndpoint(isApi);
    } catch (e) {
      if (newUrl) { // Only show error if URL is not empty
        setUrlError("Please enter a valid URL");
      }
    }
  };

  const validateUrl = (urlToTest: string): boolean => {
    try {
      new URL(urlToTest);
      
      // Make sure URL starts with http or https
      if (!urlToTest.startsWith('http')) {
        setUrlError("URL must start with http:// or https://");
        return false;
      }
      
      return true;
    } catch (e) {
      setUrlError("Please enter a valid URL");
      return false;
    }
  };

  const handleStartTest = () => {
    if (!url) {
      setUrlError("Please enter a URL");
      toast.error("Please enter a URL");
      return;
    }
    
    // URL validation
    if (!validateUrl(url)) {
      toast.error("Please enter a valid URL");
      return;
    }

    toast.info("Preparing performance test...", {
      description: `Testing ${isApiEndpoint ? 'API endpoint' : 'website'} with ${users} users for ${duration} seconds`,
      duration: 3000
    });

    onStartTest({
      url,
      testType,
      users,
      duration
    });
  };

  return (
    <div className="animate-fade-in glass-panel rounded-xl p-6 space-y-6 w-full max-w-3xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="url">Website URL or API Endpoint</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com or https://api.example.com/endpoint"
          value={url}
          onChange={handleUrlChange}
          className={`border-none bg-secondary/30 focus-visible:ring-1 focus-visible:ring-orange-500/30 ${urlError ? 'border-red-500 ring-1 ring-red-500' : ''}`}
          aria-invalid={!!urlError}
        />
        
        {urlError && (
          <Alert className="mt-2 bg-red-100 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              {urlError}
            </AlertDescription>
          </Alert>
        )}
        
        {isApiEndpoint && !urlError && (
          <Alert className="mt-2 bg-secondary/30 border-orange-200">
            <Info className="h-4 w-4 text-orange-500" />
            <AlertDescription>
              This appears to be an API endpoint. JMeter will use specialized API test configuration.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="test-type">Test Type</Label>
          <Select value={testType} onValueChange={(value: 'load' | 'endurance' | 'stress') => setTestType(value)}>
            <SelectTrigger id="test-type" className="border-none bg-secondary/30 focus:ring-1 focus:ring-orange-500/30">
              <SelectValue placeholder="Select test type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="load">Load Testing</SelectItem>
              <SelectItem value="endurance">Endurance Testing</SelectItem>
              <SelectItem value="stress">Stress Testing</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {testType === 'load' && 'Tests how the system performs under normal and peak load conditions'}
            {testType === 'endurance' && 'Tests how the system performs under sustained load over an extended period'}
            {testType === 'stress' && 'Tests the upper limits and robustness by overwhelming resources'}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="users">Virtual Users: {users}</Label>
          </div>
          <Slider
            id="users"
            min={1}
            max={500}
            step={1}
            value={[users]}
            onValueChange={(values) => setUsers(values[0])}
            className="py-4"
          />
          <p className="text-xs text-muted-foreground">
            More users will generate higher concurrent load on the target system
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="duration">Test Duration: {duration} seconds</Label>
        </div>
        <Slider
          id="duration"
          min={5}
          max={120}
          step={5}
          value={[duration]}
          onValueChange={(values) => setDuration(values[0])}
          className="py-4"
        />
        <p className="text-xs text-muted-foreground">
          Longer tests provide more accurate results but take more time to complete
        </p>
      </div>

      <Button 
        onClick={handleStartTest} 
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
      >
        <Play className="mr-2 h-4 w-4" /> Start Test
      </Button>
    </div>
  );
};

export default TestForm;
