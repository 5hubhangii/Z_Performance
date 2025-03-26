
import React from 'react';
import { CheckCircle } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      title: 'Load Testing',
      description: 'Measure how your system performs under expected load conditions.',
      items: ['Response Time Analysis', 'Server Resource Monitoring', 'Bottleneck Identification']
    },
    {
      title: 'Endurance Testing',
      description: 'Evaluate system behavior during sustained periods of activity.',
      items: ['Memory Leak Detection', 'Long-term Performance', 'System Stability Analysis']
    },
    {
      title: 'Stress Testing',
      description: 'Push your system beyond normal operating capacity to identify breaking points.',
      items: ['Peak Load Handling', 'Recovery Time Measurement', 'Error Handling Verification']
    },
    {
      title: 'Comprehensive Reports',
      description: 'Get detailed insights on your application\'s performance.',
      items: ['Visual Data Representation', 'Exportable Results', 'Trend Analysis']
    }
  ];

  return (
    <section id="features" className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Powerful Testing Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive suite of performance testing tools helps you ensure your applications
            can handle real-world conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="rounded-lg shadow-md p-6 border border-border/40 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground mb-6">{feature.description}</p>
              <ul className="space-y-2">
                {feature.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
