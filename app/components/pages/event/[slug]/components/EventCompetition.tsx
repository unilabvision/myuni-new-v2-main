'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../../../lib/supabase';
import { updateUserEventProgress } from '../../../../../../lib/eventService';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';


// Tip tanımları eklenecek
export interface CompetitionQuestion {
  id: string;
  question_text: string;
  options: { id: string; text: string }[];
  points?: number;
}

interface EventCompetitionProps {
  competitionId: string;
  title: string;
  durationMinutes: number;
  questions: CompetitionQuestion[];
  onComplete: (score: number, timeTakenSeconds: number, answers: Record<string, string>) => void;
  isSubmitting?: boolean;
}

export const EventCompetition: React.FC<EventCompetitionProps> = ({
  competitionId,
  title,
  durationMinutes,
  questions,
  onComplete,
  isSubmitting = false
}) => {
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isFinished, setIsFinished] = useState(false);

  // Sayaç mantığı
  useEffect(() => {
    if (!started || isFinished || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish(); // Süre bitince otomatik bitir
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, isFinished, timeLeft]);

  const handleStart = () => {
    setStarted(true);
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;

  const handleFinish = () => {
    setIsFinished(true);
    const timeTakenSeconds = (durationMinutes * 60) - timeLeft;
    // Puanlama burada sunucu tarafında yapılmalı ideal olarak ama demo amaçlı
    onComplete(0, timeTakenSeconds, answers); // Gerçek puanlama server'da
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/5 dark:bg-black/20 rounded-2xl border border-white/10 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title || "Genel Kültür Yarışması"}</h2>
        <p className="text-gray-400 max-w-md">
          Yarışmaya hoş geldiniz. Toplam {questions.length} sorunuz ve {durationMinutes} dakikanız var. Geri sayım siz &ldquo;Yarışmayı Başlat&rdquo; butonuna tıkladığınız an başlayacaktır. Süre bitiminde işaretlediğiniz şıklar otomatik gönderilir.
        </p>
        <button 
          onClick={handleStart}
          className="px-8 py-3 mt-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/25 border-0 rounded-xl transition-all"
        >
          Yarışmayı Başlat
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/5 dark:bg-black/20 rounded-2xl border border-white/10 text-center space-y-4 min-h-[400px]">
        <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-2">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-3xl font-bold text-white">Yarışma Tamamlandı!</h2>
        <p className="text-gray-400">
          Cevaplarınız başarıyla kaydedildi. Sonuçlar etkinlik bitiminde veya eğitmenler tarafından duyurulacaktır.
        </p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col w-full bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* İlerleme ve Süre Barı */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#111]/90 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-400">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
          <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden hidden sm:block">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <div className={`flex items-center space-x-2 font-mono text-lg font-bold px-4 py-2 rounded-lg 
          ${timeLeft < 60 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-white/5 text-gray-200'}`}
        >
          <Clock size={18} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Soru İçeriği */}
      <div className="p-6 md:p-10 min-h-[400px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-grow flex flex-col"
          >
            <h3 className="text-2xl md:text-3xl font-medium text-white mb-8 leading-tight">
              {currentQuestion.question_text}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
              {currentQuestion.options.map(option => {
                const isSelected = answers[currentQuestion.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                    className={`text-left p-6 rounded-xl border-2 transition-all duration-200 focus:outline-none flex items-center group
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10' 
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 flex-shrink-0 transition-colors
                      ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-500 group-hover:border-gray-400'}`}
                    >
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className={`text-lg transition-colors ${isSelected ? 'text-white font-medium' : 'text-gray-300 group-hover:text-gray-200'}`}>
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Alt Navigasyon (Pagination & Gönder) */}
      <div className="px-6 py-5 bg-[#1a1a1a] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-lg transition-colors"
        >
          <ChevronLeft className="mr-2" size={18} /> Önceki
        </button>
        
        {/* Pagination Dots Gizlenebilir mobilde */}
        <div className="flex items-center space-x-2 overflow-x-auto hide-scrollbar max-w-[50%]">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center flex-shrink-0 transition-colors
                ${currentQuestionIndex === idx 
                  ? 'bg-blue-500 text-white ring-2 ring-blue-500/30 ring-offset-2 ring-offset-[#1a1a1a]' 
                  : answers[q.id] 
                    ? 'bg-white/20 text-white' 
                    : 'border border-white/10 text-gray-500 hover:bg-white/5'}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleFinish}
            disabled={isSubmitting}
            className="w-full sm:w-auto flex items-center justify-center bg-green-500 text-white font-medium hover:bg-green-600 shadow-lg shadow-green-500/20 px-8 py-2 rounded-lg border-0 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Yarışmayı Sonlandır'} <CheckCircle className="ml-2" size={18} />
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            className="w-full sm:w-auto flex items-center justify-center bg-white/10 text-white font-medium hover:bg-white/20 px-6 py-2 rounded-lg border-0 transition-colors"
          >
            Sonraki <ChevronRight className="ml-2" size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export const EventCompetitionContainer: React.FC<{
  lessonId: string;
  eventId: string;
  userId: string;
  onComplete: () => void;
}> = ({ lessonId, eventId, userId, onComplete }) => {
  const [competition, setCompetition] = useState<any>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        setLoading(true);
        // lessonId'ye bağlı yarışmayı getir
        const { data, error } = await supabase
          .from('myuni_event_competitions')
          .select('*')
          .eq('lesson_id', lessonId)
          .eq('is_active', true)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setError('Bu bölüm için tanımlanmış aktif bir test/yarışma bulunamadı.');
          } else {
            setError('Yarışma yüklenirken bir hata oluştu: ' + error.message);
          }
        } else if (data) {
          setCompetition(data);

          // Daha önce bu yarışmaya katılmış mı kontrol et
          if (userId) {
            const { data: previousResult } = await supabase
              .from('myuni_event_competition_results')
              .select('id')
              .eq('competition_id', data.id)
              .eq('user_id', userId)
              .maybeSingle();

            if (previousResult) {
              setHasCompleted(true);
            }
          }
        }
      } catch (err: any) {
        setError('Sistem hatası: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (lessonId && userId) {
      fetchCompetition();
    }
  }, [lessonId, userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-[#111] rounded-2xl border border-white/10 text-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400">Yarışma verileri hazırlanıyor...</p>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-[#111] rounded-2xl border border-white/10 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <p className="text-gray-300 font-medium">{error || 'Yarışma bilgisi alınamadı.'}</p>
        <p className="text-gray-500 text-sm mt-2">Daha sonra tekrar deneyin veya eğitmeninizle iletişime geçin.</p>
      </div>
    );
  }

  if (hasCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-[#111] rounded-2xl border border-white/10 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-4">
          <CheckCircle size={48} />
        </div>
        <h3 className="text-2xl text-white font-medium mb-2">Tebrikler, yarışmayı tamamladınız!</h3>
        <p className="text-gray-400 max-w-md">Cevaplarınız sisteme başarıyla kaydedildi. Bu yarışmaya tekrar katılamazsınız.</p>
      </div>
    );
  }

  // Güvenli bir şekilde soruları çıkart
  const questions = Array.isArray(competition.questions) ? competition.questions : [];

  if (questions.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-[#111] rounded-2xl border border-white/10 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl text-white font-medium mb-2">Sorular Hazırlanıyor</h3>
        <p className="text-gray-400 max-w-md">Eğitmen bu yarışma için henüz soru eklememiş gibi görünüyor.</p>
      </div>
    );
  }

  return (
    <EventCompetition
      competitionId={competition.id}
      title={competition.title}
      durationMinutes={competition.duration_minutes || 10}
      questions={questions}
      onComplete={async (score, timeTaken, answers) => {
        try {
          // Puanı kabaca hesaplayalım (gerçekte güvenliği sunucuda sağlanmalı)
          let calculatedScore = 0;
          questions.forEach((q: any) => {
            if (answers[q.id] === q.correct_option_id) {
              calculatedScore += (q.points || 10);
            }
          });

          // Sonucu veritabanına kaydet
          const { error: insertError } = await supabase.from('myuni_event_competition_results').insert({
            competition_id: competition.id,
            user_id: userId || null, // Boş string yerine null gönder (UUID format hatasını önlemek için)
            score: calculatedScore,
            time_taken_seconds: timeTaken,
            user_answers: answers,
            started_at: new Date(Date.now() - timeTaken * 1000).toISOString(),
            completed_at: new Date().toISOString()
          });

          if (insertError) {
            console.error('Veritabanına yazarken hata oluştu:', insertError);
            alert('Sonuç kaydedilirken bir hata oluştu: ' + insertError.message);
            // Hata olursa kaydetme, return yap
            return;
          }

          // Ana eğitim ilerleme (progress) tablosunu %'yi artırmak için güncelle
          if (userId) {
            try {
              await updateUserEventProgress(userId, lessonId, {
                is_completed: true,
                watch_time_seconds: timeTaken
              });
            } catch (progressError) {
              console.error('İlerleme verisi güncellenirken hata oluştu:', progressError);
            }
          }

          setHasCompleted(true);
        } catch (error) {
          console.error('Yarışma sonucu kaydedilirken hata:', error);
          alert('Beklenmeyen bir hata oluştu.');
        } finally {
          onComplete();
        }
      }}
    />
  );
};
