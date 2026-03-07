import React from 'react';
import PageLayout from '@/app/components/layout/PageLayout';
import { Target, FileText, CalendarRange, MonitorPlay, Users, Clock, RefreshCcw, Mail, Globe } from 'lucide-react';

export const metadata = {
    title: 'İptal ve İade Politikası | MyUNI',
    description: 'MyUNI İptal ve İade Politikası koşulları ve süreçleri.',
};

const policyData = {
    tr: [
        {
            id: "amac-kapsam",
            title: "Amaç ve Kapsam",
            icon: <Target className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "Bu İptal ve İade Politikası, MyUNI Eğitim Platformu üzerinden sunulan online eğitimler, mentorluk programları, canlı eğitimler ve dijital içeriklere ilişkin satın alma işlemlerinde geçerli iptal ve iade koşullarını düzenlemek amacıyla hazırlanmıştır.",
                "MyUNI Eğitim Platformu üzerinden satın alınan tüm hizmetlerde, satın alma işlemini gerçekleştiren kullanıcılar bu politikada belirtilen şartları kabul etmiş sayılır."
            ]
        },
        {
            id: "genel-ilkeler",
            title: "Genel İlkeler",
            icon: <FileText className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "MyUNI platformunda sunulan hizmetler ağırlıklı olarak dijital içerik ve canlı eğitim hizmetleri kapsamında olduğundan, iade koşulları hizmetin niteliğine ve kullanıcının erişim durumuna göre farklılık gösterebilir.",
                "Aşağıdaki durumlar iade değerlendirmesinde dikkate alınır:",
                "• Eğitimin veya programın başlangıç tarihi",
                "• Kullanıcının eğitim içeriğine erişim sağlayıp sağlamadığı",
                "• Canlı etkinliğe katılım durumu",
                "• Hizmetin teknik nedenlerle gerçekleştirilememesi",
                "MyUNI, her iade talebini bu kriterler doğrultusunda değerlendirme hakkını saklı tutar."
            ]
        },
        {
            id: "canli-egitim",
            title: "Canlı Eğitim ve Etkinlikler İçin İptal ve İade",
            icon: <CalendarRange className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "Canlı olarak gerçekleştirilecek eğitimler, webinarlar veya etkinlikler için aşağıdaki koşullar geçerlidir:",
                "• Eğitim tarihinden en az 48 saat önce yapılan iptal taleplerinde ücretin tamamı iade edilir.",
                "• Eğitim tarihine 48 saatten daha az süre kala yapılan iptallerde iade yapılamaz.",
                "• Kullanıcının etkinliğe katılamaması durumunda iade yapılamaz, eğitim kaydı mevcutsa kullanıcıya kayıt erişimi sağlanır."
            ]
        },
        {
            id: "online-egitim",
            title: "Online Eğitim ve Dijital İçerikler",
            icon: <MonitorPlay className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "MyUNI platformunda sunulan kayıtlı eğitimler ve dijital içerikler için:",
                "• Satın alma işleminden sonraki 14 gün içinde eğitim içeriğine erişim sağlanmamak şartıyla yapılan iptal talepleri değerlendirilerek iade yapılabilir.",
                "• Kullanıcı eğitim içeriğine erişim sağladıktan sonra, dijital ürün niteliği gereği iade yapılamamaktadır.",
                "Ancak aşağıdaki durumlarda iade değerlendirmesi yapılabilir:",
                "• Teknik bir hata nedeniyle içeriğe erişilememesi",
                "• Platform kaynaklı sistemsel sorunlar",
                "• Yanlış veya hatalı satın alma işlemi"
            ]
        },
        {
            id: "mentorluk",
            title: "Mentorluk Programları",
            icon: <Users className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "Kontenjanı sınırlı mentorluk programlarında katılımcılar için özel kontenjan ayrılmaktadır. Bu nedenle:",
                "• Program başlangıcından en az 72 saat önce yapılan iptallerde iade yapılabilir.",
                "• Program başlangıcına 72 saatten az süre kala yapılan iptallerde iade yapılmamaktadır.",
                "• Program başladıktan sonra yapılan iptal talepleri değerlendirmeye alınmayacaktır.",
                "MyUNI gerekli gördüğü durumlarda katılımcıya başka bir mentorluk dönemine katılım hakkı sunabilir."
            ]
        },
        {
            id: "iptal-erteleme",
            title: "Eğitimin İptali veya Ertelenmesi",
            icon: <Clock className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "MyUNI aşağıdaki durumlarda eğitim veya etkinlik tarihlerini değiştirme veya iptal etme hakkını saklı tutar:",
                "• Eğitmen kaynaklı zorunlu durumlar",
                "• Teknik veya operasyonel sebepler",
                "• Yetersiz katılımcı sayısı",
                "Bu gibi durumlarda katılımcılara aşağıdaki seçenekler sunulur:",
                "• Yeni belirlenen tarihte eğitime katılım",
                "• Başka bir eğitime aktarım",
                "• Talep edilmesi halinde ücret iadesi"
            ]
        },
        {
            id: "iade-sureci",
            title: "İade Süreci",
            icon: <RefreshCcw className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "İade talebinde bulunmak isteyen kullanıcılar aşağıdaki iletişim kanalları üzerinden MyUNI ile iletişime geçebilir:",
                <span key="email" className="flex items-center gap-2"><Mail className="w-5 h-5 text-[#990000] dark:text-white" /> E-posta: info@myunilab.net</span>,
                "İade taleplerinde aşağıdaki bilgilerin paylaşılması gerekmektedir:",
                "• Ad ve soyad",
                "• Satın alınan eğitim veya program adı",
                "• Satın alma tarihi",
                "• Talep edilen işlem (iptal / iade)",
                "MyUNI, iletilen talepleri mümkün olan en kısa sürede değerlendirir.",
                "İade talebinin onaylanması halinde ödeme, kullanıcının ödeme yaptığı yöntem üzerinden 7–14 iş günü içerisinde gerçekleştirilmektedir.",
                "Bankaların işlem sürelerine bağlı olarak iadenin hesaba yansıma süresi değişiklik gösterebilir."
            ]
        },
        {
            id: "iletisim",
            title: "İletişim",
            icon: <Mail className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "İptal ve iade süreçleri ile ilgili her türlü soru için MyUNI destek ekibi ile iletişime geçebilirsiniz.",
                <span key="email2" className="flex items-center gap-2"><Mail className="w-5 h-5 text-[#990000] dark:text-white" /> E-posta: info@myunilab.net</span>,
                <span key="web" className="flex items-center gap-2"><Globe className="w-5 h-5 text-[#990000] dark:text-white" /> Web: www.myunilab.net</span>
            ]
        }
    ],
    en: [
        {
            id: "amac-kapsam",
            title: "Purpose and Scope",
            icon: <Target className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "This Cancellation and Refund Policy has been prepared to regulate the cancellation and refund conditions applicable to purchases regarding online courses, mentorship programs, live trainings, and digital content offered on the MyUNI Education Platform.",
                "In all services purchased through the MyUNI Education Platform, users performing the purchase are deemed to have accepted the terms specified in this policy."
            ]
        },
        {
            id: "genel-ilkeler",
            title: "General Principles",
            icon: <FileText className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "Since the services offered on the MyUNI platform are mainly within the scope of digital content and live training services, refund conditions may vary depending on the nature of the service and the user's access status.",
                "The following situations are taken into consideration in the refund evaluation:",
                "• Start date of the training or program",
                "• Whether the user has accessed the educational content",
                "• Participation status in a live event",
                "• Inability to perform the service due to technical reasons",
                "MyUNI reserves the right to evaluate each refund request in accordance with these criteria."
            ]
        },
        {
            id: "canli-egitim",
            title: "Cancellation and Refund for Live Training and Events",
            icon: <CalendarRange className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "The following conditions apply for live trainings, webinars, or events:",
                "• For cancellation requests made at least 48 hours before the training date, the full fee is refunded.",
                "• Refunds cannot be made for cancellations made less than 48 hours before the training date.",
                "• If the user cannot attend the event, a refund will not be issued; however, if an event recording is available, the user will be provided access to the recording."
            ]
        },
        {
            id: "online-egitim",
            title: "Online Training and Digital Content",
            icon: <MonitorPlay className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "For recorded trainings and digital content offered on the MyUNI platform:",
                "• Cancellation requests made within 14 days following the purchase process can be evaluated and refunded, provided that the training content has not been accessed.",
                "• Due to the nature of digital products, refunds cannot be made after the user has accessed the training content.",
                "However, refund evaluation may be considered in the following situations:",
                "• Inability to access content due to a technical error",
                "• Systemic issues originating from the platform",
                "• Incorrect or faulty purchase transactions"
            ]
        },
        {
            id: "mentorluk",
            title: "Mentorship Programs",
            icon: <Users className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "A specific quota is allocated for participants in mentorship programs with limited availability. Therefore:",
                "• Refunds can be made for cancellations made at least 72 hours before the start of the program.",
                "• Refunds are not issued for cancellations made less than 72 hours before the start of the program.",
                "• Cancellation requests made after the program starts will not be taken into consideration.",
                "When deemed necessary, MyUNI may offer the participant the right to attend another mentorship term."
            ]
        },
        {
            id: "iptal-erteleme",
            title: "Cancellation or Postponement of Training",
            icon: <Clock className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "MyUNI reserves the right to change training or event dates or to cancel them in the following situations:",
                "• Mandatory situations caused by the instructor",
                "• Technical or operational reasons",
                "• Insufficient number of participants",
                "In such cases, the following options are offered to participants:",
                "• Participation in the training on the newly determined date",
                "• Transfer to another training",
                "• Refund of the fee upon request"
            ]
        },
        {
            id: "iade-sureci",
            title: "Refund Process",
            icon: <RefreshCcw className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "Users wishing to submit a refund request can contact MyUNI through the following communication channels:",
                <span key="email" className="flex items-center gap-2"><Mail className="w-5 h-5 text-[#990000] dark:text-white" /> Email: info@myunilab.net</span>,
                "The following information must be shared in refund requests:",
                "• Name and surname",
                "• Purchased training or program name",
                "• Date of purchase",
                "• Requested action (cancellation / refund)",
                "MyUNI evaluates the submitted requests as soon as possible.",
                "If the refund request is approved, the payment is typically processed within 7-14 business days via the payment method used by the user.",
                "The time for the refund to reflect in the account may vary depending on the processing times of the banks."
            ]
        },
        {
            id: "iletisim",
            title: "Contact",
            icon: <Mail className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
            content: [
                "For any questions regarding cancellation and refund processes, you can contact the MyUNI support team.",
                <span key="email2" className="flex items-center gap-2"><Mail className="w-5 h-5 text-[#990000] dark:text-white" /> Email: info@myunilab.net</span>,
                <span key="web" className="flex items-center gap-2"><Globe className="w-5 h-5 text-[#990000] dark:text-white" /> Web: www.myunilab.net</span>
            ]
        }
    ]
};

