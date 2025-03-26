
import React from 'react';
import { ArrowDown } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative w-full h-[40vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIHN0cm9rZT0iI2Y5NzMxNjIwIiBzdHJva2Utd2lkdGg9IjEiIGN4PSIxMCIgY3k9IjEwIiByPSIzIi8+PC9nPjwvc3ZnPg==')]"></div>
      </div>
      
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-700 via-orange-500 to-orange-600">
        ZPerformance
      </h1>
      <p className="text-lg md:text-xl text-gray-700 max-w-2xl mb-8">
        Comprehensive performance testing for web applications and APIs. 
        Analyze load times, latency, and more with intuitive visualizations.
      </p>
      
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
        <p className="text-sm text-gray-500 mb-1">Scroll Down</p>
        <ArrowDown className="h-4 w-4 text-orange-500" />
      </div>
    </div>
  );
};

export default Hero;
