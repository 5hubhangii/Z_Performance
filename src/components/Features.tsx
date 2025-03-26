
import React from 'react';
import { Gauge, LineChart, Clock, Server, BarChart3, Link2 } from 'lucide-react';

const featureItems = [
  {
    icon: <Gauge className="h-8 w-8 text-orange-500" />,
    title: 'Load Testing',
    description: 'Evaluate how your application performs under normal and peak load conditions.'
  },
  {
    icon: <Clock className="h-8 w-8 text-orange-500" />,
    title: 'Endurance Testing',
    description: 'Test system behavior over extended periods under sustained load.'
  },
  {
    icon: <Server className="h-8 w-8 text-orange-500" />,
    title: 'Stress Testing',
    description: 'Push your application to its limits to determine breaking points and recovery.'
  },
  {
    icon: <LineChart className="h-8 w-8 text-orange-500" />,
    title: 'Detailed Metrics',
    description: 'Measure page load time, response latency, throughput, and error rates.'
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-orange-500" />,
    title: 'Visual Analytics',
    description: 'Interpret results through intuitive charts and comprehensive reports.'
  },
  {
    icon: <Link2 className="h-8 w-8 text-orange-500" />,
    title: 'API Testing',
    description: 'Specialized testing for RESTful APIs and microservices architectures.'
  }
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Comprehensive Testing Suite</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our platform provides everything you need to ensure your applications perform 
            under any conditions, with detailed metrics and actionable insights.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureItems.map((feature, index) => (
            <div 
              key={index} 
              className="card-hover glass-panel rounded-xl p-6 flex flex-col"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="rounded-full bg-orange-100 p-3 w-fit mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
