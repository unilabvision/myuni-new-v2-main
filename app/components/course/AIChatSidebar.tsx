"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X,
  Send,
  Sparkles,
  User,
  BookOpen,
  Lightbulb,
  HelpCircle,
  Target,
  Zap,
  Square,
  AlertCircle,
  RefreshCw,
  Database,
  Copy,
  Check
} from 'lucide-react';
import Image from 'next/image';

interface Lesson {
  id: string;
  title: string;
  type: "video" | "notes" | "quick" | "mixed";
  duration: string;
  isCompleted: boolean;
  lastPosition: number;
  watchTime: number;
  order: number;
  description?: string;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface ChatRequest {
  message: string;
  lessonId?: string;
  lessonTitle?: string;
  lessonType?: string;
  conversationHistory?: Message[];
}

interface ChatResponse {
  message: string;
  success: boolean;
  lessonContext?: boolean;
  error?: string;
}

interface AIChatSidebarProps {
  selectedLesson: Lesson | null;
  sidebarOpen: boolean;
  onSidebarClose: () => void;
  userId?: string;
  texts: {
    notes: string;
    myuniNotes: string;
    loading: string;
    error: string;
  };
}

export default function AIChatSidebar({
  selectedLesson,
  sidebarOpen,
  onSidebarClose,
}: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [lessonContextAvailable, setLessonContextAvailable] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mobile scrolling states
  const sidebarRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Gelişmiş öneriler
  const suggestedPrompts = React.useMemo(() => [
    {
      icon: <Lightbulb className="w-4 h-4" />,
      text: "Bu dersin ana konularını açıkla",
      description: "Temel kavramlar"
    },
    {
      icon: <HelpCircle className="w-4 h-4" />,
      text: "Bu konuyu nasıl daha iyi anlayabilirim?",
      description: "Öğrenme stratejileri"
    },
    {
      icon: <Target className="w-4 h-4" />,
      text: "Bu dersten sonra ne yapmalıyım?",
      description: "Sonraki adımlar"
    },
    {
      icon: <Zap className="w-4 h-4" />,
      text: "Pratik örnekler verebilir misin?",
      description: "Uygulamalı örnekler"
    }
  ], []);

  // Cihaz tipi kontrolü
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  // Mobile scroll ve touch yönetimi
  useEffect(() => {
    if (!sidebarOpen) return;

    const sidebar = sidebarRef.current;
    const backdrop = backdropRef.current;
    
    if (!sidebar || !backdrop) return;

    if (isMobile || isTablet) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.target && sidebar.contains(e.target as Node)) {
        setTouchStartY(e.touches[0].clientY);
        setIsDragging(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY !== null && e.target && sidebar.contains(e.target as Node)) {
        const currentY = e.touches[0].clientY;
        const diff = Math.abs(currentY - touchStartY);
        
        if (diff > 10) {
          setIsDragging(true);
        }
        
        e.stopPropagation();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging && touchStartY !== null) {
        const target = e.target as Node;
        if (backdrop.contains(target) && !sidebar.contains(target)) {
          onSidebarClose();
        }
      }
      
      setTouchStartY(null);
      setIsDragging(false);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      if (isMobile || isTablet) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      }
      
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sidebarOpen, isMobile, isTablet, touchStartY, isDragging, onSidebarClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (!isMobile && !isTablet && e.target === e.currentTarget) {
      onSidebarClose();
    }
  }, [isMobile, isTablet, onSidebarClose]);

  // Ders değiştiğinde sohbeti sıfırla
  useEffect(() => {
    setMessages([]);
    setInputValue('');
    setIsLoading(false);
    setError(null);
    setLessonContextAvailable(false);
    
    if (inputRef.current) {
      inputRef.current.style.height = '56px';
    }
  }, [selectedLesson?.id]);

