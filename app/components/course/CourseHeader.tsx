// components/course/CourseHeader.tsx
"use client";

import React from 'react';
import { 
  Play, 
  FileText, 
  Zap, 
  BarChart3, 
  Menu,
  StickyNote
} from 'lucide-react';
import { Lesson } from '../../../lib/types/course';

interface CourseHeaderProps {
  selectedLesson: Lesson | null;
  activeView: 'content' | 'analytics';
  rightSidebarOpen: boolean;
  onLeftSidebarToggle: () => void;
  onRightSidebarToggle: () => void;
  texts: {
    myuniNotes: string;
    showNotes: string;
    hideNotes: string;
    myuniAnalytics?: string;
    overview?: string;
    completed?: string;
    myuniVideo?: string;
    myuniQuick?: string;
    mixed?: string;
  };
}

export default function CourseHeader({
  selectedLesson,
  activeView,
  rightSidebarOpen,
  onLeftSidebarToggle,
  onRightSidebarToggle,
  texts
}: CourseHeaderProps) {
  
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'notes': return <FileText className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'quick': return <Zap className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'mixed': return <div className="flex space-x-1"><Play className="w-3 h-3 sm:w-4 sm:h-4" /><FileText className="w-3 h-3 sm:w-4 sm:h-4" /></div>;
      default: return <Play className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return texts.myuniVideo || 'Video';
      case 'notes': return texts.myuniNotes;
      case 'quick': return texts.myuniQuick || 'Quick';
      case 'mixed': return texts.mixed || 'Mixed';
      default: return type;
    }
  };

  return (
    <div className="border-b border-slate-200/60 dark:border-neutral-700 p-3 sm:p-4 lg:p-6 bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0 flex-1">
          {/* Desktop Left Sidebar Toggle */}
          <button 
            onClick={onLeftSidebarToggle}
            className="hidden lg:block p-1.5 lg:p-2 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-md transition-colors flex-shrink-0"
            aria-label="Toggle course content"
          >
            <Menu className="w-4 h-4 lg:w-5 lg:h-5 text-slate-600 dark:text-neutral-400" />
          </button>

          {/* Mobile/Tablet Left Sidebar Toggle */}
          <button 
            onClick={onLeftSidebarToggle}
            className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-md transition-colors lg:hidden flex-shrink-0"
            aria-label="Toggle course content"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-neutral-400" />
          </button>
          
          {/* Content Info */}
          <div className="min-w-0 flex-1">
            {selectedLesson ? (
              <div className="min-w-0">
                {/* Content type and lesson title */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className="text-slate-600 dark:text-neutral-400">
                      {getContentIcon(selectedLesson.type)}
                    </div>
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 whitespace-nowrap">
                      {getContentTypeLabel(selectedLesson.type)}
                    </span>
                  </div>
                  
                </div>
              </div>
            ) : activeView === 'analytics' ? (
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-neutral-400 flex-shrink-0" />
                <h2 className="text-sm sm:text-base lg:text-lg font-medium text-slate-900 dark:text-neutral-100 truncate">
                  {texts.myuniAnalytics || 'Analytics'}
                </h2>
              </div>
            ) : (
              <h2 className="text-sm sm:text-base lg:text-lg font-medium text-slate-900 dark:text-neutral-100 truncate">
                {texts.overview || 'Overview'}
              </h2>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
          {/* Lesson Info - Hidden on mobile, responsive on larger screens */}
          {selectedLesson && (
            <div className="hidden md:flex items-center space-x-2">
              
              {selectedLesson.isCompleted && (
                <div className="px-2 sm:px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap">
                  <span className="hidden lg:inline">{texts.completed || 'Completed'}</span>
                  <span className="lg:hidden">✓</span>
                </div>
              )}
            </div>
          )}

          {/* Right Sidebar Toggle - Notes */}
          {selectedLesson && activeView === 'content' && (
            <button 
              onClick={onRightSidebarToggle}
              className={`p-1.5 sm:p-2 rounded-md transition-colors flex-shrink-0 ${
                rightSidebarOpen 
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                  : 'hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400'
              }`}
              aria-label={rightSidebarOpen ? texts.hideNotes : texts.showNotes}
              title={rightSidebarOpen ? texts.hideNotes : texts.showNotes}
            >
              <StickyNote className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      
    </div>
  );
}