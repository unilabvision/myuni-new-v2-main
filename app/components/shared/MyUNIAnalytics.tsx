// components/shared/MyUNIAnalytics.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp, 
  Award,
  PlayCircle,
  FileText,
  Zap,
  Users,
  Calendar,
  MessageSquare
} from 'lucide-react';

import { getUserAnalytics } from '../../../lib/courseService';
import { getUserEventAnalytics } from '../../../lib/eventService';

// Define proper types for better type safety
interface AnalyticsItem {
  session_date: string;
  total_watch_time_minutes?: number;
  lessons_completed?: number;
  sessions_attended?: number;
  participation_score?: number;
}

interface ProgressItem {
  watch_time_seconds?: number;
  is_completed: boolean;
  attendance_status?: 'registered' | 'attended' | 'completed' | 'no_show';
}

interface AnalyticsData {
  totalTime: number; // dakika (kurs: izleme süresi, etkinlik: katılım süresi)
  completedItems: number; // (kurs: ders, etkinlik: oturum)
  totalItems: number;
  avgDailyTime: number; // dakika
  streak: number; // gün
  lastActive: string;
  weeklyProgress: Array<{
    day: string;
    minutes: number;
    itemsCompleted: number;
  }>;
  contentTypeProgress: {
    [key: string]: { completed: number; total: number };
  };
  // Etkinlik özel alanları
  attendanceRate?: number;
  participationScore?: number;
  networkingConnections?: number;
}

interface MyUNIAnalyticsProps {
  contentId: string; // courseId veya eventId
  userId: string;
  type: 'course' | 'event'; // İçerik tipi
  texts?: {
    myuniAnalytics?: string;
    totalWatchTime?: string;
    totalParticipationTime?: string;
    completedLessons?: string;
    completedSessions?: string;
    avgDailyTime?: string;
    currentStreak?: string;
    lastActive?: string;
    weeklyProgress?: string;
    contentProgress?: string;
    sessionProgress?: string;
    performance?: string;
    attendanceRate?: string;
    participationScore?: string;
    networkingConnections?: string;
    minutes?: string;
    hours?: string;
    days?: string;
    lessons?: string;
    sessions?: string;
    loading?: string;
    error?: string;
    achievements?: string;
    firstWeek?: string;
    weekStreak?: string;
    contentMaster?: string;
    completeMaster?: string;
    quickLearner?: string;
    activeParticipant?: string;
    networking?: string;
    discussionLeader?: string;
  };
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "neutral" | "green" | "blue" | "purple" | "red" | "yellow";
}

// Varsayılan Türkçe metinler
const defaultTexts = {
  myuniAnalytics: "MyUNI Analitik",
  totalWatchTime: "Toplam İzleme Süresi",
  totalParticipationTime: "Toplam Katılım Süresi",
  completedLessons: "Tamamlanan Dersler",
  completedSessions: "Tamamlanan Oturumlar",
  avgDailyTime: "Günlük Ortalama",
  currentStreak: "Mevcut Seri",
  lastActive: "Son Aktivite",
  weeklyProgress: "Haftalık İlerleme",
  contentProgress: "İçerik İlerlemesi",
  sessionProgress: "Oturum İlerlemesi",
  performance: "Performansınız",
  attendanceRate: "Katılım Oranı",
  participationScore: "Katılım Puanı",
  networkingConnections: "Yeni Bağlantılar",
  minutes: "dakika",
  hours: "saat",
  days: "gün",
  lessons: "ders",
  sessions: "oturum",
  loading: "Yükleniyor...",
  error: "Veri yüklenirken hata oluştu",
  achievements: "Başarılar",
  firstWeek: "İlk Hafta",
  weekStreak: "7 günlük seri",
  contentMaster: "İçerik Ustası",
  completeMaster: "10 içerik tamamla",
  quickLearner: "Hızlı Öğrenci",
  activeParticipant: "Aktif Katılımcı",
  networking: "Networking Ustası",
  discussionLeader: "Tartışma Lideri"
};

