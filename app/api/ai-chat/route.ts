// app/api/ai-chat/route.ts
import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold,
  GenerativeModel
} from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Type definitions
interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface LessonData {
  title: string;
  description: string | null;
  lesson_type: string;
  duration_minutes: number | null;
}

interface ChatRequest {
  message: string;
  lessonId?: string;
  lessonTitle?: string;
  lessonType?: string;
  conversationHistory?: ConversationMessage[];
}

interface ChatResponse {
  message: string;
  success: boolean;
  lessonContext?: boolean;
  error?: string;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Gelişmiş yanıt temizleme fonksiyonu
function cleanAIResponse(text: string): string {
  // Kod bloklarını geçici olarak koruma
  const codeBlocks: string[] = [];
  let codeBlockIndex = 0;
  
  // Kod bloklarını geçici placeholderlar ile değiştir
  let cleaned = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlockIndex}__`;
    // Kod içindeki literal \n'leri gerçek newline'a çevir
    const cleanCode = code?.replace(/\\n/g, '\n').trim() || '';
    codeBlocks[codeBlockIndex] = `\`\`\`${lang || 'text'}\n${cleanCode}\n\`\`\``;
    codeBlockIndex++;
    return placeholder;
  });

  // Markdown formatlarını temizle
  cleaned = cleaned
    // **Bold** formatını kaldır
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // *Italic* formatını kaldır  
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '$1')
    // ### Başlık formatlarını kaldır
    .replace(/^#{1,6}\s+/gm, '')
    // - Liste işaretlerini kaldır
    .replace(/^\s*[-•*]\s+/gm, '')
    // 1. Sayılı liste formatını kaldır
    .replace(/^\s*\d+\.\s+/gm, '')
    // > Alıntı işaretlerini kaldır
    .replace(/^\s*>\s+/gm, '')
    // Çoklu boşlukları tek boşluğa çevir
    .replace(/[ \t]+/g, ' ')
    // Çoklu satır sonlarını maksimum 2'ye sınırla
    .replace(/\n{3,}/g, '\n\n')
    // Başlangıç ve sondaki boşlukları temizle
    .trim();

  // Kod bloklarını geri yerleştir
  codeBlocks.forEach((block, index) => {
    cleaned = cleaned.replace(`__CODE_BLOCK_${index}__`, block);
  });

  return cleaned;
}

