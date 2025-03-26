
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Play } from "lucide-react";
import { toast } from "sonner";

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
  const [duration, setDuration] = useState(10);

  const handleStartTest = () => {
    if (!url) {
      toast.error("Please enter a valid URL");
      return;
    }
    
    // URL validation
    try {
      new URL(url);
    } catch (e) {
      toast.error("Please enter a valid URL");
      return;
    }

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
          onChange={(e) => setUrl(e.target.value)}
          className="border-none bg-secondary/30 focus-visible:ring-1 focus-visible:ring-orange-500/30"
        />
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
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="duration">Test Duration: {duration} seconds</Label>
        </div>
        <Slider
          id="duration"
          min={5}
          max={60}
          step={5}
          value={[duration]}
          onValueChange={(values) => setDuration(values[0])}
          className="py-4"
        />
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