// Helper functions moved outside component to avoid recreation
const calculateStreak = (analytics: AnalyticsItem[]): number => {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < analytics.length; i++) {
    const analyticsDate = new Date(analytics[i].session_date);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (analyticsDate.toDateString() === expectedDate.toDateString()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

const generateWeeklyProgress = (analytics: AnalyticsItem[], type: 'course' | 'event') => {
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const today = new Date();
  const weeklyData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    const dayData = analytics.find(a => a.session_date === dateString);
    
    weeklyData.push({
      day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
      minutes: dayData?.total_watch_time_minutes || 0,
      itemsCompleted: type === 'course' 
        ? (dayData?.lessons_completed || 0)
        : (dayData?.sessions_attended || 0)
    });
  }

  return weeklyData;
};

const transformAnalyticsData = (
  analytics: AnalyticsItem[], 
  progress: ProgressItem[], 
  type: 'course' | 'event'
): AnalyticsData => {
  // Toplam süre hesapla
  const totalTimeMinutes = progress.reduce((acc, p) => 
    acc + Math.floor((p.watch_time_seconds || 0) / 60), 0
  );

  // Tamamlanan item sayısı
  const completedItems = progress.filter(p => 
    type === 'course' ? p.is_completed : 
    (p.attendance_status === 'attended' || p.attendance_status === 'completed')
  ).length;
  const totalItems = progress.length;

  // Günlük ortalama hesapla (son 7 günün ortalaması)
  const recentAnalytics = analytics.slice(0, 7);
  const avgDailyTime = recentAnalytics.length > 0 
    ? Math.round(recentAnalytics.reduce((acc, a) => acc + (a.total_watch_time_minutes || 0), 0) / recentAnalytics.length)
    : 0;

  // Seri hesapla
  const streak = calculateStreak(analytics);

  // Son aktivite
  const lastActive = analytics.length > 0 ? analytics[0].session_date : new Date().toISOString().split('T')[0];

  // Haftalık ilerleme
  const weeklyProgress = generateWeeklyProgress(analytics, type);

  // İçerik tipine göre ilerleme
  let contentTypeProgress: { [key: string]: { completed: number; total: number } };
  
  if (type === 'course') {
    contentTypeProgress = {
      videos: { completed: Math.floor(completedItems * 0.6), total: Math.floor(totalItems * 0.6) },
      notes: { completed: Math.floor(completedItems * 0.25), total: Math.floor(totalItems * 0.25) },
      quicks: { completed: Math.floor(completedItems * 0.15), total: Math.floor(totalItems * 0.15) }
    };
  } else {
    contentTypeProgress = {
      presentations: { completed: Math.floor(completedItems * 0.4), total: Math.floor(totalItems * 0.4) },
      workshops: { completed: Math.floor(completedItems * 0.3), total: Math.floor(totalItems * 0.3) },
      discussions: { completed: Math.floor(completedItems * 0.2), total: Math.floor(totalItems * 0.2) },
      networking: { completed: Math.floor(completedItems * 0.1), total: Math.floor(totalItems * 0.1) }
    };
  }

  const baseData: AnalyticsData = {
    totalTime: totalTimeMinutes,
    completedItems,
    totalItems,
    avgDailyTime,
    streak,
    lastActive,
    weeklyProgress,
    contentTypeProgress
  };

  // Etkinlik özel veriler
  if (type === 'event') {
    const attendanceRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    const participationScore = analytics.reduce((acc, a) => acc + (a.participation_score || 0), 0) / analytics.length || 0;
    
    return {
      ...baseData,
      attendanceRate: Math.round(attendanceRate),
      participationScore: Math.round(participationScore),
      networkingConnections: Math.floor(Math.random() * 15) + 5 // Placeholder
    };
  }

  return baseData;
};

export default function MyUNIAnalytics({ 
  contentId, 
  userId, 
  type,
  texts = {} 
}: MyUNIAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Metinleri birleştir
  const t = { ...defaultTexts, ...texts };

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let analytics, progress;
      
      if (type === 'course') {
        const result = await getUserAnalytics(userId, contentId);
        analytics = result.analytics;
        progress = result.progress;
      } else {
        const result = await getUserEventAnalytics(userId, contentId);
        analytics = result.analytics;
        progress = result.progress;
      }
      
      const transformedData = transformAnalyticsData(analytics, progress, type);
      setAnalyticsData(transformedData);

    } catch (err) {
      console.error('Analitik veri çekme hatası:', err);
      setError('Analitik veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [userId, contentId, type]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color = "neutral" 
  }: StatCardProps) => {
    const colorClasses = {
      neutral: "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400",
      green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
      blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
      purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
      red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
      yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
    };

    return (
      <div className="p-4 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 transition-all duration-200 ease-in-out hover:shadow-sm hover:bg-opacity-95">
        <div className="flex items-center space-x-3 mb-3">
          <div className={`p-2 rounded ${colorClasses[color]} transition-transform duration-200 ease-in-out group-hover:scale-105`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
            {title}
          </h3>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  };

  const getContentTypeIcon = (contentType: string) => {
    const iconMap = {
      // Kurs tipleri
      videos: PlayCircle,
      notes: FileText,
      quicks: Zap,
      // Etkinlik tipleri
      presentations: PlayCircle,
      workshops: Users,
      discussions: MessageSquare,
      networking: Users
    };
    return iconMap[contentType as keyof typeof iconMap] || FileText;
  };

  const getContentTypeLabel = (contentType: string) => {
    const labelMap = {
      // Kurs tipleri
      videos: 'Videolar',
      notes: 'Notlar',
      quicks: 'Hızlı Öğrenme',
      // Etkinlik tipleri
      presentations: 'Sunumlar',
      workshops: 'Atölyeler',
      discussions: 'Tartışmalar',
      networking: 'Networking'
    };
    return labelMap[contentType as keyof typeof labelMap] || contentType;
  };

  const getContentTypeColor = (contentType: string) => {
    const colorMap = {
      // Kurs tipleri
      videos: 'blue',
      notes: 'green',
      quicks: 'purple',
      // Etkinlik tipleri
      presentations: 'blue',
      workshops: 'green',
      discussions: 'purple',
      networking: 'yellow'
    };
    return colorMap[contentType as keyof typeof colorMap] || 'neutral';
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-6 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto mb-4"></div>
          <p className="text-sm text-neutral-500">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="h-full overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <p className="text-red-600 dark:text-red-400">{error || t.error}</p>
        </div>
      </div>
    );
  }

  const completionRate = analyticsData.totalItems > 0 
    ? Math.round((analyticsData.completedItems / analyticsData.totalItems) * 100) 
    : 0;
  const hoursWatched = Math.floor(analyticsData.totalTime / 60);
  const minutesWatched = analyticsData.totalTime % 60;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Başlık */}
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="w-6 h-6 text-neutral-600 dark:text-neutral-400 transition-transform duration-200 ease-in-out hover:scale-105" />
        <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">
          {t.performance}
        </h2>
      </div>

      {/* Ana İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          title={type === 'course' ? t.totalWatchTime : t.totalParticipationTime}
          value={`${hoursWatched}s ${minutesWatched}dk`}
          subtitle={`Toplam ${analyticsData.totalTime} ${t.minutes}`}
          color="blue"
        />
        
        <StatCard
          icon={Target}
          title={type === 'course' ? t.completedLessons : t.completedSessions}
          value={`${analyticsData.completedItems}/${analyticsData.totalItems}`}
          subtitle={`%${completionRate} tamamlandı`}
          color="green"
        />
        
        <StatCard
          icon={TrendingUp}
          title={t.avgDailyTime}
          value={`${analyticsData.avgDailyTime}dk`}
          subtitle="Günlük ortalama"
          color="purple"
        />
        
        <StatCard
          icon={Award}
          title={t.currentStreak}
          value={`${analyticsData.streak}`}
          subtitle={`${analyticsData.streak} ${t.days} üst üste`}
          color="green"
        />
      </div>

      {/* Etkinlik özel istatistikler */}
      {type === 'event' && analyticsData.attendanceRate !== undefined && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Users}
            title={t.attendanceRate}
            value={`%${analyticsData.attendanceRate}`}
            subtitle="Katılım oranınız"
            color="blue"
          />
          
          <StatCard
            icon={MessageSquare}
            title={t.participationScore}
            value={`${analyticsData.participationScore}/100`}
            subtitle="Katılım puanınız"
            color="purple"
          />
          
          <StatCard
            icon={Users}
            title={t.networkingConnections}
            value={`${analyticsData.networkingConnections}`}
            subtitle="Yeni bağlantılar"
            color="yellow"
          />
        </div>
      )}

      {/* İlerleme Özeti */}
      <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-6 transition-all duration-200 ease-in-out hover:shadow-sm hover:bg-opacity-95">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">
          {type === 'course' ? 'Kurs İlerlemesi' : 'Etkinlik İlerlemesi'}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Genel Tamamlanma</span>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">%{completionRate}</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 overflow-hidden transition-all duration-200 ease-in-out hover:shadow-sm">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-300 ease-in-out hover:scale-x-102"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* İçerik Tipi İlerlemesi */}
      <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-6 transition-all duration-200 ease-in-out hover:shadow-sm hover:bg-opacity-95">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">
          {type === 'course' ? t.contentProgress : t.sessionProgress}
        </h3>
        <div className="space-y-4">
          {Object.entries(analyticsData.contentTypeProgress).map(([contentType, data]) => {
            const Icon = getContentTypeIcon(contentType);
            const label = getContentTypeLabel(contentType);
            const colorClass = getContentTypeColor(contentType);
            
            return (
              <div key={contentType} className="flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ease-in-out group-hover:scale-105 ${
                    colorClass === 'blue' ? 'text-blue-600' :
                    colorClass === 'green' ? 'text-green-600' :
                    colorClass === 'purple' ? 'text-purple-600' :
                    colorClass === 'yellow' ? 'text-yellow-600' : 'text-neutral-600'
                  }`} />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-neutral-900 dark:text-neutral-100">
                    {data.completed}/{data.total}
                  </span>
                  <div className="w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden transition-all duration-200 ease-in-out hover:shadow-sm">
                    <div 
                      className={`h-2 rounded-full transition-all duration-200 ease-in-out group-hover:scale-x-102 ${
                        colorClass === 'blue' ? 'bg-blue-600' :
                        colorClass === 'green' ? 'bg-green-600' :
                        colorClass === 'purple' ? 'bg-purple-600' :
                        colorClass === 'yellow' ? 'bg-yellow-600' : 'bg-neutral-600'
                      }`}
                      style={{ 
                        width: `${data.total > 0 ? (data.completed / data.total) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Haftalık Aktivite */}
      <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-6 transition-all duration-200 ease-in-out hover:shadow-sm hover:bg-opacity-95">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">
          {t.weeklyProgress}
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {analyticsData.weeklyProgress.map((day, index) => (
            <div key={index} className="text-center group">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                {day.day}
              </div>
              <div 
                className="bg-neutral-100 dark:bg-neutral-700 rounded p-2 mb-1 transition-all duration-200 ease-in-out group-hover:-translate-y-0.5 group-hover:shadow-sm group-hover:bg-opacity-90"
                style={{
                  backgroundColor: day.minutes > 0 
                    ? `rgba(34, 197, 94, ${Math.min(day.minutes / 90, 1)})` 
                    : undefined
                }}
              >
                <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                  {day.minutes}dk
                </div>
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {day.itemsCompleted} {type === 'course' ? t.lessons : t.sessions}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Başarılar */}
      <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-6 transition-all duration-200 ease-in-out hover:shadow-sm hover:bg-opacity-95">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">
          {t.achievements}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`text-center p-4 rounded border transition-all duration-200 ease-in-out hover:shadow-sm hover:bg-opacity-90 ${
            analyticsData.streak >= 7 
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-neutral-50 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600 opacity-50'
          }`}>
            <Award className={`w-8 h-8 mx-auto mb-2 transition-transform duration-200 ease-in-out hover:scale-105 ${
              analyticsData.streak >= 7 ? 'text-yellow-600' : 'text-neutral-400'
            }`} />
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{t.firstWeek}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.weekStreak}</p>
          </div>
          
          <div className={`text-center p-4 rounded border transition-all duration-200 ease-in-out hover:shadow-sm hover:bg-opacity-90 ${
            analyticsData.completedItems >= 10 
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              : 'bg-neutral-50 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600 opacity-50'
          }`}>
            <PlayCircle className={`w-8 h-8 mx-auto mb-2 transition-transform duration-200 ease-in-out hover:scale-105 ${
              analyticsData.completedItems >= 10 ? 'text-blue-600' : 'text-neutral-400'
            }`} />
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{t.contentMaster}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.completeMaster}</p>
          </div>
          
          <div className={`text-center p-4 rounded border transition-all duration-200 ease-in-out hover:shadow-sm hover:bg-opacity-90 ${
            (type === 'course' && analyticsData.contentTypeProgress.quicks?.completed >= 5) ||
            (type === 'event' && analyticsData.participationScore && analyticsData.participationScore >= 80)
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
              : 'bg-neutral-50 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600 opacity-50'
          }`}>
            {type === 'course' ? (
              <Zap className={`w-8 h-8 mx-auto mb-2 transition-transform duration-200 ease-in-out hover:scale-105 ${
                analyticsData.contentTypeProgress.quicks?.completed >= 5 ? 'text-purple-600' : 'text-neutral-400'
              }`} />
            ) : (
              <MessageSquare className={`w-8 h-8 mx-auto mb-2 transition-transform duration-200 ease-in-out hover:scale-105 ${
                analyticsData.participationScore && analyticsData.participationScore >= 80 ? 'text-purple-600' : 'text-neutral-400'
              }`} />
            )}
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {type === 'course' ? t.quickLearner : t.activeParticipant}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {type === 'course' ? '5 hızlı öğrenme tamamla' : '80+ katılım puanı'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}