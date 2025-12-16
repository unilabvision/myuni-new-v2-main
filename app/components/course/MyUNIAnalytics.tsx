// components/course/MyUNIAnalytics.tsx
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
  Zap
} from 'lucide-react';

import { getUserAnalytics } from '../../../lib/courseService';

// Define proper types for better type safety
interface AnalyticsItem {
  session_date: string;
  total_watch_time_minutes?: number;
  lessons_completed?: number;
}

interface ProgressItem {
  watch_time_seconds?: number;
  is_completed: boolean;
}

interface AnalyticsData {
  totalWatchTime: number; // dakika
  completedLessons: number;
  totalLessons: number;
  avgDailyTime: number; // dakika
  streak: number; // gün
  lastActive: string;
  weeklyProgress: Array<{
    day: string;
    minutes: number;
    lessonsCompleted: number;
  }>;
  contentTypeProgress: {
    videos: { completed: number; total: number };
    notes: { completed: number; total: number };
    quicks: { completed: number; total: number };
  };
}

interface MyUNIAnalyticsProps {
  courseId: string;
  userId: string;
  texts?: {
    myuniAnalytics?: string;
    totalWatchTime?: string;
    completedLessons?: string;
    avgDailyTime?: string;
    currentStreak?: string;
    lastActive?: string;
    weeklyProgress?: string;
    contentProgress?: string;
    performance?: string;
    minutes?: string;
    days?: string;
    lessons?: string;
    loading?: string;
    error?: string;
  };
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "neutral" | "green" | "blue" | "purple";
}

// Varsayılan Türkçe metinler
const defaultTexts = {
  myuniAnalytics: "MyUNI Analitik",
  totalWatchTime: "Toplam İzleme Süresi",
  completedLessons: "Tamamlanan Dersler",
  avgDailyTime: "Günlük Ortalama",
  currentStreak: "Mevcut Seri",
  lastActive: "Son Aktivite",
  weeklyProgress: "Haftalık İlerleme",
  contentProgress: "İçerik İlerlemesi",
  performance: "Performansınız",
  minutes: "dakika",
  days: "gün",
  lessons: "ders",
  loading: "Yükleniyor...",
  error: "Veri yüklenirken hata oluştu"
};

// Helper functions moved outside component to avoid recreation
const calculateStreak = (analytics: AnalyticsItem[]): number => {
  // Basit seri hesaplama - ardışık günler
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

const generateWeeklyProgress = (analytics: AnalyticsItem[]) => {
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const today = new Date();
  const weeklyData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    const dayData = analytics.find(a => a.session_date === dateString);
    
    weeklyData.push({
      day: days[date.getDay() === 0 ? 6 : date.getDay() - 1], // Pazartesi başlangıç
      minutes: dayData?.total_watch_time_minutes || 0,
      lessonsCompleted: dayData?.lessons_completed || 0
    });
  }

  return weeklyData;
};

const transformAnalyticsData = (analytics: AnalyticsItem[], progress: ProgressItem[]): AnalyticsData => {
  // Toplam izleme süresi hesapla
  const totalWatchTimeMinutes = progress.reduce((acc, p) => 
    acc + Math.floor((p.watch_time_seconds || 0) / 60), 0
  );

  // Tamamlanan ders sayısı
  const completedLessons = progress.filter(p => p.is_completed).length;
  const totalLessons = progress.length;

  // Günlük ortalama hesapla (son 7 günün ortalaması)
  const recentAnalytics = analytics.slice(0, 7);
  const avgDailyTime = recentAnalytics.length > 0 
    ? Math.round(recentAnalytics.reduce((acc, a) => acc + (a.total_watch_time_minutes || 0), 0) / recentAnalytics.length)
    : 0;

  // Seri hesapla (basit versiyon)
  const streak = calculateStreak(analytics);

  // Son aktivite
  const lastActive = analytics.length > 0 ? analytics[0].session_date : new Date().toISOString().split('T')[0];

  // Haftalık ilerleme (son 7 gün)
  const weeklyProgress = generateWeeklyProgress(analytics);

  // İçerik tipine göre ilerleme
  const contentTypeProgress = {
    videos: { completed: Math.floor(completedLessons * 0.6), total: Math.floor(totalLessons * 0.6) },
    notes: { completed: Math.floor(completedLessons * 0.25), total: Math.floor(totalLessons * 0.25) },
    quicks: { completed: Math.floor(completedLessons * 0.15), total: Math.floor(totalLessons * 0.15) }
  };

  return {
    totalWatchTime: totalWatchTimeMinutes,
    completedLessons,
    totalLessons,
    avgDailyTime,
    streak,
    lastActive,
    weeklyProgress,
    contentTypeProgress
  };
};

