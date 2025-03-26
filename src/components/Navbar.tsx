
import React from 'react';
import Logo from './Logo';

const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="flex items-center space-x-4">
          <a 
            href="/" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Home
          </a>
          <a 
            href="#features" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Features
          </a>
          <a 
            href="#documentation" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Docs
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
