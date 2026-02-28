'use client';

import React, { useState, useEffect } from "react";
import { Star, Quote, ArrowLeft, ArrowRight, User } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CommentWithCourse {
    id: string;
    user_display_name: string;
    content: string;
    rating: number;
    created_at: string;
    myuni_courses: {
        title: string;
    } | null;
}

interface DynamicTestimonialSectionProps {
    locale?: string;
}

const DynamicTestimonialSection: React.FC<DynamicTestimonialSectionProps> = ({ locale = 'tr' }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [testimonials, setTestimonials] = useState<CommentWithCourse[]>([]);
    const [loading, setLoading] = useState(true);

    const texts = {
        tr: {
            badge: "💬 Kursiyer Değerlendirmeleri",
            title: "Kursiyerlerimiz Neler Söylüyor?",
            description: "MyUNI ile hedeflerine ulaşan kursiyerlerimizin kurslarımız hakkındaki değerlendirmelerini okuyun.",
            loading: "Yorumlar yükleniyor...",
            noComments: "Henüz yorum bulunmamaktadır.",
            courseLabel: "Tamamlanan Kurs"
        },
        en: {
            badge: "💬 Student Reviews",
            title: "What Our Students Say",
            description: "Read the reviews about our courses from students who reached their goals with MyUNI.",
            loading: "Loading reviews...",
            noComments: "No reviews yet.",
            courseLabel: "Completed Course"
        }
    };

    const t = texts[locale as keyof typeof texts] || texts.tr;

    useEffect(() => {
        const fetchComments = async () => {
            try {
                setLoading(true);
                // Supabase'den 4 veya 5 yıldızlı, onaylanmış son yorumları çekiyoruz.
                const { data: commentsData, error: commentsError } = await supabase
                    .from('myuni_comments')
                    .select(`
            id,
            user_display_name,
            content,
            rating,
            created_at,
            course_id
          `)
                    .eq('status', 'approved')
                    .gte('rating', 4)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (commentsError) throw commentsError;

                if (commentsData && commentsData.length > 0) {
                    // İlgili kurs isimlerini ek olarak çekiyoruz (Hatalı Joinleri önlemek için)
                    const courseIds = [...new Set(commentsData.map(c => c.course_id).filter(Boolean))];

                    let coursesData: any[] = [];
                    if (courseIds.length > 0) {
                        const { data: courses, error: coursesError } = await supabase
                            .from('myuni_courses')
                            .select('id, title')
                            .in('id', courseIds);

                        if (!coursesError && courses) {
                            coursesData = courses;
                        }
                    }

                    const combinedData = commentsData.map(comment => {
                        const course = coursesData.find(c => c.id === comment.course_id);
                        return {
                            ...comment,
                            myuni_courses: course ? { title: course.title } : null
                        };
                    });

                    setTestimonials(combinedData);
                }
            } catch (err) {
                console.error("Error fetching testimonials:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, []);

    useEffect(() => {
        if (testimonials.length === 0) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % testimonials.length);
        }, 6000); // 6 saniyede bir otomatik geçiş
        return () => clearInterval(timer);
    }, [testimonials.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) =>
            prev === 0 ? testimonials.length - 1 : prev - 1
        );
    };

    return (
        <section className="py-16 lg:py-20 bg-gradient-to-b from-neutral-50/50 to-white dark:from-neutral-900/50 dark:to-neutral-900 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Sol Kısım: Görsel Alanı */}
                    <div className="order-2 lg:order-1 relative h-[500px] lg:h-[650px] w-full rounded-2xl overflow-hidden shadow-2xl group">
                        <div className="absolute inset-0 bg-neutral-900/10 dark:bg-black/20 z-10 group-hover:bg-transparent transition-colors duration-500"></div>
                        <img
                            src="/tr/images/myuni-egitim-platformu-4.webp"
                            alt="MyUNI Education Platform Students"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        {/* Alt Bilgi Rozeti */}
                        <div className="absolute bottom-6 left-6 right-6 z-20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-6 rounded-xl border border-white/20 shadow-xl transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#990000] rounded-full flex items-center justify-center flex-shrink-0">
                                    <Star className="w-6 h-6 text-white fill-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-neutral-900 dark:text-white">%92 Memnuniyet</h4>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Binlerce mutlu kursiyer</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sağ Kısım: Yorumlar (Kart Tasarımları) */}
                    <div className="order-1 lg:order-2 flex flex-col justify-center lg:pl-6">

                        {/* Başlık Alanı */}
                        <div className="mb-10 lg:mb-12">
                            <div className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm px-4 py-2 mb-6 border border-neutral-300 dark:border-neutral-700 rounded-full shadow-sm inline-block">
                                {t.badge}
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 leading-tight mb-6 max-w-xl">
                                {t.title}
                            </h2>
                            <div className="w-20 h-1.5 bg-[#990000] mb-6 rounded-full" />
                            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-lg">
                                {t.description}
                            </p>
                        </div>

                        {/* İçerik Gösterimi */}
                        {loading ? (
                            <div className="h-64 flex items-center justify-center text-neutral-500 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
                                {t.loading}
                            </div>
                        ) : testimonials.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-neutral-500 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
                                {t.noComments}
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Dinamik Yorum Kartı - Sade Tasarım */}
                                <div className="bg-white dark:bg-neutral-800 p-6 md:p-8 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-lg h-[400px] flex flex-col justify-between transition-all duration-500 transform opacity-100">
                                    <div className="flex-grow">
                                        <Quote className="w-8 h-8 text-[#990000] dark:text-[#ff4444] mb-4 opacity-60 flex-shrink-0" />
                                        <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6 italic">
                                            &ldquo;{testimonials[currentSlide].content}&rdquo;
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 rounded-full flex items-center justify-center shadow-inner">
                                                <User className="w-6 h-6 text-neutral-500 dark:text-neutral-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-neutral-900 dark:text-neutral-100 text-lg">
                                                    {testimonials[currentSlide].user_display_name}
                                                </div>
                                                {testimonials[currentSlide].myuni_courses?.title && (
                                                    <div className="text-sm font-medium text-[#990000] dark:text-[#ff4444] mt-1 line-clamp-1">
                                                        {testimonials[currentSlide].myuni_courses?.title}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-start sm:items-end gap-1">
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-5 h-5 ${i < Math.round(testimonials[currentSlide].rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300 dark:text-neutral-600'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs text-neutral-400">
                                                {new Date(testimonials[currentSlide].created_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigasyon Okları */}
                                {testimonials.length > 1 && (
                                    <div className="flex items-center justify-center w-full gap-4 mt-8">
                                        <button
                                            onClick={prevSlide}
                                            className="w-10 h-10 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200 shadow-sm"
                                        >
                                            <ArrowLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                        </button>

                                        <div className="flex gap-2">
                                            {testimonials.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setCurrentSlide(index)}
                                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                                        ? 'bg-[#990000] dark:bg-[#ff4444] w-6'
                                                        : 'bg-neutral-300 dark:bg-neutral-600'
                                                        }`}
                                                />
                                            ))}
                                        </div>

                                        <button
                                            onClick={nextSlide}
                                            className="w-10 h-10 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200 shadow-sm"
                                        >
                                            <ArrowRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DynamicTestimonialSection;