export default function MyUNIAnalytics({ 
  courseId, 
  userId, 
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

      // Kullanıcının analitik verilerini çek
      const { analytics, progress } = await getUserAnalytics(userId, courseId);
      
      // Veriyi transform et
      const transformedData = transformAnalyticsData(analytics, progress);
      setAnalyticsData(transformedData);

    } catch (err) {
      console.error('Analitik veri çekme hatası:', err);
      setError('Analitik veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [userId, courseId]); // transformAnalyticsData is now outside component

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
      purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
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

  const completionRate = analyticsData.totalLessons > 0 
    ? Math.round((analyticsData.completedLessons / analyticsData.totalLessons) * 100) 
    : 0;
  const hoursWatched = Math.floor(analyticsData.totalWatchTime / 60);
  const minutesWatched = analyticsData.totalWatchTime % 60;

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
          title={t.totalWatchTime}
          value={`${hoursWatched}s ${minutesWatched}dk`}
          subtitle={`Toplam ${analyticsData.totalWatchTime} ${t.minutes}`}
          color="blue"
        />
        
        <StatCard
          icon={Target}
          title={t.completedLessons}
          value={`${analyticsData.completedLessons}/${analyticsData.totalLessons}`}
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

      {/* İlerleme Özeti */}
      <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-6 transition-all duration-200 ease-in-out hover:shadow-sm hover:bg-opacity-95">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">
          Kurs İlerlemesi
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
          {t.contentProgress}
        </h3>
        <div className="space-y-4">
          {/* Videolar */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center space-x-3">
              <PlayCircle className="w-5 h-5 text-blue-600 transition-transform duration-200 ease-in-out group-hover:scale-105" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Videolar</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-900 dark:text-neutral-100">
                {analyticsData.contentTypeProgress.videos.completed}/{analyticsData.contentTypeProgress.videos.total}
              </span>
              <div className="w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden transition-all duration-200 ease-in-out hover:shadow-sm">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-200 ease-in-out group-hover:scale-x-102"
                  style={{ 
                    width: `${analyticsData.contentTypeProgress.videos.total > 0 ? (analyticsData.contentTypeProgress.videos.completed / analyticsData.contentTypeProgress.videos.total) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Notlar */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-green-600 transition-transform duration-200 ease-in-out group-hover:scale-105" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Notlar</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-900 dark:text-neutral-100">
                {analyticsData.contentTypeProgress.notes.completed}/{analyticsData.contentTypeProgress.notes.total}
              </span>
              <div className="w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden transition-all duration-200 ease-in-out hover:shadow-sm">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-200 ease-in-out group-hover:scale-x-102"
                  style={{ 
                    width: `${analyticsData.contentTypeProgress.notes.total > 0 ? (analyticsData.contentTypeProgress.notes.completed / analyticsData.contentTypeProgress.notes.total) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Hızlı Öğrenme */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-purple-600 transition-transform duration-200 ease-in-out group-hover:scale-105" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Hızlı Öğrenme</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-900 dark:text-neutral-100">
                {analyticsData.contentTypeProgress.quicks.completed}/{analyticsData.contentTypeProgress.quicks.total}
              </span>
              <div className="w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden transition-all duration-200 ease-in-out hover:shadow-sm">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-200 ease-in-out group-hover:scale-x-102"
                  style={{ 
                    width: `${analyticsData.contentTypeProgress.quicks.total > 0 ? (analyticsData.contentTypeProgress.quicks.completed / analyticsData.contentTypeProgress.quicks.total) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
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
                {day.lessonsCompleted} {t.lessons}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Başarılar */}
      <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-6 transition-all duration-200 ease-in-out hover:shadow-sm hover:bg-opacity-95">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">
          Başarılar
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
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">İlk Hafta</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">7 günlük seri</p>
          </div>
          
          <div className={`text-center p-4 rounded border transition-all duration-200 ease-in-out hover:shadow-sm hover:bg-opacity-90 ${
            analyticsData.completedLessons >= 10 
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              : 'bg-neutral-50 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600 opacity-50'
          }`}>
            <PlayCircle className={`w-8 h-8 mx-auto mb-2 transition-transform duration-200 ease-in-out hover:scale-105 ${
              analyticsData.completedLessons >= 10 ? 'text-blue-600' : 'text-neutral-400'
            }`} />
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Ders Ustası</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">10 ders tamamla</p>
          </div>
          
          <div className={`text-center p-4 rounded border transition-all duration-200 ease-in-out hover:shadow-sm hover:bg-opacity-90 ${
            analyticsData.contentTypeProgress.quicks.completed >= 5
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
              : 'bg-neutral-50 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600 opacity-50'
          }`}>
            <Zap className={`w-8 h-8 mx-auto mb-2 transition-transform duration-200 ease-in-out hover:scale-105 ${
              analyticsData.contentTypeProgress.quicks.completed >= 5 ? 'text-purple-600' : 'text-neutral-400'
            }`} />
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Hızlı Öğrenci</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">5 hızlı öğrenme tamamla</p>
          </div>
        </div>
      </div>
    </div>
  );
}