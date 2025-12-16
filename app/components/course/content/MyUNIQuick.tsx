"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Gamepad2, Target, Brain, CheckCircle, XCircle, Clock, Trophy, Award } from 'lucide-react';
import { getLessonContent, saveQuizResult, getLatestQuizResult } from '../../../../lib/courseService';

interface MyUNIQuickProps {
  lessonId: string;
  userId?: string;
  onComplete?: (score: number) => Promise<void>;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface QuizConfig {
  questions: QuizQuestion[];
  time_limit?: number;
  passing_score: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  is_final_exam?: boolean;
  certificate_eligible?: boolean;
}

interface QuickData {
  id: string;
  title: string;
  description: string;
  quick_type: string;
  config: QuizConfig;
}

interface QuizResult {
  score: number;
  attempts?: number;
  completed_at?: string;
}

export function MyUNIQuick({ lessonId, userId, onComplete }: MyUNIQuickProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuick, setCurrentQuick] = useState<QuickData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [previousResult, setPreviousResult] = useState<QuizResult | null>(null);

  const resetAllStates = useCallback(() => {
    setLoading(true);
    setError(null);
    setCurrentQuick(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setScore(0);
    setTimeLeft(null);
    setStartTime(null);
    setPreviousResult(null);
  }, []);

  const fetchQuickContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const content = await getLessonContent(lessonId);
      
      if (content.quicks && content.quicks.length > 0) {
        const firstQuick = content.quicks[0];
        setCurrentQuick(firstQuick);
        
        if (firstQuick.config?.time_limit) {
          setTimeLeft(firstQuick.config.time_limit);
        }

        if (userId) {
          const prevResult = await getLatestQuizResult(userId, firstQuick.id);
          setPreviousResult(prevResult);
        }
      } else {
        setError('Sınav içeriği bulunamadı');
      }
    } catch (err) {
      console.error('Sınav içeriği yükleme hatası:', err);
      setError('Sınav içeriği yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [lessonId, userId]);

  const calculateScore = useCallback(async () => {
    if (!currentQuick?.config?.questions) return;
    
    let correctAnswers = 0;
    const questions = currentQuick.config.questions;
    
    selectedAnswers.forEach((answer, index) => {
      if (questions[index] && answer === questions[index].correct) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    const passingScore = currentQuick.config.passing_score || 70;
    const isPassed = finalScore >= passingScore;
    
    setScore(finalScore);
    setShowResults(true);

    if (userId) {
      try {
        // Save quiz result and get the result with updated information
        const result = await saveQuizResult(
          userId,
          lessonId,
          currentQuick.id,
          finalScore
        );

        console.log('Quiz result saved:', result);

        // Only call onComplete if the quiz is passed and onComplete callback exists
        if (isPassed && onComplete) {
          console.log('Quiz passed with score:', finalScore, 'Calling onComplete callback...');
          await onComplete(finalScore);
          console.log('onComplete callback executed successfully');
        } else if (!isPassed) {
          console.log('Quiz not passed. Score:', finalScore, 'Passing score:', passingScore);
        } else if (!onComplete) {
          console.log('onComplete callback not provided');
        }
      } catch (error) {
        console.error('Sınav sonucu analitiklere kaydedilemedi:', error);
      }
    }
  }, [currentQuick, selectedAnswers, userId, lessonId, onComplete]);

  useEffect(() => {
    resetAllStates();
    fetchQuickContent();
  }, [lessonId, resetAllStates, fetchQuickContent]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || showResults) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          calculateScore();
          return 0;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResults, calculateScore]);

  const handleStartQuiz = () => {
    setStartTime(Date.now());
    setSelectedAnswers([]);
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setPreviousResult(null);
    
    if (currentQuick?.config?.time_limit) {
      setTimeLeft(currentQuick.config.time_limit);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (!currentQuick?.config?.questions) return;
    
    if (currentQuestionIndex < currentQuick.config.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateScore();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setScore(0);
    setStartTime(null);
    setPreviousResult(null);
    
    if (currentQuick?.config?.time_limit) {
      setTimeLeft(currentQuick.config.time_limit);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const getQuickTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <Brain className="w-6 h-6 text-[#990000]" />;
      case 'interactive': return <Target className="w-6 h-6 text-[#990000]" />;
      case 'game': return <Gamepad2 className="w-6 h-6 text-[#990000]" />;
      case 'simulation': return <Zap className="w-6 h-6 text-[#990000]" />;
      default: return <Brain className="w-6 h-6 text-[#990000]" />;
    }
  };

  const getScoreColor = (score: number) => {
    return score >= 70 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getScoreBadge = (score: number, passingScore: number) => {
    const isPassed = score >= passingScore;
    if (score >= 95) return { icon: Award, text: 'Mükemmel', color: 'text-green-600 dark:text-green-400' };
    if (score >= 85) return { icon: Trophy, text: 'Harika', color: 'text-green-600 dark:text-green-400' };
    if (isPassed) return { icon: CheckCircle, text: 'Başarılı', color: 'text-green-600 dark:text-green-400' };
    return { icon: XCircle, text: 'Başarısız', color: 'text-red-600 dark:text-red-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 w-64 mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 w-96 mb-8"></div>
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-8">
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 mb-4"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 mb-6"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-neutral-200 dark:bg-neutral-700"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentQuick) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 mx-auto mb-4 flex items-center justify-center">
              <span className="text-red-600 text-xl">!</span>
            </div>
            <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              Sınav Yüklenemedi
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              {error || 'Sınav içeriği bulunamadı'}
            </p>
            <button
              onClick={fetchQuickContent}
              className="px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  const questions = currentQuick.config?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const passingScore = currentQuick.config?.passing_score || 70;

  if (!startTime && previousResult) {
    const badge = getScoreBadge(previousResult.score, passingScore);
    const BadgeIcon = badge.icon;

    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <BadgeIcon className={`w-8 h-8 ${badge.color}`} />
                  <div>
                    <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100">
                      {currentQuick.title}
                    </h1>
                    <div className="w-16 h-px bg-[#990000] mt-2"></div>
                  </div>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl">
                  {currentQuick.description}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    Önceki Sonuç
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700">
                      <span className="text-neutral-600 dark:text-neutral-400">Puan</span>
                      <span className={`text-xl font-bold ${getScoreColor(previousResult.score)}`}>
                        {previousResult.score}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700">
                      <span className="text-neutral-600 dark:text-neutral-400">Durum</span>
                      <span className={`font-medium ${badge.color}`}>{badge.text}</span>
                    </div>
                    {previousResult.attempts && (
                      <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700">
                        <span className="text-neutral-600 dark:text-neutral-400">Deneme Sayısı</span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">{previousResult.attempts}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    Sınav Bilgileri
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700">
                      <span className="text-neutral-600 dark:text-neutral-400">Soru Sayısı</span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{questions.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700">
                      <span className="text-neutral-600 dark:text-neutral-400">Geçme Puanı</span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{passingScore}%</span>
                    </div>
                    {currentQuick.config?.time_limit && (
                      <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700">
                        <span className="text-neutral-600 dark:text-neutral-400">Süre Sınırı</span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {formatTime(currentQuick.config.time_limit)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartQuiz}
                className="w-full py-3 bg-[#990000] hover:bg-[#770000] text-white transition-colors font-medium"
              >
                Sınavı Tekrar Yap
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!startTime && !previousResult) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  {getQuickTypeIcon(currentQuick.quick_type)}
                  <div>
                    <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100">
                      {currentQuick.title}
                    </h1>
                    <div className="w-16 h-px bg-[#990000] mt-2"></div>
                  </div>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl">
                  {currentQuick.description}
                </p>
              </div>

              <div className="space-y-4 mb-8 max-w-md">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  Sınav Bilgileri
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700">
                    <span className="text-neutral-600 dark:text-neutral-400">Soru Sayısı</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700">
                    <span className="text-neutral-600 dark:text-neutral-400">Geçme Puanı</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{passingScore}%</span>
                  </div>
                  {currentQuick.config?.time_limit && (
                    <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700">
                      <span className="text-neutral-600 dark:text-neutral-400">Süre Sınırı</span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {formatTime(currentQuick.config.time_limit)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleStartQuiz}
                className="w-full py-3 bg-[#990000] hover:bg-[#770000] text-white transition-colors font-medium"
              >
                Sınavı Başlat
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const badge = getScoreBadge(score, passingScore);
    const BadgeIcon = badge.icon;
    const correctCount = selectedAnswers.filter((answer, index) => answer === questions[index]?.correct).length;

    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <BadgeIcon className={`w-16 h-16 ${badge.color} mx-auto mb-4`} />
                <h1 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Sınav Tamamlandı
                </h1>
                <div className="w-16 h-px bg-[#990000] mx-auto mb-4"></div>
                <div className={`text-5xl font-bold mb-2 ${getScoreColor(score)}`}>
                  {score}%
                </div>
                <p className={`text-xl font-medium ${badge.color} mb-2`}>
                  {badge.text}
                </p>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {questions.length} sorudan {correctCount} doğru
                </p>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                  Detaylı Sonuçlar
                </h3>
                <div className="bg-neutral-50 dark:bg-neutral-700 p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-3">
                    {questions.map((question: QuizQuestion, index: number) => {
                      const isCorrect = selectedAnswers[index] === question.correct;
                      return (
                        <div key={index} className="flex items-start justify-between">
                          <div className="flex-1 mr-4">
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Soru {index + 1}:
                            </span>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                              {question.question.length > 80 
                                ? question.question.substring(0, 80) + '...'
                                : question.question
                              }
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            {isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={resetQuiz}
                className="w-full py-3 bg-[#990000] hover:bg-[#770000] text-white transition-colors font-medium"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentQuick.quick_type === 'quiz' && questions.length > 0) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {getQuickTypeIcon(currentQuick.quick_type)}
                  <div>
                    <h1 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">
                      {currentQuick.title}
                    </h1>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Soru {currentQuestionIndex + 1} / {questions.length}
                    </p>
                  </div>
                </div>
                {timeLeft !== null && (
                  <div className="flex items-center space-x-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    <Clock className="w-5 h-5 text-[#990000]" />
                    <span className="text-lg">{formatTime(timeLeft)}</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2">
                  <div 
                    className="h-2 bg-[#990000] transition-all duration-300 ease-in-out"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Question Content */}
            <div className="p-8">
              {currentQuestion && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed">
                    {currentQuestion.question}
                  </h2>
                  
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option: string, index: number) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === index;
                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          className={`w-full p-4 text-left border transition-all duration-200 hover:border-[#990000] hover:shadow-sm ${
                            isSelected 
                              ? 'bg-[#990000]/5 border-[#990000] shadow-sm' 
                              : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'bg-[#990000] border-[#990000]' 
                                : 'border-neutral-300 dark:border-neutral-600'
                            }`}>
                              {isSelected && (
                                <div className="w-2 h-2 bg-white"></div>
                              )}
                            </div>
                            <span className="text-neutral-900 dark:text-neutral-100 leading-relaxed">
                              {option}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="p-6 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-2 text-neutral-600 dark:text-neutral-400 hover:text-[#990000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Önceki
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswers[currentQuestionIndex] === undefined}
                  className="px-8 py-3 bg-[#990000] hover:bg-[#770000] disabled:bg-neutral-300 disabled:cursor-not-allowed text-white transition-colors font-medium"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Sınavı Bitir' : 'Sonraki Soru'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {getQuickTypeIcon(currentQuick.quick_type)}
              <h1 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">
                {currentQuick.title}
              </h1>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">
              {currentQuick.description || `${currentQuick.quick_type} içeriği burada uygulanacak`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}