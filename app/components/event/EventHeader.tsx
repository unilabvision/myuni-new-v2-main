// components/event/EventHeader.tsx
"use client";

import React from 'react';
import { 
  Play, 
  FileText, 
  Users, 
  BarChart3, 
  Menu,
  StickyNote,
  Calendar,
  Clock,
  Video,
  MapPin,
  Globe,
  Zap
} from 'lucide-react';

// Local EventSession interface that matches our EventWatchPage
interface EventSession {
  id: string;
  title: string;
  type: "workshop" | "video" | "presentation" | "discussion" | "break" | "networking";
  duration: string;
  speaker?: string;
  isCompleted: boolean;
  order: number;
}

interface EventHeaderProps {
  selectedSession: EventSession | null;
  activeView: 'content' | 'analytics';
  rightSidebarOpen: boolean;
  onLeftSidebarToggle: () => void;
  onRightSidebarToggle: () => void;
  eventStatus?: 'upcoming' | 'live' | 'ended';
  eventType?: 'online' | 'physical' | 'hybrid';
  texts: {
    myuniNotes: string;
    showNotes: string;
    hideNotes: string;
    myuniAnalytics?: string;
    overview?: string;
    completed?: string;
    live?: string;
    upcoming?: string;
    ended?: string;
    session?: string;
    speaker?: string;
    duration?: string;
    participants?: string;
    myuniVideo?: string;
    myuniQuick?: string;
    mixed?: string;
  };
}

export default function EventHeader({
  selectedSession,
  activeView,
  rightSidebarOpen,
  onLeftSidebarToggle,
  onRightSidebarToggle,
  eventStatus = 'upcoming',
  eventType = 'online',
  texts
}: EventHeaderProps) {
  
  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'presentation': return <Play className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'workshop': return <Users className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'discussion': return <FileText className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'break': return <Clock className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'networking': return <Users className="w-4 h-4 sm:w-5 sm:h-5" />;
      default: return <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return texts.myuniVideo || 'Video';
      case 'presentation': return 'Sunum';
      case 'workshop': return 'Atölye';
      case 'discussion': return texts.myuniQuick || 'Quiz';
      case 'break': return 'Ara';
      case 'networking': return 'Networking';
      default: return texts.session || 'Oturum';
    }
  };

  const getEventStatusInfo = () => {
    switch (eventStatus) {
      case 'live':
        return {
          color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
          label: texts.live || 'CANLI',
          icon: <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        };
      case 'upcoming':
        return {
          color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
          label: texts.upcoming || 'YAKINDA',
          icon: <Clock className="w-3 h-3" />
        };
      case 'ended':
        return {
          color: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20',
          label: texts.ended || 'BİTTİ',
          icon: <Calendar className="w-3 h-3" />
        };
      default:
        return null;
    }
  };

  const getEventTypeIcon = () => {
    switch (eventType) {
      case 'online':
        return <Globe className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'physical':
        return <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'hybrid':
        return <Video className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <Globe className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  const statusInfo = getEventStatusInfo();

  return (
    <div className="border-b border-slate-200/60 dark:border-neutral-700 p-3 sm:p-4 lg:p-6 bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0 flex-1">
          {/* Desktop Left Sidebar Toggle */}
          <button 
            onClick={onLeftSidebarToggle}
            className="hidden lg:block p-1.5 lg:p-2 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-md transition-colors flex-shrink-0"
            aria-label="Toggle event content"
          >
            <Menu className="w-4 h-4 lg:w-5 lg:h-5 text-slate-600 dark:text-neutral-400" />
          </button>

          {/* Mobile/Tablet Left Sidebar Toggle */}
          <button 
            onClick={onLeftSidebarToggle}
            className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-md transition-colors lg:hidden flex-shrink-0"
            aria-label="Toggle event content"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-neutral-400" />
          </button>
          
          {/* Content Info */}
          <div className="min-w-0 flex-1">
            {selectedSession ? (
              <div className="min-w-0">
                {/* Session type and title */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className="text-slate-600 dark:text-neutral-400">
                      {getSessionIcon(selectedSession.type)}
                    </div>
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 whitespace-nowrap">
                      {getSessionTypeLabel(selectedSession.type)}
                    </span>
                  </div>
                </div>
                
                {/* Session title - Only on larger screens */}
                <div className="hidden sm:block mt-1">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-neutral-100 truncate">
                    {selectedSession.title}
                  </h3>
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
                {texts.overview || 'Etkinlik Genel Bakış'}
              </h2>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
          {/* Event Type Icon */}
          <div className="hidden sm:flex items-center text-slate-500 dark:text-neutral-400 flex-shrink-0">
            {getEventTypeIcon()}
          </div>

          {/* Event Status */}
          {statusInfo && (
            <div className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap flex items-center space-x-1 ${statusInfo.color}`}>
              {statusInfo.icon}
              <span className="hidden sm:inline">{statusInfo.label}</span>
              <span className="sm:hidden">
                {statusInfo.label}
              </span>
            </div>
          )}

          {/* Session Info - Hidden on mobile, responsive on larger screens */}
          {selectedSession && (
            <div className="hidden md:flex items-center space-x-2">
              {/* Speaker info */}
              {selectedSession.speaker && (
                <div className="text-xs text-slate-500 dark:text-neutral-400 whitespace-nowrap">
                  <span className="hidden lg:inline">{texts.speaker || 'Konuşmacı'}: </span>
                  {selectedSession.speaker}
                </div>
              )}

              {/* Duration */}
              {selectedSession.duration && (
                <div className="text-xs text-slate-500 dark:text-neutral-400 whitespace-nowrap flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{selectedSession.duration}</span>
                </div>
              )}

              {/* Session completion status */}
              {selectedSession.isCompleted && (
                <div className="px-2 sm:px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap">
                  <span className="hidden lg:inline">{texts.completed || 'Tamamlandı'}</span>
                  <span className="lg:hidden">✓</span>
                </div>
              )}
            </div>
          )}

          {/* Right Sidebar Toggle - Notes */}
          {selectedSession && activeView === 'content' && (
            <button 
              onClick={onRightSidebarToggle}
              className={`p-1.5 sm:p-2 rounded-md transition-colors flex-shrink-0 ${
                rightSidebarOpen 
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
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