// Gelişmiş prompt oluşturma fonksiyonu
function createEnhancedPrompt(
  message: string, 
  lessonData: LessonData | null, 
  conversationHistory?: ConversationMessage[]
): string {
  let systemPrompt = `Sen MyUNI eğitim platformunun yapay zeka asistanısın. Görevin öğrencilere açık, anlaşılır ve pratik yardım sağlamak.

YANIT KURALLARI:
- Türkçe yanıtla
- Açık ve anlaşılır ol
- Maksimum 4-5 cümle kullan (kod örnekleri hariç)
- Teknik terimleri açıkla
- Pratik örnekler ver
- Hiçbir markdown formatı kullanma
- Yıldız (*), tire (-), numara (1.), hashtag (#) gibi işaretler kullanma
- Sadece düz metin ver
- Liste yapmak yerine virgülle ayır
- Kod için sadece üç backtick kullan: \`\`\`dil kodu \`\`\`

ÖNEMLİ: Yanıtlarında hiç formatting işareti kullanma. Sadece düz metin ve kod blokları.`;

  // Ders bağlamı ekle
  if (lessonData) {
    systemPrompt += `\n\nAKTİF DERS BİLGİLERİ:
Başlık: ${lessonData.title}
Tür: ${lessonData.lesson_type}`;
    
    if (lessonData.description) {
      // Ders açıklamasını temizle ve kısalt
      const cleanDescription = lessonData.description
        .replace(/[*#\-]/g, '')
        .replace(/\n+/g, ' ')
        .slice(0, 400)
        .trim();
      systemPrompt += `\nİçerik: ${cleanDescription}`;
    }
    
    if (lessonData.duration_minutes) {
      systemPrompt += `\nSüre: ${lessonData.duration_minutes} dakika`;
    }
  }

  systemPrompt += `\n\nKEsinlikle formatting kullanma. Düz metin ver.`;

  // Konuşma geçmişi ekle (sadece son 2 mesaj)
  let prompt = systemPrompt + "\n\n";
  
  if (conversationHistory && conversationHistory.length > 0) {
    const recentMessages = conversationHistory.slice(-2);
    prompt += "Son konuşma:\n";
    recentMessages.forEach(msg => {
      const cleanContent = msg.content.slice(0, 150).replace(/[*#\-]/g, '');
      prompt += `${msg.type === 'user' ? 'Öğrenci' : 'Asistan'}: ${cleanContent}\n`;
    });
    prompt += "\n";
  }

  prompt += `Öğrenci sorusu: ${message}\n\nDüz metin yanıt (formatting yok):`;
  
  return prompt;
}

// Yanıt doğrulama fonksiyonu
function validateResponse(text: string): { isValid: boolean; cleanedText: string; error?: string } {
  if (!text || text.trim().length === 0) {
    return { isValid: false, cleanedText: '', error: 'Boş yanıt' };
  }

  let cleaned = text.trim();

  // Çok kısa yanıtları reddet
  if (cleaned.length < 20) {
    return { isValid: false, cleanedText: cleaned, error: 'Yanıt çok kısa' };
  }

  // Çok uzun yanıtları kısalt
  if (cleaned.length > 1000) {
    // Kod bloğu var mı kontrol et
    const hasCodeBlocks = /```[\s\S]*?```/.test(cleaned);
    const maxLength = hasCodeBlocks ? 1200 : 800;
    
    if (cleaned.length > maxLength) {
      // Cümle sonlarından kes
      const sentences = cleaned.split(/[.!?]+/);
      let truncated = '';
      
      for (const sentence of sentences) {
        const newText = truncated + sentence + '.';
        if (newText.length <= maxLength - 100) {
          truncated = newText;
        } else {
          break;
        }
      }
      
      cleaned = truncated || cleaned.slice(0, maxLength - 50) + '...';
    }
  }

  return { isValid: true, cleanedText: cleaned };
}

// Retry fonksiyonu
async function generateResponseWithRetry(
  model: GenerativeModel, 
  prompt: string, 
  maxAttempts: number = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`AI yanıt denemesi ${attempt}/${maxAttempts}`);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (text && text.trim().length > 0) {
        return text.trim();
      }
      
      throw new Error(`Boş yanıt (deneme ${attempt})`);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Bilinmeyen hata');
      console.warn(`Deneme ${attempt} başarısız:`, lastError.message);
      
      if (attempt < maxAttempts) {
        // Üstel backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Tüm denemeler başarısız');
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Environment değişkenleri kontrolü
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY yapılandırılmamış');
      return NextResponse.json(
        { error: 'AI servisi yapılandırma hatası', success: false },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase yapılandırması eksik');
      return NextResponse.json(
        { error: 'Veritabanı yapılandırma hatası', success: false },
        { status: 500 }
      );
    }

    // Request body parse etme
    let body: ChatRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Geçersiz JSON formatı', success: false },
        { status: 400 }
      );
    }

    const { message, lessonId, conversationHistory } = body;

    // Comprehensive input validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mesaj gerekli ve string olmalı', success: false },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return NextResponse.json(
        { error: 'Mesaj boş olamaz', success: false },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 1000) {
      return NextResponse.json(
        { error: 'Mesaj çok uzun (maksimum 1000 karakter)', success: false },
        { status: 400 }
      );
    }

    // Zararlı içerik kontrolü (basit)
    const harmfulPatterns = [
      /\b(hack|exploit|virus|malware)\b/i,
      /\b(password|şifre)\s*(nedir|ne|what)\b/i,
      /\b(nasıl|how)\s*(hack|kır|break)\b/i
    ];
    
    if (harmfulPatterns.some(pattern => pattern.test(trimmedMessage))) {
      return NextResponse.json(
        { error: 'Bu tür sorular yanıtlanamaz', success: false },
        { status: 400 }
      );
    }

    if (conversationHistory && !Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { error: 'Konuşma geçmişi array olmalı', success: false },
        { status: 400 }
      );
    }

    console.log('AI isteği başlatıldı:', { 
      messageLength: trimmedMessage.length, 
      lessonId: lessonId || 'yok',
      historyLength: conversationHistory?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Ders verilerini çek
    let lessonData: LessonData | null = null;
    
    if (lessonId && typeof lessonId === 'string') {
      try {
        const { data, error } = await supabase
          .from('myuni_course_lessons')
          .select('title, description, lesson_type, duration_minutes')
          .eq('id', lessonId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Supabase sorgu hatası:', error.message);
        } else if (data) {
          lessonData = data as LessonData;
          console.log('Ders verisi başarıyla alındı:', { 
            title: data.title, 
            hasDescription: !!data.description,
            descriptionLength: data.description?.length || 0
          });
        } else {
          console.log('Ders bulunamadı');
        }
      } catch (dbError) {
        console.error('Veritabanı bağlantı hatası:', dbError);
        // Ders verisi alınamazsa devam et
      }
    }

    // Gelişmiş Gemini model yapılandırması
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp", // En güvenilir model
      generationConfig: {
        temperature: 0.2, // Çok düşük - tutarlılık için
        topK: 15,
        topP: 0.7,
        maxOutputTokens: 500,
        candidateCount: 1,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Gelişmiş prompt oluştur
    const enhancedPrompt = createEnhancedPrompt(trimmedMessage, lessonData, conversationHistory);

    console.log('Prompt hazırlandı:', { 
      promptLength: enhancedPrompt.length,
      hasLessonContext: !!lessonData?.description,
      model: 'gemini-2.0-flash-exp'
    });

    // AI yanıtı oluştur - retry ile
    const rawResponse = await generateResponseWithRetry(model, enhancedPrompt, 3);
    
    console.log('Ham AI yanıtı alındı:', { 
      length: rawResponse.length,
      firstChars: rawResponse.slice(0, 100) + '...',
      processingTime: Date.now() - startTime + 'ms'
    });

    // Yanıtı temizle
    const cleanedResponse = cleanAIResponse(rawResponse);
    
    // Yanıtı doğrula
    const validation = validateResponse(cleanedResponse);
    
    if (!validation.isValid) {
      console.error('Yanıt doğrulama hatası:', validation.error);
      throw new Error(`Yanıt kalitesi uygun değil: ${validation.error}`);
    }

    const finalResponse = validation.cleanedText;

    console.log('Temizlenmiş yanıt hazır:', { 
      originalLength: rawResponse.length,
      cleanedLength: finalResponse.length,
      hasLessonContext: !!lessonData?.description,
      totalProcessingTime: Date.now() - startTime + 'ms'
    });

    // Başarılı yanıt
    const responseData: ChatResponse = {
      message: finalResponse,
      success: true,
      lessonContext: !!lessonData?.description
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Processing-Time': `${Date.now() - startTime}ms`
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('AI Chat Genel Hatası:', {
      error: error,
      message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: processingTime + 'ms',
      timestamp: new Date().toISOString()
    });
    
    // Hata tipine göre mesaj seç
    let errorMessage = 'Teknik bir sorun yaşıyorum. Lütfen tekrar deneyin.';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('SAFETY')) {
        errorMessage = 'Bu soruyu güvenlik nedeniyle yanıtlayamıyorum. Lütfen farklı bir soru sorun.';
        statusCode = 400;
      } else if (error.message.includes('QUOTA') || error.message.includes('quota')) {
        errorMessage = 'Servis geçici olarak yoğun. Lütfen birkaç saniye sonra tekrar deneyin.';
        statusCode = 429;
      } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
        statusCode = 408;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Bağlantı sorunu yaşıyorum. İnternet bağlantınızı kontrol edin.';
        statusCode = 503;
      } else if (processingTime > 25000) {
        errorMessage = 'İşlem çok uzun sürdü. Lütfen daha kısa bir soru sorun.';
        statusCode = 408;
      }
    }
    
    // Fallback mesajları
    const fallbackMessages = [
      "Bu konuda size yardım etmeye çalışıyorum ancak şu anda teknik bir sorun yaşıyorum. Lütfen sorunuzu tekrar sorar mısınız?",
      "Bağlantı sorunu nedeniyle yanıt veremiyorum. Birkaç saniye bekleyip tekrar deneyebilir misiniz?",
      "Şu anda AI servisinde geçici bir kesinti var. Lütfen kısa süre sonra tekrar deneyin.",
      "Sistemi yeniden başlatıyorum. Lütfen birkaç saniye sonra tekrar deneyin."
    ];
    
    const randomFallback = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    
    return NextResponse.json({
      message: errorMessage,
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen sistem hatası',
      fallbackMessage: randomFallback
    }, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Processing-Time': `${processingTime}ms`,
        'X-Error-Type': error instanceof Error ? error.constructor.name : 'UnknownError'
      }
    });
  }
}