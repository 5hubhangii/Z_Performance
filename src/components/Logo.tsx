
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-600 to-orange-400 rounded-md"></div>
        <div className="absolute inset-[2px] bg-white rounded-[4px] flex items-center justify-center">
          <div className="w-4 h-4 bg-orange-500 rounded-sm transform rotate-45"></div>
        </div>
      </div>
      <span className="font-semibold text-xl tracking-tight">ZPerformance</span>
    </div>
  );
};

export default Logo;
