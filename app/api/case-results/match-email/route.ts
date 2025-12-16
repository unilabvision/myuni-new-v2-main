import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { currentUser } from '@clerk/nextjs/server';

/**
 * API Endpoint: Email eşleştirmesi yaparak case result'ı user_id ile ilişkilendir
 * 
 * Bu endpoint kullanıcı giriş yaptığında veya dashboard'a girdiğinde çağrılır
 * Clerk'daki email ile form'dan gönderilen contact_email veya backup_email eşleştirilir
 */
export async function POST(request: NextRequest) {
  try {
    // Clerk user bilgisini al
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Clerk'dan email al
    const clerkEmail = user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress;
    
    if (!clerkEmail) {
      return NextResponse.json(
        { error: 'No email found in Clerk user' },
        { status: 400 }
      );
    }

    const clerkUserId = user.id;
    const normalizedEmail = clerkEmail.toLowerCase().trim();

    console.log('=== EMAIL MATCHING DEBUG ===');
    console.log('Clerk User ID:', clerkUserId);
    console.log('Clerk Email:', normalizedEmail);

    // SQL function kullanarak email eşleştirmesi yap
    // Supabase'de match_case_result_with_user fonksiyonunu çağır
    const { data, error } = await supabase.rpc('match_case_result_with_user', {
      user_email: normalizedEmail,
      clerk_user_id: clerkUserId
    });

    if (error) {
      console.error('Email matching error:', error);
      
      // Eğer function yoksa, manuel eşleştirme yap
      const { data: matchedResults, error: updateError } = await supabase
        .from('myuni_case_result')
        .update({ user_id: clerkUserId, updated_at: new Date().toISOString() })
        .or(`contact_email.ilike.${normalizedEmail},backup_email.ilike.${normalizedEmail}`)
        .is('user_id', null)
        .select();

      if (updateError) {
        console.error('Manual email matching error:', updateError);
        return NextResponse.json(
          { error: 'Failed to match email', details: updateError.message },
          { status: 500 }
        );
      }

      console.log('Manual matching result:', matchedResults?.length || 0, 'records matched');
      
      return NextResponse.json({
        success: true,
        matched_count: matchedResults?.length || 0,
        message: 'Email matched successfully'
      });
    }

    console.log('Function matching result:', data, 'records matched');

    return NextResponse.json({
      success: true,
      matched_count: data || 0,
      message: 'Email matched successfully'
    });

  } catch (error) {
    console.error('Case result email matching error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET: Kullanıcının case result'ını email ile kontrol et (eşleşme var mı?)
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

    const clerkEmail = user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress;
    
    if (!clerkEmail) {
      return NextResponse.json(
        { error: 'No email found in Clerk user' },
        { status: 400 }
      );
    }

    const normalizedEmail = clerkEmail.toLowerCase().trim();

    // Email ile eşleşen kayıt var mı kontrol et
    const { data, error } = await supabase
      .from('myuni_case_result')
      .select('id, contact_email, backup_email, user_id')
      .or(`contact_email.ilike.${normalizedEmail},backup_email.ilike.${normalizedEmail}`)
      .maybeSingle();

    if (error) {
      console.error('Check email match error:', error);
      return NextResponse.json(
        { error: 'Failed to check email match', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      has_match: !!data,
      is_linked: data?.user_id === user.id,
      case_result_id: data?.id || null
    });

  } catch (error) {
    console.error('Check email match error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

