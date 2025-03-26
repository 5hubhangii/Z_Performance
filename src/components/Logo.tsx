
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8 overflow-hidden">
        <img 
          src="/lovable-uploads/c8dbf9ab-6e4a-450b-b202-bd9b5568f5f5.png" 
          alt="ZPerformance Logo" 
          className="w-full h-full object-contain"
        />
      </div>
      <span className="font-semibold text-xl tracking-tight">ZPerformance</span>
    </div>
  );
};

export default Logo;
