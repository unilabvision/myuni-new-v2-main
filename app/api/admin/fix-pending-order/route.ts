import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * ADMIN ENDPOINT - Pending order'ları completed yap ve enrollment oluştur
 * POST /api/admin/fix-pending-order
 * Body: { orderId: "ORDER_ID" }
 * 
 * Bu endpoint:
 * 1. Order'ı "completed" yapar
 * 2. CartItems'daki her course için enrollment oluşturur
 * 3. Order'a enrollmentId atar
 * 
 * ÖNEMLİ: Sadece Iyzico'da ödeme başarılı görünen order'lar için kullanın!
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = body.orderId;

    if (!orderId) {
      return NextResponse.json({ 
        error: 'orderId gerekli' 
      }, { status: 400 });
    }

    // 1. Order'ı getir
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('orderid', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({
        error: 'Order bulunamadı',
        details: orderError,
      }, { status: 404 });
    }

    const userId = order.custom_data?.userId || order.useremail;
    const isCartMode = order.custom_data?.cartMode === true;
    const cartItems = order.custom_data?.cartItems || [];

    const results = {
      orderUpdated: false,
      enrollmentsCreated: [] as any[],
      errors: [] as any[],
      wasAlreadyCompleted: order.status === 'completed',
    };

    // 2. Order'ı completed yap (eğer değilse)
    if (order.status !== 'completed') {
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('orderid', orderId);

      if (updateError) {
        return NextResponse.json({
          error: 'Order güncellenemedi',
          details: updateError,
        }, { status: 500 });
      }

      results.orderUpdated = true;
    }

    // 3. Enrollment oluştur
    let firstEnrollmentId: string | undefined;

    if (isCartMode && cartItems.length > 0) {
      // Sepet modu - her item için enrollment
      for (const item of cartItems) {
        try {
          if (item.type === 'course') {
            const { data: existingEnrollment } = await supabaseAdmin
              .from('myuni_enrollments')
              .select('id, is_active')
              .eq('user_id', userId)
              .eq('course_id', item.id)
              .maybeSingle();

            if (existingEnrollment) {
              if (!existingEnrollment.is_active) {
                await supabaseAdmin
                  .from('myuni_enrollments')
                  .update({ 
                    is_active: true,
                    enrolled_at: new Date().toISOString() 
                  })
                  .eq('id', existingEnrollment.id);

                results.enrollmentsCreated.push({
                  courseId: item.id,
                  courseName: item.title,
                  action: 'activated',
                  enrollmentId: existingEnrollment.id,
                });

                if (!firstEnrollmentId) {
                  firstEnrollmentId = existingEnrollment.id;
                }
              }
            } else {
              const { data: newEnrollment, error: enrollError } = await supabaseAdmin
                .from('myuni_enrollments')
                .insert({
                  user_id: userId,
                  course_id: item.id,
                  enrolled_at: new Date().toISOString(),
                  progress_percentage: 0,
                  is_active: true,
                })
                .select()
                .single();

              if (enrollError) {
                results.errors.push({
                  courseId: item.id,
                  error: enrollError.message,
                });
              } else {
                results.enrollmentsCreated.push({
                  courseId: item.id,
                  courseName: item.title,
                  action: 'created',
                  enrollmentId: newEnrollment.id,
                });

                if (!firstEnrollmentId) {
                  firstEnrollmentId = newEnrollment.id;
                }
              }
            }
          } else if (item.type === 'package') {
            const { checkUserPackageEnrollment, enrollUserInPackage } = await import(
              '@/lib/enrollmentService'
            );
            const alreadyEnrolled = await checkUserPackageEnrollment(userId, item.id);
            
            if (!alreadyEnrolled) {
              await enrollUserInPackage(userId, item.id, orderId);
              results.enrollmentsCreated.push({
                packageId: item.id,
                packageName: item.title,
                action: 'enrolled_in_package',
              });
            }
          } else if (item.type === 'product') {
            const { data: existingPurchase } = await supabaseAdmin
              .from('myuni_products_purchases')
              .select('id')
              .eq('user_id', userId)
              .eq('product_id', item.id)
              .maybeSingle();

            if (!existingPurchase) {
              const { data: newPurchase } = await supabaseAdmin
                .from('myuni_products_purchases')
                .insert({
                  user_id: userId,
                  product_id: item.id,
                  purchased_at: new Date().toISOString(),
                  price_paid: item.price || 0,
                })
                .select()
                .single();

              results.enrollmentsCreated.push({
                productId: item.id,
                productName: item.title,
                action: 'purchased',
                purchaseId: newPurchase?.id,
              });
            }
          }
        } catch (error) {
          results.errors.push({
            itemId: item.id,
            itemTitle: item.title,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } else {
      // Tekil kurs modu
      const courseId = order.courseid;
      const { data: existingEnrollment } = await supabaseAdmin
        .from('myuni_enrollments')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (existingEnrollment) {
        if (!existingEnrollment.is_active) {
          await supabaseAdmin
            .from('myuni_enrollments')
            .update({ 
              is_active: true,
              enrolled_at: new Date().toISOString() 
            })
            .eq('id', existingEnrollment.id);

          firstEnrollmentId = existingEnrollment.id;
        }
      } else {
        const { data: newEnrollment } = await supabaseAdmin
          .from('myuni_enrollments')
          .insert({
            user_id: userId,
            course_id: courseId,
            enrolled_at: new Date().toISOString(),
            progress_percentage: 0,
            is_active: true,
          })
          .select()
          .single();

        firstEnrollmentId = newEnrollment?.id;
      }

      results.enrollmentsCreated.push({
        courseId,
        courseName: order.coursename,
        action: 'created',
        enrollmentId: firstEnrollmentId,
      });
    }

    // 4. Order'a enrollment ID'yi ekle
    if (firstEnrollmentId) {
      await supabaseAdmin
        .from('orders')
        .update({
          enrolled: true,
          enrollmentid: firstEnrollmentId,
        })
        .eq('orderid', orderId);
    }

    return NextResponse.json({
      success: true,
      message: 'Order başarıyla düzeltildi',
      orderId,
      results,
    });
  } catch (error) {
    console.error('Fix pending order error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
