import React from 'react';
import CourseFAQ from '@/app/components/pages/kurs/[slug]/components/CourseFAQ';
import PageLayout from '@/app/components/layout/PageLayout';

export const metadata = {
    title: 'Sık Sorulan Sorular | MyUNI',
    description: 'Sık Sorulan Sorular (SSS) ve iletişim seçenekleri.',
};

export default function FAQPage({ params }: { params: { locale: string } }) {
    const { locale } = params;

    const texts = {
        faqTitle: locale === 'en' ? 'Frequently Asked Questions' : 'Sık Sorulan Sorular',
    };

    const description = locale === 'en'
        ? "You can find all your questions here. If you can't find what you are looking for, contact us."
        : "Aklınıza takılan tüm soruları burada bulabilirsiniz. Bulamadığınız bir şey varsa bizimle iletişime geçin.";

    return (
        <PageLayout
            locale={locale}
            title={texts.faqTitle}
            description={description}
            breadcrumbs={[{ name: texts.faqTitle, href: `/${locale}/sss` }]}
            variant="minimal"
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-6 py-16">
                <CourseFAQ texts={texts} hideHeader={true} />
            </div>
        </PageLayout>
    );
}
