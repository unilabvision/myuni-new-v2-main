import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { currentUser } from '@clerk/nextjs/server';

/**
 * GET: Kullanıcının case result sonuçlarını getir
 * Email eşleştirmesi yapıldıktan sonra kullanıcı dashboard'da sonuçlarını görebilir
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const clerkUserId = user.id;
    const clerkEmail = user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress;
    
    if (!clerkEmail) {
      return NextResponse.json(
        { error: 'No email found in Clerk user' },
        { status: 400 }
      );
    }

    const normalizedEmail = clerkEmail.toLowerCase().trim();

    console.log('=== GET CASE RESULT ===');
    console.log('User ID:', clerkUserId);
    console.log('User Email:', normalizedEmail);

    // Önce user_id ile eşleşen kayıt ara
    let caseResult;
    const { data, error } = await supabase
      .from('myuni_case_result')
      .select('*')
      .eq('user_id', clerkUserId)
      .maybeSingle();
    
    caseResult = data;

    // Eğer user_id ile eşleşme yoksa, email ile ara (eşleştirme yapılmamış olabilir)
    if (!caseResult && !error) {
      console.log('No match found with user_id, trying email match...');
      
      const { data: emailMatchResult, error: emailError } = await supabase
        .from('myuni_case_result')
        .select('*')
        .or(`contact_email.ilike.${normalizedEmail},backup_email.ilike.${normalizedEmail}`)
        .maybeSingle();

      if (emailError) {
        console.error('Email match error:', emailError);
      } else if (emailMatchResult) {
        console.log('Found match with email, but not linked yet');
        // Email ile eşleşme var ama user_id atanmamış
        // Bu durumda otomatik eşleştirme yapabiliriz
        const { data: updatedResult, error: updateError } = await supabase
          .from('myuni_case_result')
          .update({ user_id: clerkUserId, updated_at: new Date().toISOString() })
          .eq('id', emailMatchResult.id)
          .select()
          .single();

        if (!updateError && updatedResult) {
          caseResult = updatedResult;
          console.log('Auto-linked case result to user');
        }
      }
    }

    if (error) {
      console.error('Get case result error:', error);
      return NextResponse.json(
        { error: 'Failed to get case result', details: error.message },
        { status: 500 }
      );
    }

    if (!caseResult) {
      return NextResponse.json(
        { error: 'No case result found for this user' },
        { status: 404 }
      );
    }

    // Sıralama hesapla (rank) - general_score'a göre sıralama
    // Aynı puanlar aynı sıralamada gösterilir (created_at'e bakılmaz)
    // Sadece daha yüksek puanlı kayıtlar sayılır
    let rank = null;
    if (caseResult.general_score !== null) {
      try {
        // Sadece daha yüksek general_score'a sahip kayıtları say
        // Aynı puanlılar aynı sıralamada olacak
        const { count: higherScoreCount, error: higherError } = await supabase
          .from('myuni_case_result')
          .select('id', { count: 'exact', head: true })
          .gt('general_score', caseResult.general_score)
          .not('general_score', 'is', null);

        if (higherError) {
          console.error('Higher score count error:', higherError);
        }

        // Rank = Daha yüksek puanlıların sayısı + 1
        // Aynı puanlılar aynı sıralamada olacak
        // Örnek: 95 (3 kişi) -> 1. sıra, 94 (1 kişi) -> 4. sıra
        const higherCount = higherScoreCount ?? 0;
        rank = higherCount + 1;

      } catch (error) {
        console.error('Rank calculation error:', error);
        // Fallback: Sadece general_score'a göre say
        const { count: simpleCount, error: simpleError } = await supabase
          .from('myuni_case_result')
          .select('id', { count: 'exact', head: true })
          .gt('general_score', caseResult.general_score)
          .not('general_score', 'is', null);
        
        if (!simpleError && simpleCount !== null) {
          rank = simpleCount + 1;
        }
      }
    }

    // Güvenlik: Hassas bilgileri filtrele (isteğe bağlı)
    const { 
      participant_name, 
      subject, 
      highlight_direction,
      general_score,
      comments,
      second_instructor_score,
      average_score,
      second_comments,
      created_at
    } = caseResult;

    return NextResponse.json({
      success: true,
      data: {
        participant_name,
        // Email'leri göstermek istemiyorsanız kaldırabilirsiniz
        // contact_email: contact_email ? contact_email.charAt(0) + '***' + '@' + contact_email.split('@')[1] : null,
        subject,
        highlight_direction,
        general_score,
        comments,
        second_instructor_score,
        average_score,
        second_comments,
        rank,
        created_at
      }
    });

  } catch (error) {
    console.error('Get case result error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

