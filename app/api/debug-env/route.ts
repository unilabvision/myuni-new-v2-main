// GEÇICI DEBUG - Production'da çalıştıktan sonra silin!
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      
      // URL ve key'lerin ilk karakterlerini göster (güvenlik için sadece başlangıç)
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'MISSING',
      supabaseKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || 'MISSING',
      
      // Uzunlukları göster (doğru key'in girilip girilmediğini anlamak için)
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      supabaseKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      
      // Tüm NEXT_PUBLIC_ environment variable'larını listele
      allNextPublicVars: Object.keys(process.env)
        .filter(key => key.startsWith('NEXT_PUBLIC_'))
        .reduce((acc, key) => {
          acc[key] = '***SET***';
          return acc;
        }, {} as Record<string, string>)
    }
  });
}
