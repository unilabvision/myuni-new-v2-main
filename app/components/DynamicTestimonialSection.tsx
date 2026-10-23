'use client';

import React, { useState, useEffect } from "react";
import Image from 'next/image';
import { Star, Quote, ArrowLeft, ArrowRight, User } from "lucide-react";

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

type TestimonialNavigationProps = {
    count: number;
    current: number;
    onNext: () => void;
    onPrevious: () => void;
    onSelect: (index: number) => void;
};

function TestimonialNavigation({
    count,
    current,
    onNext,
    onPrevious,
    onSelect,
}: TestimonialNavigationProps) {
    if (count <= 1) return null;

    return (
        <div className="flex items-center justify-center w-full gap-4 mt-8">
            <button
                type="button"
                aria-label="Previous testimonial"
                onClick={onPrevious}
                className="w-10 h-10 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200 shadow-sm"
            >
                <ArrowLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </button>
            <div className="flex gap-2">
                {Array.from({ length: count }, (_, index) => (
                    <button
                        type="button"
                        aria-label={`Testimonial ${index + 1}`}
                        key={index}
                        onClick={() => onSelect(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === current
                                ? 'bg-[#990000] dark:bg-[#ff4444] w-6'
                                : 'bg-neutral-300 dark:bg-neutral-600'
                        }`}
                    />
                ))}
            </div>
            <button
                type="button"
                aria-label="Next testimonial"
                onClick={onNext}
                className="w-10 h-10 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200 shadow-sm"
            >
                <ArrowRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </button>
        </div>
    );
}

const DynamicTestimonialSection: React.FC<DynamicTestimonialSectionProps> = ({ locale = 'tr' }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [testimonials, setTestimonials] = useState<CommentWithCourse[]>([]);
    const [loading, setLoading] = useState(true);

    const texts = {
        tr: {
            badge: "Kursiyer deneyimleri",
            title: "Kursiyerlerimiz neler söylüyor?",
            description: "MyUNI ile hedeflerine ulaşan kursiyerlerimizin kurslarımız hakkındaki değerlendirmelerini okuyun.",
            loading: "Yorumlar yükleniyor...",
            noComments: "Henüz yorum bulunmamaktadır.",
            courseLabel: "Tamamlanan Kurs"
        },
        en: {
            badge: "Student experiences",
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
                const response = await fetch('/api/public/testimonials');
                const payload = await response.json();
                if (!response.ok || !payload.success) {
                    throw new Error(payload.error || 'Testimonials could not be loaded');
                }
                setTestimonials(payload.data || []);
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
        <section className="overflow-hidden border-b border-neutral-200 bg-neutral-50 py-14 sm:py-16 lg:py-20 dark:border-neutral-800 dark:bg-neutral-900/45">
            <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">

                    {/* Sol Kısım: Görsel Alanı */}
                    <div className="group relative order-2 h-[320px] w-full overflow-hidden rounded-xl sm:h-[460px] lg:order-1 lg:h-[600px]">
                        <div className="absolute inset-0 bg-neutral-900/10 dark:bg-black/20 z-10 group-hover:bg-transparent transition-colors duration-500"></div>
                        <Image
                            src="/tr/images/myuni-egitim-platformu-4.webp"
                            alt="MyUNI Education Platform Students"
                            fill
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        {/* Alt Bilgi Rozeti */}
                        <div className="absolute bottom-4 left-4 right-4 z-20 translate-y-0 rounded-lg border border-white/20 bg-white/92 p-4 opacity-100 shadow-lg backdrop-blur-md transition-all duration-300 sm:bottom-6 sm:left-6 sm:right-6 sm:translate-y-4 sm:p-5 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 dark:bg-neutral-950/90">
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
                    <div className="order-1 flex flex-col justify-center lg:order-2 lg:pl-6">

                        {/* Başlık Alanı */}
                        <div className="mb-8 lg:mb-10">
                            <div className="mb-6 flex items-center gap-3 text-sm font-medium text-[#990000] dark:text-[#e08b94]">
                                <span className="h-px w-8 bg-current" aria-hidden="true" />
                                {t.badge}
                            </div>
                            <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-neutral-950 sm:text-4xl dark:text-white">
                                {t.title}
                            </h2>
                            <p className="mt-5 max-w-lg text-base leading-7 text-neutral-600 sm:text-lg dark:text-neutral-400">
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
                                <div className="flex min-h-[320px] flex-col justify-between rounded-xl border border-neutral-200 bg-white p-6 sm:min-h-[360px] sm:p-8 dark:border-neutral-800 dark:bg-neutral-900">
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

                                <TestimonialNavigation
                                    count={testimonials.length}
                                    current={currentSlide}
                                    onNext={nextSlide}
                                    onPrevious={prevSlide}
                                    onSelect={setCurrentSlide}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DynamicTestimonialSection;
