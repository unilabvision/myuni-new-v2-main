import { Award, BookOpen, CalendarDays, Check, Clock3, Library } from 'lucide-react';
import type {
  PublishedMembershipBenefit,
  PublishedMembershipPlan,
} from '@/lib/membershipPlans';

function formatPrice(plan: PublishedMembershipPlan, locale: string) {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: plan.currency,
    maximumFractionDigits: 2,
  }).format(plan.price);
}

function benefitLabel(benefit: PublishedMembershipBenefit, locale: string) {
  const isTr = locale === 'tr';
  if (benefit.label_tr || benefit.label_en) {
    return (isTr ? benefit.label_tr : benefit.label_en) || benefit.label_tr || benefit.label_en;
  }

  const labels = {
    course: isTr ? 'Tüm güncel eğitimlere erişim' : 'Access to all current courses',
    product: isTr ? 'Tüm dijital dergi ve ürünlere erişim' : 'Access to all digital magazines and products',
    event: isTr ? 'Uygun etkinliklere katılım' : 'Participation in eligible events',
    certificate: isTr ? 'Uygun sertifikalara erişim' : 'Access to eligible certificates',
  };
  if (benefit.capability === 'certificate') {
    return isTr ? 'Tamamlanan eğitimlerde sertifika hakkı' : 'Certificate rights for completed courses';
  }
  return labels[benefit.resource_type];
}

function BenefitIcon({ benefit }: { benefit: PublishedMembershipBenefit }) {
  if (benefit.capability === 'certificate') return <Award className="h-4 w-4" />;
  if (benefit.resource_type === 'course') return <BookOpen className="h-4 w-4" />;
  if (benefit.resource_type === 'event') return <CalendarDays className="h-4 w-4" />;
  return <Library className="h-4 w-4" />;
}

export default function MembershipLandingPage({
  locale,
  plans,
  unavailable = false,
}: {
  locale: string;
  plans: PublishedMembershipPlan[];
  unavailable?: boolean;
}) {
  const isTr = locale === 'tr';

  return (
    <main className="min-h-screen bg-[#fafafa] text-neutral-950">
      <section className="bg-[#650000] px-5 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
            <Clock3 className="h-3.5 w-3.5" /> MyUNI Access
          </div>
          <h1 className="mt-5 max-w-3xl font-syne text-4xl font-bold tracking-tight sm:text-5xl">
            {isTr ? 'Öğrenme yolculuğun için süreli erişim' : 'Fixed-term access for your learning journey'}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
            {isTr
              ? 'Eğitim, dijital dergi, etkinlik ve sertifika haklarını ihtiyacına uygun süreyle tek pakette kullan.'
              : 'Use courses, digital magazines, events and certificate rights in one plan for the duration that fits you.'}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#990000]">
              {isTr ? 'Yayınlanan paketler' : 'Published plans'}
            </p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
              {isTr ? 'Sana uygun süreyi seç' : 'Choose the right duration'}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-neutral-600">
            {isTr
              ? 'Paket içeriği ve fiyatı yayınlandığı sürüm boyunca korunur.'
              : 'Plan content and price are preserved for each published version.'}
          </p>
        </div>

        {plans.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <article
                key={plan.id}
                className={`flex min-h-[430px] flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                  index === 1 ? 'border-[#990000] ring-1 ring-[#990000]' : 'border-neutral-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#990000]">
                      {plan.duration_months} {isTr ? 'aylık erişim' : 'month access'}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">
                      {(isTr ? plan.name_tr : plan.name_en) || plan.name_tr}
                    </h3>
                  </div>
                  {index === 1 && (
                    <span className="rounded-full bg-[#990000] px-2.5 py-1 text-xs font-medium text-white">
                      {isTr ? 'Öne çıkan' : 'Featured'}
                    </span>
                  )}
                </div>

                <p className="mt-5 text-3xl font-bold tracking-tight">{formatPrice(plan, locale)}</p>
                <p className="mt-3 min-h-12 text-sm leading-6 text-neutral-600">
                  {(isTr ? plan.description_tr : plan.description_en) ||
                    (isTr ? plan.description_en : plan.description_tr) ||
                    (isTr ? 'Belirlenen süre boyunca seçili MyUNI hizmetlerine erişim.' : 'Access to selected MyUNI services for the plan duration.')}
                </p>

                <ul className="mt-6 flex-1 space-y-3 border-t border-neutral-100 pt-5">
                  {plan.benefits.map((benefit) => (
                    <li key={benefit.id} className="flex items-start gap-3 text-sm leading-5">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green-50 text-green-700">
                        <BenefitIcon benefit={benefit} />
                      </span>
                      <span>{benefitLabel(benefit, locale)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-lg bg-neutral-100 px-4 py-3 text-center text-sm font-semibold text-neutral-500" aria-disabled="true">
                  {isTr ? 'Satın alma yakında açılacak' : 'Purchasing will open soon'}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-neutral-100 text-neutral-500">
              {unavailable ? <Clock3 className="h-5 w-5" /> : <Check className="h-5 w-5" />}
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {unavailable
                ? isTr ? 'Paketler şu anda görüntülenemiyor' : 'Plans are currently unavailable'
                : isTr ? 'Üyelik paketleri hazırlanıyor' : 'Membership plans are being prepared'}
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-600">
              {isTr
                ? 'Yayınlanan ilk paketler fiyat ve hizmet kapsamıyla birlikte burada görünecek.'
                : 'The first published plans will appear here with their prices and included services.'}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
