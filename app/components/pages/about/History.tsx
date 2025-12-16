// app/components/pages/about/History.tsx
'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryItem {
  year: string;
  title: string;
  description: string;
}

interface HistoryProps {
  title: string;
  history: HistoryItem[];
}

const History: React.FC<HistoryProps> = ({ title, history }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const handleNext = () => {
    if (activeIndex < history.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };
  
  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  };
  
  const handleDotClick = (index: number) => {
    setActiveIndex(index);
  };
  
  return (
    <section className="py-16 sm:py-20">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-[#141414] dark:text-white">
          {title}
        </h2>
        <div className="w-12 h-px bg-[#a90013] mt-2 mb-4"></div>
      </div>
      
      {/* Timeline Navigation */}
      <div className="mb-20 relative">
        <div className="absolute h-0.5 bg-neutral-200 dark:bg-neutral-700 w-full top-4"></div>
        
        <div className="flex justify-between relative">
          {history.map((item, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`relative z-10 flex flex-col items-center transition-all duration-300 ${
                activeIndex === index 
                  ? "scale-110" 
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeIndex === index 
                    ? "bg-[#a90013] border-4 border-[#ffdee2]" 
                    : "bg-neutral-200 dark:bg-neutral-700 border-2 border-white dark:border-[#1a1a1a] hover:bg-[#a90013]/20"
                }`}
              >
                <span 
                  className={`text-xs font-bold ${
                    activeIndex === index 
                      ? "text-white" 
                      : "text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  {index + 1}
                </span>
              </div>
              <div 
                className={`absolute top-12 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  activeIndex === index 
                    ? "opacity-100 text-[#a90013] dark:text-[#ffdee2]" 
                    : "opacity-0 group-hover:opacity-100 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {item.year}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Content Display with Navigation Arrows */}
      <div className="flex gap-4">
        {/* Left Navigation Button */}
        <div className="flex items-center">
          <button 
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className={`p-3 rounded-full transition-all duration-300 ${
              activeIndex === 0 
                ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 cursor-not-allowed" 
                : "bg-white dark:bg-[#1a1a1a] text-[#a90013] hover:bg-[#a90013] hover:text-white shadow-sm hover:shadow-md"
            }`}
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="mb-6 inline-flex items-center">
            <div className="text-2xl font-bold text-[#a90013] dark:text-[#ffdee2] mr-4">
              {history[activeIndex].year}
            </div>
            <div className="h-0.5 w-12 bg-[#a90013]"></div>
          </div>
          
          <h3 className="text-2xl font-bold text-[#141414] dark:text-white mb-4">
            {history[activeIndex].title}
          </h3>
          
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {history[activeIndex].description}
          </p>
        </div>
        
        {/* Right Navigation Button */}
        <div className="flex items-center">
          <button 
            onClick={handleNext}
            disabled={activeIndex === history.length - 1}
            className={`p-3 rounded-full transition-all duration-300 ${
              activeIndex === history.length - 1 
                ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 cursor-not-allowed" 
                : "bg-white dark:bg-[#1a1a1a] text-[#a90013] hover:bg-[#a90013] hover:text-white shadow-sm hover:shadow-md"
            }`}
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Current position indicator */}
      <div className="mt-8 flex justify-center items-center space-x-2">
        {history.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeIndex === index 
                ? "bg-[#a90013] w-8" 
                : "bg-neutral-300 dark:bg-neutral-600 hover:bg-[#a90013]/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default History;