  // Otomatik scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mouse resize (sadece desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile || isTablet) return;
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (isMobile || isTablet) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 320;
      const maxWidth = 700;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, isMobile, isTablet]);

  // Input değişikliklerini handle et
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
  };

  // Gelişmiş mesaj gönderme fonksiyonu
  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;

    // Mesaj uzunluğu kontrolü
    if (text.length > 1000) {
      setError('Mesaj çok uzun. Lütfen 1000 karakterden kısa yazın.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setError(null);
    
    if (inputRef.current) {
      inputRef.current.style.height = '56px';
    }
    
    setIsLoading(true);

    try {
      const requestBody: ChatRequest = {
        message: text,
        lessonId: selectedLesson?.id,
        lessonTitle: selectedLesson?.title,
        lessonType: selectedLesson?.type,
        conversationHistory: messages.slice(-4) // Son 4 mesaj
      };

      console.log('Gelişmiş AI isteği gönderiliyor:', { 
        hasLessonId: !!selectedLesson?.id,
        lessonTitle: selectedLesson?.title,
        messageLength: text.length
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP hatası: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'AI yanıt hatası');
      }

      if (!data.message || data.message.trim().length === 0) {
        throw new Error('AI boş yanıt döndürdü');
      }

      // Ders bağlamı kullanıldıysa işaretle
      if (data.lessonContext) {
        setLessonContextAvailable(true);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.message.trim(),
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      console.log('Gelişmiş AI yanıtı alındı:', { 
        responseLength: data.message?.length || 0,
        usedLessonContext: data.lessonContext
      });

    } catch (error) {
      console.error('Gelişmiş AI Chat Hatası:', error);
      
      let errorMessage = 'Üzgünüm, teknik bir sorun yaşıyorum. Lütfen tekrar deneyin.';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Bağlantı sorunu yaşıyorum. İnternet bağlantınızı kontrol edin.';
        } else {
          setError(error.message);
        }
      }
      
      const errorAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: errorMessage,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Önerilere geri dön
  const handleBackToSuggestions = () => {
    setMessages([]);
    setInputValue('');
    setIsLoading(false);
    setError(null);
    setLessonContextAvailable(false);
    
    if (inputRef.current) {
      inputRef.current.style.height = '56px';
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue('');
    handleSendMessage(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Son mesajı tekrar dene
  const handleRetry = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user');
      if (lastUserMessage) {
        setMessages(prev => prev.slice(0, -1));
        handleSendMessage(lastUserMessage.content);
      }
    }
  };

  // Zaman formatı
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Gelişmiş mesaj içeriği render etme
  const renderMessageContent = (content: string) => {
    // Kod bloklarını tespit et - daha güvenilir regex
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let codeBlockId = 0;
    let match;

    // Reset regex
    codeBlockRegex.lastIndex = 0;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Kod bloğundan önce metin ekle
      if (match.index! > lastIndex) {
        const textContent = content.slice(lastIndex, match.index);
        if (textContent.trim()) {
          parts.push({
            type: 'text',
            content: textContent
          });
        }
      }

      // Kod bloğunu ekle
      const language = match[1] || 'text';
      const code = match[2]?.trim() || '';
      
      if (code) {
        parts.push({
          type: 'code',
          content: code,
          language: language,
          id: `code-${Date.now()}-${codeBlockId++}`
        });
      }

      lastIndex = match.index! + match[0].length;
    }

    // Kalan metni ekle
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      if (remainingText.trim()) {
        parts.push({
          type: 'text',
          content: remainingText
        });
      }
    }

    // Hiç kod bloğu yoksa tüm içeriği metin olarak döndür
    if (parts.length === 0) {
      return [{
        type: 'text',
        content: content
      }];
    }

    return parts;
  };

  // Panoya kopyala
  const copyToClipboard = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(codeId);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch (err) {
      console.error('Kod kopyalama hatası:', err);
      // Eski tarayıcılar için fallback
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopiedCodeId(codeId);
        setTimeout(() => setCopiedCodeId(null), 2000);
      } catch (copyErr) {
        console.error('Fallback kopyalama da başarısız:', copyErr);
      }
      
      document.body.removeChild(textArea);
    }
  };

  // Dil görüntü adı
  const getLanguageDisplayName = (lang: string) => {
    const languageMap: { [key: string]: string } = {
      'js': 'JavaScript',
      'javascript': 'JavaScript',
      'ts': 'TypeScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'csharp': 'C#',
      'css': 'CSS',
      'html': 'HTML',
      'xml': 'XML',
      'json': 'JSON',
      'sql': 'SQL',
      'bash': 'Bash',
      'shell': 'Shell',
      'php': 'PHP',
      'ruby': 'Ruby',
      'go': 'Go',
      'rust': 'Rust',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'dart': 'Dart',
      'text': 'Metin'
    };
    return languageMap[lang.toLowerCase()] || lang.toUpperCase();
  };

  return (
    <>
      {/* Gelişmiş backdrop */}
      {sidebarOpen && (
        <div 
          ref={backdropRef}
          className="fixed inset-0 bg-black/5 z-40 lg:hidden transition-opacity duration-300"
          onClick={handleBackdropClick}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget && !isDragging) {
              onSidebarClose();
            }
          }}
        />
      )}

      {/* Gelişmiş scrollbar stilleri */}
      <style jsx>{`
        .minimal-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #e5e7eb transparent;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        
        .minimal-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        
        .minimal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .minimal-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 0px;
        }
        
        .dark .minimal-scrollbar {
          scrollbar-color: #374151 transparent;
        }
        
        .dark .minimal-scrollbar::-webkit-scrollbar-thumb {
          background-color: #374151;
        }

        /* Gelişmiş kod bloğu stilleri */
        .code-block {
          background: #1e1e1e;
          border-radius: 8px;
          overflow: hidden;
          margin: 12px 0;
          border: 1px solid #333;
          max-width: 100%;
          width: 100%;
          font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .dark .code-block {
          background: #0d1117;
          border-color: #21262d;
        }

        .code-header {
          background: #2d2d2d;
          border-bottom: 1px solid #333;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #8b949e;
          flex-shrink: 0;
          font-weight: 500;
        }

        .dark .code-header {
          background: #161b22;
          border-bottom-color: #21262d;
        }

        .code-content {
          padding: 16px;
          overflow-x: auto;
          overflow-y: hidden;
          font-size: 13px;
          line-height: 1.6;
          color: #e6edf3;
          white-space: pre;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: #4a5568 transparent;
          max-width: 100%;
          width: 100%;
          box-sizing: border-box;
          font-family: inherit;
        }

        .code-content::-webkit-scrollbar {
          height: 6px;
        }

        .code-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .code-content::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 3px;
        }

        .code-content::-webkit-scrollbar-thumb:hover {
          background: #718096;
        }

        .copy-button {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #21262d;
          border: 1px solid #30363d;
          border-radius: 4px;
          color: #8b949e;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
          font-weight: 500;
        }

        .copy-button:hover {
          background: #30363d;
          color: #f0f6fc;
          border-color: #444c56;
        }

        .copy-button:active {
          transform: scale(0.95);
        }

        .copy-button.copied {
          background: #238636;
          border-color: #238636;
          color: white;
        }

        /* İyileştirilmiş mobile optimizasyonları */
        @media (max-width: 1023px) {
          .mobile-ai-sidebar {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
            height: 100vh;
            height: 100dvh;
          }
          
          .mobile-ai-sidebar .minimal-scrollbar {
            max-height: calc(100vh - 250px);
            max-height: calc(100dvh - 250px);
          }

          .code-content {
            font-size: 12px;
            padding: 12px;
          }

          .code-header {
            padding: 6px 10px;
            font-size: 11px;
          }

          .copy-button {
            padding: 3px 6px;
            font-size: 10px;
          }
        }

        /* Çok uzun kelimeler için word break */
        .message-text {
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
      `}</style>

      <div 
        ref={sidebarRef}
        className={`${
          sidebarOpen ? ((isMobile || isTablet) ? 'translate-x-0' : '') : ((isMobile || isTablet) ? 'translate-x-full' : 'w-0')
        } transition-all duration-500 ease-out overflow-hidden border-l border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col mobile-ai-sidebar ${
          isMobile 
            ? 'fixed right-0 top-0 h-screen z-50 w-full' 
            : isTablet
            ? 'fixed right-0 top-0 h-screen z-50 w-96'
            : 'fixed right-0 top-0 h-screen z-50 lg:relative lg:z-auto lg:h-full'
        }`}
        style={{ 
          width: (isMobile || isTablet)
            ? (sidebarOpen ? undefined : '0px')
            : (sidebarOpen ? `${sidebarWidth}px` : '0px')
        }}
      >
        {/* Resize handle */}
        {sidebarOpen && !isMobile && !isTablet && (
          <div
            className="hidden lg:block absolute left-0 top-0 w-1 h-full cursor-col-resize group z-10"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-0.5 w-0.5 h-12 bg-gray-300 dark:bg-neutral-600 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
          </div>
        )}

        {/* Gelişmiş header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center p-1">
                <Image
                  src="/myuni-icon.png"
                  alt="MyUNI AI"
                  width={32}
                  height={32}
                  className="block dark:hidden object-contain"
                />
                <Image
                  src="/myuni-icon2.png"
                  alt="MyUNI AI"
                  width={32}
                  height={32}
                  className="hidden dark:block object-contain"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                    MyUNI AI
                  </h2>
                  {lessonContextAvailable && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Database className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">
                        Ders İçeriği
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-neutral-400 font-medium">
                  {isLoading ? 'Düşünüyor...' : 'Yapay Zeka Desteği'}
                </p>
              </div>
            </div>
            <button 
              onClick={onSidebarClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-all duration-200 flex-shrink-0"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
            </button>
          </div>

          {/* Gelişmiş hata göstergesi */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                    {error}
                  </p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-2 inline-flex items-center space-x-1 text-xs text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    <span>Kapat</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Gelişmiş ders bağlamı gösterimi */}
          {selectedLesson && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-neutral-800 border-l-2 border-[#990000]">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-neutral-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {selectedLesson.title}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-gray-600 dark:text-neutral-400 font-medium">
                      Aktif Ders
                    </p>
                    {selectedLesson.description && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <div className="flex items-center space-x-1">
                          <Database className="w-3 h-3 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            İçerik mevcut
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Basit ve etkili öneri kartları */}
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-6 h-6 bg-gray-800 dark:bg-gray-200 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white dark:text-gray-800" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {selectedLesson ? 'Bu Ders İçin Öneriler' : 'Hızlı Başlangıç'}
                </span>
              </div>
              
              <div className="grid gap-3">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt.text)}
                    disabled={isLoading}
                    className="group p-4 text-left border border-gray-200 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-500 transition-all duration-300 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-750 active:bg-gray-100 dark:active:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-neutral-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-neutral-600 transition-all duration-300">
                        <div className="text-gray-600 dark:text-neutral-400 group-hover:text-gray-800 dark:group-hover:text-gray-200">
                          {prompt.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {prompt.text}
                          </div>
                          <Square className="w-3 h-3 text-gray-400 group-hover:text-[#990000] transition-all duration-300" />
                        </div>
                        <div className="text-xs text-gray-600 dark:text-neutral-400 font-medium">
                          {prompt.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mesajlar alanı */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              {selectedLesson?.description && (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Ders İçeriği Hazır
                    </p>
                    <p className="text-xs text-gray-600 dark:text-neutral-400 max-w-48">
                      Bu dersin içeriğini biliyorum. Size daha detaylı yardım edebilirim.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto minimal-scrollbar overscroll-contain">
              {/* Önerilere dön butonu */}
              <div className="p-4 border-b border-gray-100 dark:border-neutral-800">
                <button
                  onClick={handleBackToSuggestions}
                  disabled={isLoading}
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 active:text-gray-900 dark:active:text-gray-100 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Yeni sohbet başlat</span>
                </button>
              </div>
              
              <div className="p-5 space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${message.type === 'user' ? 'max-w-[85%] order-2' : 'max-w-[95%]'}`}>
                      <div className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {/* Gelişmiş avatarlar */}
                        <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                          message.type === 'user' 
                            ? 'bg-gray-800 dark:bg-gray-200' 
                            : 'bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 p-1'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="w-4 h-4 text-white dark:text-gray-800" />
                          ) : (
                            <>
                              <Image
                                src="/myuni-icon.png"
                                alt="MyUNI AI"
                                width={24}
                                height={24}
                                className="block dark:hidden object-contain"
                              />
                              <Image
                                src="/myuni-icon2.png"
                                alt="MyUNI AI"
                                width={24}
                                height={24}
                                className="hidden dark:block object-contain"
                              />
                            </>
                          )}
                        </div>
                        
                        {/* Gelişmiş mesaj baloncukları */}
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className={`px-5 py-3 w-full ${
                            message.type === 'user'
                              ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800'
                              : 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-neutral-700'
                          }`}>
                            <div className="text-sm leading-relaxed font-medium">
                              {message.type === 'ai' ? (
                                // AI mesajlarını kod bloğu desteği ile render et
                                <div className="w-full overflow-hidden">
                                  {renderMessageContent(message.content).map((part, index) => {
                                    if (part.type === 'text') {
                                      return (
                                        <span key={index} className="whitespace-pre-wrap message-text">
                                          {part.content}
                                        </span>
                                      );
                                    } else if (part.type === 'code') {
                                      return (
                                        <div key={index} className="code-block">
                                          <div className="code-header">
                                            <span>{getLanguageDisplayName(part.language!)}</span>
                                            <button
                                              onClick={() => copyToClipboard(part.content, part.id!)}
                                              className={`copy-button ${copiedCodeId === part.id ? 'copied' : ''}`}
                                            >
                                              {copiedCodeId === part.id ? (
                                                <>
                                                  <Check className="w-3 h-3" />
                                                  <span>Kopyalandı</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Copy className="w-3 h-3" />
                                                  <span>Kopyala</span>
                                                </>
                                              )}
                                            </button>
                                          </div>
                                          <div className="code-content">
                                            {part.content}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              ) : (
                                // Kullanıcı mesajlarını basit metin olarak render et
                                <span className="whitespace-pre-wrap message-text">
                                  {message.content}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`text-xs px-2 font-medium ${
                            message.type === 'user' ? 'text-right text-gray-400' : 'text-left text-gray-500 dark:text-neutral-400'
                          }`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Gelişmiş yükleme göstergesi */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 flex items-center justify-center p-1">
                        <Image
                          src="/myuni-icon.png"
                          alt="MyUNI AI"
                          width={24}
                          height={24}
                          className="block dark:hidden object-contain"
                        />
                        <Image
                          src="/myuni-icon2.png"
                          alt="MyUNI AI"
                          width={24}
                          height={24}
                          className="hidden dark:block object-contain"
                        />
                      </div>
                      <div className="bg-gray-100 dark:bg-neutral-800 px-5 py-3 border border-gray-200 dark:border-neutral-700">
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-[#990000] rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-[#990000] rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                            <div className="w-2 h-2 bg-[#990000] rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-neutral-400 font-bold">
                            {lessonContextAvailable ? 'Ders içeriğini analiz ediyor...' : 'Düşünüyor...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
                <div className="h-16 lg:h-4"></div>
              </div>
            </div>
          )}
        </div>

        {/* Gelişmiş input alanı */}
        <div className="flex-shrink-0 p-5 border-t border-gray-100 dark:border-neutral-800">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={selectedLesson ? `${selectedLesson.title} hakkında sorun...` : "Mesajınızı yazın..."}
              disabled={isLoading}
              className="w-full p-4 pr-16 border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#990000] focus:border-[#990000] resize-none transition-all duration-300 min-h-[56px] max-h-32 text-sm font-medium disabled:opacity-50"
              rows={1}
              maxLength={1000}
            />
            
            {/* Karakter sayacı */}
            <div className="absolute bottom-12 right-4 text-xs text-gray-400 dark:text-neutral-500">
              {inputValue.length}/1000
            </div>
            
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-3 bottom-3 p-3 bg-gray-800 dark:bg-gray-200 hover:bg-[#990000] dark:hover:bg-[#990000] text-white dark:text-gray-800 hover:text-white dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          {/* Gelişmiş klavye kısayolları ve retry butonu */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-neutral-400 font-medium">
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-xs font-bold">Enter</kbd>
                <span>gönder</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 dark:bg-neutral-500 rounded-full"></div>
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-xs font-bold">⇧ + Enter</kbd>
                <span>yeni satır</span>
              </div>
            </div>
            
            {/* Retry butonu */}
            {error && messages.length > 0 && (
              <button
                onClick={handleRetry}
                disabled={isLoading}
                className="flex items-center space-x-1 text-xs text-gray-600 dark:text-neutral-400 hover:text-[#990000] dark:hover:text-[#990000] transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Tekrar dene</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}