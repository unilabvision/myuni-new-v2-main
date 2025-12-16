//app/components/course/PersonalizedWelcome.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface PersonalizedWelcomeProps {
  userName: string;
  onComplete: (preferences: UserPreferences) => void;
}

interface UserPreferences {
  experience: string;
  goals: string[];
  learningStyle: string;
  timeCommitment: string;
}

export default function PersonalizedWelcome({ userName, onComplete }: PersonalizedWelcomeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    experience: '',
    goals: [],
    learningStyle: '',
    timeCommitment: ''
  });
  const [isAnimating, setIsAnimating] = useState(true);
  const [showQuestions, setShowQuestions] = useState(false);

  // Animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setIsAnimating(false);
    }, 3000);

    const timer2 = setTimeout(() => {
      setShowQuestions(true);
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const steps = [
    {
      id: 'experience',
      title: 'Deneyim Seviyeniz',
      subtitle: 'Bu alanda ne kadar deneyiminiz var?',
      options: [
        { value: 'beginner', label: 'Yeni Başlayan', description: 'Bu alanda hiç deneyimim yok' },
        { value: 'intermediate', label: 'Orta Seviye', description: 'Temel bilgilerim var, geliştirmek istiyorum' },
        { value: 'advanced', label: 'İleri Seviye', description: 'İyi biliyorum, uzmanlaşmak istiyorum' }
      ]
    },
    {
      id: 'goals',
      title: 'Hedefleriniz',
      subtitle: 'Bu eğitimden ne elde etmek istiyorsunuz?',
      multiple: true,
      options: [
        { value: 'career', label: 'Kariyer Gelişimi', description: 'Mesleki ilerleme sağlamak' },
        { value: 'skill', label: 'Yeni Beceri', description: 'Yeni bir beceri kazanmak' },
        { value: 'certification', label: 'Sertifikasyon', description: 'Resmi bir sertifika almak' },
        { value: 'hobby', label: 'Kişisel İlgi', description: 'Hobim olarak öğrenmek' }
      ]
    },
    {
      id: 'learningStyle',
      title: 'Öğrenme Tarzınız',
      subtitle: 'Hangi yöntemle daha iyi öğrenirsiniz?',
      options: [
        { value: 'visual', label: 'Görsel Öğrenme', description: 'Videolar, şemalar ve grafikler' },
        { value: 'reading', label: 'Okuyarak Öğrenme', description: 'Metinler, dökümanlar ve notlar' },
        { value: 'practical', label: 'Uygulayarak Öğrenme', description: 'Projeler ve uygulamalı çalışmalar' },
        { value: 'mixed', label: 'Karma Yöntem', description: 'Hepsini harmanlayarak' }
      ]
    },
    {
      id: 'timeCommitment',
      title: 'Zaman Planınız',
      subtitle: 'Haftada ne kadar zaman ayırabilirsiniz?',
      options: [
        { value: 'casual', label: '1-3 Saat', description: 'Boş zamanlarımda rahatça' },
        { value: 'regular', label: '4-7 Saat', description: 'Düzenli olarak ilerlemek istiyorum' },
        { value: 'intensive', label: '8+ Saat', description: 'Hızlı şekilde tamamlamak istiyorum' }
      ]
    }
  ];

  const handleOptionSelect = (stepId: string, value: string) => {
    if (stepId === 'goals') {
      setPreferences(prev => ({
        ...prev,
        goals: prev.goals.includes(value) 
          ? prev.goals.filter(g => g !== value)
          : [...prev.goals, value]
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        [stepId]: value
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(preferences);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    const currentStepData = steps[currentStep];
    if (currentStepData.id === 'goals') {
      return preferences.goals.length > 0;
    }
    return preferences[currentStepData.id as keyof UserPreferences] !== '';
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  if (isAnimating || !showQuestions) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-neutral-900 z-50 flex items-center justify-center overflow-hidden">
        {/* Enhanced animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/60 via-rose-50/40 to-pink-50/60 dark:from-red-950/20 dark:via-rose-950/15 dark:to-pink-950/20 animate-pulse duration-4000"></div>
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gradient-to-br from-red-100/40 to-rose-100/40 dark:from-red-900/15 dark:to-rose-900/15 rounded-full blur-3xl animate-pulse duration-6000"></div>
          <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gradient-to-br from-rose-100/40 to-pink-100/40 dark:from-rose-900/15 dark:to-pink-900/15 rounded-full blur-2xl animate-pulse duration-8000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-pink-100/30 to-red-100/30 dark:from-pink-900/10 dark:to-red-900/10 rounded-full blur-xl animate-pulse duration-5000"></div>
        </div>

        {/* Welcome content with enhanced animations */}
        <div className="text-center z-10 px-8 max-w-lg">
          {/* MyUNI Logo with minimal loading indicator */}
          <div className={`mb-8 transition-all duration-1000 ease-out ${isAnimating ? 'scale-100 opacity-100' : 'scale-75 opacity-90 -translate-y-4'}`}>
            <div className="w-20 h-20 mx-auto flex items-center justify-center relative">
              {/* Simple rotating arc */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
                <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
                  <circle
                    cx="40"
                    cy="40"
                    r="38"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeDasharray="15 225"
                    className="text-red-500/60 dark:text-red-400/50"
                  />
                </svg>
              </div>
              
              {/* Logo */}
              <div className="relative z-10 w-16 h-16">
                <Image
                  src="/myuni-icon.png"
                  alt="MyUNI Logo"
                  width={64}
                  height={64}
                  className="block dark:hidden object-contain"
                  priority
                />
                <Image
                  src="/myuni-icon2.png"
                  alt="MyUNI Logo"
                  width={64}
                  height={64}
                  className="hidden dark:block object-contain"
                  priority
                />
              </div>
            </div>
          </div>
          
          {/* Welcome text with stagger animation */}
          <div className={`transition-all duration-1000 ease-out delay-300 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-95 -translate-y-2'}`}>
            <h1 className="text-4xl font-medium text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
              Merhaba {getFirstName(userName)}! 👋
            </h1>
          </div>
          
          <div className={`transition-all duration-1000 ease-out delay-500 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-90 -translate-y-1'}`}>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 leading-relaxed">
              Senin için en iyi eğitimi hazırlıyoruz
            </p>
          </div>
          
          {/* Enhanced loading animation */}
          <div className={`flex justify-center space-x-2 transition-all duration-1000 ease-out delay-700 ${isAnimating ? 'opacity-100' : 'opacity-60'}`}>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse duration-1000"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse duration-1000" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse duration-1000" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-white dark:bg-neutral-900 z-50 flex items-center justify-center overflow-hidden">
      {/* Enhanced background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 via-rose-50/30 to-pink-50/50 dark:from-red-950/15 dark:via-rose-950/10 dark:to-pink-950/15"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-red-100/30 to-rose-100/30 dark:from-red-900/10 dark:to-rose-900/10 rounded-full blur-2xl animate-pulse duration-8000"></div>
      </div>

      {/* Content with slide-up animation */}
      <div className="w-full max-w-xl mx-auto p-8 z-10 animate-in slide-in-from-bottom-4 duration-700">
        {/* MyUNI Logo - smaller, top positioned */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 flex items-center justify-center transition-all duration-300 hover:scale-105 relative group">
            {/* Subtle background */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/3 to-rose-500/3 dark:from-red-400/2 dark:to-rose-400/2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Logo */}
            <div className="relative z-10 w-10 h-10">
              <Image
                src="/myuni-icon.png"
                alt="MyUNI"
                width={40}
                height={40}
                className="block dark:hidden object-contain"
              />
              <Image
                src="/myuni-icon2.png"
                alt="MyUNI"
                width={40}
                height={40}
                className="hidden dark:block object-contain"
              />
            </div>
          </div>
        </div>

        {/* Progress with enhanced animation */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-500 dark:text-gray-400 transition-all duration-300">
              {currentStep + 1} / {steps.length}
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              Neredeyse hazır
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-neutral-800 h-0.5 overflow-hidden">
            <div 
              className="h-0.5 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 transition-all duration-1000 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question with slide animation */}
        <div className="text-center mb-10 animate-in fade-in-50 slide-in-from-bottom-2 duration-500" key={currentStep}>
          <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-3 transition-all duration-300">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {currentStepData.subtitle}
          </p>
        </div>

        {/* Options with stagger animation */}
        <div className="space-y-3 mb-10">
          {currentStepData.options.map((option, index) => {
            const isSelected = currentStepData.multiple 
              ? preferences.goals.includes(option.value)
              : preferences[currentStepData.id as keyof UserPreferences] === option.value;

            return (
              <div
                key={option.value}
                className="animate-in fade-in-50 slide-in-from-bottom-1 duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <button
                  onClick={() => handleOptionSelect(currentStepData.id, option.value)}
                  className={`w-full p-4 text-left border transition-all duration-300 group transform hover:scale-[1.01] ${
                    isSelected
                      ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-neutral-800 shadow-sm'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 hover:bg-gray-25 dark:hover:bg-neutral-850 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-4 h-4 mt-0.5 border transition-all duration-300 ${
                      isSelected
                        ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 scale-110'
                        : 'border-gray-300 dark:border-neutral-600 group-hover:border-gray-400 dark:group-hover:border-neutral-500'
                    } ${currentStepData.multiple ? '' : 'rounded-full'}`}>
                      {isSelected && (
                        <Check className="w-2.5 h-2.5 text-white dark:text-gray-900 m-0.5 animate-in zoom-in-50 duration-200" strokeWidth={3} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100 mb-1 transition-all duration-200">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 transition-all duration-200">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Navigation with enhanced animations */}
        <div className="flex items-center justify-between">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 hover:-translate-x-1"
            >
              Geri
            </button>
          ) : (
            <div></div>
          )}

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-6 py-3 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center space-x-2 hover:translate-x-1 transform hover:scale-105 disabled:hover:scale-100 disabled:hover:translate-x-0"
          >
            <span>{currentStep === steps.length - 1 ? 'Başlayalım' : 'Devam'}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Step indicators with pulse animation */}
        <div className="flex justify-center space-x-2 mt-10">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 transition-all duration-500 ${
                index <= currentStep 
                  ? 'bg-gray-900 dark:bg-gray-100 scale-125' 
                  : 'bg-gray-300 dark:bg-neutral-600'
              } ${index === currentStep ? 'animate-pulse' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}