export default async function IptalIadePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    const currentPolicyData = policyData[locale as keyof typeof policyData] || policyData.tr;

    const texts = {
        title: locale === 'en' ? 'Cancellation and Refund Policy' : 'İptal ve İade Politikası',
    };

    const description = locale === 'en'
        ? "Please review our cancellation and refund conditions for your purchases."
        : "Satın alma işlemlerinizle ilgili iptal ve iade koşullarımızı inceleyebilirsiniz.";

    return (
        <PageLayout
            locale={locale}
            title={texts.title}
            description={description}
            breadcrumbs={[{ name: texts.title, href: `/${locale}/iptal-iade` }]}
            variant="minimal"
        >
            <div className="bg-white dark:bg-neutral-900 min-h-screen pb-20">
                <section className="py-12 bg-white dark:bg-neutral-900">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="space-y-12">
                            {currentPolicyData.map((section, index) => (
                                <div key={section.id} className="text-left">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-[#990000]/5 dark:bg-[#990000]/10 flex-shrink-0">
                                            {section.icon}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-light text-neutral-900 dark:text-neutral-100">
                                                {section.title}
                                            </h2>
                                            <div className="w-12 h-px bg-[#990000] mt-2"></div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {section.content.map((paragraph, pIndex) => (
                                            <div
                                                key={pIndex}
                                                className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-left"
                                            >
                                                {paragraph}
                                            </div>
                                        ))}
                                    </div>

                                    {index < currentPolicyData.length - 1 && (
                                        <div className="mt-12 w-full h-px bg-neutral-200 dark:bg-neutral-700"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </PageLayout>
    );
}
