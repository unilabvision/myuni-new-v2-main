// app/api/comments/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth, currentUser } from '@clerk/nextjs/server';

// Basit spam kontrolü
function isSpam(content: string): boolean {
  // Temel spam kontrolleri
  const spamIndicators = [
    // Aşırı link içeriyor mu?
    (content.match(/https?:\/\//g) || []).length > 2,
    
    // Aşırı kısa veya tek karakter tekrarı mı?
    content.length < 3 || /^(.)\1+$/.test(content),
    
    // Yasaklı kelimeler (örnek)
    /\b(viagra|casino|porn|xxx)\b/i.test(content),
    
    // Aşırı fazla büyük harf kullanımı
    content.length > 10 && (content.match(/[A-Z]/g) || []).length / content.length > 0.8,
    
    // Aşırı fazla özel karakter kullanımı
    (content.match(/[^a-zA-Z0-9\s.,!?'"ğüşöçıİĞÜŞÖÇ]/g) || []).length / content.length > 0.3,
    
    // Aynı karakter çok fazla tekrar ediyor mu?
    /(.)\1{4,}/.test(content),
    
    // Telefon numarası kalıpları
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g.test(content),
    
    // E-posta adresleri (yorumlarda genelde spam)
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g.test(content)
  ];
  
  // Herhangi bir spam göstergesi varsa true döndür
  return spamIndicators.some(indicator => indicator === true);
}

// Yorumları getir
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');
  const status = searchParams.get('status') || 'approved';

  if (!postId) {
    return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ comments: data });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}


// Yorum silme
export async function DELETE(request: Request) {
    try {
      // Auth kontrolü
      const { userId } = await auth();
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const { searchParams } = new URL(request.url);
      const commentId = searchParams.get('commentId');
  
      if (!commentId) {
        return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
      }
  
      // Önce yorumu kontrol et - kullanıcı sadece kendi yorumunu silebilir
      const { data: comment, error: fetchError } = await supabase
        .from('blog_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();
  
      if (fetchError || !comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }
  
      // Kullanıcı kontrolü
      if (comment.user_id !== userId) {
        return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 });
      }
  
      // Yorumu sil
      const { error: deleteError } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', commentId);
  
      if (deleteError) {
        throw deleteError;
      }
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ 
        error: 'Failed to delete comment', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, { status: 500 });
    }
  }

// Yorum ekle
export async function POST(request: Request) {
  try {
    // Auth kontrolü
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clerk'ten kullanıcı bilgilerini alalım
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { postId, locale, content } = body;

    if (!postId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Kullanıcı adını oluştur
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.username || 'Anonymous';
    
    // Email adresini al
    const userEmail = user.emailAddresses?.[0]?.emailAddress || '';

    // Spam kontrolü
    const isSpamContent = isSpam(content);
    
    // Eğer spam ise, kullanıcıya hata döndürmeden sessizce reddedelim
    if (isSpamContent) {
      // Yine de veritabanına kaydedelim ama "rejected" olarak
      const { error } = await supabase
        .from('blog_comments')
        .insert([
          {
            post_id: postId,
            user_id: userId,
            user_name: userName,
            user_email: userEmail,
            content,
            locale,
            status: 'rejected' // Spam olarak işaretle
          }
        ]);

      if (error) {
        console.error('Error inserting spam comment:', error);
      }

      // Kullanıcıya başarılı gibi görünsün
      return NextResponse.json({ 
        comment: { 
          id: 'temp-id', 
          status: 'pending' 
        }
      });
    }

    

    // Spam değilse, direkt onayla
    const { data, error } = await supabase
      .from('blog_comments')
      .insert([
        {
          post_id: postId,
          user_id: userId,
          user_name: userName,
          user_email: userEmail,
          content,
          locale,
          status: 'approved' // Spam değilse otomatik onayla
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting comment:', error);
      throw error;
    }

    return NextResponse.json({ comment: data });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ 
      error: 'Failed to create comment', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}